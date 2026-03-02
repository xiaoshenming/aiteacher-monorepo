const asyncHandler = require('../../utils/asyncHandler');
const db = require('../../config/db');

// GET /admin/system/stats → 匹配前端 SystemStats 类型
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const conn = db.promise();

  const [[userRow]] = await conn.query('SELECT COUNT(*) as c FROM user');
  const [[teacherRow]] = await conn.query("SELECT COUNT(*) as c FROM loginverification WHERE role='2'");
  const [[studentRow]] = await conn.query("SELECT COUNT(*) as c FROM loginverification WHERE role='0'");
  const [[courseRow]] = await conn.query('SELECT COUNT(*) as c FROM course');
  const [[planRow]] = await conn.query('SELECT COUNT(*) as c FROM lessonplans');
  const [[recordRow]] = await conn.query('SELECT COUNT(*) as c FROM course_recordings');

  let totalFiles = 0;
  try {
    const [[fileRow]] = await conn.query('SELECT COUNT(*) as c FROM file');
    totalFiles = fileRow.c;
  } catch {}

  let todayActiveUsers = 0;
  try {
    const [[activeRow]] = await conn.query(
      "SELECT COUNT(DISTINCT user_id) as c FROM ai_usage_stats WHERE call_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
    );
    todayActiveUsers = activeRow.c;
  } catch {}

  res.json({
    code: 200,
    message: 'ok',
    data: {
      totalUsers: userRow.c,
      totalTeachers: teacherRow.c,
      totalStudents: studentRow.c,
      totalCourses: courseRow.c,
      totalLessonPlans: planRow.c,
      totalFiles,
      totalRecordings: recordRow.c,
      todayActiveUsers,
    }
  });
});

// GET /admin/stats/extended → 扩展统计（AI 趋势、最近用户、AI 分布、学校统计）
exports.getExtendedStats = asyncHandler(async (req, res) => {
  const conn = db.promise();

  // 近 30 天 AI 调用趋势
  const [aiTrendRaw] = await conn.query(`
    SELECT DATE_FORMAT(call_date, '%Y-%m-%d') as date,
           CAST(SUM(call_count) AS UNSIGNED) as calls,
           CAST(SUM(token_consumed) AS UNSIGNED) as tokens
    FROM ai_usage_stats
    WHERE call_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY DATE_FORMAT(call_date, '%Y-%m-%d')
    ORDER BY date ASC
  `);
  const aiTrend = aiTrendRaw.map(r => ({ date: r.date, calls: Number(r.calls), tokens: Number(r.tokens) }));

  // 最近注册用户（前 8 名）
  const [recentUsers] = await conn.query(`
    SELECT u.id, u.username, lv.role, s.schoolName, u.avatar
    FROM user u
    LEFT JOIN loginverification lv ON lv.uid = u.id
    LEFT JOIN school s ON u.schoolId = s.id
    ORDER BY u.id DESC
    LIMIT 8
  `);

  // AI 功能分布
  const [aiByFunctionRaw] = await conn.query(`
    SELECT function_name as name, CAST(SUM(call_count) AS UNSIGNED) as value
    FROM ai_usage_stats
    GROUP BY function_name
    ORDER BY value DESC
  `);
  const aiByFunction = aiByFunctionRaw.map(r => ({ name: r.name, value: Number(r.value) }));

  // AI 模型分布
  const [aiByModelRaw] = await conn.query(`
    SELECT model_name as name, CAST(SUM(call_count) AS UNSIGNED) as calls, CAST(SUM(token_consumed) AS UNSIGNED) as tokens
    FROM ai_usage_stats
    GROUP BY model_name
    ORDER BY calls DESC
  `);
  const aiByModel = aiByModelRaw.map(r => ({ name: r.name, calls: Number(r.calls), tokens: Number(r.tokens) }));

  // 总 token 消耗、总 AI 调用数
  let totalAiCalls = 0, totalTokens = 0;
  try {
    const [[sumRow]] = await conn.query(
      'SELECT SUM(call_count) as calls, SUM(token_consumed) as tokens FROM ai_usage_stats'
    );
    totalAiCalls = Number(sumRow.calls) || 0;
    totalTokens = Number(sumRow.tokens) || 0;
  } catch {}

  // 学校用户分布
  const [schoolStats] = await conn.query(`
    SELECT s.schoolName, COUNT(u.id) as userCount
    FROM school s
    LEFT JOIN user u ON u.schoolId = s.id
    GROUP BY s.id, s.schoolName
    ORDER BY userCount DESC
    LIMIT 10
  `);

  // 各角色分布
  const [roleStats] = await conn.query(`
    SELECT role, COUNT(*) as count
    FROM loginverification
    GROUP BY role
    ORDER BY role ASC
  `);

  res.json({
    code: 200,
    data: {
      aiTrend,
      recentUsers,
      aiByFunction,
      aiByModel,
      totalAiCalls,
      totalTokens,
      schoolStats,
      roleStats,
    }
  });
});
