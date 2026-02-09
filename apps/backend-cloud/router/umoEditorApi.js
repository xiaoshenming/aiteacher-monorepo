const express = require("express");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const mammoth = require("mammoth");
const db = require("../utils/db");
const redis = require("../utils/redis");
const authenticate = require("../utils/auth-middleware.js");
const { getAIResponseStream, getAIResponse } = require("../utils/aiService");
const axios = require("axios");
const router = express.Router();

// 配置存储路径
const EDITOR_STORAGE_PATH = "./storage/editor";
// const EDITOR_DOCS_PATH = path.join(EDITOR_STORAGE_PATH, "docs");//废弃
const EDITOR_FILES_PATH = path.join(EDITOR_STORAGE_PATH, "files");
const EDITOR_TEMP_PATH = path.join(EDITOR_STORAGE_PATH, "temp");

// 确保存储目录存在
// fs.ensureDirSync(EDITOR_DOCS_PATH);//废弃
fs.ensureDirSync(EDITOR_FILES_PATH);
fs.ensureDirSync(EDITOR_TEMP_PATH);

// 配置文件上传中间件
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 根据文件类型决定存储位置
    if (file.fieldname === "wordFile") {
      cb(null, EDITOR_TEMP_PATH);
    } else {
      cb(null, EDITOR_FILES_PATH);
    }
  },
  filename: (req, file, cb) => {
    // 使用UUID生成唯一文件名，保留原始扩展名
    const fileExt = path.extname(file.originalname);
    const uniqueFileName = `${uuidv4()}${fileExt}`;
    cb(null, uniqueFileName);
  },
});

// 文件过滤器 - 限制文件类型和大小
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [
    // 图片
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // 文档
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    // 表格
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // 演示文稿
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // 其他
    "text/plain",
    "application/zip",
    "application/x-rar-compressed",
      // 视频类型
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  // 音频类型
  "audio/mpeg",
  "audio/wav",
  "audio/ogg"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("不支持的文件类型"), false);
  }
};

// 配置上传中间件，限制文件大小为100MB
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// AI助手API集成配置
const AI_API_ENDPOINT =
  process.env.AI_API_ENDPOINT || "https://api.openai.com/v1/chat/completions";
const AI_API_KEY = process.env.AI_API_KEY || "";

/**
 * 文档保存API
 * 保存编辑器内容到数据库
 */
router.post("/save", authenticate, async (req, res) => {
  console.log('==========================================');
  console.log('[Save] 收到保存请求');
  console.log('[Save] req.body.docId:', req.body.docId);
  console.log('[Save] req.body.title:', req.body.title);
  console.log('==========================================');
  
  try {
    const { title, content, docId } = req.body;
    const lvid = req.user.lvid;
    const teacherId = req.user.lvid;  // 修复：使用 lvid
    const userRole = req.user.role;

    if (!content) {
      return res.status(400).json({
        code: 400,
        message: "文档内容不能为空",
        data: null,
      });
    }

    // 获取当前时间
    const now = new Date();
    const prepareDate = now.toISOString().split('T')[0];
    let isNewDocument = false;  // 默认不是新文档
    let savedDocId = docId;

    // 检查文档是新建还是更新
    console.log('[Save] docId:', docId, 'lvid:', lvid);
    if (docId) {
      // 检查文档是否存在
      const [existing] = await db.query(
        "SELECT id FROM lessonplans WHERE id = ? AND lvid = ?",
        [docId, lvid]
      );
      
      console.log('[Save] 数据库查询结果 existing.length:', existing.length);
      
      if (existing.length > 0) {
        // 更新现有文档
        console.log('[Save] 文档已存在，执行更新操作');
        await db.query(
          "UPDATE lessonplans SET name = ?, content = ?, updated_at = ? WHERE id = ? AND lvid = ?",
          [title || "无标题文档", content, now, docId, lvid]
        );
      } else {
        // docId 不存在，创建新文档
        console.log('[Save] docId不存在，创建新文档');
        isNewDocument = true;
        const [result] = await db.query(
          "INSERT INTO lessonplans (lvid, name, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
          [lvid, title || "无标题文档", content, 0, now, now]
        );
        savedDocId = result.insertId;
        console.log('[Save] 新文档创建成功，ID:', savedDocId);
      }
    } else {
      // 创建新文档
      console.log('[Save] 无docId，创建新文档');
      isNewDocument = true;
      const [result] = await db.query(
        "INSERT INTO lessonplans (lvid, name, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [lvid, title || "无标题文档", content, 0, now, now]
      );
      
      // 获取新插入的ID
      savedDocId = result.insertId;
      console.log('[Save] 新文档创建成功（无docId），ID:', savedDocId);
      return res.json({
        code: 200,
        message: "文档保存成功",
        data: {
          docId: savedDocId,
          title: title || "无标题文档",
          updatedAt: now,
        },
      });
    }

    // 记录教师备课统计（仅限教师角色）
    console.log('[Save备课统计] userRole:', userRole, 'teacherId:', teacherId, 'isNewDocument:', isNewDocument, 'docId:', docId, 'savedDocId:', savedDocId);
    if (userRole === '2' && teacherId) {
      try {
        // 标记该文档已纳入备课统计
        await db.query(
          "UPDATE lessonplans SET is_prepared = 1 WHERE id = ? AND lvid = ?",
          [savedDocId, teacherId]
        );
        console.log('[Save备课统计] 标记文档已纳入备课, docId:', savedDocId);

        // 统计该教师已纳入备课的文档数（去重）
        const [docCountResult] = await db.query(
          "SELECT COUNT(*) as total FROM lessonplans WHERE lvid = ? AND is_prepared = 1",
          [teacherId]
        );
        const preparedDocCount = docCountResult[0].total;
        console.log('[Save备课统计] 已纳入备课的文档数:', preparedDocCount);
        
        const durationMinutes = 5;
        const checkSql = `SELECT id, prepare_duration, generate_count FROM teacher_prepare_stats 
          WHERE teacher_id = ? AND prepare_date = ?`;
        const [existing] = await db.execute(checkSql, [teacherId, prepareDate]);
        
        console.log('[Save备课统计] 查询结果:', existing.length > 0 ? '有记录，更新' : '无记录，插入');
        
        if (existing.length > 0) {
          // 更新：累加时长，generate_count设置为已纳入备课的文档数
          const updateSql = `UPDATE teacher_prepare_stats 
            SET prepare_duration = prepare_duration + ?, generate_count = ?
            WHERE id = ?`;
          await db.execute(updateSql, [durationMinutes, preparedDocCount, existing[0].id]);
          console.log('[Save备课统计] 更新成功, ID:', existing[0].id, '新增时长:', durationMinutes, '分钟, 备课文档数:', preparedDocCount);
        } else {
          // 插入：初始化记录
          const insertSql = `INSERT INTO teacher_prepare_stats 
            (teacher_id, prepare_date, prepare_duration, generate_count) 
            VALUES (?, ?, ?, ?)`;
          const result = await db.execute(insertSql, [teacherId, prepareDate, durationMinutes, preparedDocCount]);
          console.log('[Save备课统计] 插入成功, ID:', result[0].insertId, '时长:', durationMinutes, '分钟, 备课文档数:', preparedDocCount);
        }
      } catch (error) {
        console.error("[Save备课统计] 记录备课统计失败:", error);
      }
    } else {
      console.log('[Save备课统计] 条件不满足，跳过统计. userRole:', userRole, 'teacherId:', teacherId);
    }

    return res.json({
      code: 200,
      message: "文档保存成功",
      data: {
        docId: savedDocId,
        title: title || "无标题文档",
        updatedAt: now,
      },
    });
  } catch (err) {
    console.error("文档保存失败:", err);
    return res.status(500).json({
      code: 500,
      message: "文档保存失败",
      data: null,
    });
  }
});

/**
 * 文档加载API
 * 根据ID加载编辑器文档
 */
router.get("/document/:docId", authenticate, async (req, res) => {
  try {
    const { docId } = req.params;
    const lvid = req.user.lvid;

    // 从数据库获取文档信息和内容
    const [documents] = await db.query(
      "SELECT id, lvid, name, content, status, created_at, updated_at FROM lessonplans WHERE id = ? AND lvid = ?",
      [docId, lvid]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "文档不存在",
        data: null,
      });
    }

    const document = documents[0];

    return res.json({
      code: 200,
      message: "文档加载成功",
      data: {
        docId: document.id,
        title: document.name,
        content: document.content,
        status: document.status,
        createdAt: document.created_at,
        updatedAt: document.updated_at,
      },
    });
  } catch (err) {
    console.error("文档加载失败:", err);
    return res.status(500).json({
      code: 500,
      message: "文档加载失败",
      data: null,
    });
  }
});

/**
 * 获取用户文档列表
 */
router.get("/documents", authenticate, async (req, res) => {
  try {
    const lvid = req.user.lvid;
    const { page = 1, limit = 20 } = req.query;

    // 计算分页
    const offset = (page - 1) * limit;

    // 获取文档总数
    const [countResult] = await db.query(
      "SELECT COUNT(*) as total FROM lessonplans WHERE lvid = ?",
      [lvid]
    );
    const total = countResult[0].total;

    // 获取分页文档列表
    const [documents] = await db.query(
      "SELECT id, name as title, status, created_at, updated_at FROM lessonplans WHERE lvid = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?",
      [lvid, parseInt(limit), offset]
    );

    return res.json({
      code: 200,
      message: "获取文档列表成功",
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        documents,
      },
    });
  } catch (err) {
    console.error("获取文档列表失败:", err);
    return res.status(500).json({
      code: 500,
      message: "获取文档列表失败",
      data: null,
    });
  }
});

/**
 * 删除文档
 */
router.delete("/document/:docId", authenticate, async (req, res) => {
  try {
    const { docId } = req.params;
    const lvid = req.user.lvid;

    // 检查文档是否存在
    const [documents] = await db.query(
      "SELECT id FROM lessonplans WHERE id = ? AND lvid = ?",
      [docId, lvid]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "文档不存在",
        data: null,
      });
    }

    // 从数据库删除记录
    await db.query("DELETE FROM lessonplans WHERE id = ? AND lvid = ?", [
      docId,
      lvid,
    ]);

    return res.json({
      code: 200,
      message: "文档删除成功",
      data: null,
    });
  } catch (err) {
    console.error("文档删除失败:", err);
    return res.status(500).json({
      code: 500,
      message: "文档删除失败",
      data: null,
    });
  }
});

/**
 * 文件上传API
 * 用于编辑器中的图片、附件等上传
 */
router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          code: 400,
          message: "未接收到文件",
          data: null,
        });
      }

      const lvid = req.user.lvid;
      const file = req.file;
      const originalName = file.originalname;
      const fileSize = file.size;
      const mimeType = file.mimetype;
      const storedPath = file.path;
      const fileName = file.filename;

      // 生成访问URL
      const fileUrl = `/api/editor/file/${fileName}`;

      // 将文件信息保存到数据库
      const now = new Date();
      await db.query(
        "INSERT INTO editor_files (id, lvid, name, original_name, size, mime_type, path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          fileName.split(".")[0],
          lvid,
          fileName,
          originalName,
          fileSize,
          mimeType,
          storedPath,
          now,
        ]
      );

      return res.json({
        code: 200,
        message: "文件上传成功",
        data: {
          url: fileUrl,
          name: originalName,
          size: fileSize,
          type: mimeType,
        },
      });
    } catch (err) {
      console.error("文件上传失败:", err);
      return res.status(500).json({
        code: 500,
        message: "文件上传失败",
        data: null,
      });
    }
  }
);

/**
 * 文件获取API
 * 用于访问上传的文件
 */
router.get("/file/:fileName", async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(EDITOR_FILES_PATH, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        code: 404,
        message: "文件不存在",
        data: null,
      });
    }

    // 获取文件信息
    const [files] = await db.query(
      "SELECT * FROM editor_files WHERE name = ?",
      [fileName]
    );

    if (files.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "文件记录不存在",
        data: null,
      });
    }

    const file = files[0];

    // 设置正确的Content-Type
    res.setHeader("Content-Type", file.mime_type);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(file.original_name)}"`
    );

    // 发送文件
    return res.sendFile(filePath);
  } catch (err) {
    console.error("文件获取失败:", err);
    return res.status(500).json({
      code: 500,
      message: "文件获取失败",
      data: null,
    });
  }
});

/**
 * 文件下载API
 * 强制下载文件
 */
router.get("/download/:fileName", authenticate, async (req, res) => {
  try {
    const { fileName } = req.params;
    const lvid = req.user.lvid;

    // 获取文件信息
    const [files] = await db.query(
      "SELECT * FROM editor_files WHERE name = ? AND lvid = ?",
      [fileName, lvid]
    );

    if (files.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "文件不存在",
        data: null,
      });
    }

    const file = files[0];

    // 发送文件
    return res.download(file.path, file.original_name);
  } catch (err) {
    console.error("文件下载失败:", err);
    return res.status(500).json({
      code: 500,
      message: "文件下载失败",
      data: null,
    });
  }
});

/**
 * 文件删除API
 */
router.delete("/file/:fileId", authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    const lvid = req.user.lvid;

    // 获取文件信息
    const [files] = await db.query(
      "SELECT * FROM editor_files WHERE id = ? AND lvid = ?",
      [fileId, lvid]
    );

    if (files.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "文件不存在",
        data: null,
      });
    }

    const file = files[0];

    // 删除文件
    await fs.remove(file.path);

    // 从数据库删除记录
    await db.query("DELETE FROM editor_files WHERE id = ? AND lvid = ?", [
      fileId,
      lvid,
    ]);

    return res.json({
      code: 200,
      message: "文件删除成功",
      data: null,
    });
  } catch (err) {
    console.error("文件删除失败:", err);
    return res.status(500).json({
      code: 500,
      message: "文件删除失败",
      data: null,
    });
  }
});

/**
 * Word文档导入API
 */
router.post(
  "/import-word",
  authenticate,
  upload.single("wordFile"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          code: 400,
          message: "未接收到Word文件",
          data: null,
        });
      }

      const wordFilePath = req.file.path;

      // 使用mammoth将Word转换为HTML
      const result = await mammoth.convertToHtml({ path: wordFilePath });
      const html = result.value;

      // 处理错误和警告
      const messages = result.messages;
      if (messages.length > 0) {
        console.log("Word转换警告:", messages);
      }

      // 转换完成后删除临时文件
      await fs.remove(wordFilePath);

      return res.json({
        code: 200,
        message: "Word文档导入成功",
        data: {
          content: html,
          messages: messages,
        },
      });
    } catch (err) {
      console.error("Word文档导入失败:", err);
      return res.status(500).json({
        code: 500,
        message: "Word文档导入失败",
        data: null,
      });
    }
  }
);

/**
 * AI助手流式API
 * 提供AI辅助功能的流式响应版本
 */
router.post("/assistant-stream", authenticate, async (req, res) => {
  console.log('==========================================');
  console.log('[Editor助手] 收到请求');
  console.log('[Editor助手] req.user:', req.user);
  console.log('[Editor助手] req.body.command:', req.body.command);
  console.log('[Editor助手] req.body.model:', req.body.model);
  console.log('==========================================');
  
  try {
    // 修改参数解构，使用新的参数名，添加model参数
    const { command, input, lang, output, model = "deepseek-chat" } = req.body;
    const userId = req.user?.lvid || req.user?.id;  // AITeacherCloudBack 使用 lvid
    const userType = req.user?.role || 'teacher';
    const { getAIResponseStream } = require("../utils/aiService");
    
    console.log('[Editor助手] userId:', userId, 'userType:', userType, 'model:', model);

    // 设置SSE响应头
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // 禁用Nginx缓冲

    // 发送数据的工具函数
    const sendEvent = (data, event = "message") => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // 获取选中内容或全部内容
    const content = input;
    
    // 根据命令和语言生成合适的提示词
    let prompt = "";
    switch (command) {
      case "续写":
        prompt = `请根据以下内容继续写作。保持风格一致，内容自然连贯：\n\n${content}`;
        break;
      case "重写":
        prompt = `请重写以下内容，保持原意但使用不同的表达方式：\n\n${content}`;
        break;
      case "缩写":
        prompt = `请将以下内容缩写为更精简的版本，保留关键信息：\n\n${content}`;
        break;
      case "扩写":
        prompt = `请扩展以下内容，添加更多细节和说明，使其更丰富：\n\n${content}`;
        break;
      case "润色":
        prompt = `请润色以下内容，提高语言表达的流畅性和优美度，不改变原意：\n\n${content}`;
        break;
      case "校阅":
        prompt = `请校对以下内容，纠正可能的语法错误、拼写错误或表达不准确的地方：\n\n${content}`;
        break;
      case "翻译成英文":
        prompt = `请将以下${lang === 'zh-CN' ? '中文' : ''}内容翻译成英文，保持原意：\n\n${content}`;
        break;
      case "翻译成中文":
        prompt = `请将以下${lang !== 'zh-CN' ? '外语' : ''}内容翻译成中文，保持原意：\n\n${content}`;
        break;
      case "翻译":
        // 根据lang参数判断源语言和目标语言
        if (lang === 'zh-CN') {
          prompt = `请将以下中文内容翻译成英文，保持原意：\n\n${content}`;
        } else {
          prompt = `请将以下内容翻译成中文，保持原意：\n\n${content}`;
        }
        break;
      default:
        prompt = `${command}：\n\n${content}`;
    }

    // 启动处理事件
    sendEvent({
      code: 200,
      message: "STARTED",
      data: {
        done: false,
      }
    });

    // 根据输出格式设置处理选项
    const responseOptions = output === 'rich-text' ? { format: 'rich-text' } : {};

    // 记录prompt长度用于token估算
    let fullResponse = '';
    
    console.log('[Editor助手] 开始流式响应, prompt长度:', prompt.length);
    
    // 使用流式API处理请求，传入model参数
    await getAIResponseStream(prompt, (chunk) => {
      fullResponse += chunk;
      // 发送实时数据块
      sendEvent({
        code: 200,
        message: "STREAMING",
        data: {
          chunk: chunk,
          done: false,
        }
      });
    }, model);
    
    console.log('[Editor助手] 流式响应完成, fullResponse长度:', fullResponse.length);

    // 记录AI使用统计
    console.log('[Editor统计] userId:', userId, 'userType:', userType, 'model:', model);
    if (userId) {
      const estimatedTokens = Math.ceil((prompt.length + fullResponse.length) / 4);
      console.log('[Editor统计] 开始记录, tokens:', estimatedTokens, 'prompt长度:', prompt.length, 'response长度:', fullResponse.length);
      try {
        const callDate = new Date().toISOString().split('T')[0];
        
        // 记录 AI 使用统计
        const checkSql = `SELECT id, call_count, token_consumed FROM ai_usage_stats 
          WHERE user_id = ? AND model_name = ? AND function_name = ? AND call_date = ?`;
        const [existing] = await db.execute(checkSql, [userId, model, 'editor_assistant', callDate]);
        
        console.log('[Editor统计] AI使用查询结果:', existing.length > 0 ? '有记录，更新' : '无记录，插入');
        
        if (existing.length > 0) {
          const updateSql = `UPDATE ai_usage_stats 
            SET call_count = call_count + 1, token_consumed = token_consumed + ?
            WHERE id = ?`;
          await db.execute(updateSql, [estimatedTokens, existing[0].id]);
          console.log('[Editor统计] AI使用更新成功, ID:', existing[0].id);
        } else {
          const insertSql = `INSERT INTO ai_usage_stats 
            (user_id, user_type, model_name, function_name, call_count, token_consumed, call_date) 
            VALUES (?, ?, ?, ?, 1, ?, ?)`;
          const result = await db.execute(insertSql, [userId, userType, model, 'editor_assistant', estimatedTokens, callDate]);
          console.log('[Editor统计] AI使用插入成功, ID:', result[0].insertId);
        }
        
        // 记录教师备课统计（仅限教师且生成教案类命令）
        if (userType === '2' || userType === 2) {
          console.log('[备课统计] 开始记录备课, command:', command);
          const isGenerateCommand = ['生成教案', '续写', '扩写', '重写'].includes(command);
          if (isGenerateCommand) {
            // 估算备课时长（根据生成的内容长度，假设每1000字符需要1分钟）
            const durationMinutes = Math.max(1, Math.ceil(fullResponse.length / 1000));
            
            const checkPrepare = `SELECT id, prepare_duration, generate_count FROM teacher_prepare_stats 
              WHERE teacher_id = ? AND prepare_date = ?`;
            const [existingPrepare] = await db.execute(checkPrepare, [userId, callDate]);
            
            if (existingPrepare.length > 0) {
              const updatePrepare = `UPDATE teacher_prepare_stats 
                SET prepare_duration = prepare_duration + ?
                WHERE id = ?`;
              await db.execute(updatePrepare, [durationMinutes, existingPrepare[0].id]);
              console.log('[备课统计] 更新成功（生成教案）, ID:', existingPrepare[0].id, '时长:', durationMinutes, '分钟');
            } else {
              const insertPrepare = `INSERT INTO teacher_prepare_stats 
                (teacher_id, prepare_date, prepare_duration, generate_count) 
                VALUES (?, ?, ?, 0)`;
              const prepareResult = await db.execute(insertPrepare, [userId, callDate, durationMinutes]);
              console.log('[备课统计] 插入成功（生成教案）, ID:', prepareResult[0].insertId, '时长:', durationMinutes, '分钟');
            }
          } else {
            console.log('[备课统计] 命令不是生成类型，跳过备课统计');
          }
        }
      } catch (error) {
        console.error("[Editor统计] 记录统计失败:", error);
      }
    } else {
      console.log('[Editor统计] userId为空，跳过记录');
    }

    // 处理完成，发送结束事件
    sendEvent({
      code: 200,
      message: "COMPLETED",
      data: {
        done: true,
      }
    }, "done");

    // 结束响应
    res.end();
  } catch (err) {
    console.error("AI助手流式处理失败:", err);
    
    // 发送错误事件
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({
      code: 500,
      message: "AI助手处理失败: " + err.message,
      data: null
    })}\n\n`);
    
    res.end();
  }
});



module.exports = router;
