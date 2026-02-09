// --------------- mobile.js ---------------
// 移动端路由（普通上传）
const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs-extra')
const multer = require('multer')
const db = require('../utils/db')
const dayjs = require('dayjs')

// 全局存储路径配置 绝对路径
// const FILE_STORAGE_PATH = path.join(__dirname, '../storage/mobile_files')

// 全局存储路径配置 相对路径
const FILE_STORAGE_PATH = './storage/mobile_files'

// 确保存储目录存在
fs.ensureDirSync(FILE_STORAGE_PATH)

// 后端渲染文件信息数据
async function renderFileData(file) {
  // 加入图标链接
  if(file.type.startsWith('image/')){
    // 适配图片
    file.icon = process.env.URL_PHOTO
  }else if(file.type.startsWith('video/')){
    // 适配视频
    file.icon = process.env.URL_VIDEO
  }else if(file.type.startsWith('audio/')){
    // 适配音频
    file.icon = process.env.URL_AUDIO
  }else if(file.type.startsWith('application/pdf')){
    // 适配PDF
    file.icon = process.env.URL_PDF
  }else if(file.type.startsWith('application/vnd.openxmlformats-officedocument.presentationml.presentation')){
    // 适配PPT
    file.icon = process.env.URL_PPT
  }else if(file.type.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document')){
    // 适配Word
    file.icon = process.env.URL_WORD
  }else if(file.type.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')){
    // 适配Excel
    file.icon = process.env.URL_EXCEL
  }else if(file.type.startsWith('text/')){
    // 适配文本
    file.icon = process.env.URL_TXT
  }else if(file.type.startsWith('application/zip')){
    // 适配压缩包
    file.icon = process.env.URL_ZIP
  }else{
    // 适配其他
    file.icon = process.env.URL_OTHER
  }

  // 换算文件大小
  if(file.size < 1024){
    file.modifiedSize = file.size + 'B'
  }else if(file.size < 1024 * 1024){
    file.modifiedSize = (file.size / 1024).toFixed(2) + 'KB'
  }else if(file.size < 1024 * 1024 * 1024){
    file.modifiedSize = (file.size / 1024 / 1024).toFixed(2) + 'MB'
  }else{
    file.modifiedSize = (file.size / 1024 / 1024 / 1024).toFixed(2) + 'GB'
  }

  // 格式化时间 YY/MM/DD HH:mm
  file.uploaded_at = dayjs(file.uploaded_at).format("YY/MM/DD HH:mm")
  
  // 处理文件名称，防止文件名过长（只允许总长不超过15个字符，超过部分用省略号代替，但保留后缀名）
  if(file.name.length > 15){
    // file.name.slice(0, 12) 截取前12个字符
    // file.name.lastIndexOf('.') 查找最后一个.的位置，若存在返回.的下标，若不存在返回-1
    // file.name.slice(file.name.lastIndexOf('.')) 截取后缀名, 即取出从最后一个.出现的位置到结尾的字符串
    file.name = file.name.slice(0, 12) + '...' + (file.name.lastIndexOf('.') !== -1 ? file.name.slice(file.name.lastIndexOf('.')) : '');
  }

  return file
}

// 普通上传配置
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, FILE_STORAGE_PATH),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, `${Date.now()}${ext}`)
    }
  })
})

/**
 * 文件上传接口
 * @route POST /upload
 * @group 文件管理
 * 支持自定义文件名，如果请求中提供了 filename，则使用之；否则使用 multer 中自动获取的 originalname
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // 从认证中获取用户的 lvid
    const userLvid = req.user.lvid;
    // 如果请求中有 filename 字段，则使用该字段，否则使用 req.file.originalname
    const customName = req.body.filename || req.file.originalname;
    const { mimetype, size } = req.file;

    // 插入文件记录到数据库
    await db.query('INSERT INTO file SET ?', {
      lvid: userLvid,
      name: customName,     // 保存自定义的文件名或原始文件名
      path: req.file.path,  // 文件存储的路径
      size: size,           // 文件大小
      type: mimetype        // 文件类型
    });

    // 返回成功响应
    res.json({ code: 200, message: '上传成功' });
  } catch (err) {
    console.log(err);
    // 返回错误响应
    res.status(500).json({ code: 500, message: '上传失败' });
  }
});

/**
 * 文件下载接口
 * @route GET /download/:fileId
 * @group 文件管理
 */
router.get('/download/:fileId', async (req, res) => {
  try {

    // 使用解构方式获取查询结果中的 rows
    const [rows] = await db.query('SELECT * FROM file WHERE id = ? AND lvid = ?', [
      req.params.fileId,
      req.user.lvid
    ]);

    // 提取第一条记录
    const file = rows[0];
    
    // 判断文件是否存在
    if (!file || file.is_folder) {
      return res.status(404).json({ code: 404, message: '文件不存在' });
    }

    // 下载文件
    res.download(file.path, file.name);
  } catch (err) {
    console.log(err)
    res.status(500).json({ code: 500, message: '下载失败' })
  }
});

/**
 * 文件删除接口
 * @route DELETE /delete/:fileId
 * @group 文件管理
 */
router.delete('/delete/:fileId', async (req, res) => {
  try {
    // 使用解构方式获取查询结果中的 rows
    const [rows] = await db.query('SELECT * FROM file WHERE id = ? AND lvid = ?', [
      req.params.fileId,
      req.user.lvid
    ]);

    // 提取第一条记录
    const file = rows[0];

    if (!file || file.is_folder) {
      return res.status(404).json({ code: 404, message: '文件不存在' });
    }

    await db.query('DELETE FROM file WHERE id = ?', [req.params.fileId])
    if (!file.is_folder) {
      await fs.remove(file.path)
    }

    res.json({ code: 200, message: '删除成功' })
  } catch (err) {
    console.log(err)
    res.status(500).json({ code: 500, message: '删除失败' })
  }
})

/**
 * 文件搜索接口
 * @route GET /search
 * @group 文件管理
 */
router.get('/search', async (req, res) => {
  try {
    // 获取查询参数
    const { keyword } = req.query
    // 查询文件列表
    const [files] = await db.query(
      'SELECT id, name, size, type, uploaded_at, is_folder FROM file WHERE lvid = ? AND name LIKE ?',
      [req.user.lvid, `%${keyword}%`]
    )
    // 为文件列表加入图标链接 和 换算文件大小 和 格式化时间
    files.forEach(file => {
      file = renderFileData(file)
    })
    // 返回结果
    res.json({ code: 200, data: files })
  } catch (err) {
    console.log(err)
    res.status(500).json({ code: 500, message: '查询失败' })
  }
})

/**
 * 查询用户文件列表(普通)
 * @route GET /list
 * @group 文件管理
 */
router.get('/list', async (req, res) => {
  try {
    const files = await db.query(
      'SELECT id, name, size, type, uploaded_at, is_folder FROM file WHERE lvid = ?',
      [req.user.lvid]
    )
    res.json({ code: 200, message: '查询成功', data: files[0] })
  } catch (err) {
    console.log(err)
    res.status(500).json({ code: 500, message: '查询失败' })
  }
})

/**
 * 查询用户文件列表(分页)
 * @route GET /list/page
 * @group 文件管理
 */
router.get('/list/page', async (req, res) => {
  try {
    // 获取分页参数
    const { page, pageSize } = req.query
    // 计算分页偏移量
    const offset = (page - 1) * pageSize
    // 查询文件列表
    const [files] = await db.query(
      'SELECT id, name, size, type, uploaded_at, is_folder FROM file WHERE lvid = ? LIMIT ?, ?',
      [parseInt(req.user.lvid), parseInt(offset), parseInt(pageSize)]
    )
    // 为文件列表加入图标链接 和 换算文件大小 和 格式化时间
    files.forEach(file => {
      file = renderFileData(file)
    })
    // 查询总数
    let [total] = await db.query(
      'SELECT COUNT(*) as total FROM file WHERE lvid = ?',
      [req.user.lvid]
    )
    total = total[0].total
    // 返回结果
    res.json({ code: 200, data: { files, total, page, pageSize } })
  } catch (err) {
    console.log(err)
    res.status(500).json({ code: 500, message: '查询失败' })
  }
})

module.exports = router