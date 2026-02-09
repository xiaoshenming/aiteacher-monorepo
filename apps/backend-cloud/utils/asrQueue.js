/**
 * ASR任务队列管理
 * 基于Redis的异步任务队列，处理音频转录任务
 */

const { ASRService, ASRError } = require('./asrService');
const redis = require('./redis');
const db = require('./db');
const path = require('path');
const Redis = require('ioredis'); // 引入 Redis 类以创建新连接

class ASRTaskQueue {
  // 队列配置
  static QUEUE_KEY = 'asr:queue';
  static TASK_KEY_PREFIX = 'asr:task:';
  static MAX_RETRIES = 3;
  static TASK_TIMEOUT = 3600; // 1小时
  static WORKER_POLL_INTERVAL = 1000; // 1秒

  // 专用阻塞连接池
  static blockingClients = [];

  /**
   * 获取一个新的 Redis 连接用于阻塞操作
   */
  static createBlockingClient() {
    const client = new Redis({
      host: process.env.Redis_HOST,
      port: process.env.Redis_PORT,
      password: process.env.Redis_PASSWORD,
      db: 0,
    });
    this.blockingClients.push(client);
    return client;
  }

  /**
   * 添加转录任务到队列
   * @param {string} recordingId - 录制记录ID
   * @param {string} audioPath - 音频文件路径
   * @param {object} options - 任务选项
   * @returns {Promise<string>} 任务ID
   */
  static async addTask(recordingId, audioPath, options = {}) {
    try {
      // 生成任务ID
      const taskId = `${recordingId}:${Date.now()}`;
      const taskKey = `${this.TASK_KEY_PREFIX}${taskId}`;

      // 任务数据
      const taskData = {
        taskId,
        recordingId,
        audioPath,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        options: options || {}
      };

      // 保存任务数据到Redis（带过期时间）
      await redis.setex(taskKey, this.TASK_TIMEOUT, JSON.stringify(taskData));

      // 推送到队列
      await redis.lpush(this.QUEUE_KEY, taskId);

      console.log(`✅ ASR任务已添加: ${taskId}`);
      return taskId;

    } catch (error) {
      console.error('添加ASR任务失败:', error);
      throw new Error(`添加ASR任务失败: ${error.message}`);
    }
  }

  /**
   * 启动后台Worker处理队列
   * @param {number} concurrency - 并发处理数量
   */
  static async startWorker(concurrency = 1) {
    console.log(`🚀 ASR Worker启动，并发数: ${concurrency}`);

    // 创建多个Worker
    const workers = [];
    for (let i = 0; i < concurrency; i++) {
      workers.push(this.workerLoop(i));
    }

    // 等待所有Worker
    await Promise.all(workers);
  }

  /**
   * Worker循环
   * @param {number} workerId - Worker ID
   */
  static async workerLoop(workerId) {
    console.log(`Worker #${workerId} 已启动`);
    
    // 为每个 Worker 创建专门的阻塞连接，避免污染主 Redis 连接
    const blockingRedis = this.createBlockingClient();

    while (true) {
      try {
        // 使用专门的连接进行 brpop（阻塞式）
        const result = await blockingRedis.brpop(this.QUEUE_KEY, 10);

        if (!result) {
          // 超时，继续轮询
          continue;
        }

        const taskId = result[1];
        console.log(`Worker #${workerId} 获取任务: ${taskId}`);

        // 处理任务（处理逻辑可以使用普通 redis 连接）
        await this.processTask(taskId, workerId);

      } catch (error) {
        console.error(`Worker #${workerId} 错误:`, error);
        // 短暂延迟后继续
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * 处理单个任务
   * @param {string} taskId - 任务ID
   * @param {number} workerId - Worker ID
   */
  static async processTask(taskId, workerId = 0) {
    const taskKey = `${this.TASK_KEY_PREFIX}${taskId}`;
    const startTime = Date.now();

    try {
      // 获取任务数据
      const taskDataStr = await redis.get(taskKey);
      if (!taskDataStr) {
        console.warn(`任务不存在: ${taskId}`);
        return;
      }

      const task = JSON.parse(taskDataStr);

      // 更新状态为处理中
      task.status = 'processing';
      task.startedAt = new Date().toISOString();
      task.workerId = workerId;
      await redis.setex(taskKey, this.TASK_TIMEOUT, JSON.stringify(task));

      // 更新数据库状态
      await this.updateTranscriptStatus(task.recordingId, 'processing');

      console.log(`⚙️ Worker #${workerId} 开始处理任务: ${taskId}`);

      // 调用FunASR转写
      const result = await ASRService.transcribe(task.audioPath);

      // 计算处理时长
      const processingDuration = Math.floor((Date.now() - startTime) / 1000);

      // 保存转录结果到数据库
      await this.saveTranscript(task.recordingId, {
        text: result.text,
        segments: result.segments,
        duration: result.duration,
        language: result.language,
        processingDuration
      });

      // 自动触发AI笔记生成
      try {
        const { NoteService } = require('./noteService');
        console.log(`🤖 正在自动为录制 ${task.recordingId} 触发完整AI笔记生成...`);
        // 异步生成，不阻塞队列
        NoteService.generateCompleteNotes(task.recordingId, '').catch(err => {
          console.error(`❌ 自动生成录制 ${task.recordingId} 的AI笔记失败:`, err);
        });
      } catch (noteError) {
        console.warn('无法加载NoteService，跳过自动笔记生成:', noteError.message);
      }

      // 更新任务状态为完成
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.processingDuration = processingDuration;
      await redis.setex(taskKey, this.TASK_TIMEOUT, JSON.stringify(task));

      console.log(`✅ Worker #${workerId} 任务完成: ${taskId} (耗时: ${processingDuration}秒)`);

    } catch (error) {
      console.error(`❌ Worker #${workerId} 任务失败: ${taskId}`, error);

      // 错误重试逻辑
      await this.handleTaskError(taskId, error);
    }
  }

  /**
   * 处理任务错误
   * @param {string} taskId - 任务ID
   * @param {Error} error - 错误对象
   */
  static async handleTaskError(taskId, error) {
    const taskKey = `${this.TASK_KEY_PREFIX}${taskId}`;

    try {
      const taskDataStr = await redis.get(taskKey);
      if (!taskDataStr) return;

      const task = JSON.parse(taskDataStr);
      task.retryCount = (task.retryCount || 0) + 1;
      task.lastError = error.message;

      if (task.retryCount < this.MAX_RETRIES) {
        // 重新加入队列
        task.status = 'pending';
        await redis.setex(taskKey, this.TASK_TIMEOUT, JSON.stringify(task));
        await redis.lpush(this.QUEUE_KEY, taskId);

        console.log(`🔄 任务重试 (${task.retryCount}/${this.MAX_RETRIES}): ${taskId}`);

      } else {
        // 超过重试次数，标记为失败
        task.status = 'failed';
        task.failedAt = new Date().toISOString();
        await redis.setex(taskKey, this.TASK_TIMEOUT, JSON.stringify(task));

        // 更新数据库状态
        await this.updateTranscriptStatus(task.recordingId, 'failed', error.message);

        console.error(`❌ 任务失败（已达最大重试次数）: ${taskId}`);
      }

    } catch (err) {
      console.error('处理任务错误时失败:', err);
    }
  }

  /**
   * 更新数据库中的转录状态
   * @param {string} recordingId - 录制记录ID
   * @param {string} status - 状态
   * @param {string} errorMessage - 错误信息（可选）
   */
  static async updateTranscriptStatus(recordingId, status, errorMessage = null) {
    try {
      const sql = `
        UPDATE audio_transcripts 
        SET status = ?, 
            error_message = ?,
            updated_at = NOW()
        WHERE recording_id = ?
      `;

      await db.query(sql, [status, errorMessage, recordingId]);

    } catch (error) {
      console.error('更新转录状态失败:', error);
    }
  }

  /**
   * 保存转录结果到数据库
   * @param {string} recordingId - 录制记录ID
   * @param {object} result - 转录结果
   */
  static async saveTranscript(recordingId, result) {
    try {
      const sql = `
        UPDATE audio_transcripts 
        SET transcript_text = ?,
            transcript_segments = ?,
            status = 'completed',
            processing_duration = ?,
            completed_at = NOW(),
            updated_at = NOW()
        WHERE recording_id = ?
      `;

      const segments = result.segments ? JSON.stringify(result.segments) : null;

      await db.query(sql, [
        result.text,
        segments,
        result.processingDuration,
        recordingId
      ]);

      console.log(`💾 转录结果已保存: ${recordingId}`);

    } catch (error) {
      console.error('保存转录结果失败:', error);
      throw error;
    }
  }

  /**
   * 获取任务状态
   * @param {string} taskId - 任务ID
   * @returns {Promise<object>} 任务信息
   */
  static async getTaskStatus(taskId) {
    try {
      const taskKey = `${this.TASK_KEY_PREFIX}${taskId}`;
      const taskDataStr = await redis.get(taskKey);

      if (!taskDataStr) {
        return { status: 'not_found' };
      }

      return JSON.parse(taskDataStr);

    } catch (error) {
      console.error('获取任务状态失败:', error);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * 获取队列长度
   * @returns {Promise<number>}
   */
  static async getQueueLength() {
    try {
      return await redis.llen(this.QUEUE_KEY);
    } catch (error) {
      console.error('获取队列长度失败:', error);
      return 0;
    }
  }

  /**
   * 清空队列
   */
  static async clearQueue() {
    try {
      await redis.del(this.QUEUE_KEY);
      console.log('✅ 队列已清空');
    } catch (error) {
      console.error('清空队列失败:', error);
    }
  }

  /**
   * 获取队列统计信息
   * @returns {Promise<object>}
   */
  static async getQueueStats() {
    try {
      const queueLength = await this.getQueueLength();

      // 获取所有任务键
      const taskKeys = await redis.keys(`${this.TASK_KEY_PREFIX}*`);

      // 统计各状态任务数
      const stats = {
        queueLength,
        totalTasks: taskKeys.length,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };

      for (const key of taskKeys) {
        const taskDataStr = await redis.get(key);
        if (taskDataStr) {
          const task = JSON.parse(taskDataStr);
          stats[task.status] = (stats[task.status] || 0) + 1;
        }
      }

      return stats;

    } catch (error) {
      console.error('获取队列统计失败:', error);
      return null;
    }
  }
}

module.exports = { ASRTaskQueue };
