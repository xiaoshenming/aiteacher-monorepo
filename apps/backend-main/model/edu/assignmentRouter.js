const express = require("express")
const db = require("../../config/db")
const authorize = require("../auth/authUtils")

const Router = express.Router()

// GET / — 教师获取自己的作业列表
Router.get("/", authorize(["2", "3", "4"]), (req, res) => {
  const teacherId = req.user.id
  const { page = 1, pageSize = 20, status } = req.query
  const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10)

  let whereSql = `FROM assignments a
    LEFT JOIN course c ON a.course_id = c.id
    LEFT JOIN class cl ON a.class_id = cl.id
    WHERE a.teacher_id = ?`
  const whereParams = [teacherId]

  if (status) {
    whereSql += ` AND a.status = ?`
    whereParams.push(status)
  }

  const countSql = `SELECT COUNT(*) AS total ${whereSql}`
  db.query(countSql, whereParams, (err, countResult) => {
    if (err) {
      return res.status(500).json({ code: 500, message: "数据库查询失败", error: err })
    }
    const total = countResult[0].total

    const listSql = `SELECT a.*, c.name AS course_name, cl.class_name ${whereSql} ORDER BY a.createTime DESC LIMIT ? OFFSET ?`
    db.query(listSql, [...whereParams, parseInt(pageSize, 10), offset], (err2, rows) => {
      if (err2) {
        return res.status(500).json({ code: 500, message: "数据库查询失败", error: err2 })
      }
      res.json({ code: 200, message: "查询成功", data: { list: rows, total } })
    })
  })
})

// GET /teacher/classes — 获取教师的班级列表（用于下拉选择）
Router.get("/teacher/classes", authorize(["2", "3", "4"]), (req, res) => {
  const teacherId = req.user.id

  const sql = `SELECT DISTINCT cl.id, cl.class_name
    FROM class cl
    INNER JOIN course_class cc ON cc.class_id = cl.id AND cc.teacher_id = ?
    WHERE cl.status = 1`

  db.query(sql, [teacherId], (err, results) => {
    if (err) {
      return res.status(500).json({ code: 500, message: "查询失败", error: err })
    }
    res.json({ code: 200, message: "查询成功", data: results })
  })
})

// GET /teacher/courses — 获取教师的课程列表（用于下拉选择）
Router.get("/teacher/courses", authorize(["2", "3", "4"]), (req, res) => {
  const teacherId = req.user.id

  const sql = `SELECT c.id, c.name
    FROM course c
    INNER JOIN teacher_course tc ON tc.course_id = c.id AND tc.teacher_id = ?
    WHERE tc.status = 1`

  db.query(sql, [teacherId], (err, results) => {
    if (err) {
      return res.status(500).json({ code: 500, message: "查询失败", error: err })
    }
    res.json({ code: 200, message: "查询成功", data: results })
  })
})

// GET /student/list — 学生获取自己的作业列表
Router.get("/student/list", authorize(["0", "1", "2", "3", "4"]), (req, res) => {
  const studentId = req.user.id
  const { page = 1, pageSize = 20 } = req.query
  const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10)

  const whereSql = `FROM assignments a
    INNER JOIN class_student cs ON cs.class_id = a.class_id AND cs.student_id = ?
    LEFT JOIN course c ON a.course_id = c.id
    LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = ?
    WHERE a.status IN ('published', 'closed')`
  const whereParams = [studentId, studentId]

  const countSql = `SELECT COUNT(*) AS total ${whereSql}`
  db.query(countSql, whereParams, (err, countResult) => {
    if (err) {
      return res.status(500).json({ code: 500, message: "数据库查询失败", error: err })
    }
    const total = countResult[0].total

    const listSql = `SELECT a.id, a.title, a.description, a.deadline, a.total_score, a.type,
      c.name AS course_name,
      COALESCE(s.status, 'pending') AS submission_status,
      s.score, s.feedback, s.submit_time
      ${whereSql} ORDER BY a.deadline DESC LIMIT ? OFFSET ?`
    db.query(listSql, [...whereParams, parseInt(pageSize, 10), offset], (err2, rows) => {
      if (err2) {
        return res.status(500).json({ code: 500, message: "数据库查询失败", error: err2 })
      }
      res.json({ code: 200, message: "查询成功", data: { list: rows, total } })
    })
  })
})

// POST / — 创建作业
Router.post("/", authorize(["2", "3", "4"]), (req, res) => {
  const teacherId = req.user.id
  const { title, description, course_id, class_id, type, deadline, total_score, status } = req.body

  if (!title) {
    return res.status(400).json({ code: 400, message: "作业标题不能为空", data: null })
  }

  const sql = `INSERT INTO assignments (teacher_id, title, description, course_id, class_id, type, deadline, total_score, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  const params = [
    teacherId, title, description || null,
    course_id || null, class_id || null,
    type || "homework", deadline || null,
    total_score || 100, status || "draft",
  ]

  db.query(sql, params, (err, result) => {
    if (err) {
      return res.status(500).json({ code: 500, message: "创建失败", error: err })
    }
    res.json({ code: 200, message: "创建成功", data: { id: result.insertId } })
  })
})

// POST /:id/publish — 发布作业
Router.post("/:id/publish", authorize(["2", "3", "4"]), (req, res) => {
  const { id } = req.params

  db.query(
    "UPDATE assignments SET status = 'published' WHERE id = ? AND teacher_id = ?",
    [id, req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ code: 500, message: "发布失败", error: err })
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ code: 404, message: "作业不存在或无权限", data: null })
      }
      res.json({ code: 200, message: "发布成功", data: null })
    }
  )
})

// POST /:id/close — 截止作业
Router.post("/:id/close", authorize(["2", "3", "4"]), (req, res) => {
  const { id } = req.params

  db.query(
    "UPDATE assignments SET status = 'closed' WHERE id = ? AND teacher_id = ?",
    [id, req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ code: 500, message: "操作失败", error: err })
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ code: 404, message: "作业不存在或无权限", data: null })
      }
      res.json({ code: 200, message: "已截止", data: null })
    }
  )
})

// POST /:id/submit — 学生提交作业
Router.post("/:id/submit", authorize(["0", "1", "2", "3", "4"]), (req, res) => {
  const { id } = req.params
  const studentId = req.user.id
  const { answers } = req.body

  const sql = `INSERT INTO assignment_submissions (assignment_id, student_id, answers, status, submit_time)
    VALUES (?, ?, ?, 'submitted', NOW())
    ON DUPLICATE KEY UPDATE answers = VALUES(answers), status = 'submitted', submit_time = NOW()`

  db.query(sql, [id, studentId, answers || null], (err) => {
    if (err) {
      return res.status(500).json({ code: 500, message: "提交失败", error: err })
    }
    res.json({ code: 200, message: "提交成功", data: null })
  })
})

// GET /:id — 获取作业详情（含提交统计）
Router.get("/:id", authorize(["2", "3", "4"]), (req, res) => {
  const { id } = req.params
  const teacherId = req.user.id

  const sql = `SELECT a.*, c.name AS course_name, cl.class_name
    FROM assignments a
    LEFT JOIN course c ON a.course_id = c.id
    LEFT JOIN class cl ON a.class_id = cl.id
    WHERE a.id = ? AND a.teacher_id = ?`

  db.query(sql, [id, teacherId], (err, results) => {
    if (err) {
      return res.status(500).json({ code: 500, message: "数据库查询失败", error: err })
    }
    if (results.length === 0) {
      return res.status(404).json({ code: 404, message: "作业不存在", data: null })
    }

    const assignment = results[0]

    const statsSql = `SELECT
      COUNT(*) AS total_submissions,
      SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS submitted_count,
      SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) AS graded_count
      FROM assignment_submissions WHERE assignment_id = ?`

    db.query(statsSql, [id], (err2, statsRows) => {
      if (err2) {
        return res.json({ code: 200, message: "查询成功", data: assignment })
      }
      assignment.stats = statsRows[0]
      res.json({ code: 200, message: "查询成功", data: assignment })
    })
  })
})

// PUT /:id — 更新作业
Router.put("/:id", authorize(["2", "3", "4"]), (req, res) => {
  const { id } = req.params
  const { title, description, course_id, class_id, type, deadline, total_score, status } = req.body

  const sql = `UPDATE assignments SET title = ?, description = ?, course_id = ?, class_id = ?, type = ?, deadline = ?, total_score = ?, status = ? WHERE id = ? AND teacher_id = ?`
  const params = [
    title, description || null,
    course_id || null, class_id || null,
    type || "homework", deadline || null,
    total_score || 100, status || "draft",
    id, req.user.id,
  ]

  db.query(sql, params, (err, result) => {
    if (err) {
      return res.status(500).json({ code: 500, message: "更新失败", error: err })
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: "作业不存在或无权限", data: null })
    }
    res.json({ code: 200, message: "更新成功", data: null })
  })
})

// DELETE /:id — 删除作业
Router.delete("/:id", authorize(["2", "3", "4"]), (req, res) => {
  const { id } = req.params
  const teacherId = req.user.id

  // Verify ownership first
  db.query("SELECT id FROM assignments WHERE id = ? AND teacher_id = ?", [id, teacherId], (err, rows) => {
    if (err) {
      return res.status(500).json({ code: 500, message: "删除失败", error: err })
    }
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: "作业不存在或无权限", data: null })
    }

    // Delete submissions then assignment
    db.query("DELETE FROM assignment_submissions WHERE assignment_id = ?", [id], (err2) => {
      if (err2) {
        return res.status(500).json({ code: 500, message: "删除失败", error: err2 })
      }

      db.query("DELETE FROM assignments WHERE id = ?", [id], (err3) => {
        if (err3) {
          return res.status(500).json({ code: 500, message: "删除失败", error: err3 })
        }
        res.json({ code: 200, message: "删除成功", data: null })
      })
    })
  })
})

module.exports = Router
