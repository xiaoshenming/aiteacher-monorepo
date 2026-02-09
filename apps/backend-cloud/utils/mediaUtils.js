const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * 媒体处理工具类
 */
class MediaUtils {
  /**
   * 从视频中提取音频
   * @param {string} inputPath 输入文件路径 (如 webm, mp4)
   * @param {string} outputPath 输出文件路径 (如 wav, mp3)
   * @returns {Promise<string>} 返回输出路径
   */
  static async extractAudio(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      // ffmpeg -i input.webm -vn -acodec pcm_s16le -ar 16000 -ac 1 output.wav
      // -vn: 禁用视频
      // -acodec pcm_s16le: ASR 通常支持的 16bit PCM
      // -ar 16000: 采样率 16k (FunASR 推荐)
      // -ac 1: 单声道
      // -y: 覆盖已存在文件
      // 关键修正：确保输入路径是绝对路径
      const absInput = path.isAbsolute(inputPath) ? inputPath : path.join(__dirname, '..', inputPath);
      const absOutput = path.isAbsolute(outputPath) ? outputPath : path.join(__dirname, '..', outputPath);

      const command = `ffmpeg -i "${absInput}" -vn -acodec pcm_s16le -ar 16000 -ac 1 -y "${absOutput}"`;
      
      console.log(`🎬 正在提取音频: ${command}`);
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ FFmpeg 错误: ${error.message}\nStderr: ${stderr}`);
          return reject(error);
        }
        console.log(`✅ 音频提取完成: ${outputPath}`);
        resolve(outputPath);
      });
    });
  }

  /**
   * 自动生成音频保存路径并提取
   * @param {string} videoPath 
   * @returns {Promise<string>}
   */
  static async ensureAudioExtracted(videoPath) {
    const ext = path.extname(videoPath);
    // 如果已经是音频格式且不是 webm，可能不需要提取，但为了 ASR 兼容性，建议统一转 wav
    const audioPath = videoPath.replace(ext, '.wav');

    try {
      // 检查文件是否已存在
      await fs.access(audioPath);
      return audioPath;
    } catch {
      // 文件不存在，执行提取
      const absoluteVideoPath = path.isAbsolute(videoPath) ? videoPath : path.join(__dirname, '..', videoPath);
      const absoluteAudioPath = path.isAbsolute(audioPath) ? audioPath : path.join(__dirname, '..', audioPath);
      
      // 确保存储目录存在
      await fs.mkdir(path.dirname(absoluteAudioPath), { recursive: true });
      
      await this.extractAudio(absoluteVideoPath, absoluteAudioPath);
      return audioPath;
    }
  }
}

module.exports = MediaUtils;
