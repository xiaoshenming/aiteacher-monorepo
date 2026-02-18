/**
 * 统一请求验证中间件
 * 使用 express-validator 进行参数校验
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * 统一处理验证错误
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      code: 400,
      message: '请求参数验证失败',
      data: { errors: errorMessages }
    });
  }
  next();
};

/**
 * 用户注册验证
 */
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('用户名不能为空')
    .isLength({ min: 2, max: 20 }).withMessage('用户名长度必须在2-20位之间'),
  body('email')
    .trim()
    .notEmpty().withMessage('邮箱不能为空')
    .isEmail().withMessage('邮箱格式不正确')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 5, max: 32 }).withMessage('密码长度必须在5-32位之间'),
  body('code')
    .trim()
    .notEmpty().withMessage('验证码不能为空'),
  handleValidationErrors
];

/**
 * 用户登录验证
 */
const validateLogin = [
  body('account')
    .trim()
    .notEmpty().withMessage('账号不能为空'),
  body('password')
    .trim()
    .notEmpty().withMessage('密码不能为空'),
  handleValidationErrors
];

/**
 * AI 聊天请求验证
 */
const validateAIChat = [
  body('prompt')
    .trim()
    .notEmpty().withMessage('提示词不能为空')
    .isString().withMessage('提示词必须是字符串')
    .isLength({ min: 1, max: 10000 }).withMessage('提示词长度必须在1-10000字符之间'),
  body('model')
    .optional()
    .isString().withMessage('模型名称必须是字符串')
    .isIn(['deepseek-chat', 'deepseek-reasoner', 'gpt-3.5-turbo', 'gpt-4']).withMessage('不支持的模型类型'),
  handleValidationErrors
];

/**
 * 会议纪要生成验证
 */
const validateMeetingSummary = [
  body('transcript')
    .trim()
    .notEmpty().withMessage('转录内容不能为空')
    .isString().withMessage('转录内容必须是字符串')
    .isLength({ min: 10, max: 50000 }).withMessage('转录内容长度必须在10-50000字符之间'),
  body('duration')
    .optional()
    .isString().withMessage('时长必须是字符串'),
  body('model')
    .optional()
    .isString().withMessage('模型名称必须是字符串'),
  handleValidationErrors
];

/**
 * 翻译请求验证
 */
const validateTranslate = [
  body('text')
    .trim()
    .notEmpty().withMessage('翻译文本不能为空')
    .isString().withMessage('翻译文本必须是字符串')
    .isLength({ min: 1, max: 5000 }).withMessage('翻译文本长度必须在1-5000字符之间'),
  body('from')
    .optional()
    .isString().withMessage('源语言必须是字符串')
    .isIn(['auto', 'zh', 'en', 'ja', 'ko', 'fr', 'de', 'es']).withMessage('不支持的源语言'),
  body('to')
    .optional()
    .isString().withMessage('目标语言必须是字符串')
    .isIn(['zh', 'en', 'ja', 'ko', 'fr', 'de', 'es']).withMessage('不支持的目标语言'),
  handleValidationErrors
];

/**
 * 编辑器续写验证
 */
const validateEditorCompletion = [
  body('prompt')
    .trim()
    .notEmpty().withMessage('提示词不能为空')
    .isString().withMessage('提示词必须是字符串')
    .isLength({ min: 1, max: 5000 }).withMessage('提示词长度必须在1-5000字符之间'),
  body('model')
    .optional()
    .isString().withMessage('模型名称必须是字符串'),
  handleValidationErrors
];

/**
 * 生成打印材料验证
 */
const validateGeneratePrint = [
  body('prompt')
    .trim()
    .notEmpty().withMessage('需求描述不能为空')
    .isString().withMessage('需求描述必须是字符串')
    .isLength({ min: 5, max: 2000 }).withMessage('需求描述长度必须在5-2000字符之间'),
  body('template_type')
    .optional()
    .isString().withMessage('模板类型必须是字符串')
    .isIn(['quiz', 'midterm', 'exercise', 'notice', 'report']).withMessage('不支持的模板类型'),
  handleValidationErrors
];

/**
 * 生成教案验证
 */
const validateGenerateLessonPlan = [
  body('prompt')
    .trim()
    .notEmpty().withMessage('教案需求不能为空')
    .isString().withMessage('教案需求必须是字符串')
    .isLength({ min: 10, max: 2000 }).withMessage('教案需求长度必须在10-2000字符之间'),
  body('model')
    .optional()
    .isString().withMessage('模型名称必须是字符串'),
  handleValidationErrors
];

/**
 * 文件上传验证（头像）
 */
const validateAvatarUpload = (req, res, next) => {
  if (!req.files || !req.files.avatar) {
    return res.status(400).json({
      code: 400,
      message: '请选择要上传的头像文件',
      data: null
    });
  }

  const avatar = req.files.avatar;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(avatar.mimetype)) {
    return res.status(400).json({
      code: 400,
      message: '头像文件格式不支持，仅支持 JPG、PNG、GIF、WebP 格式',
      data: null
    });
  }

  if (avatar.size > maxSize) {
    return res.status(413).json({
      code: 413,
      message: '头像文件大小不能超过 5MB',
      data: null
    });
  }

  next();
};

/**
 * 课程创建验证
 */
const validateCreateCourse = [
  body('name')
    .trim()
    .notEmpty().withMessage('课程名称不能为空')
    .isLength({ min: 2, max: 100 }).withMessage('课程名称长度必须在2-100字符之间'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('课程描述不能超过500字符'),
  body('semester')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('学期信息不能超过50字符'),
  handleValidationErrors
];

/**
 * 教案创建/更新验证
 */
const validateLessonPlan = [
  body('name')
    .trim()
    .notEmpty().withMessage('教案名称不能为空')
    .isLength({ min: 2, max: 200 }).withMessage('教案名称长度必须在2-200字符之间'),
  body('content')
    .optional()
    .isString().withMessage('教案内容必须是字符串')
    .isLength({ max: 100000 }).withMessage('教案内容不能超过100000字符'),
  body('status')
    .optional()
    .isInt({ min: 0, max: 3 }).withMessage('教案状态必须是0-3之间的整数'),
  handleValidationErrors
];

/**
 * 分页参数验证
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('页码必须是大于0的整数')
    .toInt(),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('每页数量必须是1-100之间的整数')
    .toInt(),
  query('pageIndex')
    .optional()
    .isInt({ min: 1 }).withMessage('页码必须是大于0的整数')
    .toInt(),
  handleValidationErrors
];

/**
 * ID 参数验证
 */
const validateId = (paramName = 'id') => [
  param(paramName)
    .isInt({ min: 1 }).withMessage('ID必须是大于0的整数')
    .toInt(),
  handleValidationErrors
];

/**
 * 认证申请验证
 */
const validateAuthRequest = [
  body('schoolId')
    .notEmpty().withMessage('学校ID不能为空')
    .isInt({ min: 1 }).withMessage('学校ID必须是正整数')
    .toInt(),
  body('requestMessage')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('申请说明不能超过500字符'),
  handleValidationErrors
];

/**
 * 搜索关键词验证
 */
const validateSearch = [
  body('keyword')
    .trim()
    .notEmpty().withMessage('搜索关键字不能为空')
    .isLength({ min: 1, max: 50 }).withMessage('搜索关键字长度必须在1-50字符之间'),
  handleValidationErrors
];

/**
 * 头像 URL 更新验证
 */
const validateAvatarUrl = [
  body('avatarUrl')
    .trim()
    .notEmpty().withMessage('头像URL不能为空')
    .isURL({ protocols: ['http', 'https'] }).withMessage('头像URL格式不正确'),
  handleValidationErrors
];

/**
 * 助教添加验证
 */
const validateAddAssistant = [
  body('assistantId')
    .notEmpty().withMessage('助教ID不能为空')
    .isInt({ min: 1 }).withMessage('助教ID必须是正整数')
    .toInt(),
  handleValidationErrors
];

module.exports = {
  // 工具函数
  handleValidationErrors,

  // 用户相关
  validateRegister,
  validateLogin,
  validateAvatarUpload,
  validateAvatarUrl,

  // AI 相关
  validateAIChat,
  validateMeetingSummary,
  validateTranslate,
  validateEditorCompletion,
  validateGeneratePrint,
  validateGenerateLessonPlan,

  // 课程相关
  validateCreateCourse,
  validateAddAssistant,

  // 教案相关
  validateLessonPlan,

  // 认证相关
  validateAuthRequest,

  // 通用验证
  validatePagination,
  validateId,
  validateSearch
};
