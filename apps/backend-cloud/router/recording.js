/**
 * 课堂录制功能API路由
 * 提供录制记录、音频转录和AI笔记生成相关接口
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const authMiddleware = require('../utils/auth-middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const MediaUtils = require('../utils/mediaUtils');

// 配置文件上传（音频文件）
const audioStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../storage/audio');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const recordingId = req.params.id || uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${recordingId}${ext}`);
  }
});

const audioUpload = multer({
  storage: audioStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    // 允许的扩展名
    const allowedExts = ['.wav', '.mp3', '.m4a', '.flac', '.webm', '.mp4'];
    // 允许的 MIME 类型
    const allowedMimeTypes = [
      'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/flac', 'audio/webm',
      'video/webm', 'video/mp4', 'application/octet-stream' // 增加兼容性
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;

    if (allowedExts.includes(ext) || allowedMimeTypes.includes(mimeType)) {
      cb(null, true);
    } else {
      console.error(`拒收文件: originalname=${file.originalname}, mimetype=${mimeType}`);
      cb(new Error('不支持的音频格式'));
    }
  }
});

/**
 * 1. 创建录制记录
 * POST /api/recording/create
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { id, course_id, lesson_plan_id, title } = req.body;
    const user_id = req.user.lvid;

    // 验证必填字段
    if (!title) {
      return res.status(400).json({
        code: 400,
        message: '录制标题不能为空'
      });
    }

    // 使用传入的ID或生成新的录制记录ID
    const recording_id = id || uuidv4();

    // 检查ID是否已存在
    const [existing] = await db.query('SELECT user_id FROM course_recordings WHERE id = ?', [recording_id]);
    if (existing && existing.length > 0) {
      if (existing[0].user_id === user_id) {
        return res.json({
          code: 200,
          message: '录制记录已存在',
          data: { recording_id }
        });
      }
      return res.status(409).json({
        code: 409,
        message: '录制ID已存在'
      });
    }

    // 插入数据库
    const sql = `
      INSERT INTO course_recordings 
      (id, user_id, course_id, lesson_plan_id, title, start_time) 
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    await db.query(sql, [recording_id, user_id, course_id || null, lesson_plan_id || null, title]);

    res.json({
      code: 200,
      message: '录制记录创建成功',
      data: { recording_id }
    });

  } catch (error) {
    console.error('创建录制记录失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * 2. 更新录制信息（结束录制）
 * PUT /api/recording/:id/complete
 */
router.put('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, file_size, video_mime_type, audio_mime_type } = req.body;
    const user_id = req.user.lvid;

    // 验证录制记录是否存在且属于当前用户
    const [rows] = await db.query(
      'SELECT id FROM course_recordings WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '录制记录不存在或无权限'
      });
    }

    // 更新录制信息
    const sql = `
      UPDATE course_recordings 
      SET end_time = NOW(), 
          duration = ?, 
          file_size = ?,
          video_mime_type = ?,
          audio_mime_type = ?
      WHERE id = ?
    `;

    await db.query(sql, [duration, file_size, video_mime_type, audio_mime_type, id]);

    res.json({
      code: 200,
      message: '录制完成'
    });

  } catch (error) {
    console.error('更新录制信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * 3. 上传音频文件
 * POST /api/recording/:id/upload-audio
 */
router.post('/:id/upload-audio', authMiddleware, audioUpload.single('audio'), async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.lvid;

    // 验证录制记录
    const [rows] = await db.query(
      'SELECT id FROM course_recordings WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (rows.length === 0) {
      // 删除已上传的文件
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return res.status(404).json({
        code: 404,
        message: '录制记录不存在或无权限'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '未上传音频文件'
      });
    }

    // 保存音频文件路径
    const audio_path = `storage/audio/${req.file.filename}`;

    // 更新课程记录的音频路径和同步状态
    await db.query(
      'UPDATE course_recordings SET audio_path = ?, sync_status = "synced" WHERE id = ?',
      [audio_path, id]
    );
    
    // 自动流程：提取音频 -> 触发 ASR -> (ASR完成后自动触发) AI 笔记
    // 异步执行，不阻塞上传响应
    MediaUtils.ensureAudioExtracted(audio_path).then(async (finalAudioPath) => {
      console.log(`🚀 [自动流程] 音频提取完成，准备启动 ASR: ${id}`);
      
      // 1. 检查或创建转录记录
      const [existing] = await db.query(
        'SELECT id FROM audio_transcripts WHERE recording_id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        const { v4: uuidv4 } = require('uuid');
        await db.query(
          'INSERT INTO audio_transcripts (id, recording_id, audio_file_path, status, asr_provider) VALUES (?, ?, ?, "pending", "FunASR")',
          [uuidv4(), id, finalAudioPath]
        );
      } else {
        await db.query(
          'UPDATE audio_transcripts SET audio_file_path = ?, status = "pending" WHERE recording_id = ?',
          [finalAudioPath, id]
        );
      }

      // 2. 推送到任务队列
      const { ASRTaskQueue } = require('../utils/asrQueue');
      await ASRTaskQueue.addTask(id, finalAudioPath);
      console.log(`✅ [自动流程] 已自动将录制 ${id} 加入 ASR 任务队列`);
      
    }).catch(err => {
      console.error('❌ [自动流程] 自动提取音频或触发 ASR 失败:', err);
    });

    res.json({
      code: 200,
      message: '音频文件上传成功，后台已自动启动识别流水线',
      data: {
        audio_path,
        filename: req.file.filename,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('上传音频文件失败:', error);
    // 清理上传的文件
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * 4. 启动ASR转录任务
 * POST /api/recording/:id/transcribe
 * 支持直接上传文件或指定已上传的文件路径
 */
router.post('/:id/transcribe', authMiddleware, audioUpload.single('audio'), async (req, res) => {
  try {
    const { id } = req.params;
    let { audio_path, asr_provider = 'FunASR' } = req.body;
    const user_id = req.user.lvid;

    // 如果上传了文件，优先使用新上传的文件
    if (req.file) {
      audio_path = `storage/audio/${req.file.filename}`;
    }

    // 验证录制记录并获取已有音频路径
    const [rows] = await db.query(
      'SELECT id, audio_path FROM course_recordings WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (rows.length === 0) {
      // 如果上传了文件但记录不存在，清理文件
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return res.status(404).json({
        code: 404,
        message: '录制记录不存在或无权限'
      });
    }

    // 如果请求未传路径且没上传文件，则使用数据库中存的路径
    if (!audio_path && rows[0].audio_path) {
      audio_path = rows[0].audio_path;
      console.log(`📡 [ASR] 使用数据库中的已有路径: ${audio_path}`);
    }

    if (!audio_path) {
      return res.status(400).json({
        code: 400,
        message: '未找到音频文件，请先同步或上传'
      });
    }

    // 关键修正：确认为 FunASR 兼容的音频格式
    let final_audio_path = audio_path;
    try {
      // 如果输入的是视频(webm/mp4)，提取为 wav
      const ext = path.extname(audio_path).toLowerCase();
      if (['.webm', '.mp4', '.mov'].includes(ext)) {
        console.log(`检测到视频格式 ${ext}，正在提取高兼容性音频...`);
        final_audio_path = await MediaUtils.ensureAudioExtracted(audio_path);
      }
    } catch (extractError) {
      console.error('转录前提取音频失败:', extractError);
      // 继续尝试用原始路径，或者根据需要返回错误
    }

    // 更新课程记录的音频路径（如果之前没有）
    await db.query(
      'UPDATE course_recordings SET audio_path = ? WHERE id = ?',
      [audio_path, id]
    );

    // 创建转录记录
    const transcript_id = uuidv4();
    const sql = `
      INSERT INTO audio_transcripts 
      (id, recording_id, audio_file_path, status, asr_provider)
      VALUES (?, ?, ?, 'pending', ?)
    `;

    await db.query(sql, [transcript_id, id, final_audio_path, asr_provider]);

    // 将转录任务推送到任务队列
    try {
      const { ASRTaskQueue } = require('../utils/asrQueue');
      await ASRTaskQueue.addTask(id, final_audio_path);
    } catch (queueError) {
      console.warn('任务队列推送失败，可能队列未运行:', queueError.message);
      // 仍然返回成功，状态为pending
    }

    res.json({
      code: 200,
      message: '转录任务已创建',
      data: { transcript_id, audio_path }
    });

  } catch (error) {
    console.error('启动转录任务失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * 5. 获取转录记录 (Alias for status)
 * GET /api/recording/:id/transcript
 */
router.get('/:id/transcript', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.lvid;

    // 获取最新的转录记录
    const [rows] = await db.query(
      `SELECT id, status, transcript_text as text, transcript_segments as segments, 
              error_message, processing_duration, created_at, completed_at
       FROM audio_transcripts 
       WHERE recording_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [id]
    );

    const transcript = rows[0];

    if (transcript && typeof transcript.segments === 'string') {
      try {
        transcript.segments = JSON.parse(transcript.segments);
      } catch (e) {
        transcript.segments = [];
      }
    }

    if (!transcript) {
      return res.status(404).json({
        code: 404,
        message: '转录记录不存在'
      });
    }

    res.json({
      code: 200,
      data: transcript
    });
  } catch (error) {
    console.error('获取转录记录失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * 6. 获取转录状态
 * GET /api/recording/:id/transcript/status
 */
router.get('/:id/transcript/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.lvid;

    // 验证录制记录
    const [recordingRows] = await db.query(
      'SELECT id FROM course_recordings WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (recordingRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '录制记录不存在或无权限'
      });
    }

    // 获取转录记录
    const [transcriptRows] = await db.query(
      `SELECT id, status, transcript_text as text, transcript_segments as segments, 
              error_message, processing_duration, created_at, completed_at
       FROM audio_transcripts 
       WHERE recording_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [id]
    );

    if (transcriptRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '转录记录不存在'
      });
    }

    const transcript = transcriptRows[0];

    if (transcript && typeof transcript.segments === 'string') {
      try {
        transcript.segments = JSON.parse(transcript.segments);
      } catch (e) {
        transcript.segments = [];
      }
    }

    // 计算进度（如果正在处理）
    let progress = 0;
    if (transcript.status === 'processing') {
      progress = 50; // 简化处理，实际应从队列获取
    } else if (transcript.status === 'completed') {
      progress = 100;
    }

    res.json({
      code: 200,
      data: {
        status: transcript.status,
        progress,
        text: transcript.text,
        segments: transcript.segments,
        error_message: transcript.error_message,
        processing_duration: transcript.processing_duration
      }
    });

  } catch (error) {
    console.error('获取转录状态失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * 6. 启动AI笔记生成
 * POST /api/recording/:id/generate-notes
 */
router.post('/:id/generate-notes', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    // 关键修正：安全读取 body，防止空体导致解构报错
    const lesson_plan_outline = req.body?.lesson_plan_outline || '';
    const user_id = req.user.lvid;

    console.log(`📡 收到手动生成笔记请求: 录制ID=${id}, 用户ID=${user_id}`);

    // 验证录制记录
    const [recordingRows] = await db.query(
      'SELECT id FROM course_recordings WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (recordingRows.length === 0) {
      console.warn(`⚠️ 录制记录不存在或无权限: ${id}`);
      return res.status(404).json({
        code: 404,
        message: '录制记录不存在或无权限'
      });
    }

    // 获取转录记录
    const [transcriptRows] = await db.query(
      'SELECT id, transcript_text FROM audio_transcripts WHERE recording_id = ? AND status = "completed"',
      [id]
    );

    if (transcriptRows.length === 0 || !transcriptRows[0].transcript_text) {
      console.warn(`⚠️ 转录未完成，无法生成笔记: ${id}`);
      return res.status(400).json({
        code: 400,
        message: '转录未完成或转录文本为空，请等待转录完成后再试'
      });
    }

    const transcript = transcriptRows[0];

    // 检查是否已有笔记任务在运行或已完成
    const [existingNote] = await db.query(
      'SELECT id, status FROM ai_study_notes WHERE recording_id = ? ORDER BY created_at DESC LIMIT 1',
      [id]
    );

    if (existingNote && existingNote.length > 0) {
      const status = existingNote[0].status;
      if (status === 'pending' || status === 'processing') {
        return res.json({
          code: 200,
          message: 'AI笔记正在生成中，请勿重复提交',
          data: { note_id: existingNote[0].id, status }
        });
      }
    }

    // 创建AI笔记记录
    const note_id = uuidv4();
    const sql = `
      INSERT INTO ai_study_notes 
      (id, recording_id, transcript_id, status)
      VALUES (?, ?, ?, 'pending')
    `;

    await db.query(sql, [note_id, id, transcript.id]);
    console.log(`✅ 笔记记录已创建（pending）: ${note_id}`);

    // 调用AI笔记生成服务
    const { NoteService } = require('../utils/noteService');
    
    // 异步生成笔记（不阻塞响应）
    NoteService.generateCompleteNotes(id, lesson_plan_outline).catch(err => {
      console.error(`❌ 后台笔记生成失败: ${id}`, err);
    });

    res.json({
      code: 200,
      message: 'AI笔记生成任务已启动，请稍候',
      data: { note_id, status: 'pending' }
    });

  } catch (error) {
    console.error('启动笔记生成过程出错:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * 7. 获取AI笔记
 * GET /api/recording/:id/notes
 */
router.get('/:id/notes', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.lvid;

    // 验证录制记录
    const [recordingRows] = await db.query(
      'SELECT id FROM course_recordings WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (recordingRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '录制记录不存在或无权限'
      });
    }

    // 获取AI笔记
    const [noteRows] = await db.query(
      `SELECT id, note_content, summary, keywords, status, error_message, 
              processing_duration, created_at, completed_at
       FROM ai_study_notes 
       WHERE recording_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [id]
    );

    if (noteRows.length === 0) {
      // 关键修正：如果没找到笔记，检查是否正在转录中
      const [transcriptRows] = await db.query(
        'SELECT status FROM audio_transcripts WHERE recording_id = ? ORDER BY created_at DESC LIMIT 1',
        [id]
      );

      let hintMessage = 'AI笔记尚未生成';
      if (transcriptRows.length > 0) {
        const tStatus = transcriptRows[0].status;
        if (tStatus === 'pending' || tStatus === 'processing') {
          hintMessage = '语音转录正在进行中，转录完成后将自动生成AI笔记，请稍候...';
        } else if (tStatus === 'completed') {
          hintMessage = '语音转录已完成，AI笔记生成任务即将开始...';
        }
      }

      return res.json({
        code: 202, // Accepted - 正在处理中
        message: hintMessage,
        data: { status: 'waiting' }
      });
    }

    const note = noteRows[0];

    // 如果状态是 pending/processing，也提示正在处理
    if (note.status === 'pending' || note.status === 'processing') {
      return res.json({
        code: 202,
        message: 'AI笔记正在火速归纳中，请稍后刷新查看...',
        data: { 
          status: note.status,
          created_at: note.created_at
        }
      });
    }

    res.json({
      code: 200,
      data: {
        status: note.status,
        summary: note.summary,
        keywords: note.keywords,
        content: typeof note.note_content === 'string' ? JSON.parse(note.note_content) : note.note_content,
        error_message: note.error_message,
        processing_duration: note.processing_duration
      }
    });

  } catch (error) {
    console.error('获取AI笔记失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * 8. 上传视频到云端
 * POST /api/recording/:id/sync-to-cloud
 */
router.post('/:id/sync-to-cloud', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { video_file, cloud_filename } = req.body;
    const user_id = req.user.lvid;

    // 验证录制记录
    const [rows] = await db.query(
      'SELECT id FROM course_recordings WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '录制记录不存在或无权限'
      });
    }

    // TODO: 实现云端上传逻辑（对象存储/CDN）
    // 这里暂时返回模拟数据
    const upload_url = `https://example.com/upload/${id}`;
    const final_cloud_filename = cloud_filename || `${id}.webm`;

    // 更新同步状态
    await db.query(
      'UPDATE course_recordings SET sync_status = ?, cloud_filename = ? WHERE id = ?',
      ['uploading', final_cloud_filename, id]
    );

    res.json({
      code: 200,
      message: '云端上传已启动',
      data: {
        upload_url,
        cloud_filename: final_cloud_filename
      }
    });

  } catch (error) {
    console.error('启动云端上传失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * 9. 获取我的录制列表
 * GET /api/recording/list
 */
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.lvid;
    const { page = 1, limit = 20, sync_status } = req.query;
    
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = 'WHERE user_id = ?';
    let queryParams = [user_id];

    if (sync_status) {
      whereClause += ' AND sync_status = ?';
      queryParams.push(sync_status);
    }

    // 获取总数
    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM course_recordings ${whereClause}`,
      queryParams
    );
    const total = countRows[0].total;

    // 获取列表
    const sql = `
      SELECT 
        id, course_id, lesson_plan_id, title, 
        start_time, end_time, duration, 
        video_mime_type, audio_mime_type, file_size,
        sync_status, cloud_video_url, cloud_filename,
        created_at, updated_at
      FROM course_recordings 
      ${whereClause}
      ORDER BY start_time DESC 
      LIMIT ? OFFSET ?
    `;
    
    const [list] = await db.query(sql, [...queryParams, parseInt(limit), parseInt(offset)]);

    res.json({
      code: 200,
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        list
      }
    });

  } catch (error) {
    console.error('获取录制列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * 10. 删除录制
 * DELETE /api/recording/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.lvid;

    // 验证录制记录
    const [rows] = await db.query(
      'SELECT id FROM course_recordings WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '录制记录不存在或无权限'
      });
    }

    // 获取关联的音频文件
    const [transcripts] = await db.query(
      'SELECT audio_file_path FROM audio_transcripts WHERE recording_id = ?',
      [id]
    );

    // 删除音频文件
    for (const transcript of transcripts) {
      if (transcript.audio_file_path) {
        const audioPath = path.join(__dirname, '..', transcript.audio_file_path);
        await fs.unlink(audioPath).catch(console.error);
      }
    }

    // 删除数据库记录（级联删除会自动删除转录和笔记）
    await db.query('DELETE FROM course_recordings WHERE id = ?', [id]);

    res.json({
      code: 200,
      message: '录制记录已删除'
    });

  } catch (error) {
    console.error('删除录制记录失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

module.exports = router;
