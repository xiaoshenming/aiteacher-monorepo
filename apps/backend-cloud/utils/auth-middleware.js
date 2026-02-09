// 身份认证中间件 - 用于验证API请求的JWT令牌有效性
// 依赖模块：redis（存储有效令牌）、jsonwebtoken（JWT解析）、dotenv（环境变量）

// 引入基础模块
const RedisClient = require('./redis');  // Redis客户端实例
const jwt = require('jsonwebtoken');     // JWT解析库
require("dotenv").config();              // 加载环境变量

// JWT配置：优先使用环境变量中的密钥，开发环境使用默认值
const JWT_SECRET = process.env.JWT_SECRET || '3a07f8a622d44f6eaf934ca43f8f3d7b';

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
    console.log('开始认证...');
    
    // 从请求头获取必要信息
    const authHeader = req.headers.authorization;    // Bearer令牌头
    const deviceType = req.headers.devicetype;       // 客户端设备类型

    // 验证Authorization头格式（Bearer Token）
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('未提供访问令牌');
      return res.status(401).json({
        code: 401,
        message: '未提供访问令牌',
        data: null
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('接收到的 Token:', token);

    // JWT验证阶段
    let decoded;
    try {
      // 解密令牌并验证签名有效性
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('JWT 解码成功:', decoded);
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
    console.log('Redis Key:', redisKey);

  // 权限检查：只有权限为2以上的用户可以访问
    if (role < 2) {
      console.log('权限不足，必须为权限教师才能访问');
      return res.status(403).json({
        code: 403,
        message: '权限不足，必须为权限教师才能访问',
        data: null
      });
    }

    // Redis令牌有效性验证
    const isValid = await checkJWTInRedis(lvid, token, deviceType);
    if (!isValid) {
      console.log('Redis 中无效 Token');
      return res.status(401).json({
        code: 401,
        message: '无效的访问令牌',
        data: null
      });
    }

    // 令牌续期：每次成功认证后重置有效期（3600秒=1小时）
    await RedisClient.expire(redisKey, 3600);
    console.log('认证通过，用户信息:', decoded);

    // 注入用户信息到请求对象
    req.user = { id: lvid, lvid, role }; // 包含用户ID和角色 (增加id别名以兼容不同风格)
    next(); // 放行到后续中间件
  } catch (err) {
    console.error('认证过程发生不可预知错误:', err);
    res.status(500).json({
      code: 500,
      message: '认证系统内部错误',
      error: err.message
    });
  }
};

module.exports = authenticate;
