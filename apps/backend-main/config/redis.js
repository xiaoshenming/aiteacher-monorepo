// redis.js
const Redis = require('ioredis');
const logger = require('../utils/logger');
const { getRedisConnectionOptions } = require('./redis-config');
require("dotenv").config();

// 创建 Redis 连接
const redis = new Redis(getRedisConnectionOptions());

// 测试 Redis 连接
redis.on('connect', () => {
    logger.info('Redis 连接成功');
});

redis.on('error', (err) => {
    logger.error('Redis 连接失败:', err);
});

module.exports = redis;
