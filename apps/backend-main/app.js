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
const assignmentRouter = require("./model/edu/assignmentRouter"); // 作业接口
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
const questionBankRouter = require("./model/edu/questionBankRouter"); // 题库管理接口
const knowledgeTreeRouter = require("./model/knowledge/knowledgeTreeRouter"); // 知识点树接口
const shareRouter = require("./model/share/shareRouter"); // 资源共享接口
const aiRouter = require("./model/ai/aiRouter"); // AI 功能接口
const { setupWebSocketServer } = require("./model/ai/wxsocket"); // 初始化 WebSocket 服务（用于 AI 模块）
const classroomRouter = require("./model/classroom/classroomRouter"); // 课堂互动接口
const { setupClassroomWS } = require("./model/classroom/classroomSocket"); // 课堂互动 WebSocket
const { startHeartbeats } = require("./config/heartbeat"); // 启动心跳检测（Redis 与 MySQL）
const testRouter = require("./model/test/testRoutes"); // 测试接口（需要鉴权）
const fileUploadMiddleware = require("./model/static/fileUpload"); // 文件上传中间件
const staticFiles = require("./model/static/staticFiles"); // 静态文件资源配置
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { globalLimiter, authLimiter, aiLimiter } = require("./middleware/rateLimiter");
const { metricsMiddleware, metricsEndpoint } = require("./middleware/metrics");
const logger = require("./utils/logger");
const app = express(); // 创建 Express 实例
const port = process.env.PORT || 10001; // 默认端口

// 反向代理支持（Nginx）
app.set('trust proxy', 1);

// CORS 配置 - 限制为前端域名白名单
const allowedOrigins = [
  'http://localhost:10003', // 开发环境
  'http://10.3.36.36:10003', // 局域网访问
  ...(process.env.FRONTEND_URL || '').split(',').map(s => s.trim()),
].filter(Boolean); // 过滤掉空字符串

const corsOptions = {
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如 Postman、服务器端请求）
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS 拒绝来源: ${origin}`);
      callback(new Error('不允许的 CORS 来源'));
    }
  },
  credentials: true, // 支持 Cookie
  optionsSuccessStatus: 200
};

app.use(express.json()); // 解析 JSON 请求体
app.use(cors(corsOptions)); // 启用 CORS 中间件（限制白名单）

// Prometheus metrics 中间件
app.use(metricsMiddleware);
app.get('/metrics', metricsEndpoint);

// 健康检查端点
app.get('/health', async (req, res) => {
  const pool = require('./config/db');
  const redis = require('./config/redis');
  const checks = { mysql: 'ok', redis: 'ok' };
  let status = 200;
  try {
    await pool.promise().query('SELECT 1');
  } catch {
    checks.mysql = 'error';
    status = 503;
  }
  try {
    await redis.ping();
  } catch {
    checks.redis = 'error';
    status = 503;
  }
  res.status(status).json({ status: status === 200 ? 'healthy' : 'unhealthy', checks });
});

// 全局限流：100 req/15min
app.use(globalLimiter);

app.use(fileUploadMiddleware()); // 文件上传中间件
staticFiles(app); // 配置静态文件资源
app.use("/api", testRouter); // 测试接口

// 登录/注册接口限流：5 req/15min
app.use("/api/register", authLimiter);
app.use("/api/pc/login", authLimiter);
app.use("/api/mobile/login/wxMiniprogram", authLimiter);
app.use("/api/mobile/register/wxMiniprogram", authLimiter);

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
app.use("/api/question-bank", questionBankRouter); // 题库管理接口
app.use("/api/knowledge-tree", knowledgeTreeRouter); // 知识点树接口
app.use("/api/share", shareRouter); // 资源共享接口

// AI 接口限流：10 req/min（按用户 ID）
app.use("/api/ai", aiLimiter);

app.use("/api/ai", aiRouter); // AI 功能接口
app.use("/api/resource", resourceRouter); // 教育资源接口
app.use("/api/ppt", pptRouter); // PPT 接口
app.use("/api/news", newsRouter); // 新闻接口
app.use("/api/lessonPlans", lessonPlansRouter); // 教案接口
app.use("/api/assignments", assignmentRouter); // 作业接口
app.use("/api/classroom", classroomRouter); // 课堂互动接口
app.use("/api", verifyRoute); // 邮件验证接口

// 404 错误处理（必须在所有路由之后）
app.use(notFoundHandler);

// 全局错误处理中间件（必须在最后）
app.use(errorHandler);

const server = http.createServer(app); // 创建 HTTP 服务器
setupWebSocketServer(server); // 初始化 WebSocket 服务器（绑定至 HTTP 服务器）
setupClassroomWS(server); // 初始化课堂互动 WebSocket
startHeartbeats(); // 启动心跳检测服务
server.listen(port, "0.0.0.0", () => {
  logger.info(`服务器已启动，监听端口：http://0.0.0.0:${port}`);
}); // 启动服务器并监听指定端口
