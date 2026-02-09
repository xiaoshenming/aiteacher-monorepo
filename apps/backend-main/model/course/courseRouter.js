const express = require("express");
const router = express.Router();
const courseUtils = require("./courseUtils");
const authorize = require("../auth/authUtils");

// 创建新课程（仅教师）
router.post("/", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const result = await courseUtils.createCourse(req.user.id, req.body);
    res.status(201).json({
      code: 201,
      message: result.message,
      data: { courseId: result.courseId },
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message, data: null });
  }
});

// 获取教师的课程
router.get("/", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const courses = await courseUtils.getTeacherCourses(req.user.id);
    res.json({ code: 200, message: "获取课程列表成功", data: { courses } });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取课程详情
router.get("/:courseId", authorize(["2", "3", "4"]), async (req, res) => {
  try {
    const courseDetails = await courseUtils.getCourseDetails(
      req.params.courseId,
      req.user.id
    );
    res.json({ code: 200, message: "获取课程详情成功", data: courseDetails });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message, data: null });
  }
});

// 添加助教到课程
router.post(
  "/:courseId/assistants",
  authorize(["2", "3", "4"]),
  async (req, res) => {
    try {
      const { assistantId } = req.body;
      const result = await courseUtils.addCourseAssistant(
        req.params.courseId,
        req.user.id,
        assistantId
      );
      res.json({ code: 200, message: result.message, data: null });
    } catch (error) {
      res.status(400).json({ code: 400, message: error.message, data: null });
    }
  }
);

// 从课程中移除助教
router.delete(
  "/:courseId/assistants/:assistantId",
  authorize(["2", "3", "4"]),
  async (req, res) => {
    try {
      const result = await courseUtils.removeCourseAssistant(
        req.params.courseId,
        req.user.id,
        req.params.assistantId
      );
      res.json({ code: 200, message: result.message, data: null });
    } catch (error) {
      res.status(400).json({ code: 400, message: error.message, data: null });
    }
  }
);

// 添加班级到课程
router.post(
  "/:courseId/classes",
  authorize(["2", "3", "4"]),
  async (req, res) => {
    try {
      const result = await courseUtils.addClassToCourse(
        req.params.courseId,
        req.user.id,
        req.body
      );
      res.json({
        code: 200,
        message: result.message,
        data: { classId: result.classId },
      });
    } catch (error) {
      res.status(400).json({ code: 400, message: error.message, data: null });
    }
  }
);

module.exports = router;
