// middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { code: 429, message: "请求过于频繁，请稍后再试", data: null },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { globalLimiter };
