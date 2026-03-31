// 身份认证中间件 - 用于验证API请求的JWT令牌有效性
// 依赖模块：redis（存储有效令牌）、jsonwebtoken（JWT解析）、dotenv（环境变量）

// 引入基础模块
const RedisClient = require('./redis');  // Redis客户端实例
const jwt = require('jsonwebtoken');     // JWT解析库
require("dotenv").config();              // 加载环境变量
const { getJwtSecret } = require('./auth-config');

/**
 * 检查Redis中存储的令牌有效性
 * @param {number} lvid - 用户唯一标识
 * @param {string} token - 待验证的JWT令牌
 * @param {string} deviceType - 设备类型（pc/mobile）
 * @returns {Promise<boolean>} 令牌是否有效
 */
async function checkJWTInRedis(lvid, token, deviceType) {
  const redisKey = `user_${lvid}_${deviceType}_token`; // Redis键格式：user_[用户ID]_[设备类型]_token
  const storedToken = await RedisClient.get(redisKey);
  return storedToken === token; // 严格比对客户端令牌和存储令牌
}

/**
 * 身份认证中间件主函数
 * 执行流程：
 * 1. 验证请求头格式
 * 2. 解析并验证JWT令牌
 * 3. 核对Redis存储的令牌有效性
 * 4. 令牌续期并放行请求
 */
const authenticate = async (req, res, next) => {
  try {
    const jwtSecret = getJwtSecret();

    // 从请求头获取必要信息
    const authHeader = req.headers.authorization;    // Bearer令牌头
    const deviceType = req.headers.devicetype || 'pc'; // 客户端设备类型，默认pc

    // 支持从query参数获取token（用于文件下载等无法设置请求头的场景）
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供访问令牌',
        data: null
      });
    }

    // JWT验证阶段
    let decoded;
    try {
      // 解密令牌并验证签名有效性
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      console.error('JWT 验证失败:', err.message);
      return res.status(401).json({
        code: 401,
        message: '无效的访问令牌',
        data: null
      });
    }

    // 准备验证参数
    const lvid = decoded.id; // 从JWT负载获取用户ID
    const role = decoded.role; // 从JWT负载获取用户权限
    const redisKey = `user_${lvid}_${deviceType}_token`;

  // 权限检查：只有权限为2以上的用户可以访问
    if (role < 2) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，必须为权限教师才能访问',
        data: null
      });
    }

    // Redis令牌有效性验证
    const isValid = await checkJWTInRedis(lvid, token, deviceType);
    if (!isValid) {
      return res.status(401).json({
        code: 401,
        message: '无效的访问令牌',
        data: null
      });
    }

    // 令牌续期：每次成功认证后重置有效期（3600秒=1小时）
    await RedisClient.expire(redisKey, 3600);

    // 注入用户信息到请求对象
    req.user = { id: lvid, lvid, role }; // 包含用户ID和角色 (增加id别名以兼容不同风格)
    next(); // 放行到后续中间件
  } catch (err) {
    const isConfigError = err instanceof Error && err.message.includes('JWT_SECRET');
    console.error(isConfigError ? '认证服务配置错误:' : '认证过程发生不可预知错误:', err);
    res.status(500).json({
      code: 500,
      message: isConfigError ? '认证服务配置错误' : '认证系统内部错误',
      error: err.message
    });
  }
};

module.exports = authenticate;
