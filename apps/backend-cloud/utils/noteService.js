/**
 * AI笔记生成服务
 * 基于DeepSeek AI，将转录文本整理成结构化笔记
 */

const axios = require('axios');
const db = require('./db');

class NoteService {
  // DeepSeek API配置
  static API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
  static API_KEY = process.env.DEEPSEEK_API_KEY || '';
  static MODEL = 'deepseek-chat';
  static MAX_TOKENS = 4000;
  static TEMPERATURE = 0.7;

  /**
   * 生成结构化笔记
   * @param {string} transcriptText - 转录文本
   * @param {string} lessonPlanOutline - 教案大纲（可选）
   * @param {string} recordingId - 录制记录ID
   * @returns {Promise<object>} 笔记内容
   */
  static async generateNotes(transcriptText, lessonPlanOutline = '', recordingId = null) {
    try {
      console.log(`📝 开始生成AI笔记...`);

      // 构建Prompt
      const prompt = this.buildNotesPrompt(transcriptText, lessonPlanOutline);

      // 调用AI生成
      const response = await this.callAI(prompt);

      // 解析结果
      const noteContent = this.parseNoteResponse(response);

      // 如果提供了recordingId，保存到数据库
      if (recordingId) {
        await this.saveNotesToDB(recordingId, noteContent);
      }

      console.log(`✅ AI笔记生成成功`);
      return noteContent;

    } catch (error) {
      console.error('生成AI笔记失败:', error);
      throw new Error(`生成AI笔记失败: ${error.message}`);
    }
  }

  /**
   * 构建笔记生成的Prompt
   * @param {string} transcriptText - 转录文本
   * @param {string} lessonPlanOutline - 教案大纲
   * @returns {string} Prompt
   */
  static buildNotesPrompt(transcriptText, lessonPlanOutline) {
    let prompt = `你是一位专业的课堂笔记整理助手。请根据以下课堂录音转录文本，生成结构化的课堂笔记。

**要求**:
1. 提取课程大纲（outline）：识别主要章节和知识点
2. 提炼重点内容（keypoints）：列出核心知识点和要点
3. 生成互动问答（quizzes）：设计3-5个检验学习效果的问题及答案
4. 整理作业要点（homework）：总结课后需要复习和练习的内容

**输出格式** (严格JSON格式):
\`\`\`json
{
  "outline": ["章节1标题", "章节2标题", ...],
  "keypoints": ["重点1", "重点2", ...],
  "quizzes": [
    {"question": "问题1", "answer": "答案1"},
    {"question": "问题2", "answer": "答案2"}
  ],
  "homework": ["作业1", "作业2", ...]
}
\`\`\`

`;

    // 如果有教案大纲，添加参考
    if (lessonPlanOutline) {
      prompt += `**教案大纲参考**:\n${lessonPlanOutline}\n\n`;
    }

    prompt += `**课堂转录文本**:\n${transcriptText.substring(0, 3000)}\n\n请生成课堂笔记（JSON格式）:`;

    return prompt;
  }

  /**
   * 提取关键词
   * @param {string} transcriptText - 转录文本
   * @returns {Promise<string[]>} 关键词数组
   */
  static async extractKeywords(transcriptText) {
    try {
      const prompt = `请从以下课堂转录文本中提取5-10个核心关键词，用逗号分隔：

${transcriptText.substring(0, 2000)}

关键词（用逗号分隔）:`;

      const response = await this.callAI(prompt, { max_tokens: 200 });

      // 解析关键词
      const keywords = response
        .split(/[,，、]/)
        .map(k => k.trim())
        .filter(k => k.length > 0 && k.length < 20);

      return keywords.slice(0, 10);

    } catch (error) {
      console.error('提取关键词失败:', error);
      return [];
    }
  }

  /**
   * 生成课程摘要
   * @param {string} transcriptText - 转录文本
   * @returns {Promise<string>} 摘要文本
   */
  static async generateSummary(transcriptText) {
    try {
      const prompt = `请为以下课堂转录文本生成一段简明扼要的课程摘要（200字以内）：

${transcriptText.substring(0, 3000)}

课程摘要:`;

      const summary = await this.callAI(prompt, { max_tokens: 500 });

      return summary.trim();

    } catch (error) {
      console.error('生成课程摘要失败:', error);
      return '';
    }
  }

  /**
   * 调用DeepSeek AI
   * @param {string} prompt - Prompt
   * @param {object} options - 选项
   * @returns {Promise<string>} AI响应
   */
  static async callAI(prompt, options = {}) {
    try {
      // 如果没有配置API Key，返回模拟数据
      if (!this.API_KEY) {
        console.warn('⚠️ DeepSeek API Key未配置，返回模拟数据');
        return this.getMockResponse(prompt);
      }

      const requestData = {
        model: this.MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.max_tokens || this.MAX_TOKENS,
        temperature: options.temperature || this.TEMPERATURE
      };

      const response = await axios.post(this.API_URL, requestData, {
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      // 提取AI响应
      const content = response.data.choices[0].message.content;
      return content;

    } catch (error) {
      console.error('调用AI失败:', error.message);
      
      // 降级到模拟数据
      console.warn('⚠️ AI调用失败，返回模拟数据');
      return this.getMockResponse(prompt);
    }
  }

  /**
   * 解析笔记响应
   * @param {string} response - AI响应
   * @returns {object} 结构化笔记
   */
  static parseNoteResponse(response) {
    try {
      // 尝试提取JSON（可能被代码块包裹）
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
      }

      // 如果无法解析，返回默认结构
      throw new Error('无法解析AI响应');

    } catch (error) {
      console.error('解析笔记响应失败:', error);
      
      // 返回默认结构
      return {
        outline: ['课程内容提取中...'],
        keypoints: ['知识点提取中...'],
        quizzes: [],
        homework: []
      };
    }
  }

  /**
   * 保存笔记到数据库
   * @param {string} recordingId - 录制记录ID
   * @param {object} noteContent - 笔记内容
   * @param {string} summary - 摘要（可选）
   * @param {array} keywords - 关键词（可选）
   */
  static async saveNotesToDB(recordingId, noteContent, summary = null, keywords = null) {
    try {
      // 查找是否已存在笔记记录
      const [existingNote] = await db.query(
        'SELECT id FROM ai_study_notes WHERE recording_id = ?',
        [recordingId]
      );

      const noteContentJson = JSON.stringify(noteContent);
      const keywordsJson = keywords ? JSON.stringify(keywords) : null;

      if (existingNote && existingNote.length > 0) {
        // 更新现有记录
        console.log(`📝 更新现有笔记记录: ${recordingId}`);
        const sql = `
          UPDATE ai_study_notes 
          SET note_content = ?,
              summary = ?,
              keywords = ?,
              status = 'completed',
              completed_at = NOW(),
              updated_at = NOW()
          WHERE recording_id = ?
        `;

        await db.query(sql, [noteContentJson, summary, keywordsJson, recordingId]);

      } else {
        // 插入新记录
        console.log(`📝 插入新笔记记录: ${recordingId}`);
        const { v4: uuidv4 } = require('uuid');
        const noteId = uuidv4();

        const sql = `
          INSERT INTO ai_study_notes 
          (id, recording_id, note_content, summary, keywords, status, completed_at)
          VALUES (?, ?, ?, ?, ?, 'completed', NOW())
        `;

        await db.query(sql, [noteId, recordingId, noteContentJson, summary, keywordsJson]);
      }

      console.log(`✅ AI笔记持久化成功: ${recordingId}`);

    } catch (error) {
      console.error('保存笔记到数据库失败:', error);
      throw error;
    }
  }

  /**
   * 获取模拟响应（用于测试或降级）
   * @param {string} prompt - Prompt
   * @returns {string} 模拟响应
   */
  static getMockResponse(prompt) {
    if (prompt.includes('关键词')) {
      return '数据结构, 栈, 队列, 算法, 时间复杂度, 空间复杂度';
    }

    if (prompt.includes('摘要')) {
      return '本节课主要讲解了数据结构中的栈和队列，包括它们的基本概念、特点、操作和应用场景。通过实例演示了如何使用栈实现括号匹配，以及如何使用队列实现广度优先搜索。';
    }

    // 默认笔记结构
    return `\`\`\`json
{
  "outline": [
    "课程导入与回顾",
    "核心概念讲解",
    "案例分析与实践",
    "总结与作业布置"
  ],
  "keypoints": [
    "理解基本概念和原理",
    "掌握核心知识点",
    "能够应用到实际场景",
    "了解常见问题和解决方案"
  ],
  "quizzes": [
    {
      "question": "请解释本节课的核心概念？",
      "answer": "核心概念包括基本原理和应用方法。"
    },
    {
      "question": "如何应用所学知识解决实际问题？",
      "answer": "通过理论结合实践，分析问题并给出解决方案。"
    }
  ],
  "homework": [
    "复习本节课的核心概念",
    "完成课后练习题",
    "预习下节课内容"
  ]
}
\`\`\``;
  }

  /**
   * 完整笔记生成流程
   * @param {string} recordingId - 录制记录ID
   * @param {string} lessonPlanOutline - 教案大纲（可选）
   * @returns {Promise<object>} 完整笔记
   */
  static async generateCompleteNotes(recordingId, lessonPlanOutline = '') {
    try {
      console.log(`📚 [NoteService] 收到完整笔记生成请求: ${recordingId}`);

      // 1. 获取转录文本
      const [transcriptRows] = await db.query(
        'SELECT transcript_text FROM audio_transcripts WHERE recording_id = ? AND status = "completed"',
        [recordingId]
      );

      if (transcriptRows.length === 0 || !transcriptRows[0].transcript_text) {
        console.warn(`[NoteService] 转录文本不存在或未完成，无法生成笔记: ${recordingId}`);
        throw new Error('转录文本不存在或未完成');
      }

      const transcriptText = transcriptRows[0].transcript_text;
      console.log(`[NoteService] 已获取转录文本，长度: ${transcriptText.length} 字符`);

      // 2. 生成摘要
      console.log(`[NoteService] 正在调用 AI 生成摘要...`);
      const summary = await this.generateSummary(transcriptText);

      // 3. 提取关键词
      console.log(`[NoteService] 正在调用 AI 提取关键词...`);
      const keywords = await this.extractKeywords(transcriptText);

      // 4. 生成结构化笔记
      console.log(`[NoteService] 正在调用 AI 生成结构化笔记内容...`);
      const noteContent = await this.generateNotes(transcriptText, lessonPlanOutline);

      // 5. 保存到数据库
      await this.saveNotesToDB(recordingId, noteContent, summary, keywords);

      console.log(`✨ [NoteService] 录制ID ${recordingId} 的完整笔记生成流程圆满完成！`);

      return {
        summary,
        keywords,
        content: noteContent
      };

    } catch (error) {
      console.error('生成完整笔记失败:', error);
      throw error;
    }
  }
}

module.exports = { NoteService };
