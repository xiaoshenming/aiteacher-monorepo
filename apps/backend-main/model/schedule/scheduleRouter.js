// model\schedule\scheduleRouter.js
const express = require("express");
const router = express.Router();
const authorize = require("../auth/authUtils");
const scheduleUtils = require("./scheduleUtils");

// 获取当前用户所有课程表（按状态排序）
router.get("/", authorize(["1", "2", "3", "4"]), async (req, res) => {
  try {
    const userUid = await scheduleUtils.getUserUid(req.user.id);
    const schedules = await scheduleUtils.getCourseSchedules(userUid);
    res.json({ code: 200, message: "获取课程表成功", data: schedules });
  } catch (error) {
    console.error("获取课程表失败:", error);
    res.status(500).json({ code: 500, message: "服务器错误", data: null });
  }
});

// 新增创建课程表接口
router.post("/", authorize(["1", "2", "3", "4"]), async (req, res) => {
  try {
    const { schedule_name, schedule_data, status } = req.body;
    if (!schedule_name || !schedule_data) {
      return res
        .status(400)
        .json({
          code: 400,
          message: "缺少必要字段：课程表名称或详细数据",
          data: null,
        });
    }
    const userUid = await scheduleUtils.getUserUid(req.user.id);
    const insertId = await scheduleUtils.createCourseSchedule(userUid, {
      schedule_name,
      schedule_data,
      status,
    });
    res.json({ code: 200, message: "创建课程表成功", data: { id: insertId } });
  } catch (error) {
    console.error("创建课程表失败:", error);
    res.status(500).json({ code: 500, message: "服务器错误", data: null });
  }
});

// 更新课程表接口
router.put("/:id", authorize(["1", "2", "3", "4"]), async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const { schedule_name, schedule_data, status } = req.body;
    if (!schedule_name && !schedule_data && status === undefined) {
      return res
        .status(400)
        .json({ code: 400, message: "没有需要更新的字段", data: null });
    }
    const userUid = await scheduleUtils.getUserUid(req.user.id);
    await scheduleUtils.updateCourseSchedule(userUid, scheduleId, {
      schedule_name,
      schedule_data,
      status,
    });
    res.json({ code: 200, message: "更新课程表成功", data: null });
  } catch (error) {
    console.error("更新课程表失败:", error);
    res.status(500).json({ code: 500, message: "服务器错误", data: null });
  }
});

// 删除课程表接口
router.delete("/:id", authorize(["1", "2", "3", "4"]), async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const userUid = await scheduleUtils.getUserUid(req.user.id);
    await scheduleUtils.deleteCourseSchedule(userUid, scheduleId);
    res.json({ code: 200, message: "删除课程表成功", data: null });
  } catch (error) {
    console.error("删除课程表失败:", error);
    res.status(500).json({ code: 500, message: "服务器错误", data: null });
  }
});

module.exports = router;
