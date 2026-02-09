// model/admin/adminRouter.js
const express = require("express");
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

module.exports = router;
