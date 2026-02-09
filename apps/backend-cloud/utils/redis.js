// redis.js
const Redis = require('ioredis');

require("dotenv").config();
const HOST = process.env.Redis_HOST;
const PORT = process.env.Redis_PORT;
const PASSWORD = process.env.Redis_PASSWORD;

// 创建 Redis 连接
const redis = new Redis({
  host: HOST,
  port: PORT,
  password: PASSWORD,
  db: 0,
});

// 测试 Redis 连接
redis.on('connect', () => {
    console.log('Redis 连接成功');
});

redis.on('error', (err) => {
    console.error('Redis 连接失败:', err);
});
setInterval(() => {
    redis.ping()
        .then(result => {
            console.log('Redis 心跳包发送成功:', result);
        })
        .catch(err => {
            console.error('Redis 心跳包发送失败:', err);
        });
}, 300000); // 每五分钟发送一次心跳包
module.exports = redis;
