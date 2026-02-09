// db.js
const mysql = require('mysql2/promise');
require("dotenv").config();
const HOST = process.env.MYSQL_HOST;
const PORT = process.env.MYSQL_PORT;
const PASSWORD = process.env.MYSQL_PASSWORD;
const USER = process.env.MYSQL_USER;
const DATABASE = process.env.MYSQL_DATABASE;
// 创建 MySQL 连接池，支持 Promise 风格的接口
const pool = mysql.createPool({
  host: HOST,
  user: USER,
  port: PORT,
  password: PASSWORD,
  database: DATABASE,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 测试数据库连接
pool.getConnection()
  .then(connection => {
    console.log('MySQL 连接成功');
    connection.release();
  })
  .catch(err => {
    console.error('MySQL 连接失败:', err);
  });

// 每5分钟发送一次心跳包，防止连接因长时间空闲被断开
setInterval(() => {
  pool.getConnection()
    .then(connection => {
      return connection.ping()
        .then(() => {
          console.log('MYSQL 心跳包发送成功');
        })
        .catch(err => {
          console.error('MYSQL 心跳包发送失败:', err);
        })
        .finally(() => {
          // 释放连接，确保连接池资源不会耗尽
          connection.release();
        });
    })
    .catch(err => {
      console.error('获取数据库连接失败:', err);
    });
}, 300000); // 每 300000 毫秒（即5分钟）执行一次

module.exports = pool;
