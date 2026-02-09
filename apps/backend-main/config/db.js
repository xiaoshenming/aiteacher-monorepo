// db.js
const mysql = require('mysql2');
require("dotenv").config();
const HOST = process.env.MYSQL_HOST;
const PORT = process.env.MYSQL_PORT;
const PASSWORD = process.env.MYSQL_PASSWORD;
const USER = process.env.MYSQL_USER;
const DATABASE = process.env.MYSQL_DATABASE;
// 创建 MySQL 连接
const db = mysql.createConnection({
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


// 连接成功时的回调
db.connect((err) => {
    if (err) {
        console.error('MySQL 连接失败:', err);
    } else {
        console.log('MySQL 连接成功');
    }
});

module.exports = db;
