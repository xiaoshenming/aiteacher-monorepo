// model/rabbitmq/notificationUtils.js
const amqp = require("amqplib");
require("dotenv").config();

let notificationChannel = null;
const RABBIT_URL =
  process.env.RABBIT_URL || "amqp://admin:admin@10.3.36.17:5672";
const EXCHANGE_NAME = process.env.EXCHANGE_NAME || "notificationExchange";

/**
 * 获取或建立通知专用的 RabbitMQ 通道
 */
async function connectNotificationChannel() {
  if (notificationChannel) return notificationChannel;
  try {
    const connection = await amqp.connect(RABBIT_URL);
    notificationChannel = await connection.createChannel();
    await notificationChannel.assertExchange(EXCHANGE_NAME, "direct", {
      durable: true,
    });
    console.log(
      "[NotificationUtils] Notification Exchange 就绪:",
      EXCHANGE_NAME
    );
    return notificationChannel;
  } catch (error) {
    console.error("[NotificationUtils] 连接失败:", error);
    setTimeout(connectNotificationChannel, 5000);
  }
}

/**
 * 发布通知消息到 RabbitMQ
 * @param {string} routingKey 消息路由键，例如 notification.user.{receiverId}
 * @param {Object} messageObj 通知消息对象
 */
async function publishNotification(routingKey, messageObj) {
  const channel = await connectNotificationChannel();
  if (!channel) return;
  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(messageObj)),
    { persistent: true }
  );
  console.log("[NotificationUtils] 发布通知:", messageObj);
}

module.exports = {
  publishNotification,
  connectNotificationChannel,
  EXCHANGE_NAME,
  RABBIT_URL,
};
