const logger = require('../utils/logger');
const { ERROR_CODES, getError } = require('../utils/errorCodes');

/**
 * 业务错误类
 * 用于抛出可预期的业务错误
 */
class AppError extends Error {
  constructor(errorKey, customMessage = null, statusCode = null) {
    const errorInfo = typeof errorKey === 'string'
      ? getError(errorKey, customMessage)
      : { code: errorKey, message: customMessage || '操作失败' };

    super(errorInfo.message);
    this.code = errorInfo.code;
    this.message = errorInfo.message;
    this.statusCode = statusCode || this.mapCodeToStatus(errorInfo.code);
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 将业务错误码映射到 HTTP 状态码
   */
  mapCodeToStatus(code) {
    if (code === 0) return 200;
    if (code >= 2000 && code < 3000) return 401; // 认证错误
    if (code >= 3000 && code < 4000) return 400; // 用户相关错误
    if (code >= 4000 && code < 5000) return 404; // 资源不存在
    if (code >= 5000 && code < 6000) return 400; // 文件错误
    if (code >= 6000 && code < 7000) return 500; // AI服务错误
    if (code >= 7000 && code < 8000) return 500; // 数据库错误
    if (code >= 8000 && code < 9000) return 502; // 第三方服务错误
    return 500; // 默认服务器错误
  }
}

/**
 * 统一错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 设置默认值
  err.statusCode = err.statusCode || 500;
  err.code = err.code || ERROR_CODES.UNKNOWN_ERROR.code;
  err.message = err.message || ERROR_CODES.UNKNOWN_ERROR.message;

  // 记录错误日志
  const logMessage = `[${req.method}] ${req.path} - ${err.code}: ${err.message}`;
  if (err.statusCode >= 500) {
    logger.error(logMessage, {
      error: err.message,
      stack: err.stack,
      body: req.body,
      query: req.query,
      params: req.params,
    });
  } else {
    logger.warn(logMessage, {
      error: err.message,
      body: req.body,
    });
  }

  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      data: null,
      error: {
        name: err.name,
        stack: err.stack,
      },
    });
  }

  // 生产环境
  if (err.isOperational) {
    // 可预期的业务错误，返回给客户端
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      data: null,
    });
  }

  // 未知错误，不泄露详细信息
  return res.status(500).json({
    code: ERROR_CODES.UNKNOWN_ERROR.code,
    message: ERROR_CODES.UNKNOWN_ERROR.message,
    data: null,
  });
};

/**
 * 404 错误处理中间件
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError('INVALID_REQUEST', `路由不存在: ${req.originalUrl}`, 404);
  next(error);
};

/**
 * 异步路由错误捕获包装器
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
