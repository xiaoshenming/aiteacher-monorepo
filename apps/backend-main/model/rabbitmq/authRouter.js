// model/rabbitmq/authRouter.js
const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const amqp = require("amqplib");
const authorize = require("../auth/authUtils"); // 假设此处引入的中间件用于权限校验
const { publishAuthRequest, publishAuthApproval } = require("./authUtils");

/**
 * 获取 RabbitMQ 通道（简化版本，仅用于读取队列消息）
 */
async function getRabbitChannel() {
  const RABBIT_URL =
    process.env.RABBIT_URL || "amqp://admin:admin@10.3.36.17:5672";
  try {
    const connection = await amqp.connect(RABBIT_URL);
    const channel = await connection.createChannel();
    return channel;
  } catch (err) {
    console.error("RabbitMQ 通道错误:", err);
    throw err;
  }
}

/**
 * GET /api/auth/requests
 * 管理员拉取认证申请消息并写入数据库，然后分页返回认证申请列表
 */
router.get("/requests", authorize(["3"]), async (req, res) => {
  try {
    const adminId = req.user.id;
    const [lvRows] = await db
      .promise()
      .query("SELECT uid FROM loginverification WHERE id = ?", [adminId]);
    if (!lvRows.length) {
      return res
        .status(404)
        .json({ code: 404, message: "管理员信息不存在", data: null });
    }
    const adminUid = lvRows[0].uid;
    const [userRows] = await db
      .promise()
      .query("SELECT schoolId FROM user WHERE id = ?", [adminUid]);
    if (!userRows.length) {
      return res
        .status(404)
        .json({ code: 404, message: "管理员用户信息不存在", data: null });
    }
    const adminSchoolId = userRows[0].schoolId;

    // 从 RabbitMQ 拉取认证请求消息
    const channel = await getRabbitChannel();
    const AUTH_EXCHANGE = process.env.AUTH_EXCHANGE || "authExchange";
    const queueName = `authRequestQueue_${adminSchoolId}`;
    await channel.assertExchange(AUTH_EXCHANGE, "direct", { durable: true });
    await channel.assertQueue(queueName, { durable: true });
    const routingKey = `auth.request.school.${adminSchoolId}`;
    await channel.bindQueue(queueName, AUTH_EXCHANGE, routingKey);

    const messages = [];
    let count = 0;
    while (count < 50) {
      const msg = await channel.get(queueName, { noAck: false });
      if (!msg) break;
      try {
        const messageObj = JSON.parse(msg.content.toString());
        messages.push(messageObj);
      } catch (e) {
        console.error("JSON 解析错误:", e);
      }
      channel.ack(msg);
      count++;
    }
    // 若有新消息，则批量写入认证请求表
    if (messages.length) {
      const teacherIds = [...new Set(messages.map((m) => m.teacher_id))];
      const [teacherInfoRows] = await db
        .promise()
        .query("SELECT id, uid, name FROM loginverification WHERE id IN (?)", [
          teacherIds,
        ]);
      const teacherInfoMap = new Map();
      teacherInfoRows.forEach((row) => teacherInfoMap.set(row.id, row));
      const values = messages.map((message) => {
        const { teacher_id, school_id, request_message, expiresAt } = message;
        const teacherInfo = teacherInfoMap.get(teacher_id) || {};
        const formattedExpiresAt = new Date(expiresAt)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        return [
          teacher_id,
          teacherInfo.uid || "",
          school_id,
          request_message || "",
          formattedExpiresAt,
          0,
        ];
      });
      const insertSql = `
        INSERT INTO authentication_requests 
        (teacher_id, teacher_uid, school_id, request_message, expires_at, status)
        VALUES ?
      `;
      await db.promise().query(insertSql, [values]);
    }
    // 更新超时待处理申请为已过期（status 3）
    await db
      .promise()
      .execute(
        "UPDATE authentication_requests SET status = 3 WHERE school_id = ? AND status = 0 AND expires_at < ?",
        [adminSchoolId, new Date()]
      );

    // 分页查询认证申请
    const pageIndex = parseInt(req.query.pageIndex, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const offset = (pageIndex - 1) * pageSize;
    const [countResult] = await db
      .promise()
      .query(
        "SELECT COUNT(*) as total FROM authentication_requests WHERE school_id = ? AND status <> 4",
        [adminSchoolId]
      );
    const total = countResult[0].total;
    const [requests] = await db.promise().query(
      `SELECT authentication_requests.*, user.username 
       FROM authentication_requests 
       INNER JOIN user ON authentication_requests.teacher_uid = user.id 
       WHERE school_id = ? AND status <> 4 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [adminSchoolId, pageSize, offset]
    );
    return res.json({
      code: 200,
      message: "获取认证申请成功",
      data: { total, pageIndex, pageSize, requests },
    });
  } catch (error) {
    console.error("获取认证申请失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误，获取认证申请失败", data: null });
  }
});

/**
 * POST /api/auth/request/async
 * 教师提交认证申请（检查待处理数量后调用 RabbitMQ 发布消息）
 */
router.post("/request/async", authorize(["1"]), async (req, res) => {
  try {
    const { schoolId, requestMessage } = req.body;
    if (!schoolId) {
      return res
        .status(400)
        .json({ code: 400, message: "学校ID不能为空", data: null });
    }
    const teacherId = req.user.id;
    const [pendingRows] = await db
      .promise()
      .query(
        "SELECT COUNT(*) as count FROM authentication_requests WHERE teacher_id = ? AND status = 0",
        [teacherId]
      );
    if (pendingRows[0].count >= 3) {
      return res
        .status(400)
        .json({ code: 400, message: "您的待处理认证申请已达上限", data: null });
    }
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await publishAuthRequest({
      teacher_id: teacherId,
      school_id: schoolId,
      request_message: requestMessage || "",
      expiresAt,
    });
    return res.json({
      code: 200,
      message: "认证申请已提交，处理中",
      data: null,
    });
  } catch (error) {
    console.error("认证申请提交错误:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误，提交认证申请失败", data: null });
  }
});

/**
 * POST /api/auth/approve/:id/async
 * 管理员审批认证申请（调用 authUtils 处理审批逻辑）
 */
router.post("/approve/:id/async", authorize(["3"]), async (req, res) => {
  try {
    const requestId = req.params.id;
    const adminId = req.user.id;
    await publishAuthApproval({ requestId, admin_id: adminId });
    return res.json({
      code: 200,
      message: "认证审批请求已提交，处理中",
      data: null,
    });
  } catch (error) {
    console.error("认证审批错误:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误，审批认证申请失败", data: null });
  }
});

/**
 * POST /api/auth/reject/:id/async
 * 管理员拒绝认证申请（将 status 设为 2）
 */
router.post("/reject/:id/async", authorize(["3"]), async (req, res) => {
  try {
    const requestId = req.params.id;
    const adminId = req.user.id;
    const [rows] = await db
      .promise()
      .query(
        "SELECT * FROM authentication_requests WHERE id = ? AND status = 0",
        [requestId]
      );
    if (!rows.length) {
      return res
        .status(400)
        .json({
          code: 400,
          message: "认证申请不存在或状态不可拒绝",
          data: null,
        });
    }
    await db
      .promise()
      .execute(
        "UPDATE authentication_requests SET status = 2, admin_id = ? WHERE id = ?",
        [adminId, requestId]
      );
    return res.json({ code: 200, message: "认证申请已拒绝", data: null });
  } catch (error) {
    console.error("拒绝认证申请失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误，拒绝认证申请失败", data: null });
  }
});

/**
 * POST /api/auth/delete/:id/async
 * 管理员删除认证申请（逻辑删除，status 设为 4）
 */
router.post("/delete/:id/async", authorize(["3"]), async (req, res) => {
  try {
    const requestId = req.params.id;
    const [rows] = await db
      .promise()
      .query(
        "SELECT * FROM authentication_requests WHERE id = ? AND status <> 4",
        [requestId]
      );
    if (!rows.length) {
      return res
        .status(400)
        .json({ code: 400, message: "认证申请不存在或已删除", data: null });
    }
    await db
      .promise()
      .execute("UPDATE authentication_requests SET status = 4 WHERE id = ?", [
        requestId,
      ]);
    return res.json({ code: 200, message: "认证申请已删除", data: null });
  } catch (error) {
    console.error("删除认证申请失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误，删除认证申请失败", data: null });
  }
});

/**
 * GET /api/auth/count
 * 根据用户角色获取队列中认证消息数量
 */
router.get("/count", authorize(["3"]), async (req, res) => {
  try {
    const adminId = req.user.id;
    const [lvRows] = await db
      .promise()
      .query("SELECT uid FROM loginverification WHERE id = ?", [adminId]);
    if (!lvRows.length) {
      return res
        .status(404)
        .json({ code: 404, message: "用户不存在", data: null });
    }
    const realUserId = lvRows[0].uid;
    const [userRows] = await db
      .promise()
      .query("SELECT schoolId FROM user WHERE id = ?", [realUserId]);
    if (!userRows.length) {
      return res
        .status(404)
        .json({ code: 404, message: "用户信息不存在", data: null });
    }
    const schoolId = userRows[0].schoolId;
    const queueName = `authRequestQueue_${schoolId}`;
    const channel = await getRabbitChannel();
    if (req.user.role === "1") {
      let teacherPendingCount = 0;
      const fetchedMessages = [];
      const MAX_MESSAGES_TO_SCAN = 100;
      for (let i = 0; i < MAX_MESSAGES_TO_SCAN; i++) {
        const msg = await channel.get(queueName, { noAck: false });
        if (!msg) break;
        fetchedMessages.push(msg);
        try {
          const messageObj = JSON.parse(msg.content.toString());
          if (messageObj.teacher_id === req.user.id) {
            teacherPendingCount++;
          }
        } catch (err) {
          console.error("解析 RabbitMQ 消息失败:", err);
        }
      }
      for (const msg of fetchedMessages) {
        channel.nack(msg, false, true);
      }
      return res.json({
        code: 200,
        message: "获取认证队列消息数量成功",
        data: { count: teacherPendingCount },
      });
    } else if (req.user.role === "3") {
      const queueInfo = await channel.checkQueue(queueName);
      return res.json({
        code: 200,
        message: "获取认证队列消息数量成功",
        data: { count: queueInfo.messageCount },
      });
    } else {
      return res
        .status(403)
        .json({ code: 403, message: "无权访问", data: null });
    }
  } catch (error) {
    console.error("获取认证队列消息数量失败:", error);
    return res
      .status(500)
      .json({
        code: 500,
        message: "服务器错误，获取认证队列消息数量失败",
        data: null,
      });
  }
});

module.exports = router;
