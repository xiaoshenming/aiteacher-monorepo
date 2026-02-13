/**
 * ASR服务抽象层
 * 封装调用Python FastAPI + FunASR服务的接口
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const WebSocket = require('ws');

class ASRService {
  // FunASR服务配置
  static FUNASR_URL = process.env.FUNASR_URL || 'http://localhost:10005';
  static FUNASR_WS_URL = process.env.FUNASR_WS_URL || 'ws://localhost:10005';
  static REQUEST_TIMEOUT = 120000; // 120秒超时
  static MAX_RETRIES = 3; // 最大重试次数

  /**
   * 健康检查
   * @returns {Promise<object>} 服务状态
   */
  static async healthCheck() {
    try {
      const response = await axios.get(`${this.FUNASR_URL}/health`, {
        timeout: 10000
      });

      return {
        status: 'ok',
        available: true,
        data: response.data
      };

    } catch (error) {
      console.error('FunASR健康检查失败:', error.message);
      return {
        status: 'error',
        available: false,
        error: error.message
      };
    }
  }

  /**
   * 录音后转写（文件上传转写）
   * @param {string} audioPath - 音频文件路径
   * @param {object} options - 转写选项
   * @returns {Promise<object>} 转写结果
   */
  static async transcribe(audioPath, options = {}) {
    let retries = 0;

    while (retries < this.MAX_RETRIES) {
      try {
        // 验证文件存在
        if (!fs.existsSync(audioPath)) {
          throw new Error(`音频文件不存在: ${audioPath}`);
        }

        // 创建FormData
        const formData = new FormData();
        formData.append('file', fs.createReadStream(audioPath));

        // 发送请求
        console.log(`开始转写音频文件: ${audioPath} (尝试 ${retries + 1}/${this.MAX_RETRIES})`);
        const response = await axios.post(
          `${this.FUNASR_URL}/transcribe`,
          formData,
          {
            headers: formData.getHeaders(),
            timeout: this.REQUEST_TIMEOUT,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          }
        );

        // 检查响应
        if (response.data && response.data.success) {
          console.log('转写成功');
          return {
            success: true,
            text: response.data.text,
            segments: response.data.segments || [],
            duration: response.data.duration,
            language: response.data.language || 'zh-CN'
          };
        } else {
          throw new Error(response.data.error || '转写失败');
        }

      } catch (error) {
        retries++;
        const errMsg = error.response?.data?.detail || error.response?.data?.error || error.message || String(error);
        console.error(`转写失败 (尝试 ${retries}/${this.MAX_RETRIES}):`, errMsg);

        if (retries >= this.MAX_RETRIES) {
          throw new Error(`转写失败（已重试${this.MAX_RETRIES}次）: ${errMsg}`);
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 2000 * retries));
      }
    }
  }

  /**
   * 批量转写
   * @param {string[]} audioPaths - 音频文件路径数组
   * @returns {Promise<object[]>} 转写结果数组
   */
  static async batchTranscribe(audioPaths) {
    try {
      const formData = new FormData();

      // 添加所有音频文件
      for (const audioPath of audioPaths) {
        if (!fs.existsSync(audioPath)) {
          console.warn(`跳过不存在的文件: ${audioPath}`);
          continue;
        }
        formData.append('files', fs.createReadStream(audioPath));
      }

      // 发送请求
      console.log(`开始批量转写 ${audioPaths.length} 个文件`);
      const response = await axios.post(
        `${this.FUNASR_URL}/batch-transcribe`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.REQUEST_TIMEOUT * audioPaths.length,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      return response.data.results || [];

    } catch (error) {
      console.error('批量转写失败:', error);
      throw new Error(`批量转写失败: ${error.message}`);
    }
  }

  /**
   * 实时流式转写（WebSocket）
   * @param {Buffer[]} audioChunks - 音频数据块数组
   * @param {function} onResult - 结果回调函数
   * @returns {Promise<string>} 完整转写文本
   */
  static async transcribeStream(audioChunks, onResult = null) {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(`${this.FUNASR_WS_URL}/stream`);
        let fullText = '';
        let chunkIndex = 0;

        // 连接打开
        ws.on('open', () => {
          console.log('WebSocket连接已建立，开始发送音频流');

          // 发送音频数据块
          const sendNextChunk = () => {
            if (chunkIndex < audioChunks.length) {
              const chunk = audioChunks[chunkIndex];
              ws.send(chunk);
              console.log(`发送音频块 ${chunkIndex + 1}/${audioChunks.length}`);
              chunkIndex++;

              // 间隔发送，模拟实时流
              setTimeout(sendNextChunk, 100);
            } else {
              // 所有数据发送完毕，发送结束标记
              ws.send(JSON.stringify({ type: 'end' }));
              console.log('音频数据发送完毕');
            }
          };

          sendNextChunk();
        });

        // 接收消息
        ws.on('message', (data) => {
          try {
            const result = JSON.parse(data.toString());

            if (result.text) {
              fullText += result.text;

              // 触发回调
              if (onResult && typeof onResult === 'function') {
                onResult(result);
              }

              // 如果是最终结果
              if (result.is_final) {
                console.log('流式转写完成');
                ws.close();
              }
            }

            if (result.error) {
              reject(new Error(result.error));
              ws.close();
            }

          } catch (error) {
            console.error('解析WebSocket消息失败:', error);
          }
        });

        // 连接关闭
        ws.on('close', () => {
          console.log('WebSocket连接已关闭');
          resolve(fullText);
        });

        // 连接错误
        ws.on('error', (error) => {
          console.error('WebSocket错误:', error);
          reject(error);
        });

        // 超时处理
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            console.warn('WebSocket超时，关闭连接');
            ws.close();
            reject(new Error('WebSocket超时'));
          }
        }, this.REQUEST_TIMEOUT);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 获取服务信息
   * @returns {Promise<object>} 服务信息
   */
  static async getServiceInfo() {
    try {
      const response = await axios.get(`${this.FUNASR_URL}/`, {
        timeout: 10000
      });

      return response.data;

    } catch (error) {
      throw new Error(`获取服务信息失败: ${error.message}`);
    }
  }

  /**
   * 验证服务可用性
   * @returns {Promise<boolean>}
   */
  static async isServiceAvailable() {
    try {
      const health = await this.healthCheck();
      return health.available;
    } catch (error) {
      return false;
    }
  }

  /**
   * 等待服务就绪
   * @param {number} maxWaitTime - 最大等待时间（毫秒）
   * @param {number} checkInterval - 检查间隔（毫秒）
   * @returns {Promise<boolean>}
   */
  static async waitForService(maxWaitTime = 60000, checkInterval = 2000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const available = await this.isServiceAvailable();
      
      if (available) {
        console.log('FunASR服务已就绪');
        return true;
      }

      console.log('等待FunASR服务启动...');
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    console.error('FunASR服务启动超时');
    return false;
  }
}

// 错误类型定义
class ASRError extends Error {
  constructor(message, code = 'ASR_ERROR', details = null) {
    super(message);
    this.name = 'ASRError';
    this.code = code;
    this.details = details;
  }
}

module.exports = { ASRService, ASRError };
