const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const redis = require("../../config/redis");
const logger = require("../../utils/logger");
const {
  createSession,
  endSession,
  createInteraction,
  closeInteraction,
  saveResponse,
  updateParticipantCount,
} = require("./classroomUtils");
require("dotenv").config();

const secret = process.env.JWT_SECRET;
const rooms = new Map(); // sessionId -> { teacher: ws, students: Map<userId, ws> }

function extractToken(request) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const tokenFromQuery = url.searchParams.get("token");
  if (tokenFromQuery) return tokenFromQuery;
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) return authHeader.split(" ")[1];
  return null;
}

async function verifyToken(request) {
  const token = extractToken(request);
  const deviceType = request.headers.devicetype || "web";
  if (!token) return { valid: false, error: "未提供授权信息" };
  try {
    const decoded = jwt.verify(token, secret);
    const storedToken = await redis.get(`user_${decoded.id}_${deviceType}_token`);
    if (storedToken !== token) return { valid: false, error: "无效的 Token" };
    await redis.expire(`user_${decoded.id}_${deviceType}_token`, 3600);
    return { valid: true, user: decoded };
  } catch (err) {
    return { valid: false, error: "Token 验证失败" };
  }
}

function broadcast(sessionId, message, excludeWs = null) {
  const room = rooms.get(sessionId);
  if (!room) return;
  const data = JSON.stringify(message);
  if (room.teacher && room.teacher !== excludeWs && room.teacher.readyState === WebSocket.OPEN) {
    room.teacher.send(data);
  }
  for (const [, ws] of room.students) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

function sendTo(ws, message) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
}

function setupClassroomWS(server) {
  const wss = new WebSocket.Server({ noServer: true, path: "/api/classroom-ws" });

  server.on("upgrade", async (request, socket, head) => {
    if (!request.url.startsWith("/api/classroom-ws")) return;
    const authResult = await verifyToken(request);
    if (!authResult.valid) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, authResult.user);
    });
  });

  wss.on("connection", (ws, request, user) => {
    logger.info(`课堂 WS 已连接，用户 ${user.id} 角色 ${user.role}`);
    ws._user = user;
    ws._sessionId = null;

    ws.on("message", async (raw) => {
      let data;
      try { data = JSON.parse(raw); } catch { return sendTo(ws, { type: "error", message: "无效 JSON" }); }
      try {
        await handleMessage(ws, user, data);
      } catch (err) {
        logger.error(`课堂 WS 消息处理错误: ${err.message}`);
        sendTo(ws, { type: "error", message: err.message });
      }
    });

    ws.on("close", () => {
      handleDisconnect(ws, user);
    });
  });

  return wss;
}

async function handleMessage(ws, user, data) {
  const { type } = data;

  switch (type) {
    case "start_session": {
      const { classId, courseId } = data;
      const result = await createSession(classId, courseId, user.id);
      const sessionId = String(result.sessionId);
      rooms.set(sessionId, { teacher: ws, students: new Map(), timers: new Map() });
      ws._sessionId = sessionId;
      sendTo(ws, { type: "session_started", sessionId });
      break;
    }

    case "end_session": {
      const sessionId = data.sessionId || ws._sessionId;
      if (!sessionId) return sendTo(ws, { type: "error", message: "未指定会话" });
      await endSession(sessionId, user.id);
      const room = rooms.get(sessionId);
      if (room) {
        for (const [, timer] of room.timers) clearInterval(timer);
        broadcast(sessionId, { type: "session_ended", sessionId });
        rooms.delete(sessionId);
      }
      ws._sessionId = null;
      break;
    }

    case "join_session": {
      const { sessionId } = data;
      const room = rooms.get(sessionId);
      if (!room) return sendTo(ws, { type: "error", message: "会话不存在" });
      room.students.set(String(user.id), ws);
      ws._sessionId = sessionId;
      const count = room.students.size;
      await updateParticipantCount(sessionId, count);
      broadcast(sessionId, { type: "student_joined", userId: user.id, count });
      sendTo(ws, { type: "join_success", sessionId, count });
      break;
    }

    case "random_pick": {
      const sessionId = data.sessionId || ws._sessionId;
      const room = rooms.get(sessionId);
      if (!room || room.students.size === 0) return sendTo(ws, { type: "error", message: "无学生在线" });
      const ids = Array.from(room.students.keys());
      const pickedId = ids[Math.floor(Math.random() * ids.length)];
      broadcast(sessionId, { type: "student_picked", studentId: pickedId });
      break;
    }

    case "start_poll": {
      const sessionId = data.sessionId || ws._sessionId;
      const { question, options } = data;
      const result = await createInteraction(sessionId, "poll", { question, options });
      broadcast(sessionId, { type: "poll_started", interactionId: result.interactionId, question, options });
      break;
    }

    case "poll_vote": {
      const { interactionId, answer } = data;
      await saveResponse(interactionId, user.id, { answer }, false);
      const sessionId = ws._sessionId;
      if (sessionId) {
        const room = rooms.get(sessionId);
        if (room && room.teacher) sendTo(room.teacher, { type: "poll_vote_received", studentId: user.id, interactionId });
      }
      sendTo(ws, { type: "vote_confirmed", interactionId });
      break;
    }

    case "close_poll": {
      const { interactionId, result: pollResult } = data;
      await closeInteraction(interactionId, pollResult || {});
      const sessionId = ws._sessionId;
      if (sessionId) broadcast(sessionId, { type: "poll_result", interactionId, result: pollResult });
      break;
    }

    case "start_quiz": {
      const sessionId = data.sessionId || ws._sessionId;
      const { question, options, correctAnswer } = data;
      const result = await createInteraction(sessionId, "quiz", { question, options, correctAnswer });
      broadcast(sessionId, { type: "quiz_started", interactionId: result.interactionId, question, options });
      break;
    }

    case "quiz_answer": {
      const { interactionId, answer, correctAnswer } = data;
      const isCorrect = answer === correctAnswer;
      await saveResponse(interactionId, user.id, { answer }, isCorrect);
      sendTo(ws, { type: "answer_confirmed", interactionId, isCorrect });
      const sessionId = ws._sessionId;
      if (sessionId) {
        const room = rooms.get(sessionId);
        if (room && room.teacher) sendTo(room.teacher, { type: "quiz_answer_received", studentId: user.id, interactionId, isCorrect });
      }
      break;
    }

    case "close_quiz": {
      const { interactionId, result: quizResult } = data;
      await closeInteraction(interactionId, quizResult || {});
      const sessionId = ws._sessionId;
      if (sessionId) broadcast(sessionId, { type: "quiz_result", interactionId, result: quizResult });
      break;
    }

    case "start_timer": {
      const sessionId = data.sessionId || ws._sessionId;
      const { duration } = data;
      const room = rooms.get(sessionId);
      if (!room) return sendTo(ws, { type: "error", message: "会话不存在" });
      let remaining = duration;
      broadcast(sessionId, { type: "timer_tick", remaining });
      const timer = setInterval(() => {
        remaining--;
        broadcast(sessionId, { type: "timer_tick", remaining });
        if (remaining <= 0) {
          clearInterval(timer);
          room.timers.delete("timer");
          broadcast(sessionId, { type: "timer_ended" });
        }
      }, 1000);
      room.timers.set("timer", timer);
      break;
    }

    default:
      sendTo(ws, { type: "error", message: `未知消息类型: ${type}` });
  }
}

function handleDisconnect(ws, user) {
  const sessionId = ws._sessionId;
  if (!sessionId) return;
  const room = rooms.get(sessionId);
  if (!room) return;

  if (room.teacher === ws) {
    logger.info(`教师 ${user.id} 断开课堂 WS，会话 ${sessionId}`);
    room.teacher = null;
  } else {
    room.students.delete(String(user.id));
    const count = room.students.size;
    updateParticipantCount(sessionId, count).catch(() => {});
    broadcast(sessionId, { type: "student_left", userId: user.id, count });
    logger.info(`学生 ${user.id} 离开课堂，会话 ${sessionId}，剩余 ${count} 人`);
  }
}

module.exports = { setupClassroomWS };