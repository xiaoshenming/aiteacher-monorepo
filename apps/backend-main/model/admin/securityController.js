const db = require("../../config/db");
const redis = require("../../config/redis");

// 安全概览
async function getSecurityOverview(req, res) {
  try {
    // 总用户数
    const [userResult] = await db.promise().query("SELECT COUNT(*) as count FROM user");

    // 今日新注册
    let todayRegistered = 0;
    try {
      const [regResult] = await db.promise().query(
        "SELECT COUNT(*) as count FROM user WHERE createTime >= CURDATE()"
      );
      todayRegistered = regResult[0].count;
    } catch {}

    // 活跃会话数（从 Redis 扫描）
    let activeSessions = 0;
    try {
      const keys = await redis.keys("sess:*");
      activeSessions = keys.length;
      if (activeSessions === 0) {
        const tokenKeys = await redis.keys("token:*");
        activeSessions = tokenKeys.length;
      }
      if (activeSessions === 0) {
        // fallback: 用 user 表最近24小时登录过的用户数估算
        const [activeResult] = await db.promise().query(
          "SELECT COUNT(*) as count FROM user WHERE lastLoginTime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)"
        );
        activeSessions = activeResult[0].count;
      }
    } catch {}

    // 待审核认证申请
    let pendingAuth = 0;
    try {
      const [authResult] = await db.promise().query(
        "SELECT COUNT(*) as count FROM authentication_requests WHERE status = 0"
      );
      pendingAuth = authResult[0].count;
    } catch {}

    // 系统运行天数
    const uptimeDays = Math.floor(require("os").uptime() / 86400);

    res.json({
      code: 200,
      data: {
        totalUsers: userResult[0].count,
        todayRegistered,
        activeSessions,
        pendingAuth,
        uptimeDays,
      },
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
}

// 最近登录活动
async function getLoginActivity(req, res) {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const [total] = await db.promise().query(
      "SELECT COUNT(*) as count FROM user WHERE lastLoginTime IS NOT NULL"
    );

    const [records] = await db.promise().query(
      `SELECT u.id, u.username, u.email, u.lastLoginTime, lv.role
       FROM user u
       LEFT JOIN loginverification lv ON u.id = lv.uid
       WHERE u.lastLoginTime IS NOT NULL
       ORDER BY u.lastLoginTime DESC
       LIMIT ? OFFSET ?`,
      [parseInt(pageSize), offset]
    );

    const roleMap = { "1": "普通用户", "2": "教师", "3": "管理员", "4": "超级管理员" };

    const activities = records.map(r => ({
      username: r.username || `用户${r.id}`,
      email: r.email || "",
      role: roleMap[r.role] || "普通用户",
      loginTime: r.lastLoginTime,
      status: "success",
    }));

    res.json({
      code: 200,
      data: {
        total: total[0].count,
        activities,
      },
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
}

// 限流配置信息
async function getRateLimitInfo(req, res) {
  try {
    res.json({
      code: 200,
      data: {
        global: { windowMs: 900000, max: 100, description: "全局限流: 100次/15分钟" },
        auth: { windowMs: 900000, max: process.env.NODE_ENV === "production" ? 5 : 50, description: "登录/注册限流" },
        ai: { windowMs: 60000, max: 10, description: "AI接口限流: 10次/分钟" },
        captcha: { windowMs: 600000, max: 3, description: "验证码限流: 3次/10分钟" },
      },
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
}

module.exports = { getSecurityOverview, getLoginActivity, getRateLimitInfo };
