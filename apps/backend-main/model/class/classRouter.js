const express = require("express");
const router = express.Router();
const classUtils = require("./classUtils");
const authorize = require("../auth/authUtils");

// 创建新班级
router.post("/", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const result = await classUtils.createClass(req.user.id, req.body);
    res.status(201).json({
      code: 201,
      message: result.message,
      data: { classId: result.classId },
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message, data: null });
  }
});

// 获取教师的班级
router.get("/", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const classes = await classUtils.getTeacherClasses(req.user.id);
    res.json({ code: 200, message: "获取班级列表成功", data: { classes } });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取班级详情
router.get("/:classId", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const classDetails = await classUtils.getClassDetails(
      req.params.classId,
      req.user.id
    );
    res.json({ code: 200, message: "获取班级详情成功", data: classDetails });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message, data: null });
  }
});

// 添加学生到班级
router.post(
  "/:classId/students",
  authorize(["2", "3", "4"]),
  async (req, res) => {
    try {
      const result = await classUtils.addStudentToClass(
        req.params.classId,
        req.user.id,
        req.body
      );
      res.json({ code: 200, message: result.message, data: null });
    } catch (error) {
      res.status(400).json({ code: 400, message: error.message, data: null });
    }
  }
);

// 从班级移除学生
router.delete(
  "/:classId/students/:studentId",
  authorize(["2", "3", "4"]),
  async (req, res) => {
    try {
      const result = await classUtils.removeStudentFromClass(
        req.params.classId,
        req.user.id,
        req.params.studentId
      );
      res.json({ code: 200, message: result.message, data: null });
    } catch (error) {
      res.status(400).json({ code: 400, message: error.message, data: null });
    }
  }
);

module.exports = router;
