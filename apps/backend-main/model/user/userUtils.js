// model/user/userUtils.js
const db = require("../../config/db");
const redis = require("../../config/redis");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getOpenid } = require("../wx/getOpenid");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const crypto = require("crypto");
require("dotenv").config();
const secret = process.env.JWT_SECRET;

/** 生成 JWT */
function generateJWT(user, deviceType) {
  return jwt.sign(
    { id: user.id, role: user.role, device: deviceType },
    secret,
    { expiresIn: "168h" }
  );
}

/** 将 JWT 存入 Redis（1小时过期） */
async function saveJWTToRedis(userId, token, deviceType) {
  await redis.set(`user_${userId}_${deviceType}_token`, token, "EX", 3600);
}

/** 删除 Redis 中的 JWT */
async function deleteJWTFromRedis(userId, deviceType) {
  await redis.del(`user_${userId}_${deviceType}_token`);
}

/** 用户注册 */
async function registerUser({ name, email, password, code }) {
  const storedCode = await redis.get(`code_${email}`);
  if (storedCode !== code) {
    throw new Error("验证码不正确或已过期");
  }
  const connection = db.promise();
  await connection.beginTransaction();
  try {
    const [existing] = await connection.query(
      "SELECT * FROM loginverification WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      throw new Error("该邮箱已被注册");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await connection.query(
      'INSERT INTO user (username, email, password, schoolId, openid) VALUES (?, ?, ?, 0, "")',
      [name, email, hashedPassword]
    );
    const userId = userResult.insertId;
    await connection.query(
      'INSERT INTO loginverification (name, email, password, role, uid) VALUES (?, ?, ?, "1", ?)',
      [name, email, hashedPassword, userId]
    );
    await connection.commit();
    await redis.del(`code_${email}`);
    return { message: "注册成功" };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

/** PC 登录 */
async function loginPC({ account, password }) {
  if (!account?.trim() || !password?.trim()) {
    throw new Error("账号和密码不能为空");
  }
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account);
  const isPhone = /^1[3-9]\d{9}$/.test(account);
  if (!isEmail && !isPhone) {
    throw new Error("账号格式不正确，请输入邮箱或手机号");
  }
  const connection = db.promise();
  const [result] = await connection.query(
    "SELECT * FROM loginverification WHERE phoneNumber = ? OR email = ?",
    [account, account]
  );
  if (result.length === 0) {
    throw new Error("账号不存在");
  }
  const user = result[0];
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new Error("密码错误");
  }
  const token = generateJWT(user, "pc");
  await saveJWTToRedis(user.id, token, "pc");
  return { token, role: user.role };
}

/** 微信小程序登录 */
async function loginWxMiniprogram({ code }) {
  const { openid } = await getOpenid(code);
  const connection = db.promise();
  const [result] = await connection.query(
    "SELECT * FROM loginverification WHERE openid = ?",
    [openid]
  );
  if (result.length > 0) {
    const user = result[0];
    const token = generateJWT(user, "mobile");
    await saveJWTToRedis(user.id, token, "mobile");
    return { token, role: user.role };
  } else {
    const error = new Error("移动端(微信小程序)请求登录的账号未被创建");
    error.code = 211;
    throw error;
  }
}

/** 微信小程序绑定 */
async function bindWxMiniprogram({ code, email, verificationCode }) {
  const { openid } = await getOpenid(code);
  const connection = db.promise();
  const [openidResult] = await connection.query(
    "SELECT * FROM loginverification WHERE openid = ?",
    [openid]
  );
  if (openidResult.length > 0) {
    throw new Error("该微信号已被绑定，请更换微信号或联系管理员");
  }
  const [emailResult] = await connection.query(
    "SELECT * FROM loginverification WHERE email = ?",
    [email]
  );
  if (emailResult.length === 0) {
    throw new Error("该邮箱未被注册，请选择重试...");
  }
  const storedCode = await redis.get(`code_${email}`);
  if (storedCode !== verificationCode) {
    throw new Error("验证码不正确或已过期");
  }
  await connection.query(
    "UPDATE loginverification SET openid = ? WHERE email = ?",
    [openid, email]
  );
  await connection.query("UPDATE user SET openid = ? WHERE email = ?", [
    openid,
    email,
  ]);
  return { message: "绑定成功" };
}

/** 微信小程序注册 */
async function registerWxMiniprogram({ code }) {
  const { openid } = await getOpenid(code);
  const connection = db.promise();
  const [openidResult] = await connection.query(
    "SELECT * FROM loginverification WHERE openid = ?",
    [openid]
  );
  if (openidResult.length > 0) {
    throw new Error("该微信号已被绑定，请更换微信号或联系管理员");
  }
  const [userResult] = await connection.query(
    "INSERT INTO user (openid) VALUES (?)",
    [openid]
  );
  const userId = userResult.insertId;
  await connection.query(
    "INSERT INTO loginverification (openid, uid) VALUES (?, ?)",
    [openid, userId]
  );
  return { message: "注册成功" };
}

/** 用户退出 */
async function logoutUser({ token, deviceType }) {
  const decoded = jwt.verify(token, secret);
  await deleteJWTFromRedis(decoded.id, deviceType);
  return { message: "退出成功" };
}

/** 获取用户详细信息 */
async function getUserInfo(userId) {
  const connection = db.promise();
  const [lvRows] = await connection.query(
    "SELECT * FROM loginverification WHERE id = ?",
    [userId]
  );
  if (!lvRows || lvRows.length === 0) {
    throw new Error("未找到该用户的登录信息");
  }
  const loginUser = lvRows[0];
  
  let userInfo = null;
  let studentInfo = null;
  
  // 如果有uid字段，从user表获取信息
  if (loginUser.uid) {
    const [userRows] = await connection.query(
      "SELECT * FROM user WHERE id = ?",
      [loginUser.uid]
    );
    userInfo = userRows && userRows.length > 0 ? userRows[0] : null;
  }
  
  // 如果有sid字段，从student表获取信息
  if (loginUser.sid) {
    const [studentRows] = await connection.query(
      "SELECT * FROM student WHERE id = ?",
      [loginUser.sid]
    );
    studentInfo = studentRows && studentRows.length > 0 ? studentRows[0] : null;
  }
  
  // 获取学校信息
  let schoolInfo = null;
  const schoolId = studentInfo?.schoolId || userInfo?.schoolId;
  if (schoolId && schoolId !== 0) {
    const [schoolRows] = await connection.query(
      "SELECT * FROM school WHERE id = ?",
      [schoolId]
    );
    schoolInfo = schoolRows && schoolRows.length > 0 ? schoolRows[0] : null;
  }
  
  return {
    id: loginUser.id,
    name: loginUser.name,
    email: loginUser.email || studentInfo?.email,
    role: loginUser.role,
    uid: loginUser.uid,
    sid: loginUser.sid,
    username: studentInfo?.username || userInfo?.username || null,
    wechatId: userInfo?.wechatId || null,
    avatar: studentInfo?.avatar || userInfo?.avatar || null,
    schoolId: schoolId || null,
    phoneNumber: studentInfo?.phoneNumber || userInfo?.phoneNumber || loginUser.phoneNumber || null,
    schoolName: schoolInfo?.schoolName || null,
  };
}


/** 更新用户信息 */
async function updateUserInfo(userId, { type, data }) {
  if (!["phoneNumber", "email", "name"].includes(type)) {
    throw new Error("type 字段只能是 phoneNumber 或 email 或 name");
  }
  const phoneRegex = /^1[3-9]\d{9}$/;
  const emailRegex = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
  if (type === "phoneNumber" && !phoneRegex.test(data)) {
    throw new Error("手机号码格式不正确");
  } else if (type === "email" && !emailRegex.test(data)) {
    throw new Error("邮箱格式不正确");
  } else if (type === "name" && !data) {
    throw new Error("昵称不能为空");
  }
  const connection = db.promise();
  const [lvRows] = await connection.query(
    "SELECT * FROM loginverification WHERE id = ?",
    [userId]
  );
  if (!lvRows || lvRows.length === 0) {
    throw new Error("未找到该用户的登录信息");
  }
  
  const user = lvRows[0];
  await connection.execute(
    `UPDATE loginverification SET ${type} = ? WHERE id = ?`,
    [data, userId]
  );
  
  if (user.role === '0' && user.sid) {
    // 学生用户，更新student表
    await connection.execute(
      `UPDATE student SET ${type === "name" ? "username" : type} = ? WHERE id = ?`,
      [data, user.sid]
    );
  } else if (user.uid) {
    // 普通用户，更新user表
    await connection.execute(
      `UPDATE user SET ${type === "name" ? "username" : type} = ? WHERE id = ?`,
      [data, user.uid]
    );
  }
  
  return { message: "更新用户信息成功" };
}

/** 上传头像 */
const avatarDir = path.join(__dirname, "../../static/imgs/avatar");
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}
const calculateMD5 = (buffer) =>
  crypto.createHash("md5").update(buffer).digest("hex");

async function uploadAvatar({ userId, avatar }) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ];
  if (!allowedTypes.includes(avatar.mimetype)) {
    throw new Error("仅支持 JPG/PNG/WEBP/HEIC/HEIF 格式的图片");
  }
  const fileBuffer = avatar.data;
  const md5Hash = calculateMD5(fileBuffer);
  const connection = db.promise();
  const [existing] = await connection.query(
    "SELECT filename, avatar_id FROM user_avatars WHERE md5_hash = ? LIMIT 1",
    [md5Hash]
  );
  if (existing.length > 0) {
    return {
      url: `/static/imgs/avatar/${existing[0].filename}`,
      avatar_id: existing[0].avatar_id,
      message: "头像已存在，直接使用",
    };
  }
  const fileName = `${md5Hash}.webp`;
  const savePath = path.join(avatarDir, fileName);
  await sharp(fileBuffer)
    .resize(256, 256)
    .webp({ quality: 85 })
    .toFile(savePath);
  const [result] = await connection.execute(
    `INSERT INTO user_avatars (user_id, md5_hash, filename, original_name, mime_type, size)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, md5Hash, fileName, avatar.name, "image/webp", avatar.size]
  );
  return {
    url: `/static/imgs/avatar/${fileName}`,
    avatar_id: result.insertId,
    message: "头像上传成功",
  };
}

/** 更新用户头像 */
async function updateUserAvatar(userId, avatarUrl) {
  const connection = db.promise();
  const [lvRows] = await connection.query(
    "SELECT * FROM loginverification WHERE id = ?",
    [userId]
  );
  if (!lvRows || lvRows.length === 0) {
    throw new Error("用户不存在");
  }
  
  const user = lvRows[0];
  if (user.role === '0' && user.sid) {
    // 学生用户，更新student表
    await connection.execute("UPDATE student SET avatar = ? WHERE id = ?", [
      avatarUrl,
      user.sid,
    ]);
  } else if (user.uid) {
    // 普通用户，更新user表
    await connection.execute("UPDATE user SET avatar = ? WHERE id = ?", [
      avatarUrl,
      user.uid,
    ]);
  }
  
  return { avatar: avatarUrl, message: "头像更新成功" };
}


/** 更新通讯录信息 */
async function updatePhoneList(userId, phoneList) {
  const connection = db.promise();
  const [lvRows] = await connection.query(
    "SELECT * FROM loginverification WHERE id = ?",
    [userId]
  );
  if (!lvRows || lvRows.length === 0) {
    throw new Error("用户不存在");
  }
  const { phoneNumber, wechatId, email } = phoneList;
  const phoneRegex = /^(?:\+86)?1[3-9]\d{9}$/;
  const wechatRegex = /^(?:1[3-9]\d{9}|[a-zA-Z][-_a-zA-Z0-9]{5,19})$/;
  const emailRegex = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
  if (
    (phoneNumber === "" || phoneRegex.test(phoneNumber)) &&
    (wechatId === "" || wechatRegex.test(wechatId)) &&
    (email === "" || emailRegex.test(email))
  ) {
    await connection.execute(
      "UPDATE user SET phoneNumber = ?, wechatId = ?, email = ? WHERE id = ?",
      [phoneNumber, wechatId, email, lvRows[0].uid]
    );
    return { message: "通讯录更新成功" };
  } else {
    throw new Error("通讯录数据不合法");
  }
}

/** 获取当前用户通讯录 */
async function getPhoneList(userId) {
  const connection = db.promise();
  const [lvRows] = await connection.query(
    "SELECT * FROM loginverification WHERE id = ?",
    [userId]
  );
  if (!lvRows || lvRows.length === 0) {
    throw new Error("用户不存在");
  }
  const [userRows] = await connection.query(
    "SELECT phoneNumber, wechatId, email FROM user WHERE id = ?",
    [lvRows[0].uid]
  );
  if (!userRows || userRows.length === 0) {
    throw new Error("用户不存在");
  }
  return userRows[0];
}

/** 分页获取本校通讯录 */
async function getSchoolPhoneList(userId, pageIndex, pageSize) {
  const connection = db.promise();
  const [lvRows] = await connection.query(
    "SELECT uid FROM loginverification WHERE id = ?",
    [userId]
  );
  if (!lvRows || lvRows.length === 0) {
    throw new Error("用户不存在");
  }
  const uid = lvRows[0].uid;
  const [userRows] = await connection.query(
    "SELECT schoolId FROM user WHERE id = ?",
    [uid]
  );
  if (!userRows || userRows.length === 0) {
    throw new Error("用户不存在");
  }
  const schoolId = userRows[0].schoolId;
  const [countRows] = await connection.query(
    "SELECT COUNT(*) AS total FROM user WHERE schoolId = ? AND id != ?",
    [schoolId, uid]
  );
  const total = countRows[0].total;
  const [phoneListRows] = await connection.query(
    `SELECT username, phoneNumber, wechatId, email 
       FROM user 
      WHERE schoolId = ? AND id != ? 
      LIMIT ?, ?`,
    [schoolId, uid, (pageIndex - 1) * pageSize, pageSize]
  );
  return { total, phoneList: phoneListRows };
}

/** 搜索本校通讯录 */
async function searchSchoolPhoneList(userId, keyword, pageIndex, pageSize) {
  const connection = db.promise();
  const [lvRows] = await connection.query(
    "SELECT uid FROM loginverification WHERE id = ?",
    [userId]
  );
  if (!lvRows || lvRows.length === 0) {
    throw new Error("用户不存在");
  }
  const uid = lvRows[0].uid;
  const [userRows] = await connection.query(
    "SELECT schoolId FROM user WHERE id = ?",
    [uid]
  );
  if (!userRows || userRows.length === 0) {
    throw new Error("用户不存在");
  }
  const schoolId = userRows[0].schoolId;
  const [countRows] = await connection.query(
    `SELECT COUNT(*) AS total 
       FROM user 
      WHERE schoolId = ? 
        AND (username LIKE ? OR phoneNumber LIKE ? OR wechatId LIKE ? OR email LIKE ?)`,
    [schoolId, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
  );
  const total = countRows[0].total;
  const [phoneListRows] = await connection.query(
    `SELECT username, phoneNumber, wechatId, email 
       FROM user 
      WHERE schoolId = ? 
        AND (username LIKE ? OR phoneNumber LIKE ? OR wechatId LIKE ? OR email LIKE ?)
      LIMIT ?, ?`,
    [
      schoolId,
      `%${keyword}%`,
      `%${keyword}%`,
      `%${keyword}%`,
      `%${keyword}%`,
      (pageIndex - 1) * pageSize,
      pageSize,
    ]
  );
  return { total, phoneList: phoneListRows };
}
/** 获取所有学校 */
async function getAllSchools() {
  const connection = db.promise();
  const [rows] = await connection.query("SELECT * FROM school");
  return rows;
}
/** 获取用户所在学校的所有教师 */
async function getSchoolTeachers(userId) {
  const connection = db.promise();
  
  // 获取用户的学校ID
  const [lvRows] = await connection.query(
    "SELECT * FROM loginverification WHERE id = ?",
    [userId]
  );
  
  if (!lvRows || lvRows.length === 0) {
    throw new Error("用户信息不存在");
  }
  
  const loginUser = lvRows[0];
  let userSchoolId = null;
  
  if (loginUser.uid) {
    const [userRows] = await connection.query(
      "SELECT * FROM user WHERE id = ?",
      [loginUser.uid]
    );
    
    if (!userRows || userRows.length === 0) {
      throw new Error("用户表信息不存在");
    }
    
    userSchoolId = userRows[0].schoolId;
  }
  
  if (!userSchoolId) {
    throw new Error("用户尚未绑定schoolId，无法获取教师列表");
  }
  
  // 只查询角色为2(教师)的用户，只返回id、name和email字段
const [rows] = await connection.query(
  `SELECT u.id, u.username as name, u.email 
   FROM user u
   JOIN loginverification lv ON u.id = lv.uid
   WHERE u.schoolId = ? AND lv.role = '2'
   ORDER BY u.username ASC`,
  [userSchoolId]
);
  
  return rows;
}
module.exports = {
  registerUser,
  loginPC,
  loginWxMiniprogram,
  bindWxMiniprogram,
  registerWxMiniprogram,
  logoutUser,
  getUserInfo,
  updateUserInfo,
  uploadAvatar,
  updateUserAvatar,
  updatePhoneList,
  getPhoneList,
  getSchoolPhoneList,
  searchSchoolPhoneList,
  getAllSchools,
  getSchoolTeachers,
};
