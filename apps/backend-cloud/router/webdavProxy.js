const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
require('dotenv').config();

const router = express.Router();

const WEBDAV_URL = process.env.WEBDAV_URL;
const WEBDAV_USER = process.env.WEBDAV_USER;
const WEBDAV_PASS = process.env.WEBDAV_PASS;

// 本地缓存目录
const CACHE_DIR = path.join(__dirname, '../storage/webdav-cache');
fs.mkdirSync(CACHE_DIR, { recursive: true });

// 正在下载中的请求（防止同一文件并发重复下载）
const downloading = new Map();

function getCachePath(resourcePath) {
  const normalized = path.normalize(resourcePath).replace(/^(\.\.[/\\])+/, '');
  const p = path.join(CACHE_DIR, normalized);
  // 防路径穿越
  if (!p.startsWith(CACHE_DIR + path.sep) && p !== CACHE_DIR) {
    throw new Error('非法路径');
  }
  return p;
}

// 代理 /Resource/* 路径到 WebDAV 服务器，带本地磁盘缓存
router.get('/*path', (req, res) => {
  const resourcePath = '/' + [].concat(req.params.path).join('/');
  const contentType = mime.lookup(resourcePath) || 'application/octet-stream';

  let cachePath;
  try {
    cachePath = getCachePath(resourcePath);
  } catch {
    return res.status(400).json({ message: '非法路径' });
  }

  // 缓存命中 → 直接从磁盘返回（毫秒级），跳过空文件
  if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 0) {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(cachePath);
  }

  // 如果已有相同文件在下载中，等它下载完再从缓存提供
  if (downloading.has(cachePath)) {
    downloading.get(cachePath).then(() => {
      if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 0) {
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.sendFile(cachePath);
      } else {
        res.status(502).json({ message: '资源获取失败' });
      }
    });
    return;
  }

  // 首次下载：同时写入响应流 + 缓存文件
  const webdavUrl = `${WEBDAV_URL}${resourcePath}`;
  const tmpPath = cachePath + '.tmp';
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400');

  const cacheStream = fs.createWriteStream(tmpPath);

  const downloadPromise = new Promise((resolve) => {
    const curl = spawn('curl', [
      '-s', '--fail', '-k',
      '-u', `${WEBDAV_USER}:${WEBDAV_PASS}`,
      '--max-time', '30',
      webdavUrl,
    ]);

    curl.stdout.on('data', chunk => {
      if (!res.writableEnded) res.write(chunk);
      cacheStream.write(chunk);
    });

    curl.on('close', code => {
      downloading.delete(cachePath);
      if (code === 0) {
        cacheStream.end(() => {
          fs.rename(tmpPath, cachePath, () => {});
        });
        if (!res.writableEnded) res.end();
        resolve(true);
      } else {
        cacheStream.destroy();
        fs.unlink(tmpPath, () => {});
        if (!res.headersSent) {
          res.status(code === 22 ? 404 : 502).json({ message: '资源不存在或获取失败' });
        } else if (!res.writableEnded) {
          res.end();
        }
        resolve(false);
      }
    });

    curl.on('error', e => {
      downloading.delete(cachePath);
      cacheStream.destroy();
      fs.unlink(tmpPath, () => {});
      console.error('[WebDAV Proxy] curl 启动失败:', e.message);
      if (!res.headersSent) res.status(502).json({ message: 'WebDAV 服务器连接失败' });
      else if (!res.writableEnded) res.end();
      resolve(false);
    });
  });

  downloading.set(cachePath, downloadPromise);
});

module.exports = router;
