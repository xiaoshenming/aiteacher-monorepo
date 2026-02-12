const express = require("express");
const db = require("../../config/db");
const authorize = require("../auth/authUtils");

const router = express.Router();

/**
 * GET /api/question-bank
 * 分页获取当前教师的题库列表，支持筛选
 */
router.get("/", authorize(["2", "3", "4"]), (req, res) => {
  const userId = req.user.id;
  const { page = 1, pageSize = 20, subject, type, difficulty, keyword } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  let sql = "SELECT * FROM question WHERE userId = ? AND isDelete = 0";
  const params = [userId];

  if (subject) {
    sql += " AND subject = ?";
    params.push(subject);
  }
  if (type) {
    sql += " AND type = ?";
    params.push(type);
  }
  if (difficulty) {
    sql += " AND difficulty = ?";
    params.push(difficulty);
  }
  if (keyword) {
    sql += " AND (content LIKE ? OR title LIKE ?)";
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  sql += " ORDER BY id DESC";

  // Count total first
  const countSql = sql.replace("SELECT *", "SELECT COUNT(*) AS total");
  db.query(countSql, params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ code: 500, message: "数据库查询失败", data: null });
    }
    const total = countResult[0].total;

    sql += " LIMIT ? OFFSET ?";
    params.push(parseInt(pageSize), offset);

    db.query(sql, params, (err2, results) => {
      if (err2) {
        return res.status(500).json({ code: 500, message: "数据库查询失败", data: null });
      }
      // Parse options JSON for each row
      const list = results.map((row) => {
        let options = row.options;
        if (typeof options === "string") {
          try { options = JSON.parse(options); } catch { options = null; }
        }
        return { ...row, options };
      });
      res.json({ code: 200, message: "查询成功", data: { list, total } });
    });
  });
});

/**
 * GET /api/question-bank/stats
 * 获取题库统计信息
 */
router.get("/stats", authorize(["2", "3", "4"]), (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT
      COUNT(*) AS total,
      SUM(type = '选择题') AS single_choice,
      SUM(type = '填空题') AS fill_blank,
      SUM(type = '判断题') AS true_false,
      SUM(type = '简答题') AS short_answer,
      SUM(type = '计算题') AS calculation
    FROM question WHERE userId = ? AND isDelete = 0
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ code: 500, message: "数据库查询失败", data: null });
    }
    res.json({ code: 200, message: "查询成功", data: results[0] });
  });
});

/**
 * POST /api/question-bank
 * 批量添加题目到题库
 */
router.post("/", authorize(["2", "3", "4"]), (req, res) => {
  const userId = req.user.id;
  const { questions } = req.body;

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ code: 400, message: "题目列表不能为空", data: null });
  }

  const values = questions.map((q) => [
    q.title || q.content?.substring(0, 100) || "",
    q.subject || "",
    q.type || "选择题",
    q.difficulty || "中等",
    q.content || "",
    q.options ? JSON.stringify(q.options) : null,
    q.tags || null,
    q.answer || "",
    q.explanation || "",
    userId,
    new Date(),
  ]);

  const sql =
    "INSERT INTO question (title, subject, type, difficulty, content, options, tags, answer, explanation, userId, createTime) VALUES ?";

  db.query(sql, [values], (err, result) => {
    if (err) {
      return res.status(500).json({ code: 500, message: "数据库插入失败", data: null });
    }
    res.json({
      code: 200,
      message: `成功添加 ${result.affectedRows} 道题目`,
      data: { count: result.affectedRows, insertId: result.insertId },
    });
  });
});

/**
 * PUT /api/question-bank/:id
 * 更新题目
 */
router.put("/:id", authorize(["2", "3", "4"]), (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, subject, type, difficulty, content, options, answer, explanation, tags } = req.body;

  const sql = `UPDATE question SET title = ?, subject = ?, type = ?, difficulty = ?, content = ?, options = ?, answer = ?, explanation = ?, tags = ?, updateTime = ? WHERE id = ? AND userId = ? AND isDelete = 0`;
  const params = [
    title || content?.substring(0, 100) || "",
    subject || "",
    type || "选择题",
    difficulty || "中等",
    content || "",
    options ? JSON.stringify(options) : null,
    answer || "",
    explanation || "",
    tags || null,
    new Date(),
    id,
    userId,
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      return res.status(500).json({ code: 500, message: "数据库更新失败", data: null });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: "题目不存在或无权修改", data: null });
    }
    res.json({ code: 200, message: "更新成功", data: null });
  });
});

/**
 * DELETE /api/question-bank/:id
 * 软删除题目
 */
router.delete("/:id", authorize(["2", "3", "4"]), (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const sql = "UPDATE question SET isDelete = 1, updateTime = ? WHERE id = ? AND userId = ? AND isDelete = 0";
  db.query(sql, [new Date(), id, userId], (err, result) => {
    if (err) {
      return res.status(500).json({ code: 500, message: "数据库删除失败", data: null });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: "题目不存在或无权删除", data: null });
    }
    res.json({ code: 200, message: "删除成功", data: null });
  });
});

module.exports = router;
