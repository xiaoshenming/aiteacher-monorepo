const express = require("express");
const router = express.Router();
const authorize = require("../auth/authUtils");
const { getTeacherSessions, getSessionDetail, getSessionStats } = require("./classroomUtils");
const logger = require("../../utils/logger");

// 教师会话历史
router.get("/sessions", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const data = await getTeacherSessions(req.user.id, Number(page), Number(pageSize));
    res.json({ code: 200, message: "获取成功", data });
  } catch (err) {
    logger.error(`获取会话历史失败: ${err.message}`);
    res.status(500).json({ code: 500, message: "获取会话历史失败" });
  }
});

// 会话详情
router.get("/sessions/:id", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const data = await getSessionDetail(Number(req.params.id));
    res.json({ code: 200, message: "获取成功", data });
  } catch (err) {
    logger.error(`获取会话详情失败: ${err.message}`);
    const status = err.message === "会话不存在" ? 404 : 500;
    res.status(status).json({ code: status, message: err.message });
  }
});

// 会话统计
router.get("/sessions/:id/stats", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const data = await getSessionStats(Number(req.params.id));
    res.json({ code: 200, message: "获取成功", data });
  } catch (err) {
    logger.error(`获取会话统计失败: ${err.message}`);
    const status = err.message === "会话不存在" ? 404 : 500;
    res.status(status).json({ code: status, message: err.message });
  }
});

module.exports = router;
