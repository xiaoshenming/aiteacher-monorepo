/**
 * 文件上传处理工具模块
 * 支持音频格式转换、分块上传和断点续传
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const execAsync = promisify(exec);

class UploadHelper {
  /**
   * 音频格式转换（webm → wav）
   * FunASR需要wav/flac格式，单声道，16kHz采样率
   * 
   * @param {string} inputPath - 输入音频文件路径
   * @param {string} outputPath - 输出音频文件路径（可选，默认同目录.wav后缀）
   * @returns {Promise<string>} 输出文件路径
   */
  static async convertAudioToWav(inputPath, outputPath = null) {
    try {
      // 验证输入文件
      const inputExists = await fs.access(inputPath).then(() => true).catch(() => false);
      if (!inputExists) {
        throw new Error(`输入文件不存在: ${inputPath}`);
      }

      // 生成输出路径
      if (!outputPath) {
        const ext = path.extname(inputPath);
        outputPath = inputPath.replace(ext, '.wav');
      }

      // 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // 使用ffmpeg转换
      // -i: 输入文件
      // -ac 1: 单声道
      // -ar 16000: 采样率16kHz
      // -y: 覆盖输出文件
      const command = `ffmpeg -i "${inputPath}" -ac 1 -ar 16000 -y "${outputPath}"`;
      
      console.log(`开始音频转换: ${inputPath} → ${outputPath}`);
      const { stdout, stderr } = await execAsync(command);
      
      // ffmpeg的输出在stderr中
      if (stderr && !stderr.includes('error')) {
        console.log('转换成功');
      }

      // 验证输出文件
      const outputExists = await fs.access(outputPath).then(() => true).catch(() => false);
      if (!outputExists) {
        throw new Error('音频转换失败：输出文件未生成');
      }

      return outputPath;

    } catch (error) {
      console.error('音频转换失败:', error);
      throw new Error(`音频转换失败: ${error.message}`);
    }
  }

  /**
   * 检查ffmpeg是否安装
   * @returns {Promise<boolean>}
   */
  static async checkFfmpegInstalled() {
    try {
      await execAsync('ffmpeg -version');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 计算文件MD5哈希值
   * 用于断点续传中的文件完整性验证
   * 
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} MD5哈希值
   */
  static async calculateFileMD5(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = require('fs').createReadStream(filePath);

      stream.on('data', (data) => {
        hash.update(data);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * 保存上传分片
   * 
   * @param {Buffer} chunkData - 分片数据
   * @param {string} fileId - 文件唯一ID
   * @param {number} chunkIndex - 分片索引
   * @param {string} uploadDir - 上传目录
   * @returns {Promise<string>} 分片文件路径
   */
  static async saveChunk(chunkData, fileId, chunkIndex, uploadDir = 'storage/chunks') {
    try {
      // 创建上传目录
      const chunkDir = path.join(uploadDir, fileId);
      await fs.mkdir(chunkDir, { recursive: true });

      // 保存分片
      const chunkPath = path.join(chunkDir, `chunk_${chunkIndex}`);
      await fs.writeFile(chunkPath, chunkData);

      return chunkPath;

    } catch (error) {
      console.error('保存分片失败:', error);
      throw new Error(`保存分片失败: ${error.message}`);
    }
  }

  /**
   * 合并分片为完整文件
   * 
   * @param {string} fileId - 文件唯一ID
   * @param {number} totalChunks - 总分片数
   * @param {string} outputPath - 输出文件路径
   * @param {string} uploadDir - 上传目录
   * @returns {Promise<string>} 合并后的文件路径
   */
  static async mergeChunks(fileId, totalChunks, outputPath, uploadDir = 'storage/chunks') {
    try {
      const chunkDir = path.join(uploadDir, fileId);

      // 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // 创建写入流
      const writeStream = require('fs').createWriteStream(outputPath);

      // 依次合并分片
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(chunkDir, `chunk_${i}`);
        
        // 读取分片
        const chunkData = await fs.readFile(chunkPath);
        
        // 写入合并文件
        await new Promise((resolve, reject) => {
          writeStream.write(chunkData, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      }

      // 关闭写入流
      await new Promise((resolve, reject) => {
        writeStream.end((error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      // 删除分片目录
      await fs.rm(chunkDir, { recursive: true, force: true });

      console.log(`文件合并成功: ${outputPath}`);
      return outputPath;

    } catch (error) {
      console.error('合并分片失败:', error);
      throw new Error(`合并分片失败: ${error.message}`);
    }
  }

  /**
   * 获取已上传的分片列表
   * 用于断点续传
   * 
   * @param {string} fileId - 文件唯一ID
   * @param {string} uploadDir - 上传目录
   * @returns {Promise<number[]>} 已上传的分片索引数组
   */
  static async getUploadedChunks(fileId, uploadDir = 'storage/chunks') {
    try {
      const chunkDir = path.join(uploadDir, fileId);

      // 检查目录是否存在
      const dirExists = await fs.access(chunkDir).then(() => true).catch(() => false);
      if (!dirExists) {
        return [];
      }

      // 读取目录中的文件
      const files = await fs.readdir(chunkDir);

      // 提取分片索引
      const chunkIndexes = files
        .filter(file => file.startsWith('chunk_'))
        .map(file => parseInt(file.replace('chunk_', '')))
        .sort((a, b) => a - b);

      return chunkIndexes;

    } catch (error) {
      console.error('获取已上传分片失败:', error);
      return [];
    }
  }

  /**
   * 验证文件大小限制
   * 
   * @param {number} fileSize - 文件大小（字节）
   * @param {number} maxSize - 最大允许大小（字节），默认500MB
   * @returns {boolean}
   */
  static validateFileSize(fileSize, maxSize = 500 * 1024 * 1024) {
    return fileSize <= maxSize;
  }

  /**
   * 验证文件类型
   * 
   * @param {string} filename - 文件名
   * @param {string[]} allowedTypes - 允许的文件扩展名数组
   * @returns {boolean}
   */
  static validateFileType(filename, allowedTypes = ['.wav', '.mp3', '.m4a', '.flac', '.webm']) {
    const ext = path.extname(filename).toLowerCase();
    return allowedTypes.includes(ext);
  }

  /**
   * 获取文件信息
   * 
   * @param {string} filePath - 文件路径
   * @returns {Promise<object>} 文件信息
   */
  static async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath);
      const basename = path.basename(filePath, ext);

      return {
        path: filePath,
        name: path.basename(filePath),
        basename,
        extension: ext,
        size: stats.size,
        sizeFormatted: this.formatFileSize(stats.size),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };

    } catch (error) {
      throw new Error(`获取文件信息失败: ${error.message}`);
    }
  }

  /**
   * 格式化文件大小
   * 
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * 清理临时文件
   * 
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>}
   */
  static async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(`临时文件已删除: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`删除临时文件失败: ${filePath}`, error);
      return false;
    }
  }

  /**
   * 批量清理临时文件
   * 
   * @param {string[]} filePaths - 文件路径数组
   * @returns {Promise<void>}
   */
  static async cleanupFiles(filePaths) {
    const promises = filePaths.map(filePath => this.cleanupFile(filePath));
    await Promise.allSettled(promises);
  }
}

module.exports = UploadHelper;
