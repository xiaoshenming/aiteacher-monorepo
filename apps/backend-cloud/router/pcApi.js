// --------------- pc.js ---------------

const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs-extra')
const multer = require('multer')
const db = require('../utils/db')

// 全局存储路径配置（相对路径）
const FILE_STORAGE_PATH = './storage/files' // 文件存储路径
const CHUNK_STORAGE_PATH = './storage/chunks' // 分片存储路径

// 确保存储目录存在
fs.ensureDirSync(FILE_STORAGE_PATH)
fs.ensureDirSync(CHUNK_STORAGE_PATH)

// 分片上传配置
const chunkUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, CHUNK_STORAGE_PATH),
    filename: (req, file, cb) => {
      const { fileMd5, chunkIndex } = req.body
      cb(null, `${fileMd5}-${chunkIndex}`)
    }
  })
})

/**
 * 检查分片上传状态
 * @route POST /chunk/check
 * @group 文件管理 - 分片上传相关
 */
router.post('/chunk/check', async (req, res) => {
  try {
    const { fileMd5, totalChunks } = req.body
    const [existingChunks] = await db.query(
      'SELECT chunk_index FROM file_chunk WHERE file_md5 = ?',
      [fileMd5]
    )
    
    res.json({
      code: 200,
      message: '检查分片上传状态成功',
      data: {
        uploaded: existingChunks.map(c => c.chunk_index),
        total: parseInt(totalChunks)
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 500, message: '检查分片上传状态失败', data: null })
  }
})

/**
 * 分片上传接口
 * @route POST /chunk/upload
 * @group 文件管理 - 分片上传相关
 */
router.post('/chunk/upload', chunkUpload.single('chunk'), async (req, res) => {
  try {
    const { fileMd5, chunkIndex, totalChunks, fileName, fileType, fileSize } = req.body
    if (!fileMd5 || chunkIndex === undefined) {
      return res.status(400).json({ code: 400, message: '缺少必要参数', data: null })
    }
    // 检查该分片是否已存在
    const [rows] = await db.query(
      'SELECT id FROM file_chunk WHERE file_md5 = ? AND chunk_index = ?',
      [fileMd5, chunkIndex]
    )
    if (rows.length > 0) {
      // 已存在则更新（或直接跳过），防止重复插入
      await db.query(
        'UPDATE file_chunk SET chunk_path = ? WHERE file_md5 = ? AND chunk_index = ?',
        [req.file.path, fileMd5, chunkIndex]
      )
    } else {
      await db.query('INSERT INTO file_chunk SET ?', {
        file_md5: fileMd5,
        chunk_index: chunkIndex,
        total_chunks: totalChunks,
        chunk_path: req.file.path
      })
    }
    res.json({ code: 200, message: '分片上传成功', data: null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 500, message: '分片上传失败', data: null })
  }
})

/**
 * 合并分片接口
 * @route POST /chunk/merge
 * @group 文件管理 - 分片上传相关
 */
router.post('/chunk/merge', async (req, res) => {
  try {
    const { fileMd5, fileName, fileType, fileSize } = req.body
    const userLvid = req.user.lvid

    // 获取所有已上传的分片，并确保按照顺序排列
    const [chunks] = await db.query(
      'SELECT * FROM file_chunk WHERE file_md5 = ? ORDER BY chunk_index ASC',
      [fileMd5]
    )
    if (chunks.length === 0) {
      return res.status(404).json({ code: 404, message: '找不到分片文件', data: null })
    }
    // 可选：检查是否缺失分片（若 chunks.length !== totalChunks 则返回错误）
    // 开始合并分片
    const fileExt = path.extname(fileName)
    const finalFileName = `${Date.now()}${fileExt}`
    const finalPath = path.join(FILE_STORAGE_PATH, finalFileName)
    const writeStream = fs.createWriteStream(finalPath)

    for (const chunk of chunks) {
      const chunkPath = chunk.chunk_path
      if (!fs.existsSync(chunkPath)) {
        return res.status(500).json({ code: 500, message: `分片文件不存在：${chunkPath}`, data: null })
      }
      const chunkBuffer = await fs.readFile(chunkPath)
      writeStream.write(chunkBuffer)
      await fs.remove(chunkPath) // 删除已合并的分片文件
    }
    writeStream.end()

    // 保存合并后的文件记录
    await db.query('INSERT INTO file SET ?', {
      lvid: userLvid,
      name: fileName,
      path: finalPath,
      size: fileSize,
      type: fileType,
      uploaded_at: new Date()
    })

    // 清理数据库中对应的分片记录
    await db.query('DELETE FROM file_chunk WHERE file_md5 = ?', [fileMd5])

    res.json({ code: 200, message: '文件合并成功', data: null })
  } catch (err) {
    console.error('文件合并失败:', err)
    res.status(500).json({ code: 500, message: '合并文件出错', data: null })
  }
})

/**
 * 文件下载接口
 * @route GET /download/:fileId
 * @group 文件管理
 */
router.get('/download/:fileId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM file WHERE id = ? AND lvid = ?',
      [req.params.fileId, req.user.lvid]
    )
    const file = rows[0]
    if (!file || file.is_folder) {
      return res.status(404).json({ code: 404, message: '文件不存在', data: null })
    }
    res.download(file.path, file.name)
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 500, message: '下载失败', data: null })
  }
})

/**
 * 文件删除接口
 * @route DELETE /delete/:fileId
 * @group 文件管理
 */
router.delete('/delete/:fileId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM file WHERE id = ? AND lvid = ?',
      [req.params.fileId, req.user.lvid]
    )
    const file = rows[0]
    if (!file) return res.status(404).json({ code: 404, message: '文件不存在', data: null })
    await db.query('DELETE FROM file WHERE id = ?', [req.params.fileId])
    if (!file.is_folder) {
      await fs.remove(file.path)
    }
    res.json({ code: 200, message: '删除成功', data: null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 500, message: '删除失败', data: null })
  }
})

/**
 * 查询用户文件列表
 * @route GET /list
 * @group 文件管理
 */
router.get('/list', async (req, res) => {
  try {
    const [files] = await db.query(
      'SELECT id, name, size, type, uploaded_at, is_folder FROM file WHERE lvid = ?',
      [req.user.lvid]
    )
    res.json({ code: 200, message: '查询文件列表成功', data: files })
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 500, message: '查询失败', data: null })
  }
})

module.exports = router
