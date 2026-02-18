// heartbeat/heartbeat.js
const redis = require("./redis");
const db = require("./db");
const logger = require("../utils/logger");

function startHeartbeats() {
  // Redis 心跳
  setInterval(async () => {
    try {
      const pong = await redis.ping();
      logger.info("Redis 心跳包成功:", pong);
    } catch (error) {
      logger.error("Redis 心跳包失败:", error);
    }
  }, 300000); // 每 5 分钟

  // MySQL 心跳
  setInterval(() => {
    db.query("SELECT 1", (err) => {
      if (err) {
        logger.error("MySQL 心跳包失败:", err);
      } else {
        logger.info("MySQL 心跳包成功");
      }
    });
  }, 300000); // 每 5 分钟
}

module.exports = { startHeartbeats };
