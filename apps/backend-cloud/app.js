// 导入包
const express = require("express")
const cors = require("cors")
const path = require("path");
const cookieParser = require("cookie-parser")
// 导入工具类
const authenticate = require("./utils/auth-middleware.js")
const { mediaLimiter, fileUploadLimiter, apiLimiter } = require("./middleware/rateLimiter")
// 导入路由
const testRouter = require("./router/test.js")
const pcApiRouter = require("./router/pcApi.js")
const mobileApiRouter = require("./router/mobileApi.js")
const apidownload = require("./router/apidownload.js")
const umoEditorApi = require("./router/umoEditorApi.js") // 导入UmoEditor API路由
const analyticsRouter = require("./router/analytics.js") // 导入数据分析API路由
const recordingRouter = require("./router/recording.js") // 导入课堂录制API路由
const webdavProxyRouter = require("./router/webdavProxy.js") // 导入WebDAV资源代理路由

// 导入任务队列并启动 Worker
const { ASRTaskQueue } = require('./utils/asrQueue');
ASRTaskQueue.startWorker(2).catch(err => {
  console.error('Failed to start ASR Worker:', err);
});

// 创建一个服务器对象
const app = express()

// CORS 配置 - 限制为前端域名白名单
const allowedOrigins = [
  'http://localhost:10003', // 开发环境
  'http://10.3.36.36:10003', // 局域网访问
  process.env.FRONTEND_URL, // 生产环境（从环境变量读取）
].filter(Boolean); // 过滤掉 undefined

const corsOptions = {
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如 Postman、服务器端请求）
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS 拒绝来源: ${origin}`);
      callback(new Error('不允许的 CORS 来源'));
    }
  },
  credentials: true, // 支持 Cookie
  optionsSuccessStatus: 200
};

// 重要：先设置请求体大小限制，然后再使用其他中间件
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// 添加跨域，解析数据的中间件
app.use(cors(corsOptions))
// 添加cookie解析
app.use(cookieParser())

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// 分类限流中间件（按路径类型分别限流）
app.use((req, res, next) => {
  // 媒体播放/下载类 API - 高频限流
  if (req.path.includes('/download') || req.path.includes('/preview') || req.path.includes('/stream')) {
    return mediaLimiter(req, res, next);
  }
  // 文件上传/分片操作 API - 中等限流
  if (req.path.includes('/chunk') || req.path.includes('/upload') || req.path.includes('/delete')) {
    return fileUploadLimiter(req, res, next);
  }
  // 其他 API - 低频限流
  return apiLimiter(req, res, next);
});


// 路径鉴权，不通过全局中间件
app.use("/api", apidownload);
// UmoEditor文件访问API - 不需要全局认证
app.use("/api/editor/file", express.static(path.join(__dirname, "storage/editor/files")));
// 录制文件访问 - 不需要全局认证
app.use("/api/recording/file", express.static(path.join(__dirname, "storage/audio")));
// WebDAV资源代理 - 不需要全局认证（静态资源）
app.use("/Resource", webdavProxyRouter);

// 应用全局认证中间件
app.use((req, res, next) => {
  // 定义不需要认证的路由
  const whitelist = ['/user/login', '/user/register'];
  
  if (whitelist.includes(req.path)) {
    return next();
  }
  
  authenticate(req, res, next);
});

// 加入测试路由
app.use("/api",testRouter)
// 加入PC端API路由
app.use("/api/pc",pcApiRouter)
// 加入移动端API路由
app.use("/api/mobile",mobileApiRouter)
// 加入UmoEditor API路由
app.use("/api/editor", umoEditorApi)
// 加入数据分析API路由
app.use("/api/analytics", analyticsRouter)
// 加入课堂录制API路由
app.use("/api/recording", recordingRouter)
// 启动监听
const PORT = process.env.PORT || 10002;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`服务器已启动，监听端口：http://0.0.0.0:${PORT}`);
});