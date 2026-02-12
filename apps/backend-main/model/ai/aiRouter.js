// routes/ai.js
const express = require("express");
const router = express.Router();
const { getAIResponseStream, getAIResponse, getAIResponseStreamCustom } = require("./aiUtils");
const db = require("../../config/db");
const authorize = require("../auth/authUtils");
const { promisify } = require('util');
const query = promisify(db.query).bind(db);

// 记录AI使用统计的辅助函数
async function recordAIUsage(userId, userType, modelName, functionName, tokenConsumed = 0) {
  try {
    console.log('[recordAIUsage] 开始记录:', { userId, userType, modelName, functionName, tokenConsumed });
    const callDate = new Date().toISOString().split('T')[0];
    
    // 检查今天是否已有记录
    const checkSql = `SELECT id, call_count, token_consumed FROM ai_usage_stats 
      WHERE user_id = ? AND model_name = ? AND function_name = ? AND call_date = ?`;
    const existing = await query(checkSql, [userId, modelName, functionName, callDate]);
    
    console.log('[recordAIUsage] 查询结果:', existing.length > 0 ? '有记录，更新' : '无记录，插入');
    
    if (existing.length > 0) {
      // 更新记录
      const updateSql = `UPDATE ai_usage_stats 
        SET call_count = call_count + 1, token_consumed = token_consumed + ?
        WHERE id = ?`;
      await query(updateSql, [tokenConsumed, existing[0].id]);
      console.log('[recordAIUsage] 更新成功, ID:', existing[0].id);
    } else {
      // 插入新记录
      const insertSql = `INSERT INTO ai_usage_stats 
        (user_id, user_type, model_name, function_name, call_count, token_consumed, call_date) 
        VALUES (?, ?, ?, ?, 1, ?, ?)`;
      const result = await query(insertSql, [userId, userType, modelName, functionName, tokenConsumed, callDate]);
      console.log('[recordAIUsage] 插入成功, ID:', result.insertId);
    }
  } catch (error) {
    console.error("[recordAIUsage] 记录AI使用统计失败:", error);
    // 不阻塞主流程
  }
}

// 普通 AI 聊天接口
router.post("/chat", authorize(["0", "1", "2", "3", "4"]), async (req, res) => {
  const { prompt, model = "deepseek-chat" } = req.body;
  const userId = req.user?.id;
  const userType = req.user?.role || 'teacher';
  
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({
      code: 400,
      message: "Prompt must be a non-empty string.",
      data: null,
    });
  }
  try {
    const aiResponse = await getAIResponse(prompt, model);
    
    // 记录使用统计（简单估算token）
    const estimatedTokens = Math.ceil((prompt.length + aiResponse.length) / 4);
    if (userId) {
      await recordAIUsage(userId, userType, model, 'ai_chat', estimatedTokens);
    }
    
    return res.json({
      code: 200,
      message: "AI response fetched successfully",
      data: { response: aiResponse },
    });
  } catch (error) {
    console.error("Error handling AI request:", error);
    return res.status(500).json({
      code: 500,
      message: "Error processing AI request",
      data: null,
    });
  }
});

// SSE 流式 AI 聊天接口
router.post("/chat-stream", authorize(["0", "1", "2", "3", "4"]), async (req, res) => {
  const { prompt, model = "deepseek-chat" } = req.body;
  const userId = req.user?.id;
  const userType = req.user?.role || 'teacher';
  
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({
      code: 400,
      message: "Prompt must be a non-empty string.",
      data: null,
    });
  }
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sendEvent = (data, event = "message") => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    let fullResponse = '';
    await getAIResponseStream(prompt, (chunk) => {
      fullResponse += chunk;
      sendEvent({
        code: 200,
        message: "STREAMING",
        data: {
          chunk,
          done: false,
        },
      });
    }, model);

    sendEvent(
      {
        code: 200,
        message: "COMPLETED",
        data: {
          done: true,
        },
      },
      "done"
    );

    // 记录使用统计
    const estimatedTokens = Math.ceil((prompt.length + fullResponse.length) / 4);
    console.log('[AI统计] userId:', userId, 'userType:', userType, 'model:', model, 'tokens:', estimatedTokens);
    if (userId) {
      await recordAIUsage(userId, userType, model, 'ai_chat_stream', estimatedTokens);
      console.log('[AI统计] 记录完成');
    } else {
      console.log('[AI统计] userId为空，跳过记录');
    }

    res.end();
  } catch (error) {
    console.error("Error handling AI request:", error);
    res.write(`event: error\n`);
    res.write(
      `data: ${JSON.stringify({
        code: 500,
        message: "Error processing AI request",
        data: null,
      })}\n\n`
    );
    res.end();
  }
});

// 生成会议纪要接口
router.post("/meeting-summary", authorize(["0", "1", "2", "3", "4"]), async (req, res) => {
  const { transcript, duration, model = "deepseek-chat" } = req.body;
  const userId = req.user?.id;
  const userType = req.user?.role || 'teacher';

  if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
    return res.status(400).json({
      code: 400,
      message: "Transcript must be a non-empty string.",
      data: null,
    });
  }

  try {
    // 构建会议纪要提示词
    const prompt = `请根据以下会议转录内容生成一份结构化的会议纪要：

会议时长：${duration || '未知'}
转录内容：
${transcript}

请按照以下格式生成会议纪要：

## 📅 会议概要
- **时间：** [当前日期时间]
- **时长：** ${duration || '未知'}
- **字数：** ${transcript.length} 字

## 💡 核心议题
[总结会议讨论的主要议题，2-3句话]

## 📝 主要内容
### 讨论要点
- [要点1]
- [要点2]
- [要点3]

### 重要观点
- [观点1]
- [观点2]

## ✅ 待办事项 (Action Items)
1. [ ] [具体待办事项1] - [负责人/时间]
2. [ ] [具体待办事项2] - [负责人/时间]
3. [ ] [具体待办事项3] - [负责人/时间]

## 🎯 决策结论
- [决策1]
- [决策2]

## 📌 备注
[其他需要记录的重要信息]

请确保纪要简洁明了，重点突出，便于后续查阅和执行。`;

    const aiResponse = await getAIResponse(prompt, model);

    // 记录使用统计（简单估算token）
    const estimatedTokens = Math.ceil((prompt.length + aiResponse.length) / 4);
    if (userId) {
      await recordAIUsage(userId, userType, model, 'meeting_summary', estimatedTokens);
    }

    return res.json({
      code: 200,
      message: "Meeting summary generated successfully",
      data: {
        summary: aiResponse,
        tokens: estimatedTokens,
        model: model
      },
    });
  } catch (error) {
    console.error("Error generating meeting summary:", error);
    return res.status(500).json({
      code: 500,
      message: "Error generating meeting summary",
      data: null,
    });
  }
});

// 翻译接口
router.post("/translate", authorize(["0", "1", "2", "3", "4"]), async (req, res) => {
  const { text, from = "auto", to = "en", model = "deepseek-chat" } = req.body;
  const userId = req.user?.id;
  const userType = req.user?.role || 'teacher';

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({
      code: 400,
      message: "Text must be a non-empty string.",
      data: null,
    });
  }

  try {
    // 构建翻译提示词
    const prompt = `请将以下${from === 'zh' ? '中文' : from === 'en' ? '英文' : '文本'}翻译成${to === 'zh' ? '中文' : to === 'en' ? '英文' : to}。

要求：
1. 保持原文的语气和风格
2. 确保翻译准确、自然、流畅
3. 专有名词使用通用翻译
4. 只返回翻译结果，不要有任何解释

原文：
${text}

翻译：`;

    const aiResponse = await getAIResponse(prompt, model);

    // 记录使用统计（简单估算token）
    const estimatedTokens = Math.ceil((prompt.length + aiResponse.length) / 4);
    if (userId) {
      await recordAIUsage(userId, userType, model, 'translate', estimatedTokens);
    }

    return res.json({
      code: 200,
      message: "Translation completed successfully",
      data: {
        translatedText: aiResponse,
        tokens: estimatedTokens,
        model: model
      },
    });
  } catch (error) {
    console.error("Error handling translation request:", error);
    return res.status(500).json({
      code: 500,
      message: "Error processing translation request",
      data: null,
    });
  }
});

// 编辑器 AI 内联续写接口（SSE 流式）
router.post("/editor-completion", authorize(["0", "1", "2", "3", "4"]), async (req, res) => {
  const { prompt, model = "deepseek-chat" } = req.body;
  const userId = req.user?.id;
  const userType = req.user?.role || 'teacher';

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({
      code: 400,
      message: "Prompt must be a non-empty string.",
      data: null,
    });
  }

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const sendEvent = (data, event = "message") => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const systemPrompt = `你是一位专业的教育工作者和写作助手。你的任务是根据用户已有的教案或文档内容，自然地续写下去。

要求：
1. 保持与前文一致的语气、风格和格式
2. 续写内容要自然连贯，像是同一个人写的
3. 只输出续写的内容，不要重复前文，不要添加解释
4. 续写长度适中（1-3句话），不要过长
5. 如果前文是 Markdown 格式，续写也使用 Markdown
6. 内容要专业、准确，适合教育场景`;

    let fullResponse = '';
    await getAIResponseStreamCustom({
      prompt: prompt,
      systemPrompt: systemPrompt,
      callback: (chunk) => {
        fullResponse += chunk;
        sendEvent({
          code: 200,
          message: "STREAMING",
          data: {
            chunk,
            done: false,
          },
        });
      },
      model: model,
      maxTokens: 256
    });

    sendEvent(
      {
        code: 200,
        message: "COMPLETED",
        data: {
          done: true,
        },
      },
      "done"
    );

    // 记录使用统计
    const estimatedTokens = Math.ceil((prompt.length + fullResponse.length) / 4);
    if (userId) {
      await recordAIUsage(userId, userType, model, 'editor_completion', estimatedTokens);
    }

    res.end();
  } catch (error) {
    console.error("Error handling editor completion request:", error);
    res.write(`event: error\n`);
    res.write(
      `data: ${JSON.stringify({
        code: 500,
        message: "Error processing editor completion request",
        data: null,
      })}\n\n`
    );
    res.end();
  }
});

// AI 智能生成打印材料接口
router.post("/generate-print", authorize(["0", "1", "2", "3", "4"]), async (req, res) => {
  const { prompt, template_type = "quiz", model = "deepseek-chat" } = req.body;
  const userId = req.user?.id;
  const userType = req.user?.role || 'teacher';

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return res.status(400).json({
      code: 400,
      message: "Prompt must be a non-empty string.",
      data: null,
    });
  }

  // 模板类型对应的中文名和格式指导
  const templateGuides = {
    quiz: {
      name: '课堂测验',
      guide: `格式要求：
- 顶部居中显示标题（如"课堂测验"）
- 标题下方显示科目、班级、日期、姓名填写栏
- 分隔线后按题型分区（选择题、填空题、判断题、简答题等）
- 每道题编号清晰，选择题选项用 A/B/C/D 排列
- 底部可留评分栏`
    },
    midterm: {
      name: '期中考试',
      guide: `格式要求：
- 顶部居中显示学校名称和"期中考试试卷"
- 显示科目、年级、考试时间、满分分值
- 包含考生信息栏（姓名、班级、学号）
- 注意事项说明
- 按题型分大题，每大题标注分值（如"一、选择题（每题3分，共30分）"）
- 题目数量适中，难度递进
- 底部留答题区或答题卡说明`
    },
    exercise: {
      name: '课堂练习',
      guide: `格式要求：
- 顶部显示"课堂练习"标题和科目信息
- 练习题目直接排列，编号清晰
- 题目之间留适当空白供学生作答
- 可包含例题和解题提示
- 难度适中，侧重巩固课堂知识`
    },
    notice: {
      name: '通知公告',
      guide: `格式要求：
- 顶部居中显示"通知"或"公告"
- 发布单位/部门
- 正文内容分段清晰
- 包含时间、地点、对象等关键信息
- 底部显示发布日期和发布单位
- 如有附件说明或联系方式也要包含`
    },
    report: {
      name: '成绩单',
      guide: `格式要求：
- 顶部显示学校名称和"学生成绩报告单"
- 学生基本信息（姓名、班级、学号、学期）
- 使用HTML表格展示各科成绩（科目、平时成绩、期中成绩、期末成绩、总评）
- 表格样式清晰，有边框
- 底部包含班主任评语栏、家长签字栏
- 可包含排名或等级信息`
    },
  };

  const templateInfo = templateGuides[template_type] || templateGuides.quiz;

  try {
    const aiPrompt = `你是一位资深教育工作者和排版设计专家。请根据用户的需求生成一份专业的教学打印材料。

材料类型：${templateInfo.name}

${templateInfo.guide}

通用要求：
1. 输出纯 HTML 代码，可直接用于打印
2. 使用内联样式确保打印效果一致
3. 字体使用宋体或黑体，适合中文打印
4. 排版美观、专业，符合中国教育行业标准
5. 内容要专业、准确、有教育价值
6. 只输出 HTML 内容，不要包含 \`\`\`html 代码块标记，不要有任何解释文字
7. 不要包含 <html>、<head>、<body> 等外层标签，只输出内容部分的 HTML
8. 确保所有内容都是中文

用户需求：${prompt}`;

    const aiResponse = await getAIResponse(aiPrompt, model);

    // 清理可能的代码块标记
    let content = aiResponse.trim();
    content = content.replace(/^```html?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

    // 记录使用统计
    const estimatedTokens = Math.ceil((aiPrompt.length + aiResponse.length) / 4);
    if (userId) {
      await recordAIUsage(userId, userType, model, 'generate_print', estimatedTokens);
    }

    return res.json({
      code: 200,
      message: "Print content generated successfully",
      data: {
        content: content,
        template_type: template_type,
        tokens: estimatedTokens,
        model: model,
      },
    });
  } catch (error) {
    console.error("Error generating print content:", error);
    return res.status(500).json({
      code: 500,
      message: "Error generating print content",
      data: null,
    });
  }
});

module.exports = router;
