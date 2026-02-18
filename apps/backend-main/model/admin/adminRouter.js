// model/admin/adminRouter.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const adminUtils = require("./adminUtils");
const authorize = require("../auth/authUtils");
const systemController = require("./systemController");
const statsController = require("./statsController");

// System Health
router.get("/system/health", authorize(["3", "4"]), systemController.getSystemHealth);

// Dashboard Stats
router.get("/system/stats", authorize(["3", "4"]), statsController.getDashboardStats);

// 获取本校用户列表
router.get("/user", authorize(["3", "4"]), async (req, res) => {
  try {
    const users = await adminUtils.getSchoolUsers(req.user.id);
    res.json({ code: 200, message: "查询成功", data: users });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 新增用户
router.post("/user", authorize(["3", "4"]), async (req, res) => {
  try {
    const result = await adminUtils.addUser(req.user.id, req.body);
    res.json({
      code: 200,
      message: result.message,
      data: { insertId: result.insertId },
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message, data: null });
  }
});

// 更新用户
router.put("/user/:id", authorize(["3", "4"]), async (req, res) => {
  try {
    const result = await adminUtils.updateUser(
      req.user.id,
      req.params.id,
      req.body
    );
    res.json({ code: 200, message: result.message, data: null });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message, data: null });
  }
});

// 删除用户
router.delete("/user/:id", authorize(["3", "4"]), async (req, res) => {
  try {
    const result = await adminUtils.deleteUser(req.user.id, req.params.id);
    res.json({ code: 200, message: result.message, data: null });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message, data: null });
  }
});

// 查询系统日志
router.get("/logs", authorize(["4"]), async (req, res) => {
  try {
    const { level, page = 1, pageSize = 50, keyword } = req.query;
    const logFile = path.join(__dirname, "../../logs/combined.log");

    if (!fs.existsSync(logFile)) {
      return res.json({ code: 200, data: { total: 0, logs: [] } });
    }

    const content = fs.readFileSync(logFile, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    let logs = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        logs.push({
          level: entry.level,
          message: entry.message,
          timestamp: entry.timestamp,
          service: entry.service || "backend-main",
          stack: entry.stack || null,
        });
      } catch {
        // skip malformed lines
      }
    }

    // Filter by level
    if (level) {
      logs = logs.filter((l) => l.level === level);
    }

    // Filter by keyword
    if (keyword) {
      const kw = keyword.toLowerCase();
      logs = logs.filter((l) => l.message.toLowerCase().includes(kw));
    }

    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = logs.length;
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const paged = logs.slice(start, start + parseInt(pageSize));

    res.json({
      code: 200,
      data: { total, page: parseInt(page), pageSize: parseInt(pageSize), logs: paged },
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// Backup
const backupController = require("./backupController");
router.get("/backups", authorize(["4"]), backupController.getBackups);
router.post("/backups", authorize(["4"]), backupController.createBackup);
router.get("/backups/:filename/download", authorize(["4"]), backupController.downloadBackup);
router.delete("/backups/:filename", authorize(["4"]), backupController.deleteBackup);

// Security
const securityController = require("./securityController");
router.get("/security/overview", authorize(["4"]), securityController.getSecurityOverview);
router.get("/security/login-activity", authorize(["4"]), securityController.getLoginActivity);
router.get("/security/rate-limits", authorize(["4"]), securityController.getRateLimitInfo);

// Monitor
const monitorController = require("./monitorController");
router.get("/monitor/system", authorize(["4"]), monitorController.getSystemMonitor);
router.get("/monitor/services", authorize(["4"]), monitorController.getServiceStatus);
router.get("/monitor/stats", authorize(["4"]), monitorController.getBusinessStats);

module.exports = router;
