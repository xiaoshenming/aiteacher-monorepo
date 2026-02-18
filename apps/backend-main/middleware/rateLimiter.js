// middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

/**
 * 全局限流：100 req/15min
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100,
  message: {
    code: 429,
    message: "请求过于频繁，请稍后再试",
    data: null,
  },
  standardHeaders: true, // 返回 RateLimit-* 头
  legacyHeaders: false, // 禁用 X-RateLimit-* 头
});

/**
 * 登录/注册限流：5 req/15min（按 IP）
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 5,
  message: {
    code: 429,
    message: "登录/注册请求过于频繁，请 15 分钟后再试",
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // 成功的请求也计数
});

/**
 * AI 接口限流：10 req/min（按用户 ID）
 * 需要在认证后使用，通过 req.user.id 识别用户
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 10,
  message: {
    code: 429,
    message: "AI 请求过于频繁，请稍后再试",
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // 优先使用用户 ID，未登录则使用 IP
    return req.user?.id?.toString() || req.ip;
  },
});

/**
 * 验证码限流：3 req/10min（按 IP）
 */
const verificationCodeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 分钟
  max: 3,
  message: {
    code: 429,
    message: "验证码请求过于频繁，请稍后再试",
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  authLimiter,
  aiLimiter,
  verificationCodeLimiter,
};
