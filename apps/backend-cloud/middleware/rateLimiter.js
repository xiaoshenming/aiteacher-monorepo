// middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

// 视频播放/下载类 API - 高频限流（适用于流式播放、下载等场景）
const mediaLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 10000, // 10000次请求/分钟（支持视频 Range 请求）
  message: { code: 429, message: "媒体播放请求过于频繁，请稍后再试", data: null },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 只对媒体相关的路径生效
    return !req.path.includes('/download') && !req.path.includes('/preview') && !req.path.includes('/stream');
  },
  // 对 Range 请求使用单独的计数 key，避免影响普通请求
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const isRangeRequest = req.headers['range'];
    // Range 请求和普通请求分开计数
    return isRangeRequest ? `${ip}-range` : `${ip}-full`;
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
