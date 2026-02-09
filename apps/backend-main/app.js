// app.js
const express = require("express"); // 使用 Express 框架
require("dotenv").config(); // 加载环境变量
const cors = require("cors"); // 启用跨域支持
const path = require("path"); // 处理文件路径
const fileUpload = require("express-fileupload"); // 文件上传中间件
const verifyRoute = require("./model/email/verifyRoute"); // 邮件验证路由
const changelogRoute = require("./model/changelog/changelog");
const http = require("http"); // 用于创建 HTTP 服务器
const pptRouter = require("./model/ppt/pptRouter"); // PPT 相关接口
const newsRouter = require("./model/news/newsRouter"); // 新闻接口
const resourceRouter = require("./model/edu/resourceRouter"); // 教育资源接口
const lessonPlansRouter = require("./model/edu/lessonPlansRouter"); // 教案接口
const authRouter = require("./model/rabbitmq/authRouter"); // 鉴权相关接口（RabbitMQ）
const notificationRouter = require("./model/rabbitmq/notificationRouter"); // 消息通知接口（RabbitMQ）
const userRouter = require("./model/user/userRouter"); // 用户接口
const courseRouter = require("./model/course/courseRouter");
const classRouter = require("./model/class/classRouter");
const studentRouter = require("./model/student/studentRouter");
const adminRouter = require("./model/admin/adminRouter"); // 管理员接口
const authorize = require("./model/auth/authUtils"); // 鉴权中间件
const scheduleRouter = require("./model/schedule/scheduleRouter"); // 课程表接口
const questionRouter = require("./model/question/questionRouter"); // 题目生成接口
const aiRouter = require("./model/ai/aiRouter"); // AI 功能接口
const { setupWebSocketServer } = require("./model/ai/wxsocket"); // 初始化 WebSocket 服务（用于 AI 模块）
const { startHeartbeats } = require("./config/heartbeat"); // 启动心跳检测（Redis 与 MySQL）
const testRouter = require("./model/test/testRoutes"); // 测试接口（需要鉴权）
const fileUploadMiddleware = require("./model/static/fileUpload"); // 文件上传中间件
const staticFiles = require("./model/static/staticFiles"); // 静态文件资源配置
const { errorHandler } = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const app = express(); // 创建 Express 实例
const port = process.env.PORT || 10001; // 默认端口
app.use(express.json()); // 解析 JSON 请求体
app.use(cors()); // 启用 CORS 中间件
app.use(fileUploadMiddleware()); // 文件上传中间件
staticFiles(app); // 配置静态文件资源
app.use("/api", testRouter); // 测试接口
app.use("/api", userRouter); // 用户模块接口
app.use("/api/courses", courseRouter);
app.use("/api/classes", classRouter);
app.use("/api/students", studentRouter);
app.use("/api/admin", adminRouter); // 管理员模块接口
app.use("/api/authentication", authRouter); // 鉴权（RabbitMQ）接口
app.use("/api/notifications", notificationRouter); // 消息通知（RabbitMQ）接口
app.use("/api/changelog", changelogRoute); // 版本更新日志接口
app.use("/api/course-schedule", scheduleRouter); // 课程表接口
app.use("/api/bridge", questionRouter); // 题目生成接口
app.use("/api/ai", aiRouter); // AI 功能接口
app.use("/api/resource", resourceRouter); // 教育资源接口
app.use("/api/ppt", pptRouter); // PPT 接口
app.use("/api/news", newsRouter); // 新闻接口
app.use("/api/lessonPlans", lessonPlansRouter); // 教案接口
app.use("/api", verifyRoute); // 邮件验证接口

// 全局错误处理中间件
app.use(errorHandler);

const server = http.createServer(app); // 创建 HTTP 服务器
setupWebSocketServer(server); // 初始化 WebSocket 服务器（绑定至 HTTP 服务器）
startHeartbeats(); // 启动心跳检测服务
server.listen(port, "0.0.0.0", () => {
  logger.info(`服务器已启动，监听端口：http://0.0.0.0:${port}`);
}); // 启动服务器并监听指定端口
