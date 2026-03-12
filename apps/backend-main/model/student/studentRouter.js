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
// 学情数据
router.get("/learning-stats", authorize(["0"]), async (req, res) => {
  try {
    const connection = db.promise();
    const [loginRows] = await connection.query(
      "SELECT sid FROM loginverification WHERE id = ?", [req.user.id]
    );
    if (loginRows.length === 0 || !loginRows[0].sid) {
      throw new Error("未找到学生信息");
    }
    const studentId = loginRows[0].sid;
    const lvId = req.user.id;

    // 学情统计（按科目）
    const [statsRows] = await connection.query(
      `SELECT subject, homework_accuracy, mastery_level, practice_count
       FROM student_learning_stats WHERE student_id = ?`, [studentId]
    );

    // 各科作业成绩（按课程分组取平均）
    const [scoreRows] = await connection.query(
      `SELECT c.name AS course_name, c.subject,
        ROUND(AVG(sub.score), 1) AS avg_score,
        COUNT(sub.id) AS graded_count
       FROM assignment_submissions sub
       JOIN assignments a ON sub.assignment_id = a.id
       LEFT JOIN course c ON a.course_id = c.id
       WHERE sub.student_id = ? AND sub.status = 'graded'
       GROUP BY a.course_id`, [lvId]
    );

    // 成绩趋势（按提交时间排序，最近20条）
    const [trendRows] = await connection.query(
      `SELECT a.title, sub.score, a.total_score, sub.grade_time, c.subject
       FROM assignment_submissions sub
       JOIN assignments a ON sub.assignment_id = a.id
       LEFT JOIN course c ON a.course_id = c.id
       WHERE sub.student_id = ? AND sub.status = 'graded'
       ORDER BY sub.grade_time ASC LIMIT 20`, [lvId]
    );

    // 各科作业完成情况
    const [completionRows] = await connection.query(
      `SELECT c.name AS course_name,
        COUNT(a.id) AS total,
        SUM(CASE WHEN sub.status IN ('submitted','graded') THEN 1 ELSE 0 END) AS completed
       FROM assignments a
       JOIN class_student cs ON a.class_id = cs.class_id AND cs.student_id = ?
       LEFT JOIN course c ON a.course_id = c.id
       LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
       WHERE a.status = 'published'
       GROUP BY a.course_id`, [lvId, lvId]
    );

    res.json({ code: 200, message: "获取成功", data: {
      subjects: statsRows,
      scores: scoreRows,
      trend: trendRows,
      completion: completionRows,
    }});
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 考试列表
router.get("/exams", authorize(["0"]), async (req, res) => {
  try {
    const connection = db.promise();
    const lvId = req.user.id;

    const [rows] = await connection.query(
      `SELECT a.id, a.title, a.description, a.deadline, a.total_score,
        a.status AS exam_status, c.name AS course_name, c.subject,
        COALESCE(sub.status, 'pending') AS submission_status,
        sub.score, sub.submit_time, sub.grade_time
       FROM assignments a
       JOIN class_student cs ON a.class_id = cs.class_id AND cs.student_id = ?
       LEFT JOIN course c ON a.course_id = c.id
       LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
       WHERE a.type = 'exam' AND a.status = 'published'
       ORDER BY a.deadline DESC`, [lvId, lvId]
    );

    res.json({ code: 200, message: "获取成功", data: { exams: rows } });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 学生课程表
router.get("/schedule", authorize(["0"]), async (req, res) => {
  try {
    const connection = db.promise();
    const lvId = req.user.id;

    const [rows] = await connection.query(
      `SELECT cc.schedule_day, cc.start_time, cc.end_time, cc.classroom,
        c.name AS course_name, c.subject, u.username AS teacher_name
       FROM class_student cs
       JOIN course_class cc ON cs.class_id = cc.class_id
       JOIN course c ON cc.course_id = c.id
       LEFT JOIN user u ON cc.teacher_id = u.id
       WHERE cs.student_id = ? AND cs.status = 1 AND cc.status = 1
       ORDER BY cc.schedule_day, cc.start_time`, [lvId]
    );

    res.json({ code: 200, message: "获取成功", data: { schedule: rows } });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 成绩查询
router.get("/grades", authorize(["0"]), async (req, res) => {
  try {
    const connection = db.promise();
    const lvId = req.user.id;

    // 详细成绩列表
    const [gradeRows] = await connection.query(
      `SELECT a.id, a.title, a.type, a.total_score, sub.score,
        sub.feedback, sub.grade_time, c.name AS course_name, c.subject
       FROM assignment_submissions sub
       JOIN assignments a ON sub.assignment_id = a.id
       LEFT JOIN course c ON a.course_id = c.id
       WHERE sub.student_id = ? AND sub.status = 'graded'
       ORDER BY sub.grade_time DESC`, [lvId]
    );

    // 按课程统计
    const [summaryRows] = await connection.query(
      `SELECT c.name AS course_name,
        ROUND(AVG(sub.score), 1) AS avg_score,
        MAX(sub.score) AS max_score,
        MIN(sub.score) AS min_score,
        COUNT(sub.id) AS count
       FROM assignment_submissions sub
       JOIN assignments a ON sub.assignment_id = a.id
       LEFT JOIN course c ON a.course_id = c.id
       WHERE sub.student_id = ? AND sub.status = 'graded'
       GROUP BY a.course_id`, [lvId]
    );

    res.json({ code: 200, message: "获取成功", data: {
      grades: gradeRows,
      summary: summaryRows,
    }});
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// 学生仪表盘统计
router.get("/dashboard-stats", authorize(["0"]), async (req, res) => {
  try {
    const connection = db.promise();
    const [loginRows] = await connection.query(
      "SELECT sid FROM loginverification WHERE id = ?", [req.user.id]
    );
    if (loginRows.length === 0 || !loginRows[0].sid) {
      throw new Error("未找到学生信息");
    }
    const lvId = req.user.id;

    // 课程数
    const [courseRows] = await connection.query(
      `SELECT COUNT(DISTINCT cc.course_id) AS count FROM class_student cs
       JOIN course_class cc ON cs.class_id = cc.class_id
       WHERE cs.student_id = ? AND cs.status = 1`, [lvId]
    );

    // 作业统计
    const [assignStats] = await connection.query(
      `SELECT COUNT(*) AS total,
        SUM(CASE WHEN sub.status IN ('submitted','graded') THEN 1 ELSE 0 END) AS completed
       FROM assignments a
       JOIN class_student cs ON a.class_id = cs.class_id AND cs.student_id = ?
       LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
       WHERE a.status = 'published'`, [lvId, lvId]
    );

    // 平均分
    const [avgRows] = await connection.query(
      `SELECT ROUND(AVG(score), 1) AS avg_score FROM assignment_submissions
       WHERE student_id = ? AND status = 'graded'`, [lvId]
    );

    // 近期作业（即将到期的5个）
    const [recentAssign] = await connection.query(
      `SELECT a.id, a.title, a.deadline, a.total_score, c.name AS course_name,
        COALESCE(sub.status, 'pending') AS submission_status
       FROM assignments a
       JOIN class_student cs ON a.class_id = cs.class_id AND cs.student_id = ?
       LEFT JOIN course c ON a.course_id = c.id
       LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
       WHERE a.status = 'published' AND (a.deadline IS NULL OR a.deadline >= NOW())
       ORDER BY a.deadline ASC LIMIT 5`, [lvId, lvId]
    );

    // 最近成绩（最近批改的5个）
    const [recentGrades] = await connection.query(
      `SELECT a.title, sub.score, a.total_score, sub.grade_time, c.name AS course_name
       FROM assignment_submissions sub
       JOIN assignments a ON sub.assignment_id = a.id
       LEFT JOIN course c ON a.course_id = c.id
       WHERE sub.student_id = ? AND sub.status = 'graded'
       ORDER BY sub.grade_time DESC LIMIT 5`, [lvId]
    );

    const total = assignStats[0].total || 0;
    const completed = assignStats[0].completed || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({ code: 200, message: "获取成功", data: {
      courseCount: courseRows[0].count,
      completionRate,
      avgScore: avgRows[0].avg_score || 0,
      recentAssignments: recentAssign,
      recentGrades,
    }});
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message, data: null });
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
