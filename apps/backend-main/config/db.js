// db.js
const mysql = require('mysql2');
const logger = require('../utils/logger');
require("dotenv").config();
const HOST = process.env.MYSQL_HOST;
const PORT = process.env.MYSQL_PORT;
const PASSWORD = process.env.MYSQL_PASSWORD;
const USER = process.env.MYSQL_USER;
const DATABASE = process.env.MYSQL_DATABASE;

// 创建 MySQL 连接池
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

// 测试连接池
pool.getConnection((err, connection) => {
  if (err) {
    logger.error('MySQL 连接池初始化失败:', err);
    logger.error('错误详情:', {
      code: err.code,
      errno: err.errno,
      sqlMessage: err.sqlMessage
    });
  } else {
    logger.info('MySQL 连接池初始化成功');
    connection.release();
  }
});

// 监听连接池错误
pool.on('error', (err) => {
  logger.error('MySQL 连接池错误:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    logger.error('数据库连接丢失');
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    logger.error('数据库连接数过多');
  } else if (err.code === 'ECONNREFUSED') {
    logger.error('数据库连接被拒绝');
  }
});

module.exports = pool;
