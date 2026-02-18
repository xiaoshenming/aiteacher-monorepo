// websocket/wxsocket.js
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const redis = require("../../config/redis");
const { getAIResponseStream } = require("./aiUtils");
const logger = require("../../utils/logger");
require("dotenv").config();

const secret = process.env.JWT_SECRET;

// 从 URL 或 header 中提取 token
function extractToken(request) {
  // 1. 尝试从 query 参数获取
  const url = new URL(request.url, `http://${request.headers.host}`);
  const tokenFromQuery = url.searchParams.get("token");
  if (tokenFromQuery) {
    return tokenFromQuery;
  }

  // 2. 尝试从 Authorization header 获取
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
}

// 验证 JWT Token
async function verifyWebSocketToken(request) {
  const token = extractToken(request);
  const deviceType = request.headers.devicetype || "web";

  if (!token) {
    logger.warn("WebSocket 连接尝试失败：未提供 Token");
    return { valid: false, error: "未提供授权信息" };
  }

  try {
    const decoded = jwt.verify(token, secret);
    logger.info(`WebSocket JWT 解码成功，用户 ID: ${decoded.id}`);

    // 检查 Redis 中的 token
    const storedToken = await redis.get(
      `user_${decoded.id}_${deviceType}_token`
    );
    if (storedToken !== token) {
      logger.warn(`WebSocket 连接失败：Redis 中 Token 无效，用户 ID: ${decoded.id}`);
      return { valid: false, error: "无效的 Token" };
    }

    // 重置 token 有效期
    await redis.expire(`user_${decoded.id}_${deviceType}_token`, 3600);

    logger.info(`WebSocket 认证成功，用户 ID: ${decoded.id}, 角色: ${decoded.role}`);
    return { valid: true, user: decoded };
  } catch (err) {
    logger.error(`WebSocket Token 验证错误: ${err.message}`);
    return { valid: false, error: "无效的 Token" };
  }
}

function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({
    noServer: true,
    path: "/api/wxsocket",
  });

  server.on("upgrade", async (request, socket, head) => {
    if (request.url.startsWith("/api/wxsocket")) {
      // 验证 JWT Token
      const authResult = await verifyWebSocketToken(request);

      if (!authResult.valid) {
        logger.warn(`WebSocket 连接被拒绝: ${authResult.error}`);
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      // 认证成功，继续 WebSocket 握手
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request, authResult.user);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws, request, user) => {
    logger.info(`WebSocket 客户端已连接，用户 ID: ${user.id}`);
    ws.on("message", async (message) => {
      let data;
      try {
        data = JSON.parse(message);
      } catch (error) {
        return ws.send(
          JSON.stringify({ type: "error", message: "Invalid JSON" })
        );
      }
      const { prompt } = data;
      logger.info(`收到 WebSocket 消息，用户 ID: ${user.id}, Prompt: ${prompt}`);
      try {
        await getAIResponseStream(prompt, (chunk) => {
          ws.send(
            JSON.stringify({
              type: "chunk",
              content: chunk,
            })
          );
        });
        ws.send(JSON.stringify({ type: "complete" }));
      } catch (error) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: error.message,
          })
        );
        ws.close();
      }
    });
    ws.on("close", () => {
      logger.info(`WebSocket 客户端断开连接，用户 ID: ${user.id}`);
    });
  });
}

module.exports = { setupWebSocketServer };
