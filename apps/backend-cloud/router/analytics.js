// router/analytics.js - 数据分析API路由
const express = require("express");
const router = express.Router();
const db = require("../utils/db");

// ==================== 教师备课效率分析 ====================

/**
 * 记录教师备课统计
 * POST /analytics/teacher/prepare
 */
router.post("/teacher/prepare", async (req, res) => {
  try {
    const { teacher_id, prepare_duration, generate_count, template_used, subject, grade } = req.body;
    const prepare_date = new Date().toISOString().split('T')[0];
    
    const sql = `INSERT INTO teacher_prepare_stats 
      (teacher_id, prepare_date, prepare_duration, generate_count, template_used, subject, grade) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    await db.execute(sql, [teacher_id, prepare_date, prepare_duration || 0, generate_count || 1, template_used, subject, grade]);
    
    res.json({ code: 200, message: "备课统计记录成功" });
  } catch (error) {
    console.error("记录备课统计失败:", error);
    res.status(500).json({ code: 500, message: "记录备课统计失败" });
  }
});

/**
 * 获取教师备课统计数据
 * GET /analytics/teacher/prepare/:teacherId
 */
router.get("/teacher/prepare/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { startDate, endDate, subject } = req.query;
    
    let sql = `SELECT 
      DATE_FORMAT(prepare_date, '%Y-%m-%d') as date,
      SUM(prepare_duration) as total_duration,
      SUM(generate_count) as total_generates,
      COUNT(DISTINCT template_used) as template_variety,
      subject,
      grade
    FROM teacher_prepare_stats 
    WHERE teacher_id = ?`;
    
    const params = [teacherId];
    
    if (startDate && endDate) {
      sql += ` AND prepare_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    if (subject) {
      sql += ` AND subject = ?`;
      params.push(subject);
    }
    
    sql += ` GROUP BY prepare_date, subject, grade ORDER BY prepare_date DESC`;
    
    const [rows] = await db.execute(sql, params);
    
    // 计算汇总数据
    const summary = {
      total_duration: rows.reduce((sum, row) => sum + (parseInt(row.total_duration) || 0), 0),
      total_generates: rows.reduce((sum, row) => sum + (parseInt(row.total_generates) || 0), 0),
      avg_duration_per_day: rows.length > 0 ? Math.round(rows.reduce((sum, row) => sum + (parseInt(row.total_duration) || 0), 0) / rows.length) : 0,
      active_days: rows.length
    };
    
    res.json({ code: 200, data: { details: rows, summary } });
  } catch (error) {
    console.error("获取备课统计失败:", error);
    res.status(500).json({ code: 500, message: "获取备课统计失败" });
  }
});

// ==================== 学生学习效果追踪 ====================

/**
 * 记录/更新学生学习统计
 * POST /analytics/student/learning
 */
router.post("/student/learning", async (req, res) => {
  try {
    const { student_id, subject, knowledge_point, homework_accuracy, mastery_level, practice_count } = req.body;
    const last_practice_date = new Date().toISOString().split('T')[0];
    
    // 检查是否已存在记录
    const checkSql = `SELECT id FROM student_learning_stats 
      WHERE student_id = ? AND subject = ? AND knowledge_point = ?`;
    const [existing] = await db.execute(checkSql, [student_id, subject, knowledge_point]);
    
    if (existing.length > 0) {
      // 更新记录
      const updateSql = `UPDATE student_learning_stats 
        SET homework_accuracy = ?, mastery_level = ?, practice_count = practice_count + ?, last_practice_date = ?
        WHERE id = ?`;
      await db.execute(updateSql, [homework_accuracy, mastery_level, practice_count || 1, last_practice_date, existing[0].id]);
    } else {
      // 插入新记录
      const insertSql = `INSERT INTO student_learning_stats 
        (student_id, subject, knowledge_point, homework_accuracy, mastery_level, practice_count, last_practice_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`;
      await db.execute(insertSql, [student_id, subject, knowledge_point, homework_accuracy, mastery_level, practice_count || 1, last_practice_date]);
    }
    
    res.json({ code: 200, message: "学习统计记录成功" });
  } catch (error) {
    console.error("记录学习统计失败:", error);
    res.status(500).json({ code: 500, message: "记录学习统计失败" });
  }
});

/**
 * 获取学生学习统计数据
 * GET /analytics/student/learning/:studentId
 */
router.get("/student/learning/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subject } = req.query;
    
    let sql = `SELECT * FROM student_learning_stats WHERE student_id = ?`;
    const params = [studentId];
    
    if (subject) {
      sql += ` AND subject = ?`;
      params.push(subject);
    }
    
    sql += ` ORDER BY last_practice_date DESC`;
    
    const [rows] = await db.execute(sql, params);
    
    // 计算汇总数据
    const summary = {
      avg_accuracy: rows.length > 0 ? (rows.reduce((sum, row) => sum + parseFloat(row.homework_accuracy || 0), 0) / rows.length).toFixed(2) : 0,
      mastered_count: rows.filter(row => row.mastery_level === '完全掌握').length,
      weak_points: rows.filter(row => row.mastery_level === '未掌握' || row.mastery_level === '部分掌握').map(row => row.knowledge_point)
    };
    
    res.json({ code: 200, data: { details: rows, summary } });
  } catch (error) {
    console.error("获取学习统计失败:", error);
    res.status(500).json({ code: 500, message: "获取学习统计失败" });
  }
});

// ==================== AI使用统计 ====================

/**
 * 记录AI使用统计
 * POST /analytics/ai/usage
 */
router.post("/ai/usage", async (req, res) => {
  try {
    const { user_id, user_type, model_name, function_name, token_consumed } = req.body;
    const call_date = new Date().toISOString().split('T')[0];
    
    // 检查今天是否已有该用户、模型、功能的记录
    const checkSql = `SELECT id, call_count, token_consumed FROM ai_usage_stats 
      WHERE user_id = ? AND model_name = ? AND function_name = ? AND call_date = ?`;
    const [existing] = await db.execute(checkSql, [user_id, model_name, function_name, call_date]);
    
    if (existing.length > 0) {
      // 更新记录
      const updateSql = `UPDATE ai_usage_stats 
        SET call_count = call_count + 1, token_consumed = token_consumed + ?
        WHERE id = ?`;
      await db.execute(updateSql, [token_consumed || 0, existing[0].id]);
    } else {
      // 插入新记录
      const insertSql = `INSERT INTO ai_usage_stats 
        (user_id, user_type, model_name, function_name, call_count, token_consumed, call_date) 
        VALUES (?, ?, ?, ?, 1, ?, ?)`;
      await db.execute(insertSql, [user_id, user_type, model_name, function_name, token_consumed || 0, call_date]);
    }
    
    res.json({ code: 200, message: "AI使用统计记录成功" });
  } catch (error) {
    console.error("记录AI使用统计失败:", error);
    res.status(500).json({ code: 500, message: "记录AI使用统计失败" });
  }
});

/**
 * 获取AI使用统计数据
 * GET /analytics/ai/usage/:userId
 */
router.get("/ai/usage/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, model_name } = req.query;
    
    let sql = `SELECT 
      model_name,
      function_name,
      SUM(call_count) as total_calls,
      SUM(token_consumed) as total_tokens,
      DATE_FORMAT(call_date, '%Y-%m-%d') as date
    FROM ai_usage_stats 
    WHERE user_id = ?`;
    
    const params = [userId];
    
    if (startDate && endDate) {
      sql += ` AND call_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    if (model_name) {
      sql += ` AND model_name = ?`;
      params.push(model_name);
    }
    
    sql += ` GROUP BY model_name, function_name, call_date ORDER BY call_date DESC`;
    
    const [rows] = await db.execute(sql, params);
    
    // 计算汇总数据
    const summary = {
      total_calls: rows.reduce((sum, row) => sum + (parseInt(row.total_calls) || 0), 0),
      total_tokens: rows.reduce((sum, row) => sum + (parseInt(row.total_tokens) || 0), 0),
      most_used_model: getMostFrequent(rows.map(row => row.model_name)),
      most_used_function: getMostFrequent(rows.map(row => row.function_name))
    };
    
    res.json({ code: 200, data: { details: rows, summary } });
  } catch (error) {
    console.error("获取AI使用统计失败:", error);
    res.status(500).json({ code: 500, message: "获取AI使用统计失败" });
  }
});

/**
 * 获取全局AI使用热门功能统计
 * GET /analytics/ai/popular
 */
router.get("/ai/popular", async (req, res) => {
  try {
    const sql = `SELECT 
      function_name,
      model_name,
      SUM(call_count) as total_calls,
      COUNT(DISTINCT user_id) as unique_users
    FROM ai_usage_stats 
    WHERE call_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY function_name, model_name 
    ORDER BY total_calls DESC 
    LIMIT 10`;
    
    const [rows] = await db.execute(sql);
    res.json({ code: 200, data: rows });
  } catch (error) {
    console.error("获取热门功能失败:", error);
    res.status(500).json({ code: 500, message: "获取热门功能失败" });
  }
});

// ==================== 智能推荐 ====================

/**
 * 记录推荐结果
 * POST /analytics/recommendation
 */
router.post("/recommendation", async (req, res) => {
  try {
    const { user_id, recommendation_type, recommended_item_id, recommended_item_title, similarity_score } = req.body;
    
    const sql = `INSERT INTO recommendation_records 
      (user_id, recommendation_type, recommended_item_id, recommended_item_title, similarity_score) 
      VALUES (?, ?, ?, ?, ?)`;
    
    await db.execute(sql, [user_id, recommendation_type, recommended_item_id, recommended_item_title, similarity_score || 0]);
    
    res.json({ code: 200, message: "推荐记录成功" });
  } catch (error) {
    console.error("记录推荐失败:", error);
    res.status(500).json({ code: 500, message: "记录推荐失败" });
  }
});

/**
 * 更新推荐互动状态（点击/使用）
 * PUT /analytics/recommendation/:id
 */
router.put("/recommendation/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { is_clicked, is_used } = req.body;
    
    let sql = `UPDATE recommendation_records SET `;
    const updates = [];
    const params = [];
    
    if (is_clicked !== undefined) {
      updates.push('is_clicked = ?');
      params.push(is_clicked ? 1 : 0);
    }
    
    if (is_used !== undefined) {
      updates.push('is_used = ?');
      params.push(is_used ? 1 : 0);
    }
    
    sql += updates.join(', ') + ' WHERE id = ?';
    params.push(id);
    
    await db.execute(sql, params);
    res.json({ code: 200, message: "推荐状态更新成功" });
  } catch (error) {
    console.error("更新推荐状态失败:", error);
    res.status(500).json({ code: 500, message: "更新推荐状态失败" });
  }
});

/**
 * 获取智能推荐（基于历史相似教案）
 * GET /analytics/recommendation/lessons/:userId
 */
router.get("/recommendation/lessons/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 5 } = req.query;
    
    // 这里简化处理，实际可以基于用户历史行为、标签等进行智能推荐
    // 示例：推荐其他教师最近创建的高质量教案
    const limitNum = parseInt(limit) || 5;
    const sql = `SELECT 
      id as recommended_item_id,
      '示例教案' as recommended_item_title,
      'lesson_plan' as recommendation_type,
      RAND() * 100 as similarity_score
    FROM teacher_prepare_stats 
    WHERE teacher_id != ? 
    ORDER BY created_at DESC 
    LIMIT ${limitNum}`;
    
    const [rows] = await db.execute(sql, [userId]);
    
    // 记录推荐结果
    for (const row of rows) {
      const insertSql = `INSERT INTO recommendation_records 
        (user_id, recommendation_type, recommended_item_id, recommended_item_title, similarity_score) 
        VALUES (?, ?, ?, ?, ?)`;
      await db.execute(insertSql, [userId, row.recommendation_type, row.recommended_item_id, row.recommended_item_title, row.similarity_score]);
    }
    
    res.json({ code: 200, data: rows });
  } catch (error) {
    console.error("获取智能推荐失败:", error);
    res.status(500).json({ code: 500, message: "获取智能推荐失败" });
  }
});

/**
 * 获取推荐效果统计
 * GET /analytics/recommendation/stats/:userId
 */
router.get("/recommendation/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const sql = `SELECT 
      recommendation_type,
      COUNT(*) as total_recommendations,
      SUM(is_clicked) as clicked_count,
      SUM(is_used) as used_count,
      ROUND(SUM(is_clicked) * 100.0 / COUNT(*), 2) as click_rate,
      ROUND(SUM(is_used) * 100.0 / COUNT(*), 2) as use_rate
    FROM recommendation_records 
    WHERE user_id = ?
    GROUP BY recommendation_type`;
    
    const [rows] = await db.execute(sql, [userId]);
    res.json({ code: 200, data: rows });
  } catch (error) {
    console.error("获取推荐统计失败:", error);
    res.status(500).json({ code: 500, message: "获取推荐统计失败" });
  }
});

// ==================== 综合数据看板 ====================

/**
 * 获取综合数据看板
 * GET /analytics/dashboard/:userId
 */
router.get("/dashboard/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType = 'teacher' } = req.query;
    
    const dashboard = {};
    
    if (userType === 'teacher') {
      // 教师看板：备课统计 + AI使用
      const [prepareStats] = await db.execute(
        `SELECT 
          COUNT(*) as total_sessions,
          SUM(prepare_duration) as total_minutes,
          SUM(generate_count) as total_generates
        FROM teacher_prepare_stats 
        WHERE teacher_id = ? AND prepare_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
        [userId]
      );
      dashboard.prepare = prepareStats[0];
    } else if (userType === 'student') {
      // 学生看板：学习统计
      const [learningStats] = await db.execute(
        `SELECT 
          COUNT(*) as total_knowledge_points,
          AVG(homework_accuracy) as avg_accuracy,
          SUM(practice_count) as total_practices
        FROM student_learning_stats 
        WHERE student_id = ?`,
        [userId]
      );
      dashboard.learning = learningStats[0];
    }
    
    // AI使用统计（通用）
    const [aiStats] = await db.execute(
      `SELECT 
        SUM(call_count) as total_calls,
        SUM(token_consumed) as total_tokens
      FROM ai_usage_stats 
      WHERE user_id = ? AND call_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [userId]
    );
    dashboard.ai = aiStats[0];
    
    res.json({ code: 200, data: dashboard });
  } catch (error) {
    console.error("获取数据看板失败:", error);
    res.status(500).json({ code: 500, message: "获取数据看板失败" });
  }
});

// ==================== 工具函数 ====================

function getMostFrequent(arr) {
  if (arr.length === 0) return null;
  const frequency = {};
  let maxCount = 0;
  let mostFrequent = null;
  
  arr.forEach(item => {
    frequency[item] = (frequency[item] || 0) + 1;
    if (frequency[item] > maxCount) {
      maxCount = frequency[item];
      mostFrequent = item;
    }
  });
  
  return mostFrequent;
}

module.exports = router;
