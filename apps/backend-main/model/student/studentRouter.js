const express = require("express");
const router = express.Router();
const studentUtils = require("./studentUtils");
const authorize = require("../auth/authUtils");
const db = require("../../config/db");

// 学生登录.被user复用故废弃
// router.post("/login", async (req, res) => {
//   try {
//     const result = await studentUtils.loginStudent(req.body);
//     res.json({ code: 200, message: "登录成功", data: result });
//   } catch (error) {
//     res.status(400).json({ code: 400, message: error.message, data: null });
//   }
// });

// 注册学生账号
router.post("/register", async (req, res) => {
  try {
    const result = await studentUtils.registerStudent(req.body);
    res.status(201).json({ code: 201, message: result.message, data: null });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message, data: null });
  }
});

// 学生退出登录.被user复用故废弃
// router.post("/logout", authorize(["0"]), async (req, res) => {
//   try {
//     await studentUtils.logoutStudent(req.user.id, req.user.device);
//     res.json({ code: 200, message: "退出登录成功", data: null });
//   } catch (error) {
//     res.status(500).json({ code: 500, message: error.message, data: null });
//   }
// });

// 获取学生课程
router.get("/courses", authorize(["0"]), async (req, res) => {
  try {
    // 从登录验证记录中查找学生ID
    const connection = db.promise();
    const [loginRows] = await connection.query(
      "SELECT sid FROM loginverification WHERE id = ?",
      [req.user.id]
    );

    if (loginRows.length === 0 || !loginRows[0].sid) {
      throw new Error("未找到学生信息");
    }

    const studentId = loginRows[0].sid;
    const courses = await studentUtils.getStudentCourses(studentId);
    res.json({ code: 200, message: "获取课程列表成功", data: { courses } });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取学生班级
router.get("/classes", authorize(["0"]), async (req, res) => {
  try {
    // 从登录验证记录中查找学生ID
    const connection = db.promise();
    const [loginRows] = await connection.query(
      "SELECT sid FROM loginverification WHERE id = ?",
      [req.user.id]
    );

    if (loginRows.length === 0 || !loginRows[0].sid) {
      throw new Error("未找到学生信息");
    }

    const studentId = loginRows[0].sid;
    const classes = await studentUtils.getStudentClasses(studentId);
    res.json({ code: 200, message: "获取班级列表成功", data: { classes } });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 获取学生个人信息,比user详细，保留
router.get("/profile", authorize(["0"]), async (req, res) => {
  try {
    // 从登录验证记录中查找学生ID
    const connection = db.promise();
    const [loginRows] = await connection.query(
      "SELECT sid FROM loginverification WHERE id = ?",
      [req.user.id]
    );

    if (loginRows.length === 0 || !loginRows[0].sid) {
      throw new Error("未找到学生信息");
    }

    const studentId = loginRows[0].sid;
    const profile = await studentUtils.getStudentProfile(studentId);
    res.json({ code: 200, message: "获取个人信息成功", data: profile });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 更新学生个人信息
router.put("/profile", authorize(["0"]), async (req, res) => {
  try {
    // 从登录验证记录中查找学生ID
    const connection = db.promise();
    const [loginRows] = await connection.query(
      "SELECT sid FROM loginverification WHERE id = ?",
      [req.user.id]
    );

    if (loginRows.length === 0 || !loginRows[0].sid) {
      throw new Error("未找到学生信息");
    }

    const studentId = loginRows[0].sid;
    const result = await studentUtils.updateStudentProfile(studentId, req.body);
    res.json({ code: 200, message: result.message, data: null });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message, data: null });
  }
});
// 搜索学生
router.get("/search", authorize(["1", "2"]), async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ code: 400, message: "搜索参数不能为空", data: null });
    }
    
    const students = await studentUtils.searchStudents(query);
    res.json({ code: 200, message: "搜索成功", data: { students } });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});
module.exports = router;
