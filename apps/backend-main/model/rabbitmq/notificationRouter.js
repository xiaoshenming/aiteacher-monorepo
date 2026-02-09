// model/rabbitmq/notificationRouter.js
const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const amqp = require("amqplib");
const {
  publishNotification,
  EXCHANGE_NAME,
  RABBIT_URL,
} = require("./notificationUtils");
const authorize = require("../auth/authUtils"); // 同样使用权限中间件

/**
 * POST /api/notification/sendToOne
 * 单发通知
 */
router.post("/sendToOne", authorize(["3", "4"]), async (req, res) => {
  try {
    const { receiverId, title, content, level } = req.body;
    if (!receiverId || !content) {
      return res
        .status(400)
        .json({ code: 400, message: "缺少必要参数", data: null });
    }
    const senderId = req.user.id;
    const routingKey = `notification.user.${receiverId}`;
    await publishNotification(routingKey, {
      receiverId,
      senderId,
      title,
      content,
      level,
    });
    return res.json({
      code: 200,
      message: "消息已加入队列，将异步发送",
      data: null,
    });
  } catch (error) {
    console.error("发送通知失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误", data: null });
  }
});

/**
 * POST /api/notification/sendToMany
 * 批量发送通知
 */
router.post("/sendToMany", authorize(["3", "4"]), async (req, res) => {
  try {
    const { receiverIds, title, content, level } = req.body;
    if (!Array.isArray(receiverIds) || receiverIds.length === 0 || !content) {
      return res
        .status(400)
        .json({ code: 400, message: "缺少必要参数", data: null });
    }
    const senderId = req.user.id;
    for (const receiverId of receiverIds) {
      const routingKey = `notification.user.${receiverId}`;
      await publishNotification(routingKey, {
        receiverId,
        senderId,
        title,
        content,
        level,
      });
    }
    return res.json({
      code: 200,
      message: "批量消息已加入队列，将异步发送",
      data: null,
    });
  } catch (error) {
    console.error("批量发送通知失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误", data: null });
  }
});

/**
 * POST /api/notification/sendGlobal
 * 全局广播通知
 */
router.post("/sendGlobal", authorize(["3", "4"]), async (req, res) => {
  try {
    const { title, content, level } = req.body;
    if (!content) {
      return res
        .status(400)
        .json({ code: 400, message: "缺少必要参数: content", data: null });
    }
    const senderId = req.user.id;
    const [users] = await db.promise().query("SELECT id FROM user");
    for (const u of users) {
      const routingKey = `notification.user.${u.id}`;
      await publishNotification(routingKey, {
        receiverId: u.id,
        senderId,
        title,
        content,
        level,
      });
    }
    return res.json({ code: 200, message: "全局消息已加入队列", data: null });
  } catch (error) {
    console.error("全服广播失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误", data: null });
  }
});

/**
 * GET /api/notification
 * 拉取当前用户通知：先从 RabbitMQ 队列取消息写入数据库，再分页返回数据库中的通知
 */
router.get("/", authorize(["1", "2", "3", "4"]), async (req, res) => {
  try {
    const userId = req.user.id;
    const [lv] = await db
      .promise()
      .query("SELECT uid, name FROM loginverification WHERE id = ?", [userId]);
    if (!lv.length) {
      return res
        .status(404)
        .json({ code: 404, message: "用户不存在", data: null });
    }
    const realUserId = lv[0].uid;
    const routingKey = `notification.user.${realUserId}`;
    const queueName = `notificationQueue_${realUserId}`;
    const connection = await amqp.connect(RABBIT_URL);
    const channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: true });
    const q = await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
    let mqMessages = [];
    while (true) {
      const msg = await channel.get(q.queue, { noAck: false });
      if (!msg) break;
      const messageObj = JSON.parse(msg.content.toString());
      mqMessages.push(messageObj);
      channel.ack(msg);
    }
    await channel.close();
    await connection.close();
    if (mqMessages.length > 0) {
      for (const message of mqMessages) {
        const {
          receiverId,
          senderId = 0,
          title = "系统通知",
          content,
          level = 1,
        } = message;
        await db.execute(
          `INSERT INTO notifications (receiver_id, sender_id, title, content, level, status)
           VALUES (?, ?, ?, ?, ?, 0)`,
          [receiverId, senderId, title, content, level]
        );
      }
    }
    const pageIndex = parseInt(req.query.pageIndex) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (pageIndex - 1) * pageSize;
    const [countRows] = await db
      .promise()
      .query(
        "SELECT COUNT(*) as total FROM notifications WHERE receiver_id = ? AND status != 2",
        [realUserId]
      );
    const total = countRows[0].total;
    const [rows] = await db.promise().query(
      `SELECT n.*, lv.name AS sender_username 
       FROM notifications n 
       LEFT JOIN loginverification lv ON n.sender_id = lv.id 
       WHERE n.receiver_id = ? AND n.status != 2 
       ORDER BY n.create_time DESC, n.id DESC 
       LIMIT ?, ?`,
      [realUserId, offset, pageSize]
    );
    return res.json({
      code: 200,
      message: "获取通知列表成功",
      data: { total, pageIndex, pageSize, list: rows },
    });
  } catch (error) {
    console.error("获取通知列表失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误", data: null });
  }
});

/**
 * PUT /api/notification/:id/read
 * 标记通知为已读
 */
router.put("/:id/read", authorize(["1", "2", "3", "4"]), async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    const [lv] = await db
      .promise()
      .query("SELECT uid FROM loginverification WHERE id = ?", [userId]);
    if (!lv.length) {
      return res
        .status(404)
        .json({ code: 404, message: "用户不存在", data: null });
    }
    const realUserId = lv[0].uid;
    const [result] = await db
      .promise()
      .query(
        "UPDATE notifications SET status = 1 WHERE id = ? AND receiver_id = ?",
        [notificationId, realUserId]
      );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          code: 404,
          message: "通知不存在或无权限标记此消息",
          data: null,
        });
    }
    return res.json({ code: 200, message: "标记已读成功", data: null });
  } catch (error) {
    console.error("标记已读失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误", data: null });
  }
});

/**
 * DELETE /api/notification/:id
 * 删除（逻辑删除）通知
 */
router.delete("/:id", authorize(["1", "2", "3", "4"]), async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    const [lv] = await db
      .promise()
      .query("SELECT uid FROM loginverification WHERE id = ?", [userId]);
    if (!lv.length) {
      return res
        .status(404)
        .json({ code: 404, message: "用户不存在", data: null });
    }
    const realUserId = lv[0].uid;
    const [result] = await db
      .promise()
      .query(
        "UPDATE notifications SET status = 2 WHERE id = ? AND receiver_id = ?",
        [notificationId, realUserId]
      );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          code: 404,
          message: "通知不存在或无权限删除此消息",
          data: null,
        });
    }
    return res.json({
      code: 200,
      message: "删除通知成功(逻辑删除)",
      data: null,
    });
  } catch (error) {
    console.error("删除通知失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误", data: null });
  }
});

/**
 * GET /api/notification/count
 * 获取当前用户队列中的通知消息数量
 */
router.get("/count", authorize(["1", "2", "3", "4"]), async (req, res) => {
  try {
    const userId = req.user.id;
    const [lv] = await db
      .promise()
      .query("SELECT uid FROM loginverification WHERE id = ?", [userId]);
    if (!lv.length) {
      return res
        .status(404)
        .json({ code: 404, message: "用户不存在", data: null });
    }
    const realUserId = lv[0].uid;
    const queueName = `notificationQueue_${realUserId}`;
    const connection = await amqp.connect(RABBIT_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });
    const queueInfo = await channel.checkQueue(queueName);
    await channel.close();
    await connection.close();
    return res.json({
      code: 200,
      message: "获取消息数量成功",
      data: { count: queueInfo.messageCount },
    });
  } catch (error) {
    console.error("获取消息数量失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误，获取消息数量失败", data: null });
  }
});

module.exports = router;
