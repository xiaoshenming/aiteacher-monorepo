const db = require("../../config/db");

/**
 * 创建一个新班级
 */
async function createClass(teacherId, classData) {
  const connection = db.promise();
  try {
    // 获取用户的uid
    const [userResult] = await connection.query(
      "SELECT uid FROM loginverification WHERE id = ?",
      [teacherId]
    );

    if (userResult.length === 0) {
      throw new Error("教师不存在");
    }

    const teacherUid = userResult[0].uid;

    const [result] = await connection.query(
      "INSERT INTO class (class_name, grade, school_year, semester, capacity, schoolId, head_teacher_id, classroom) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        classData.className,
        classData.grade,
        classData.schoolYear,
        classData.semester,
        classData.capacity || 50,
        classData.schoolId,
        teacherUid,
        classData.classroom || null,
      ]
    );

    return { classId: result.insertId, message: "班级创建成功" };
  } catch (error) {
    throw error;
  }
}

/**
 * 获取教师创建的班级
 */
async function getTeacherClasses(teacherId) {
  const connection = db.promise();

  // 获取用户的uid
  const [userResult] = await connection.query(
    "SELECT uid FROM loginverification WHERE id = ?",
    [teacherId]
  );

  if (userResult.length === 0) {
    throw new Error("教师不存在");
  }

  const teacherUid = userResult[0].uid;

  const [rows] = await connection.query(
    `SELECT * FROM class 
     WHERE head_teacher_id = ? AND status = 1
     ORDER BY createTime DESC`,
    [teacherUid]
  );
  return rows;
}

/**
 * 获取班级详情，包括学生信息
 */
async function getClassDetails(classId, teacherId) {
  const connection = db.promise();

  // 获取用户的uid
  const [userResult] = await connection.query(
    "SELECT uid FROM loginverification WHERE id = ?",
    [teacherId]
  );

  if (userResult.length === 0) {
    throw new Error("教师不存在");
  }

  const teacherUid = userResult[0].uid;

  // 获取班级信息
  const [classRows] = await connection.query(
    "SELECT * FROM class WHERE id = ?",
    [classId]
  );

  if (classRows.length === 0) {
    throw new Error("班级不存在");
  }

  // 检查教师是否为班主任或在该班级教授任何课程
  const [teacherCheck] = await connection.query(
    `SELECT 1 FROM class WHERE id = ? AND head_teacher_id = ?
     UNION
     SELECT 1 FROM course_class WHERE class_id = ? AND teacher_id = ?`,
    [classId, teacherUid, classId, teacherUid]
  );

  if (teacherCheck.length === 0) {
    throw new Error("您不是该班级的班主任或课程教师，无权查看详情");
  }

  // 获取班级学生
  const [studentRows] = await connection.query(
    `SELECT cs.*, s.username, s.student_number, s.gender, s.phoneNumber, s.email, s.avatar
     FROM class_student cs
     JOIN student s ON cs.student_id = s.id
     WHERE cs.class_id = ? AND cs.status = 1
     ORDER BY cs.seat_number`,
    [classId]
  );

  // 获取关联到班级的课程
  const [courseRows] = await connection.query(
    `SELECT cc.*, c.name as course_name, c.subject, u.username as teacher_name
     FROM course_class cc
     JOIN course c ON cc.course_id = c.id
     JOIN teacher_course tc ON c.id = tc.course_id AND tc.is_main_teacher = 1
     JOIN user u ON tc.teacher_id = u.id
     WHERE cc.class_id = ? AND cc.status = 1`,
    [classId]
  );

  return {
    class: classRows[0],
    students: studentRows,
    courses: courseRows,
  };
}

/**
 * 将学生添加到班级
 */
async function addStudentToClass(classId, teacherId, studentData) {
  const connection = db.promise();
  await connection.beginTransaction();
  try {
    // 获取用户的uid
    const [userResult] = await connection.query(
      "SELECT uid FROM loginverification WHERE id = ?",
      [teacherId]
    );

    if (userResult.length === 0) {
      throw new Error("教师不存在");
    }

    const teacherUid = userResult[0].uid;

    // 检查教师是否为班主任
    const [classCheck] = await connection.query(
      "SELECT id FROM class WHERE id = ? AND head_teacher_id = ? AND status = 1",
      [classId, teacherUid]
    );

    if (classCheck.length === 0) {
      throw new Error("您不是该班级的班主任，无权添加学生");
    }

    // 检查学生是否存在
    const [studentCheck] = await connection.query(
      "SELECT id FROM student WHERE id = ?",
      [studentData.studentId]
    );

    if (studentCheck.length === 0) {
      throw new Error("学生不存在");
    }

    // 检查学生是否已在班级中
    const [existingCheck] = await connection.query(
      "SELECT id FROM class_student WHERE class_id = ? AND student_id = ? AND status = 1",
      [classId, studentData.studentId]
    );

    if (existingCheck.length > 0) {
      throw new Error("该学生已在班级中");
    }

    // 将学生添加到班级
    await connection.query(
      "INSERT INTO class_student (class_id, student_id, join_date, seat_number, is_monitor) VALUES (?, ?, CURDATE(), ?, ?)",
      [
        classId,
        studentData.studentId,
        studentData.seatNumber || null,
        studentData.isMonitor ? 1 : 0,
      ]
    );

    await connection.commit();
    return { message: "学生添加成功" };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

/**
 * 从班级中移除学生
 */
async function removeStudentFromClass(classId, teacherId, studentId) {
  const connection = db.promise();
  await connection.beginTransaction();
  try {
    // 获取用户的uid
    const [userResult] = await connection.query(
      "SELECT uid FROM loginverification WHERE id = ?",
      [teacherId]
    );

    if (userResult.length === 0) {
      throw new Error("教师不存在");
    }

    const teacherUid = userResult[0].uid;

    // 检查教师是否为班主任
    const [classCheck] = await connection.query(
      "SELECT id FROM class WHERE id = ? AND head_teacher_id = ? AND status = 1",
      [classId, teacherUid]
    );

    if (classCheck.length === 0) {
      throw new Error("您不是该班级的班主任，无权移除学生");
    }

    // 检查学生是否在班级中
    const [studentCheck] = await connection.query(
      "SELECT id FROM class_student WHERE class_id = ? AND student_id = ? AND status = 1",
      [classId, studentId]
    );

    if (studentCheck.length === 0) {
      throw new Error("该学生不在班级中");
    }

    // 从班级移除学生（标记为非活动）
    await connection.query(
      "UPDATE class_student SET status = 0, leave_date = CURDATE() WHERE class_id = ? AND student_id = ?",
      [classId, studentId]
    );

    await connection.commit();
    return { message: "学生移除成功" };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

module.exports = {
  createClass,
  getTeacherClasses,
  getClassDetails,
  addStudentToClass,
  removeStudentFromClass,
};
