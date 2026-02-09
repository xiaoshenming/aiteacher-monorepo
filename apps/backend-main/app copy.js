// 引入模块
const express = require('express');
const mysql = require('mysql2');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

// 引入封装好的邮件发送模块
const sendVerificationCode = require('./model/sendVerificationCode');
const { log } = require('console');
const rateLimit = require('express-rate-limit');



// 创建 Express 实例
const app = express();

// 默认端口
const port = process.env.PORT || 3000;

// 设置 JSON 解析
app.use(express.json());
app.use(cors());

// 创建 Redis 连接
const redis = new Redis({
    host: 'localhost',
    port: 6379,
    password: '000000',
    db: 0
});

// 创建 MySQL 连接
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'MO520MING',
    database: 'ai_demo2'
});

require('dotenv').config();
const secret = process.env.JWT_SECRET;

// 生成 JWT 函数
function generateJWT(user, deviceType) {
    return jwt.sign({ id: user.id, role: user.role, device: deviceType }, secret, { expiresIn: '1h' });
}

// 登录状态持久化：将 JWT 存入 Redis
async function saveJWTToRedis(userId, token, deviceType) {
    await redis.set(`user_${userId}_${deviceType}_token`, token, 'EX', 3600); // 设置 1 小时过期
}

// 检查 Redis 中是否存在有效的 JWT
async function checkJWTInRedis(userId, token, deviceType) {
    const storedToken = await redis.get(`user_${userId}_${deviceType}_token`);
    return storedToken === token; // 比较 Redis 中的 token 和当前请求的 token
}

// 删除 Redis 中的 JWT（用户退出）
async function deleteJWTFromRedis(userId, deviceType) {
    await redis.del(`user_${userId}_${deviceType}_token`);
}

// 限制单个 IP 在 10 分钟内最多只能访问 10 次验证码发送接口
const sendCodeLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 分钟
    max: 3,
    message: { code: 429, message: '请求过于频繁，请稍后再试！', data: null }
  });

// 用户注册接口
app.post('/api/register', async (req, res) => {
    const { name, email, password, code } = req.body;

    // 验证验证码
    const storedCode = await redis.get(`code_${email}`);
    if (storedCode !== code) {
        return res.status(400).json({ code: 400, message: '验证码不正确或已过期', data: null });
    }

    // 查询数据库，检查邮箱是否已注册
    const checkEmailQuery = 'SELECT * FROM loginVerification WHERE email = ?';
    db.execute(checkEmailQuery, [email], async (err, result) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库错误，请稍后重试', data: null });
        }

        if (result.length > 0) {
            // 邮箱已注册时，返回 400 错误
            return res.status(400).json({ code: 400, message: '该邮箱已被注册，请重试', data: null });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 将用户信息存入数据库
        const insertUserQuery = 'INSERT INTO loginVerification (name, email, password, role) VALUES (?, ?, ?, ?)';
        db.execute(insertUserQuery, [name, email, hashedPassword, '1'], (insertErr) => {
            if (insertErr) {
                return res.status(500).json({ code: 500, message: '数据库错误，请稍后重试', data: null });
            }

            // 删除验证码
            redis.del(`code_${email}`, (delErr) => {
                if (delErr) {
                    console.error(`删除验证码失败: ${delErr.message}`);
                } else {
                    console.log(`验证码已从 Redis 删除`);
                }
            });

            // 成功注册
            res.status(201).json({ code: 201, message: '注册成功', data: null });
        });
    });
});



// 用户登录接口（PC）
app.post('/api/pc/login', async (req, res) => {
    const { name, password } = req.body;

    // 查找用户
    const query = 'SELECT * FROM loginVerification WHERE name = ?';
    db.execute(query, [name], async (err, result) => {
        if (err || result.length === 0) {
            return res.status(400).json({ code: 400, message: '用户不存在', data: null });
        }

        const user = result[0];

        // 验证密码
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ code: 400, message: '密码错误', data: null });
        }

        // 生成 JWT
        const token = generateJWT(user, 'pc');

        // 存储用户 JWT 到 Redis
        await saveJWTToRedis(user.id, token, 'pc');

        res.json({
            code: 200,
            message: '登录成功',
            data: { token, role: user.role }
        });
    });
});

// 用户登录接口（移动设备）
app.post('/api/mobile/login', async (req, res) => {
    const { name, password } = req.body;

    // 查找用户
    const query = 'SELECT * FROM loginVerification WHERE name = ?';
    db.execute(query, [name], async (err, result) => {
        if (err || result.length === 0) {
            return res.status(400).json({ code: 400, message: '用户不存在', data: null });
        }

        const user = result[0];

        // 验证密码
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ code: 400, message: '密码错误', data: null });
        }

        // 生成 JWT
        const token = generateJWT(user, 'mobile');

        // 存储用户 JWT 到 Redis
        await saveJWTToRedis(user.id, token, 'mobile');

        res.json({
            code: 200,
            message: '登录成功',
            data: { token, role: user.role }
        });
    });
});

// 用户退出接口
app.post('/api/logout', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ code: 401, message: '未提供授权信息', data: null });
    }

    const token = authHeader.split(' ')[1];
    const deviceType = req.headers.devicetype; // 从请求体中获取设备类型

    try {
        // 验证 Token 是否有效
        const decoded = jwt.verify(token, secret);

        // 删除 Redis 中的 Token
        await deleteJWTFromRedis(decoded.id, deviceType);

        res.json({ code: 200, message: '退出成功', data: null });
    } catch (err) {
        res.status(401).json({ code: 401, message: '无效的 Token', data: null });
    }
});

// 验证码生成接口
app.post('/api/send-verification-code', sendCodeLimiter, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ code: 400, message: '邮箱地址不能为空', data: null });
    }

    try {
        const { success, verificationCode, error } = await sendVerificationCode(email);

        if (success) {
            redis.set(`code_${email}`, verificationCode, 'EX', 10 * 60); // 设置验证码过期时间为 10 分钟

            res.json({
                code: 200,
                message: `验证码已发送至邮箱 ${email}`,
                data: null
            });
        } else {
            console.error('发送验证码失败：', error);
            res.status(500).json({
                code: 500,
                message: '验证码发送失败，请稍后重试',
                data: null
            });
        }
    } catch (error) {
        console.error('发送验证码失败：', error);
        res.status(500).json({
            code: 500,
            message: '验证码发送失败，请稍后重试',
            data: null
        });
    }
});

// 检查用户状态
app.get('/api/status', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.json({ code: 200, message: '用户未登录', data: { loggedIn: false } });
    }

    const token = authHeader.split(' ')[1];
    const deviceType = req.headers.devicetype; // 从请求体中获取设备类型

    try {
        const decoded = jwt.verify(token, secret);
        const isValid = await checkJWTInRedis(decoded.id, token, deviceType);

        if (!isValid) {
            return res.json({ code: 200, message: '用户未登录', data: { loggedIn: false } });
        }

        res.json({
            code: 200,
            message: '用户已登录',
            data: { loggedIn: true, user: { id: decoded.id, role: decoded.role } }
        });
    } catch {
        res.json({ code: 200, message: '用户未登录', data: { loggedIn: false } });
    }
});

// 权限验证中间件
function authorize(roles = []) {
    return async (req, res, next) => {
        console.log('开始权限验证，目标角色:', roles);

        const authHeader = req.headers.authorization; // 从请求体中获取 JWT 令牌
        const deviceType = req.headers.devicetype; // 从请求体中获取设备类型
        if (!authHeader) {
            console.log('未提供授权信息');
            return res.status(401).json({
                code: 401,
                message: '未提供授权信息',
                data: null
            });
        }

        const token = authHeader.split(' ')[1];
        console.log('接收到的 Token:', token);
        try {
            const decoded = jwt.verify(token, secret);
            console.log('JWT 解码成功:', decoded);
            const isValid = await checkJWTInRedis(decoded.id, token,deviceType);

            if (!isValid) {
                console.log('Redis 中无效 Token');
                return res.status(401).json({
                    code: 401,
                    message: '无效的 Token',
                    data: null
                });
            }

            console.log(decoded.role);
            
            if (roles.length && !roles.includes(decoded.role)) {
                console.log(`用户角色 ${decoded.role} 无权限访问`);
                return res.status(403).json({
                    code: 403,
                    message: `权限不足，用户角色 ${decoded.role} 无权限访问此资源`,
                    data: null
                });
            }

            console.log('权限验证通过');
            req.user = decoded; // 将用户信息传递到后续逻辑
            next();
        } catch (err) {
            console.error('权限验证错误:', err.message);
            return res.status(401).json({
                code: 401,
                message: '无效的 Token',
                data: null
            });
        }
    };
}

// 普通用户接口
app.get('/api/test/user', authorize(['2','3','4']), (req, res) => {
    res.json({
        code: 200,
        message: '普通用户访问成功',
        data: {
            role: req.user.role,
            message: '你已成功访问普通用户接口'
        }
    });
});

// 管理员接口
app.get('/api/test/admin', authorize(['3','4']), (req, res) => {
    res.json({
        code: 200,
        message: '管理员访问成功',
        data: {
            role: req.user.role,
            message: '你已成功访问管理员接口'
        }
    });
});

// 超级管理员接口
app.get('/api/test/superadmin', authorize(['4']), (req, res) => {
    res.json({
        code: 200,
        message: '超级管理员访问成功',
        data: {
            role: req.user.role,
            message: '你已成功访问超级管理员接口'
        }
    });
});

// 超级管理员、管理员联合接口（允许管理员和超级管理员访问）
app.get('/api/test/admin-superadmin', authorize(['3', '4']), (req, res) => {
    res.json({
        code: 200,
        message: '管理员或超级管理员访问成功',
        data: {
            role: req.user.role,
            message: '你已成功访问管理员或超级管理员接口'
        }
    });
});
// 提供不需要权限的静态资源路径
app.use('/static/imgs', express.static(path.join(__dirname, 'static/imgs')));

// 提供需要权限的静态资源路径
app.use('/static/img', authorize(['2', '3', '4']), express.static(path.join(__dirname, 'static/img')));

// 获取更新日志接口
app.get('/api/changelog', (req, res) => {
    const query = 'SELECT * FROM changelog ORDER BY updateTime DESC';

    db.execute(query, (err, results) => {
        if (err) {
            console.error('获取更新日志失败:', err);
            return res.status(500).json({ code: 500, message: '获取更新日志失败', data: null });
        }

        res.json({
            code: 200,
            message: '获取更新日志成功',
            data: results
        });
    });
});


// 1) 获取用户的所有信息
app.get('/api/user', authorize(['1', '2', '3', '4']), async (req, res) => {
    try {
        // 1. 从解密后的 token 中拿到 loginverification.id
        const loginVerificationId = req.user.id; // 即 decode 后的 id

        // 2. 根据 loginVerificationId 去 loginverification 表里查记录
        const [lvRows] = await db.promise().query(
            'SELECT * FROM loginverification WHERE id = ?',
            [loginVerificationId]
        );

        if (!lvRows || lvRows.length === 0) {
            return res.status(404).json({
                code: 404,
                message: '未找到该用户的登录信息',
                data: null
            });
        }

        const loginUser = lvRows[0]; // 登录表对应的数据

        // 3. 如果 loginverification 中有 uid，则再去 user 表找详细信息
        //    注意：如果 uid 为空或为 null，可以做个兼容
        let userInfo = null;
        if (loginUser.uid) {
            const [userRows] = await db.promise().query(
                'SELECT * FROM user WHERE id = ?',
                [loginUser.uid]
            );
            userInfo = userRows && userRows.length > 0 ? userRows[0] : null;
        }

        // 4. 整合返回数据
        //    - 这里既可以返回 loginverification 的信息，也可以返回 user 表的信息
        //    - 视具体业务而定：比如前端最关注 nickname / email / avatar / schoolId / role 等
        const result = {
            // 来自 loginverification 表的信息
            id: loginUser.id,      // loginverification 表的自增 ID
            name: loginUser.name,  // 昵称
            email: loginUser.email,
            role: loginUser.role,
            uid: loginUser.uid,    // user 表的 ID

            // 来自 user 表的信息（可选返回）
            username: userInfo?.username || null,
            avatar: userInfo?.avatar || null,
            schoolId: userInfo?.schoolId || null,
            phoneNumber: userInfo?.phoneNumber || loginUser.phoneNumber || null,
            // 其他 user 表中的字段依需求可继续添加
        };

        return res.json({
            code: 200,
            message: '获取用户信息成功',
            data: result
        });
    } catch (error) {
        console.error('获取用户信息时出现异常:', error);
        return res.status(500).json({
            code: 500,
            message: '服务器错误，获取用户信息失败',
            data: null
        });
    }
});





/*****************************************
 * 学校管理员专属：对 user 表的增删改查
 *****************************************/
app.get('/api/admin/user', authorize(['3', '4']), async (req, res) => {
    try {
      // 1. 先获取当前登录管理员的信息
      const loginVerificationId = req.user.id; // decode后的id
      // 根据这个id去 loginverification表查
      const [lvRows] = await db.promise().query(
        'SELECT * FROM loginverification WHERE id = ?',
        [loginVerificationId]
      );
      if (!lvRows || lvRows.length === 0) {
        return res.status(404).json({ code: 404, message: '管理员信息不存在', data: null });
      }
      const loginUser = lvRows[0];
  
      // 2. 再去 user 表查出管理员的 schoolId
      let adminSchoolId = null;
      if (loginUser.uid) {
        const [adminUserRows] = await db.promise().query(
          'SELECT * FROM user WHERE id = ?',
          [loginUser.uid]
        );
        if (!adminUserRows || adminUserRows.length === 0) {
          return res.status(404).json({ code: 404, message: '管理员用户表信息不存在', data: null });
        }
        adminSchoolId = adminUserRows[0].schoolId;
      }
  
      // 如果管理员的schoolId不存在，就无法判断「本校用户」，可根据业务需要返回错误
      if (!adminSchoolId) {
        return res.status(400).json({
          code: 400,
          message: '管理员尚未绑定schoolId，无法操作用户',
          data: null
        });
      }
  
      // 3. 查询user表：schoolId = adminSchoolId 或 schoolId = '未认证'
      const [rows] = await db.promise().query(
        'SELECT * FROM user WHERE schoolId = ? OR schoolId = ? ORDER BY id ASC',
        [adminSchoolId, '未认证']
      );
  
      return res.json({
        code: 200,
        message: '查询成功',
        data: rows
      });
    } catch (error) {
      console.error('查询用户失败:', error);
      return res.status(500).json({
        code: 500,
        message: '服务器错误，查询用户失败',
        data: null
      });
    }
  });
  
  
  /**
   * 新增 用户
   *  - 仅当管理员role = 3 或 4 才可操作
   *  - 一般情况下，admin 新增用户时，可将 user.schoolId = admin.schoolId，或者设为 '未认证'。
   */
  app.post('/api/admin/user', authorize(['3', '4']), async (req, res) => {
    try {
      const { username, phoneNumber, email, schoolId, password } = req.body;
  
      if (!username || !email) {
        return res.status(400).json({
          code: 400,
          message: '缺少必要字段 username 或 email',
          data: null
        });
      }
  
      // 获取当前管理员
      const loginVerificationId = req.user.id;
      const [lvRows] = await db.promise().query(
        'SELECT * FROM loginverification WHERE id = ?',
        [loginVerificationId]
      );
      if (!lvRows || lvRows.length === 0) {
        return res.status(404).json({ code: 404, message: '管理员信息不存在', data: null });
      }
      const loginUser = lvRows[0];
  
      // 获取管理员schoolId
      let adminSchoolId = null;
      if (loginUser.uid) {
        const [adminUserRows] = await db.promise().query(
          'SELECT * FROM user WHERE id = ?',
          [loginUser.uid]
        );
        if (!adminUserRows || adminUserRows.length === 0) {
          return res.status(404).json({ code: 404, message: '管理员用户表信息不存在', data: null });
        }
        adminSchoolId = adminUserRows[0].schoolId;
      }
      if (!adminSchoolId) {
        return res.status(400).json({
          code: 400,
          message: '管理员尚未绑定schoolId，无法操作用户',
          data: null
        });
      }
  
      // 判断将要插入的 schoolId 是否与管理员相同，或者是否可以设为 '未认证'
      //   如果你的业务允许管理员手动选择 "本校" 或 "未认证" 做新增，就可以这样校验
      //   如果不允许添加其他学校的 user，就这里检查强制写死： newSchoolId = adminSchoolId
      let newSchoolId = schoolId && (schoolId === adminSchoolId || schoolId === '未认证')
        ? schoolId
        : adminSchoolId;
  
      // 密码加密（如果前端要创建带登录信息的用户）
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
  
      // 插入 user 表
      const [result] = await db.promise().execute(
        `INSERT INTO user (username, password, phoneNumber, email, schoolId)
         VALUES (?, ?, ?, ?, ?)`,
        [username, hashedPassword, phoneNumber, email, newSchoolId]
      );
  
      // 如果你还希望在 loginverification 建立一条对应的登录记录（可选）
      // const insertId = result.insertId; // 刚插入的 user.id
      // await db.promise().execute(
      //   `INSERT INTO loginverification (name, email, password, role, uid)
      //    VALUES (?, ?, ?, ?, ?)`,
      //   [username, email, hashedPassword, '1', insertId]
      // );
      // ※ 这里 role 你也可以是 '1' 表示普通用户、'2' 表示正常用户，按你需要。
  
      return res.json({
        code: 200,
        message: '新增用户成功',
        data: {
          insertId: result.insertId
        }
      });
    } catch (error) {
      console.error('新增用户失败:', error);
      return res.status(500).json({
        code: 500,
        message: '服务器错误，新增用户失败',
        data: null
      });
    }
  });
  
  
  /**
   * 更新 用户
   * 仅当管理员role = 3 or 4 且该用户是「同校 or 未认证」时才可以更新
   */
  app.put('/api/admin/user/:id', authorize(['3', '4']), async (req, res) => {
    try {
      const userId = req.params.id;
      const { username, phoneNumber, email, schoolId, password } = req.body;
  
      // 1. 查出此时要修改的用户记录
      const [rows] = await db.promise().query(
        'SELECT * FROM user WHERE id = ?',
        [userId]
      );
      if (!rows || rows.length === 0) {
        return res.status(404).json({
          code: 404,
          message: '要更新的用户不存在',
          data: null
        });
      }
      const targetUser = rows[0];
  
      // 2. 查管理员信息，获取 adminSchoolId
      const loginVerificationId = req.user.id;
      const [lvRows] = await db.promise().query(
        'SELECT * FROM loginverification WHERE id = ?',
        [loginVerificationId]
      );
      if (!lvRows || lvRows.length === 0) {
        return res.status(404).json({ code: 404, message: '管理员信息不存在', data: null });
      }
      const loginUser = lvRows[0];
  
      let adminSchoolId = null;
      if (loginUser.uid) {
        const [adminUserRows] = await db.promise().query(
          'SELECT * FROM user WHERE id = ?',
          [loginUser.uid]
        );
        if (!adminUserRows || adminUserRows.length === 0) {
          return res.status(404).json({ code: 404, message: '管理员用户表信息不存在', data: null });
        }
        adminSchoolId = adminUserRows[0].schoolId;
      }
      if (!adminSchoolId) {
        return res.status(400).json({
          code: 400,
          message: '管理员尚未绑定schoolId，无法操作用户',
          data: null
        });
      }
  
      // 3. 验证 targetUser.schoolId 是否是 adminSchoolId 或 '未认证'
      if (targetUser.schoolId !== adminSchoolId && targetUser.schoolId !== '未认证') {
        return res.status(403).json({
          code: 403,
          message: '无权限更新其他学校的用户',
          data: null
        });
      }
  
      // 4. 准备更新字段
      //   如果传了新的 schoolId，也要判断是否符合（只能设成自己学校 或 '未认证'）
      let newSchoolId = schoolId;
      if (newSchoolId && newSchoolId !== adminSchoolId && newSchoolId !== '未认证') {
        return res.status(400).json({
          code: 400,
          message: '只能将用户schoolId更新为本校或未认证',
          data: null
        });
      }
  
      // 密码加密
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
  
      // 构建更新字段的 SQL 动态语句，这里简单写
      const updateFields = [];
      const updateValues = [];
      if (username) {
        updateFields.push('username = ?');
        updateValues.push(username);
      }
      if (phoneNumber) {
        updateFields.push('phoneNumber = ?');
        updateValues.push(phoneNumber);
      }
      if (email) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }
      if (newSchoolId) {
        updateFields.push('schoolId = ?');
        updateValues.push(newSchoolId);
      }
      if (hashedPassword) {
        updateFields.push('password = ?');
        updateValues.push(hashedPassword);
      }
      // 没有要更新的字段
      if (updateFields.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '没有可更新的字段',
          data: null
        });
      }
  
      updateValues.push(userId); // 放在最后
      const updateSql = `
        UPDATE user
           SET ${updateFields.join(', ')}
         WHERE id = ?
      `;
      await db.promise().execute(updateSql, updateValues);
  
      return res.json({
        code: 200,
        message: '更新用户成功',
        data: null
      });
    } catch (error) {
      console.error('更新用户失败:', error);
      return res.status(500).json({
        code: 500,
        message: '服务器错误，更新用户失败',
        data: null
      });
    }
  });
  
  
  /**
   * 删除 用户
   * 仅当管理员role = 3 or 4 且该用户是「同校 or 未认证」时才可以删除
   */
  app.delete('/api/admin/user/:id', authorize(['3', '4']), async (req, res) => {
    try {
      const userId = req.params.id;
  
      // 1. 查要删除的用户
      const [rows] = await db.promise().query(
        'SELECT * FROM user WHERE id = ?',
        [userId]
      );
      if (!rows || rows.length === 0) {
        return res.status(404).json({
          code: 404,
          message: '要删除的用户不存在',
          data: null
        });
      }
      const targetUser = rows[0];
  
      // 2. 查管理员
      const loginVerificationId = req.user.id;
      const [lvRows] = await db.promise().query(
        'SELECT * FROM loginverification WHERE id = ?',
        [loginVerificationId]
      );
      if (!lvRows || lvRows.length === 0) {
        return res.status(404).json({ code: 404, message: '管理员信息不存在', data: null });
      }
      const loginUser = lvRows[0];
  
      let adminSchoolId = null;
      if (loginUser.uid) {
        const [adminUserRows] = await db.promise().query(
          'SELECT * FROM user WHERE id = ?',
          [loginUser.uid]
        );
        if (!adminUserRows || adminUserRows.length === 0) {
          return res.status(404).json({ code: 404, message: '管理员用户表信息不存在', data: null });
        }
        adminSchoolId = adminUserRows[0].schoolId;
      }
      if (!adminSchoolId) {
        return res.status(400).json({
          code: 400,
          message: '管理员尚未绑定schoolId，无法操作用户',
          data: null
        });
      }
  
      // 3. 验证是否同校/未认证
      if (targetUser.schoolId !== adminSchoolId && targetUser.schoolId !== '未认证') {
        return res.status(403).json({
          code: 403,
          message: '无权限删除其他学校的用户',
          data: null
        });
      }
  
      // 4. 删除
      await db.promise().execute(
        'DELETE FROM user WHERE id = ?',
        [userId]
      );
  
      return res.json({
        code: 200,
        message: '删除用户成功',
        data: null
      });
    } catch (error) {
      console.error('删除用户失败:', error);
      return res.status(500).json({
        code: 500,
        message: '服务器错误，删除用户失败',
        data: null
      });
    }
  });
  

























// 启动服务
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${port}`);
});

// Redis 心跳包
setInterval(async () => {
    try {
        const pong = await redis.ping();
        console.log('Redis 心跳包成功:', pong);
    } catch (error) {
        console.error('Redis 心跳包失败:', error);
    }
}, 300000); // 每 5 分钟发送一次心跳包

// MySQL 心跳包
setInterval(() => {
    db.query('SELECT 1', (err) => {
        if (err) {
            console.error('MySQL 心跳包失败:', err);
        } else {
            console.log('MySQL 心跳包成功');
        }
    });
}, 300000); // 每 5 分钟发送一次心跳包
///111111