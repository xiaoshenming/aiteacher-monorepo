const express = require("express")
const db = require("../../config/db")
const authorize = require("../auth/authUtils")
const logger = require("../../utils/logger")

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
    const { questions } = req.body
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const values = questions.map((q, i) => [
        result.insertId, q.question_id, q.sort_order ?? i, q.score ?? 10
      ])
      db.query(
        `INSERT INTO assignment_questions (assignment_id, question_id, sort_order, score) VALUES ?`,
        [values],
        (err3) => {
          if (err3) {
            return res.status(500).json({ code: 500, message: "关联题目失败", error: err3 })
          }
          res.json({ code: 200, message: "创建成功", data: { id: result.insertId } })
        }
      )
    } else {
      res.json({ code: 200, message: "创建成功", data: { id: result.insertId } })
    }
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
      if (!err2) {
        assignment.stats = statsRows[0]
      }
      // 查询关联题目
      db.query(
        `SELECT aq.*, q.title, q.type, q.difficulty, q.content, q.options, q.answer, q.explanation
         FROM assignment_questions aq
         LEFT JOIN question q ON aq.question_id = q.id
         WHERE aq.assignment_id = ?
         ORDER BY aq.sort_order`,
        [id],
        (err3, questions) => {
          assignment.questions = err3 ? [] : questions
          res.json({ code: 200, message: "查询成功", data: assignment })
        }
      )
    })
  })
})

// GET /:id/questions — 获取作业关联的题目列表
Router.get("/:id/questions", authorize(["0","1","2","3","4"]), (req, res) => {
  db.query(
    `SELECT aq.id, aq.question_id, aq.sort_order, aq.score,
            q.title, q.type, q.difficulty, q.content, q.options, q.answer, q.explanation
     FROM assignment_questions aq
     LEFT JOIN question q ON aq.question_id = q.id
     WHERE aq.assignment_id = ?
     ORDER BY aq.sort_order`,
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ code: 500, message: "查询失败" })
      res.json({ code: 200, message: "查询成功", data: results })
    }
  )
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
    const { questions } = req.body
    if (questions && Array.isArray(questions)) {
      db.query(`DELETE FROM assignment_questions WHERE assignment_id = ?`, [req.params.id], (delErr) => {
        if (delErr) return res.status(500).json({ code: 500, message: "更新题目关联失败" })
        if (questions.length === 0) {
          return res.json({ code: 200, message: "更新成功" })
        }
        const values = questions.map((q, i) => [
          parseInt(req.params.id), q.question_id, q.sort_order ?? i, q.score ?? 10
        ])
        db.query(
          `INSERT INTO assignment_questions (assignment_id, question_id, sort_order, score) VALUES ?`,
          [values],
          (insErr) => {
            if (insErr) return res.status(500).json({ code: 500, message: "关联题目失败" })
            res.json({ code: 200, message: "更新成功" })
          }
        )
      })
    } else {
      res.json({ code: 200, message: "更新成功" })
    }
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

// ========== 批改与反馈端点 ==========
const assignmentUtils = require("./assignmentUtils")

// GET /:id/submissions — 教师获取提交列表
Router.get("/:id/submissions", authorize(["2","3","4"]), async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const data = await assignmentUtils.getSubmissions(req.params.id, parseInt(page), parseInt(pageSize))
    res.json({ code: 200, message: "查询成功", data })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败" })
  }
})

// GET /:id/submissions/:sid — 获取单个提交详情
Router.get("/:id/submissions/:sid", authorize(["2","3","4"]), async (req, res) => {
  try {
    const data = await assignmentUtils.getSubmissionDetail(req.params.id, req.params.sid)
    if (!data) return res.status(404).json({ code: 404, message: "提交不存在" })
    res.json({ code: 200, message: "查询成功", data })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败" })
  }
})

// POST /:id/auto-grade — 自动批改客观题
Router.post("/:id/auto-grade", authorize(["2","3","4"]), async (req, res) => {
  try {
    const result = await assignmentUtils.autoGradeObjective(req.params.id)
    res.json({ code: 200, message: "自动批改完成", data: result })
  } catch (err) {
    res.status(500).json({ code: 500, message: "自动批改失败" })
  }
})

// POST /:id/ai-grade — AI 辅助批改主观题（SSE 流式）
Router.post("/:id/ai-grade", authorize(["2","3","4"]), async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")

  try {
    const questions = await assignmentUtils.dbQuery(
      `SELECT aq.*, q.title, q.type, q.content, q.answer AS standard_answer, q.explanation
       FROM assignment_questions aq
       LEFT JOIN question q ON aq.question_id = q.id
       WHERE aq.assignment_id = ? AND q.type IN ('short_answer','essay','calculation')`,
      [req.params.id]
    )
    const submissions = await assignmentUtils.dbQuery(
      `SELECT * FROM assignment_submissions WHERE assignment_id = ? AND status IN ('submitted','auto_graded')`,
      [req.params.id]
    )

    for (const sub of submissions) {
      let answers = []
      try { answers = JSON.parse(sub.answers)?.question_answers || [] } catch (e) { continue }

      const aiScores = []
      for (const q of questions) {
        const sa = answers.find((a) => a.question_id === q.question_id)
        if (!sa) continue

        const prompt = `你是一位严格的教师，请评估学生的答案。
题目：${q.content || q.title}
标准答案：${q.standard_answer || "无"}
学生答案：${sa.answer}
满分：${q.score}分

请以 JSON 格式返回评分：{"score": 数字, "feedback": "评语"}`

        try {
          const OpenAI = require("openai")
          const client = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
          })
          const completion = await client.chat.completions.create({
            model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
          })

          let aiResult = { score: 0, feedback: "AI 评分失败" }
          try {
            const content = completion.choices[0].message.content
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) aiResult = JSON.parse(jsonMatch[0])
          } catch (e) { /* parse error, use default */ }

          aiScores.push({ question_id: q.question_id, score: aiResult.score, max: q.score, feedback: aiResult.feedback })
          res.write(`data: ${JSON.stringify({ type: "progress", submission_id: sub.id, question_id: q.question_id, result: aiResult })}\n\n`)
        } catch (aiErr) {
          logger.error("AI 批改失败:", aiErr)
        }
      }

      if (aiScores.length > 0) {
        await assignmentUtils.dbQuery(
          `UPDATE assignment_submissions SET ai_scores = ?, status = 'ai_graded' WHERE id = ?`,
          [JSON.stringify(aiScores), sub.id]
        )
      }
      res.write(`data: ${JSON.stringify({ type: "submission_done", submission_id: sub.id, ai_scores: aiScores })}\n\n`)
    }

    res.write(`data: ${JSON.stringify({ type: "complete" })}\n\n`)
    res.end()
  } catch (err) {
    logger.error("AI 批改失败:", err)
    res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`)
    res.end()
  }
})

// PUT /:id/submissions/:sid/grade — 教师手动批改
Router.put("/:id/submissions/:sid/grade", authorize(["2","3","4"]), async (req, res) => {
  try {
    const { score, feedback, detail_scores } = req.body
    await assignmentUtils.manualGrade(req.params.sid, score, feedback, detail_scores)
    res.json({ code: 200, message: "批改成功" })
  } catch (err) {
    res.status(500).json({ code: 500, message: "批改失败" })
  }
})

// POST /:id/batch-grade — 批量确认 AI 建议
Router.post("/:id/batch-grade", authorize(["2","3","4"]), async (req, res) => {
  try {
    const { submission_ids } = req.body
    const result = await assignmentUtils.batchConfirmGrades(req.params.id, submission_ids)
    res.json({ code: 200, message: "批量确认完成", data: result })
  } catch (err) {
    res.status(500).json({ code: 500, message: "批量确认失败" })
  }
})

// GET /:id/grade-summary — 批改统计
Router.get("/:id/grade-summary", authorize(["2","3","4"]), async (req, res) => {
  try {
    const data = await assignmentUtils.getGradeSummary(req.params.id)
    res.json({ code: 200, message: "查询成功", data })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败" })
  }
})

module.exports = Router
