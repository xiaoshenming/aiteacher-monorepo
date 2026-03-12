// middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

// 视频播放/下载类 API - 高频限流（适用于流式播放、下载等场景）
const mediaLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 1000, // 1000次请求/分钟
  message: { code: 429, message: "媒体播放请求过于频繁，请稍后再试", data: null },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 只对媒体相关的路径生效
    return !req.path.includes('/download') && !req.path.includes('/preview') && !req.path.includes('/stream');
  }
});

// 文件管理 API - 中等限流
const fileUploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 30, // 30次请求/分钟
  message: { code: 429, message: "文件操作请求过于频繁，请稍后再试", data: null },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return !req.path.includes('/chunk') && !req.path.includes('/upload') && !req.path.includes('/delete');
  }
});

// 其他 API - 低频限流（防止滥用）
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 60, // 60次请求/分钟
  message: { code: 429, message: "请求过于频繁，请稍后再试", data: null },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { mediaLimiter, fileUploadLimiter, apiLimiter };
