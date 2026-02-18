const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

const BACKUP_DIR = path.join(__dirname, "../../backups");

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 获取备份列表
async function getBackups(req, res) {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith(".sql") || f.endsWith(".sql.gz"))
      .map((f) => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        const sizeInMB = (stat.size / (1024 * 1024)).toFixed(2);
        return {
          name: f,
          size: `${sizeInMB} MB`,
          sizeBytes: stat.size,
          type: f.includes("_manual") ? "手动" : "自动",
          time: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({ code: 200, data: { backups: files } });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
}

// 创建备份
async function createBackup(req, res) {
  try {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const filename = `backup_${timestamp}_manual.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    // 从环境变量或默认值获取数据库配置
    const dbHost = process.env.DB_HOST || "127.0.0.1";
    const dbUser = process.env.DB_USER || "ming";
    const dbPass = process.env.DB_PASSWORD || "ming";
    const dbName = process.env.DB_NAME || "aiteacher";

    const cmd = `mysqldump -h ${dbHost} -u ${dbUser} -p${dbPass} ${dbName} > "${filepath}"`;
    await execPromise(cmd, { timeout: 120000 });

    // 压缩
    await execPromise(`gzip "${filepath}"`, { timeout: 60000 });

    const gzFile = `${filename}.gz`;
    const stat = fs.statSync(path.join(BACKUP_DIR, gzFile));

    res.json({
      code: 200,
      message: "备份创建成功",
      data: {
        name: gzFile,
        size: `${(stat.size / (1024 * 1024)).toFixed(2)} MB`,
        type: "手动",
        time: stat.mtime.toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: `备份失败: ${error.message}` });
  }
}

// 下载备份
async function downloadBackup(req, res) {
  try {
    const { filename } = req.params;
    // 安全检查：防止路径遍历
    const safeName = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safeName);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ code: 404, message: "备份文件不存在" });
    }

    res.download(filepath, safeName);
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
}

// 删除备份
async function deleteBackup(req, res) {
  try {
    const { filename } = req.params;
    const safeName = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safeName);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ code: 404, message: "备份文件不存在" });
    }

    fs.unlinkSync(filepath);
    res.json({ code: 200, message: "备份已删除" });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
}

module.exports = { getBackups, createBackup, downloadBackup, deleteBackup };
