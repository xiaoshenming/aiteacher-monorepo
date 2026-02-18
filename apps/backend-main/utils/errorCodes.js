/**
 * 统一错误码字典
 * 格式：{ code: number, message: string }
 *
 * 错误码规范：
 * - 1000-1999: 通用错误
 * - 2000-2999: 认证/授权错误
 * - 3000-3999: 用户相关错误
 * - 4000-4999: 课程/教学相关错误
 * - 5000-5999: 文件/资源相关错误
 * - 6000-6999: AI/题目生成相关错误
 * - 7000-7999: 数据库/系统错误
 * - 8000-8999: 第三方服务错误
 */

const ERROR_CODES = {
  // 通用错误 (1000-1999)
  SUCCESS: { code: 0, message: '操作成功' },
  UNKNOWN_ERROR: { code: 1000, message: '未知错误' },
  INVALID_PARAMS: { code: 1001, message: '参数错误' },
  MISSING_PARAMS: { code: 1002, message: '缺少必要参数' },
  INVALID_REQUEST: { code: 1003, message: '无效的请求' },
  METHOD_NOT_ALLOWED: { code: 1004, message: '请求方法不允许' },
  RATE_LIMIT_EXCEEDED: { code: 1005, message: '请求过于频繁，请稍后再试' },
  SERVICE_UNAVAILABLE: { code: 1006, message: '服务暂时不可用' },
  VALIDATION_ERROR: { code: 1007, message: '数据验证失败' },

  // 认证/授权错误 (2000-2999)
  UNAUTHORIZED: { code: 2000, message: '未授权，请先登录' },
  TOKEN_EXPIRED: { code: 2001, message: '登录已过期，请重新登录' },
  TOKEN_INVALID: { code: 2002, message: '无效的令牌' },
  TOKEN_MISSING: { code: 2003, message: '缺少认证令牌' },
  PERMISSION_DENIED: { code: 2004, message: '权限不足' },
  ACCOUNT_DISABLED: { code: 2005, message: '账号已被禁用' },
  ACCOUNT_LOCKED: { code: 2006, message: '账号已被锁定' },
  SESSION_EXPIRED: { code: 2007, message: '会话已过期' },
  INVALID_CREDENTIALS: { code: 2008, message: '用户名或密码错误' },

  // 用户相关错误 (3000-3999)
  USER_NOT_FOUND: { code: 3000, message: '用户不存在' },
  USER_ALREADY_EXISTS: { code: 3001, message: '用户已存在' },
  EMAIL_ALREADY_EXISTS: { code: 3002, message: '邮箱已被注册' },
  PHONE_ALREADY_EXISTS: { code: 3003, message: '手机号已被注册' },
  INVALID_EMAIL: { code: 3004, message: '邮箱格式不正确' },
  INVALID_PHONE: { code: 3005, message: '手机号格式不正确' },
  PASSWORD_TOO_WEAK: { code: 3006, message: '密码强度不足' },
  PASSWORD_MISMATCH: { code: 3007, message: '两次输入的密码不一致' },
  OLD_PASSWORD_INCORRECT: { code: 3008, message: '原密码错误' },
  USER_UPDATE_FAILED: { code: 3009, message: '用户信息更新失败' },
  VERIFICATION_CODE_INVALID: { code: 3010, message: '验证码错误或已过期' },
  VERIFICATION_CODE_EXPIRED: { code: 3011, message: '验证码已过期' },

  // 课程/教学相关错误 (4000-4999)
  COURSE_NOT_FOUND: { code: 4000, message: '课程不存在' },
  COURSE_ALREADY_EXISTS: { code: 4001, message: '课程已存在' },
  CLASS_NOT_FOUND: { code: 4002, message: '班级不存在' },
  CLASS_ALREADY_EXISTS: { code: 4003, message: '班级已存在' },
  STUDENT_NOT_FOUND: { code: 4004, message: '学生不存在' },
  STUDENT_ALREADY_IN_CLASS: { code: 4005, message: '学生已在该班级中' },
  LESSON_PLAN_NOT_FOUND: { code: 4006, message: '教案不存在' },
  ASSIGNMENT_NOT_FOUND: { code: 4007, message: '作业不存在' },
  RESOURCE_NOT_FOUND: { code: 4008, message: '资源不存在' },
  SCHEDULE_CONFLICT: { code: 4009, message: '课程时间冲突' },
  ENROLLMENT_FULL: { code: 4010, message: '课程已满员' },
  ENROLLMENT_CLOSED: { code: 4011, message: '课程报名已关闭' },
  GRADE_INVALID: { code: 4012, message: '成绩格式不正确' },
  QUESTION_BANK_NOT_FOUND: { code: 4013, message: '题库不存在' },

  // 文件/资源相关错误 (5000-5999)
  FILE_NOT_FOUND: { code: 5000, message: '文件不存在' },
  FILE_TOO_LARGE: { code: 5001, message: '文件大小超出限制' },
  FILE_TYPE_NOT_ALLOWED: { code: 5002, message: '不支持的文件类型' },
  FILE_UPLOAD_FAILED: { code: 5003, message: '文件上传失败' },
  FILE_DELETE_FAILED: { code: 5004, message: '文件删除失败' },
  STORAGE_QUOTA_EXCEEDED: { code: 5005, message: '存储空间不足' },
  FILE_CORRUPTED: { code: 5006, message: '文件已损坏' },
  FILE_PROCESSING_FAILED: { code: 5007, message: '文件处理失败' },

  // AI/题目生成相关错误 (6000-6999)
  AI_SERVICE_ERROR: { code: 6000, message: 'AI服务异常' },
  AI_QUOTA_EXCEEDED: { code: 6001, message: 'AI使用额度已用完' },
  AI_GENERATION_FAILED: { code: 6002, message: 'AI生成失败' },
  AI_TIMEOUT: { code: 6003, message: 'AI响应超时' },
  QUESTION_GENERATION_FAILED: { code: 6004, message: '题目生成失败' },
  INVALID_QUESTION_TYPE: { code: 6005, message: '无效的题目类型' },
  LESSON_PLAN_GENERATION_FAILED: { code: 6006, message: '教案生成失败' },
  AI_CONTENT_FILTERED: { code: 6007, message: 'AI内容被过滤' },

  // 数据库/系统错误 (7000-7999)
  DATABASE_ERROR: { code: 7000, message: '数据库错误' },
  DATABASE_CONNECTION_FAILED: { code: 7001, message: '数据库连接失败' },
  QUERY_FAILED: { code: 7002, message: '查询失败' },
  INSERT_FAILED: { code: 7003, message: '插入数据失败' },
  UPDATE_FAILED: { code: 7004, message: '更新数据失败' },
  DELETE_FAILED: { code: 7005, message: '删除数据失败' },
  TRANSACTION_FAILED: { code: 7006, message: '事务执行失败' },
  REDIS_ERROR: { code: 7007, message: 'Redis缓存错误' },
  CACHE_ERROR: { code: 7008, message: '缓存操作失败' },

  // 第三方服务错误 (8000-8999)
  EMAIL_SEND_FAILED: { code: 8000, message: '邮件发送失败' },
  SMS_SEND_FAILED: { code: 8001, message: '短信发送失败' },
  PAYMENT_FAILED: { code: 8002, message: '支付失败' },
  THIRD_PARTY_API_ERROR: { code: 8003, message: '第三方API调用失败' },
  RABBITMQ_ERROR: { code: 8004, message: '消息队列错误' },
  ASR_SERVICE_ERROR: { code: 8005, message: '语音识别服务错误' },
  CLOUD_STORAGE_ERROR: { code: 8006, message: '云存储服务错误' },
};

/**
 * 根据错误码获取错误信息
 * @param {string} errorKey - 错误码键名
 * @param {string} customMessage - 自定义错误消息（可选）
 * @returns {Object} { code, message }
 */
function getError(errorKey, customMessage = null) {
  const error = ERROR_CODES[errorKey] || ERROR_CODES.UNKNOWN_ERROR;
  return {
    code: error.code,
    message: customMessage || error.message,
  };
}

/**
 * 创建标准响应对象
 * @param {number} code - 错误码
 * @param {string} message - 消息
 * @param {*} data - 数据（可选）
 * @returns {Object} { code, message, data }
 */
function createResponse(code, message, data = null) {
  const response = { code, message };
  if (data !== null) {
    response.data = data;
  }
  return response;
}

/**
 * 创建成功响应
 * @param {*} data - 返回数据
 * @param {string} message - 自定义消息（可选）
 * @returns {Object} { code: 0, message, data }
 */
function success(data = null, message = '操作成功') {
  return createResponse(0, message, data);
}

/**
 * 创建错误响应
 * @param {string} errorKey - 错误码键名
 * @param {string} customMessage - 自定义错误消息（可选）
 * @param {*} data - 附加数据（可选）
 * @returns {Object} { code, message, data }
 */
function error(errorKey, customMessage = null, data = null) {
  const err = getError(errorKey, customMessage);
  return createResponse(err.code, err.message, data);
}

module.exports = {
  ERROR_CODES,
  getError,
  createResponse,
  success,
  error,
};
