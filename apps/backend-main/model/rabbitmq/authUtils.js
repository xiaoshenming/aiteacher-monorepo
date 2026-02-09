// model/rabbitmq/authUtils.js
const amqp = require("amqplib");
const db = require("../../config/db");
const redis = require("../../config/redis");
require("dotenv").config();

let authChannel = null;
const RABBIT_URL =
  process.env.RABBIT_URL || "amqp://admin:admin@10.3.36.17:5672";
const AUTH_EXCHANGE = process.env.AUTH_EXCHANGE || "authExchange";

/**
 * 获取或建立认证专用的 RabbitMQ 通道
 */
async function connectAuthChannel() {
  if (authChannel) return authChannel;
  try {
    const connection = await amqp.connect(RABBIT_URL);
    authChannel = await connection.createChannel();
    await authChannel.assertExchange(AUTH_EXCHANGE, "direct", {
      durable: true,
    });
    console.log("[RabbitMQ] Auth Exchange 就绪:", AUTH_EXCHANGE);
    return authChannel;
  } catch (error) {
    console.error("[RabbitMQ] Auth 通道连接失败:", error);
    setTimeout(connectAuthChannel, 5000);
  }
}

/**
 * 发布认证请求消息到 RabbitMQ，不直接写入数据库
 * @param {Object} messageObj 认证请求消息对象
 */
async function publishAuthRequest(messageObj) {
  const channel = await connectAuthChannel();
  if (!channel) return;
  const routingKey = `auth.request.school.${messageObj.school_id}`;
  channel.publish(
    AUTH_EXCHANGE,
    routingKey,
    Buffer.from(JSON.stringify(messageObj)),
    { persistent: true }
  );
  console.log("[AuthUtils] 发布认证请求:", messageObj);
}

/**
 * 处理认证审批消息：查询记录、校验学校、开启事务更新认证记录和教师信息，并清除 Redis 中 JWT
 * @param {Object} messageObj 消息对象，包含 { requestId, admin_id }
 */
async function publishAuthApproval(messageObj) {
  try {
    const { requestId, admin_id } = messageObj;
    console.log(messageObj);
    
    // 查询认证申请记录
    const [reqRows] = await db
      .promise()
      .query("SELECT * FROM authentication_requests WHERE id = ?", [requestId]);
    if (reqRows.length === 0) {
      console.error("[AuthUtils] 认证申请未找到:", requestId);
      return;
    }
    const authRequest = reqRows[0];

    // 查询管理员登录验证记录，获取 uid
    const [adminLvRows] = await db
      .promise()
      .query("SELECT uid FROM loginverification WHERE id = ?", [admin_id]);
    if (adminLvRows.length === 0) {
      console.error("[AuthUtils] 管理员未找到:", admin_id);
      return;
    }
    const admin_uid = adminLvRows[0].uid;
    // 查询管理员用户信息，获取学校ID
    const [adminUserRows] = await db
      .promise()
      .query("SELECT schoolId FROM user WHERE id = ?", [admin_uid]);
    if (adminUserRows.length === 0) {
      console.error("[AuthUtils] 管理员信息未找到，uid:", admin_uid);
      return;
    }
    const adminSchoolId = adminUserRows[0].schoolId;
    // 校验学校是否匹配
    if (authRequest.school_id !== adminSchoolId) {
      console.error("[AuthUtils] 学校不匹配，无权限审批");
      return;
    }
    // 检查认证申请状态是否为待处理
    if (authRequest.status !== 0) {
      console.error("[AuthUtils] 认证申请已处理");
      return;
    }
    // 开启事务更新认证记录和教师信息
    const connectionDb = db.promise();
    await connectionDb.beginTransaction();
    try {
      await connectionDb.execute(
        "UPDATE authentication_requests SET status = 1, admin_id = ? WHERE id = ?",
        [admin_id, requestId]
      );
      await connectionDb.execute("UPDATE user SET schoolId = ? WHERE id = ?", [
        adminSchoolId,
        authRequest.teacher_uid,
      ]);
      await connectionDb.execute(
        "UPDATE loginverification SET role = ? WHERE uid = ?",
        [2, authRequest.teacher_uid]
      );
      await connectionDb.commit();
    } catch (err) {
      await connectionDb.rollback();
      console.error("[AuthUtils] 事务错误:", err);
      return;
    }
    // 清除教师在 Redis 中的 JWT（PC 与移动端）
    const [teacherLvRows] = await db
      .promise()
      .query("SELECT id FROM loginverification WHERE uid = ?", [
        authRequest.teacher_uid,
      ]);
    if (teacherLvRows.length > 0) {
      const teacherLvId = teacherLvRows[0].id;
      await redis.del(`user_${teacherLvId}_pc_token`);
      await redis.del(`user_${teacherLvId}_mobile_token`);
      console.log(`[AuthUtils] 已清除教师 JWT，teacher_lv_id: ${teacherLvId}`);
    }
    console.log("[AuthUtils] 认证审批成功，requestId:", requestId);
  } catch (error) {
    console.error("[AuthUtils] 认证审批处理出错:", error);
  }
}

module.exports = {
  publishAuthRequest,
  publishAuthApproval,
};
