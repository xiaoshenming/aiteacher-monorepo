// module.exports = router;
const express = require("express");
// const fs = require("fs");
const fs = require("fs-extra");
const jwt = require("jsonwebtoken");
const path = require("path");
const redis = require("../utils/redis");
const db = require("../utils/db");
const { log } = require("console");
const multer = require("multer");
require("dotenv").config();
const secret = process.env.JWT_SECRET;

const router = express.Router();
// 全局存储路径配置 相对路径
const FILE_STORAGE_PATH = "./storage/files"; // 文件存储路径
const FILE_STORAGE_MOBILE_PATH = "./storage/mobile_files";
// 确保存储目录存在
fs.ensureDirSync(FILE_STORAGE_PATH);
fs.ensureDirSync(FILE_STORAGE_MOBILE_PATH);
// 定义一个辅助函数，用来检查 Redis 中的 JWT
async function checkJWTInRedis(userId, token, deviceType) {
  const storedToken = await redis.get(`user_${userId}_${deviceType}_token`);
  return storedToken === token;
}

// 文件下载接口-法三
router.get("/download/file3/:filename", async (req, res) => {
  const { filename } = req.params;
  const { token } = req.query;
  console.log("filename:", filename);
  console.log("token:", token);
  if (!filename) {
    return res.status(400).json({ message: "缺少文件名" });
  }

  try {
    // 解析 JWT
    const decoded = jwt.verify(token, secret);
    console.log("decoded:", decoded);

    //暂时不做判断
    // const deviceType = req.headers.devicetype || 'pc'; // 获取设备类型
    // 验证 token 是否有效
    // const isValid = await checkJWTInRedis(decoded.id, token, deviceType);
    const isValid = await checkJWTInRedis(decoded.id, token, decoded.device);

    if (!isValid) {
      return res.status(401).json({ message: "无效的 token" });
    }

    // 使用文件 id 和 lvid（即当前用户 id）查询文件记录
    const [rows] = await db.query(
      "SELECT * FROM file WHERE name = ? AND lvid = ?",
      [filename, decoded.id]
    );
    const file = rows[0];
    console.log("file:", file);

    if (!file || file.is_folder) {
      return res.status(404).json({ message: "文件不存在" });
    }

    // 获取文件扩展名
    const fileExt = path.extname(file.name).toLowerCase();
    const contentTypeMap = {
      // 文档类型
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.pdf': 'application/pdf',
      // 媒体类型
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mov': 'video/quicktime',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
    };
    
    // 获取对应的 Content-Type，默认为 application/octet-stream
    const contentType = contentTypeMap[fileExt] || 'application/octet-stream';
    
    // 判断是否为文档类型或媒体类型
    const isDocument = ['.xls', '.xlsx', '.doc', '.docx', '.ppt', '.pptx', '.pdf'].includes(fileExt);
    const isVideoOrImage = ['.mp4', '.webm', '.ogg', '.mov', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].includes(fileExt);

    // 对于文档类型和媒体类型，使用 sendFile 并设置正确的 Content-Type
    if (isDocument || isVideoOrImage) {
      // 设置 Content-Type 以便前端正确预览
      res.setHeader('Content-Type', contentType);
      
      // 文档和媒体文件使用 sendFile，支持预览和流式播放
      res.sendFile(path.resolve(file.path), (err) => {
        if (err) {
          // 忽略连接中止错误（用户停止视频播放是正常行为）
          if (err.code === 'ECONNABORTED' || err.code === 'ERR_HTTP_HEADERS_SENT') {
            console.log('文件流传输中止或响应已发送:', err.message);
            return;
          }
          // 确保响应头未发送才发送错误
          if (!res.headersSent) {
            console.error("文件传输错误:", err);
            res.status(500).json({ message: "文件预览失败" });
          }
        }
      });
    } else {
      // 其他不支持的文件类型使用 download，强制下载
      res.download(file.path, file.name, (err) => {
        if (err) {
          // 忽略连接中止错误
          if (err.code === 'ECONNABORTED' || err.code === 'ERR_HTTP_HEADERS_SENT') {
            console.log('文件下载中止或响应已发送:', err.message);
            return;
          }
          // 确保响应头未发送才发送错误
          if (!res.headersSent) {
            console.error("文件下载错误:", err);
            res.status(500).json({ message: "文件下载失败" });
          }
        }
      });
    }
  } catch (err) {
    console.error("JWT 解码错误:", err);
    return res.status(401).json({ message: "无效的 token" });
  }
});



// 配置 multer 使用内存存储
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 内部接口：接收文件并保存到相对路径目录
router.post("/uploadFile", upload.single("file"), async (req, res) => {
  try {
    // 获取文件 buffer 和文件名称
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname; // 使用 PPT 服务传递的唯一文件名
    const lvid = req.body.lvid; // 可选：记录文件所属用户
    const fileType = req.body.fileType;

    // 定义相对文件路径（数据库中存储相对路径）和对应的绝对路径
    const relativeFilePath = path.join("storage", "files", fileName);
    const absoluteFilePath = path.join(FILE_STORAGE_PATH, fileName);

    // 将文件写入磁盘
    await fs.writeFile(absoluteFilePath, fileBuffer);

    // 获取文件大小（单位：字节）
    const stats = await fs.stat(absoluteFilePath);
    const fileSize = stats.size;

    // 返回存储信息给调用方
    return res.json({
      code: 200,
      message: "文件上传成功",
      data: { relativeFilePath, fileSize },
    });
  } catch (err) {
    console.error("内部文件上传失败:", err);
    return res.status(500).json({
      code: 500,
      message: "文件上传失败",
      data: null,
    });
  }
});













// 文件下载接口-失败
router.get("/download/file", async (req, res) => {
  const { filename, jwt: token } = req.query;
  console.log("filename:", filename, "token:", token);
  if (!filename || !token) {
    return res.status(400).json({ message: "缺少文件名或 token" });
  }

  try {
    // 解析 JWT
    const decoded = jwt.verify(token, secret);
    console.log("decoded:", decoded);

    const deviceType = req.headers.devicetype; // 获取设备类型

    // 验证 token 是否有效,暂时不做类型判断
    const isValid = await checkJWTInRedis(decoded.id, token, decoded.device);

    if (!isValid) {
      return res.status(401).json({ message: "无效的 token" });
    }

    // 文件路径，确保文件存在
    const absoluteFolderPath =
      "E:\\计算机类\\服创\\AI辅助的教师备课系统构建\\AITeacherCloudBack\\storage\\files";
    const filePath = path.join(absoluteFolderPath, filename);
    console.log("filePath:", filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "文件未找到" });
    }

    // 使用 res.sendFile 直接发送文件
    res.sendFile(filePath, (err) => {
      if (err) {
        // 忽略连接中止错误
        if (err.code === 'ECONNABORTED' || err.code === 'ERR_HTTP_HEADERS_SENT') {
          console.log('文件发送中止或响应已发送:', err.message);
          return;
        }
        // 确保响应头未发送才发送错误
        if (!res.headersSent) {
          console.error("文件发送错误:", err);
          res.status(500).json({ message: "文件发送失败" });
        }
      }
    });
  } catch (err) {
    console.error("JWT 解码错误:", err);
    return res.status(401).json({ message: "无效的 token" });
  }
});

// 文件下载接口-法一 -暂时废弃
router.get("/download/file1/:filename", async (req, res) => {
  const { filename } = req.params;
  const { token } = req.query;
  console.log("filename:", filename);
  console.log("token:", token);
  if (!filename) {
    return res.status(400).json({ message: "缺少文件名" });
  }

  try {
    // 解析 JWT
    const decoded = jwt.verify(token, secret);
    console.log("decoded:", decoded);

    //暂时不做判断
    const deviceType = req.headers.devicetype || "pc"; // 获取设备类型
    // 验证 token 是否有效
    const isValid = await checkJWTInRedis(decoded.id, token, deviceType);

    if (!isValid) {
      return res.status(401).json({ message: "无效的 token" });
    }

    // 文件路径，确保文件存在
    const absoluteFolderPath =
      "E:\\计算机类\\服创\\AI辅助的教师备课系统构建\\AITeacherCloudBack\\storage\\files";
    const filePath = path.join(absoluteFolderPath, filename);
    console.log("filePath:", filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "文件未找到" });
    }

    // 使用 res.sendFile 直接发送文件
    res.sendFile(filePath, (err) => {
      if (err) {
        // 忽略连接中止错误
        if (err.code === 'ECONNABORTED' || err.code === 'ERR_HTTP_HEADERS_SENT') {
          console.log('文件发送中止或响应已发送:', err.message);
          return;
        }
        // 确保响应头未发送才发送错误
        if (!res.headersSent) {
          console.error("文件发送错误:", err);
          res.status(500).json({ message: "文件发送失败" });
        }
      }
    });
  } catch (err) {
    console.error("JWT 解码错误:", err);
    return res.status(401).json({ message: "无效的 token" });
  }
});

// 文件下载接口-法二 -暂时废弃
router.get("/download/file2/:filename", async (req, res) => {
  const { filename } = req.params;
  const { token } = req.query;
  console.log("filename:", filename);
  console.log("token:", token);

  if (!filename || !token) {
    return res.status(400).json({ message: "缺少文件名或 token" });
  }

  try {
    // 解析 JWT
    const decoded = jwt.verify(token, secret);
    //暂时不做判断
    const deviceType = req.headers.devicetype || "pc"; // 获取设备类型
    // 验证 token 是否有效
    const isValid = await checkJWTInRedis(decoded.id, token, deviceType);

    if (!isValid) {
      return res.status(401).json({ message: "无效的 token" });
    }

    // 文件路径，确保文件存在
    const absoluteFolderPath =
      "E:\\计算机类\\服创\\AI辅助的教师备课系统构建\\AITeacherCloudBack\\storage\\files";
    const filePath = path.join(absoluteFolderPath, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "文件未找到" });
    }

    // 设置响应头，进行文件下载
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/octet-stream");

    // 读取并发送文件
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error("JWT 解码错误:", err);
    return res.status(401).json({ message: "无效的 token" });
  }
});



// 文件下载接口 - 用 id 和 lvid 查找文件 失败
router.get("/download/id/:fileId", async (req, res) => {
  const { fileId } = req.params;
  const { token } = req.query;

  if (!fileId || !token) {
    return res.status(400).json({ message: "缺少文件 id 或 token" });
  }

  try {
    // 解析 JWT
    const decoded = jwt.verify(token, secret);
    const deviceType = req.headers.devicetype || "pc";

    // 验证 token 是否有效
    const isValid = await checkJWTInRedis(decoded.id, token, deviceType);
    if (!isValid) {
      return res.status(401).json({ message: "无效的 token" });
    }

    // 使用文件 id 和 lvid（即当前用户 id）查询文件记录
    const [rows] = await db.query(
      "SELECT * FROM file WHERE id = ? AND lvid = ?",
      [fileId, decoded.id]
    );
    const file = rows[0];

    if (!file || file.is_folder) {
      return res.status(404).json({ message: "文件不存在" });
    }

    // 使用 res.download 发送文件给客户端
    res.download(file.path, file.name, (err) => {
      if (err) {
        // 忽略连接中止错误
        if (err.code === 'ECONNABORTED' || err.code === 'ERR_HTTP_HEADERS_SENT') {
          console.log('文件下载中止或响应已发送:', err.message);
          return;
        }
        // 确保响应头未发送才发送错误
        if (!res.headersSent) {
          console.error("文件下载错误:", err);
          res.status(500).json({ message: "文件下载失败" });
        }
      }
    });
  } catch (err) {
    console.error("JWT 解码错误或其它错误:", err);
    return res.status(401).json({ message: "无效的 token" });
  }
});


















module.exports = router;
