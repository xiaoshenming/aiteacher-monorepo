const os = require("os");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const db = require("../../config/db");

// 获取 CPU 使用率
function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0,
    totalTick = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }
  return {
    usage: Math.round((1 - totalIdle / totalTick) * 100),
    cores: cpus.length,
    model: cpus[0]?.model || "Unknown",
    loadAvg: os.loadavg(),
  };
}

// 系统资源监控
async function getSystemMonitor(req, res) {
  try {
    const cpu = getCpuUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // 磁盘使用
    let disk = { total: "N/A", used: "N/A", available: "N/A", usage: 0 };
    try {
      const { stdout } = await execPromise("df -h / | tail -1");
      const parts = stdout.trim().split(/\s+/);
      if (parts.length >= 5) {
        disk = {
          total: parts[1],
          used: parts[2],
          available: parts[3],
          usage: parseInt(parts[4]) || 0,
        };
      }
    } catch {}

    const processMemory = process.memoryUsage();

    res.json({
      code: 200,
      data: {
        cpu,
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          usage: Math.round((usedMem / totalMem) * 100),
        },
        disk,
        system: {
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
          uptime: os.uptime(),
          nodeVersion: process.version,
          processUptime: process.uptime(),
          processMemory: {
            rss: processMemory.rss,
            heapUsed: processMemory.heapUsed,
            heapTotal: processMemory.heapTotal,
          },
        },
      },
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
}

// 服务状态检查
async function getServiceStatus(req, res) {
  try {
    const services = [];

    // MySQL
    try {
      await db.promise().query("SELECT 1");
      services.push({ name: "MySQL", status: "online", message: "连接正常" });
    } catch (e) {
      services.push({ name: "MySQL", status: "offline", message: e.message });
    }

    // Redis
    try {
      const redis = require("../../config/redis");
      await redis.ping();
      services.push({ name: "Redis", status: "online", message: "连接正常" });
    } catch (e) {
      services.push({
        name: "Redis",
        status: "offline",
        message: e.message || "连接失败",
      });
    }

    // RabbitMQ
    try {
      const amqp = require("amqplib");
      const conn = await amqp.connect(
        process.env.RABBITMQ_URL || "amqp://localhost"
      );
      await conn.close();
      services.push({
        name: "RabbitMQ",
        status: "online",
        message: "连接正常",
      });
    } catch (e) {
      services.push({
        name: "RabbitMQ",
        status: "offline",
        message: e.message || "连接失败",
      });
    }

    res.json({ code: 200, data: { services } });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
}

// 业务统计
async function getBusinessStats(req, res) {
  try {
    const [userCount] = await db
      .promise()
      .query("SELECT COUNT(*) as count FROM user");
    const [courseCount] = await db
      .promise()
      .query("SELECT COUNT(*) as count FROM course");

    let aiCount = 0;
    try {
      const [aiResult] = await db
        .promise()
        .query("SELECT COUNT(*) as count FROM ai_usage_stats");
      aiCount = aiResult[0].count;
    } catch {}

    let todayActive = 0;
    try {
      const [activeResult] = await db
        .promise()
        .query(
          "SELECT COUNT(DISTINCT uid) as count FROM loginverification WHERE last_login >= CURDATE()"
        );
      todayActive = activeResult[0].count;
    } catch {}

    res.json({
      code: 200,
      data: {
        totalUsers: userCount[0].count,
        todayActive,
        totalCourses: courseCount[0].count,
        aiCalls: aiCount,
      },
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
}

module.exports = { getSystemMonitor, getServiceStatus, getBusinessStats };
