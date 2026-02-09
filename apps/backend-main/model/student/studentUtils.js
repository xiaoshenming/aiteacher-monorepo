const db = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redis = require("../../config/redis");
require("dotenv").config();
const secret = process.env.JWT_SECRET;

/**
 * 生成JWT令牌
 */
function generateJWT(user, deviceType) {
  return jwt.sign(
    { id: user.id, role: user.role, device: deviceType },
    secret,
    { expiresIn: "168h" }
  );
}

/**
 * 将JWT保存到Redis
 */
async function saveJWTToRedis(userId, token, deviceType) {
  await redis.set(`user_${userId}_${deviceType}_token`, token, "EX", 3600);
}

/**
 * 从Redis删除JWT
 */
async function removeJWTFromRedis(userId, deviceType) {
  await redis.del(`user_${userId}_${deviceType}_token`);
}

/**
 * 学生登录
 */
async function loginStudent({ studentNumber, password }) {
  if (!studentNumber?.trim() || !password?.trim()) {
    throw new Error("学号和密码不能为空");
  }

  const connection = db.promise();

  // 首先通过学号查找学生
  const [studentRows] = await connection.query(
    "SELECT * FROM student WHERE student_number = ?",
    [studentNumber]
  );

  if (studentRows.length === 0) {
    throw new Error("学号不存在");
  }

  const student = studentRows[0];

  // 查找与该学生关联的登录验证记录
  const [loginRows] = await connection.query(
    "SELECT * FROM loginverification WHERE sid = ?",
    [student.id]
  );

  if (loginRows.length === 0) {
    throw new Error("账号未激活，请联系教师");
  }

  const loginInfo = loginRows[0];

  // 检查密码
  const validPassword = await bcrypt.compare(password, loginInfo.password);
  if (!validPassword) {
    throw new Error("密码错误");
  }

  // 生成令牌
  const token = generateJWT(loginInfo, "pc");
  await saveJWTToRedis(loginInfo.id, token, "pc");

  return {
    token,
    role: loginInfo.role,
    studentInfo: {
      id: student.id,
      name: student.username,
      studentNumber: student.student_number,
      avatar: student.avatar,
    },
  };
}

/**
 * 学生退出登录
 */
async function logoutStudent(userId, deviceType) {
  await removeJWTFromRedis(userId, deviceType);
  return { message: "退出登录成功" };
}

/**
 * 注册新学生账号
 */
async function registerStudent({
  studentNumber,
  name,
  password,
  email,
  phoneNumber,
  schoolId,
  code,
}) {
  // 必填字段验证
  if (!email?.trim() || !code?.trim() || !password?.trim()) {
    throw new Error("邮箱、验证码和密码为必填项");
  }

  // 邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("邮箱格式不正确");
  }

  // 密码强度验证
  if (password.length < 5) {
    throw new Error("密码长度不能少于6位");
  }

  // 手机号格式验证（如果提供）
  if (phoneNumber?.trim()) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error("手机号格式不正确");
    }
  }

  // 验证码校验
  const storedCode = await redis.get(`code_${email}`);
  if (storedCode !== code) {
    throw new Error("验证码不正确或已过期");
  }

  const connection = db.promise();
  await connection.beginTransaction();

  try {
    // 检查学号是否已存在（如果提供）
    if (studentNumber?.trim()) {
      const [existingStudent] = await connection.query(
        "SELECT id FROM student WHERE student_number = ?",
        [studentNumber]
      );

      if (existingStudent.length > 0) {
        throw new Error("该学号已被注册");
      }
    }

    // 检查邮箱是否已被使用
    const [existingEmail] = await connection.query(
      "SELECT id FROM loginverification WHERE email = ?",
      [email]
    );

    if (existingEmail.length > 0) {
      throw new Error("该邮箱已被注册");
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建学生记录
    const [studentResult] = await connection.query(
      "INSERT INTO student (username, student_number, phoneNumber, email, schoolId) VALUES (?, ?, ?, ?, ?)",
      [
        name || null,
        studentNumber || null,
        phoneNumber || null,
        email,
        schoolId || null,
      ]
    );

    const studentId = studentResult.insertId;

    // 创建登录验证记录，只设置sid而不设置uid
    await connection.query(
      'INSERT INTO loginverification (name, phoneNumber, email, password, role, sid) VALUES (?, ?, ?, ?, "0", ?)',
      [name || null, phoneNumber || null, email, hashedPassword, studentId]
    );

    await connection.commit();
    // 删除验证码
    await redis.del(`code_${email}`);
    return { message: "学生账号注册成功" };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}



/**
 * 获取学生课程
 */
async function getStudentCourses(studentId) {
  const connection = db.promise();

  const [rows] = await connection.query(
    `SELECT c.id, c.name, c.subject, c.description, c.cover_image,
            cls.class_name, cc.schedule_day, cc.start_time, cc.end_time, cc.classroom,
            u.username as teacher_name
     FROM class_student cs
     JOIN class cls ON cs.class_id = cls.id
     JOIN course_class cc ON cls.id = cc.class_id
     JOIN course c ON cc.course_id = c.id
     JOIN teacher_course tc ON c.id = tc.course_id AND tc.is_main_teacher = 1
     JOIN loginverification lv ON tc.teacher_id = lv.id
     JOIN user u ON lv.uid = u.id
     WHERE cs.student_id = ? AND cs.status = 1 AND cc.status = 1
     ORDER BY cc.schedule_day, cc.start_time`,
    [studentId]
  );

  return rows;
}

/**
 * 获取学生班级
 */
async function getStudentClasses(studentId) {
  const connection = db.promise();

  const [rows] = await connection.query(
    `SELECT c.id, c.class_name, c.grade, c.school_year, c.semester,
            u.username as head_teacher_name, cs.join_date, cs.seat_number, cs.is_monitor
     FROM class_student cs
     JOIN class c ON cs.class_id = c.id
     JOIN loginverification lv ON c.head_teacher_id = lv.id
     JOIN user u ON lv.uid = u.id
     WHERE cs.student_id = ? AND cs.status = 1
     ORDER BY cs.join_date DESC`,
    [studentId]
  );

  return rows;
}

/**
 * 获取学生个人信息
 */
async function getStudentProfile(studentId) {
  const connection = db.promise();

  const [rows] = await connection.query(
    `SELECT s.*, sc.schoolName
     FROM student s
     LEFT JOIN school sc ON s.schoolId = sc.id
     WHERE s.id = ?`,
    [studentId]
  );

  if (rows.length === 0) {
    throw new Error("学生不存在");
  }

  return rows[0];
}

/**
 * 更新学生个人信息
 */
async function updateStudentProfile(studentId, profileData) {
  const connection = db.promise();
  await connection.beginTransaction();

  try {
    // 更新学生记录
    await connection.query(
      `UPDATE student 
       SET phoneNumber = ?, 
           email = ?, 
           address = ?
       WHERE id = ?`,
      [
        profileData.phoneNumber,
        profileData.email,
        profileData.address,
        studentId,
      ]
    );

    // 获取学生的登录验证记录
    const [loginRows] = await connection.query(
      "SELECT id FROM loginverification WHERE sid = ?",
      [studentId]
    );

    if (loginRows.length > 0) {
      const loginId = loginRows[0].id;

      // 更新登录验证记录
      await connection.query(
        `UPDATE loginverification 
         SET phoneNumber = ?, 
             email = ?
         WHERE id = ?`,
        [profileData.phoneNumber, profileData.email, loginId]
      );
    }

    await connection.commit();
    return { message: "个人信息更新成功" };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}
/**
 * 搜索学生
 */
async function searchStudents(query) {
  const connection = db.promise();
  const searchPattern = `%${query}%`;

  const [rows] = await connection.query(
    `SELECT s.id, s.username, s.student_number, s.email, s.phoneNumber, s.address, 
            s.gender, s.birthday, s.avatar, s.schoolId, sc.schoolName
     FROM student s
     LEFT JOIN school sc ON s.schoolId = sc.id
     WHERE s.student_number LIKE ? 
        OR s.username LIKE ? 
        OR s.email LIKE ?
     LIMIT 20`,
    [searchPattern, searchPattern, searchPattern]
  );

  return rows;
}

module.exports = {
  loginStudent,
  logoutStudent,
  registerStudent,
  getStudentCourses,
  getStudentClasses,
  getStudentProfile,
  updateStudentProfile,
  searchStudents,
};
