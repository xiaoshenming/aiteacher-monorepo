const db = require("../../config/db");

/**
 * 创建新课程
 */
async function createCourse(teacherId, courseData) {
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

    // 插入课程记录
    const [courseResult] = await connection.query(
      "INSERT INTO course (course_code, name, subject, description, grade_level, credit, hours, is_elective, textbook_id, cover_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        courseData.courseCode,
        courseData.name,
        courseData.subject,
        courseData.description,
        courseData.gradeLevel,
        courseData.credit || 0.0,
        courseData.hours || 0,
        courseData.isElective ? 1 : 0,
        courseData.textbookId || null,
        courseData.coverImage || null,
      ]
    );

    const courseId = courseResult.insertId;

    // 将教师关联到课程作为主讲教师
    await connection.query(
      "INSERT INTO teacher_course (teacher_id, course_id, is_main_teacher, start_date) VALUES (?, ?, 1, CURDATE())",
      [teacherUid, courseId]
    );

    await connection.commit();
    return { courseId, message: "课程创建成功" };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

/**
 * 获取教师所教授的课程
 */
async function getTeacherCourses(teacherId) {
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

    // 使用uid查询课程，并统计班级数量和学生数量
    const [rows] = await connection.query(
      `SELECT c.*, tc.is_main_teacher,
              (SELECT COUNT(*) FROM course_class cc WHERE cc.course_id = c.id AND cc.status = 1) as class_count,
              (SELECT COUNT(cs.student_id) 
               FROM class_student cs 
               JOIN course_class cc ON cs.class_id = cc.class_id 
               WHERE cc.course_id = c.id AND cc.status = 1 AND cs.status = 1) as student_count
       FROM course c
       JOIN teacher_course tc ON c.id = tc.course_id
       WHERE tc.teacher_id = ? AND tc.status = 1
       ORDER BY tc.is_main_teacher DESC, c.id DESC`,
      [teacherUid]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

/**
 * 添加助教到课程
 */
async function addCourseAssistant(courseId, mainTeacherId, assistantId) {
  const connection = db.promise();
  await connection.beginTransaction();
  try {
    // 获取用户的uid
    const [userResult] = await connection.query(
      "SELECT uid FROM loginverification WHERE id = ?",
      [mainTeacherId]
    );

    if (userResult.length === 0) {
      throw new Error("教师不存在");
    }
    const teacherUid = userResult[0].uid;
    // 检查课程是否存在且用户是主讲教师
    const [courseCheck] = await connection.query(
      `SELECT c.id FROM course c
       JOIN teacher_course tc ON c.id = tc.course_id
       WHERE c.id = ? AND tc.teacher_id = ? AND tc.is_main_teacher = 1`,
      [courseId, teacherUid]
    );

    if (courseCheck.length === 0) {
      throw new Error("您不是该课程的主讲教师，无权添加助教");
    }

    // 检查助教是否已关联到该课程
    const [assistantCheck] = await connection.query(
      "SELECT id, status FROM teacher_course WHERE course_id = ? AND teacher_id = ?",
      [courseId, assistantId]
    );

    if (assistantCheck.length > 0) {
      if (assistantCheck[0].status === 1) {
        throw new Error("该教师已经是课程的教师或助教");
      } else {
        // 助教之前被移除，重新激活
        await connection.query(
          "UPDATE teacher_course SET status = 1, end_date = NULL, start_date = CURDATE() WHERE course_id = ? AND teacher_id = ?",
          [courseId, assistantId]
        );
      }
    } else {
      // 添加助教到课程
      await connection.query(
        "INSERT INTO teacher_course (teacher_id, course_id, is_main_teacher, start_date) VALUES (?, ?, 0, CURDATE())",
        [assistantId, courseId]
      );
    }

    await connection.commit();
    return { message: "助教添加成功" };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

/**
 * 从课程中移除助教
 */
async function removeCourseAssistant(courseId, mainTeacherId, assistantId) {
  const connection = db.promise();
  await connection.beginTransaction();
  try {
    // 获取主讲教师uid
    const [mainTeacherResult] = await connection.query(
      "SELECT uid FROM loginverification WHERE id = ?",
      [mainTeacherId]
    );

    if (mainTeacherResult.length === 0) {
      throw new Error("主讲教师不存在");
    }

    const mainTeacherUid = mainTeacherResult[0].uid;



    // 检查课程是否存在且用户是主讲教师
    const [courseCheck] = await connection.query(
      `SELECT c.id FROM course c
       JOIN teacher_course tc ON c.id = tc.course_id
       WHERE c.id = ? AND tc.teacher_id = ? AND tc.is_main_teacher = 1`,
      [courseId, mainTeacherUid]
    );

    if (courseCheck.length === 0) {
      throw new Error("您不是该课程的主讲教师，无权移除助教");
    }

    // 检查助教是否关联到该课程且不是主讲教师
    const [assistantCheck] = await connection.query(
      "SELECT id FROM teacher_course WHERE course_id = ? AND teacher_id = ? AND is_main_teacher = 0",
      [courseId, assistantId]
    );

    if (assistantCheck.length === 0) {
      throw new Error("该教师不是课程的助教");
    }

    // 从课程中移除助教
    await connection.query(
      "UPDATE teacher_course SET status = 0, end_date = CURDATE() WHERE course_id = ? AND teacher_id = ?",
      [courseId, assistantId]
    );

    await connection.commit();
    return { message: "助教移除成功" };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

/**
 * 添加班级到课程
 */
async function addClassToCourse(courseId, teacherId, classData) {
  const connection = db.promise();
  await connection.beginTransaction();
  try {
    // 获取教师uid
    const [teacherResult] = await connection.query(
      "SELECT uid FROM loginverification WHERE id = ?",
      [teacherId]
    );

    if (teacherResult.length === 0) {
      throw new Error("教师不存在");
    }

    const teacherUid = teacherResult[0].uid;

    // 检查教师是否与课程关联
    const [courseCheck] = await connection.query(
      "SELECT id FROM teacher_course WHERE course_id = ? AND teacher_id = ? AND status = 1",
      [courseId, teacherUid]
    );

    if (courseCheck.length === 0) {
      throw new Error("您不是该课程的教师，无权添加班级");
    }

    // 处理班级ID
    let classId = classData.classId;
    if (classId) {
      // 验证班级ID是否存在
      const [classExists] = await connection.query(
        "SELECT id FROM class WHERE id = ?",
        [classId]
      );

      if (classExists.length === 0) {
        throw new Error("提供的班级ID不存在，请确认后重试");
      }
    } else {
      // 创建新班级
      const [classResult] = await connection.query(
        "INSERT INTO class (class_name, grade, school_year, semester, capacity, schoolId, head_teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          classData.className,
          classData.grade,
          classData.schoolYear,
          classData.semester,
          classData.capacity || 50,
          classData.schoolId,
          teacherUid,
        ]
      );
      classId = classResult.insertId;
    }

    // 检查班级是否已关联到该课程
    const [classCheck] = await connection.query(
      "SELECT id FROM course_class WHERE course_id = ? AND class_id = ?",
      [courseId, classId]
    );

    if (classCheck.length > 0) {
      throw new Error("该班级已关联到此课程");
    }

    // 将班级关联到课程
    await connection.query(
      "INSERT INTO course_class (course_id, class_id, teacher_id, schedule_day, start_time, end_time, classroom, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())",
      [
        courseId,
        classId,
        teacherUid,
        classData.scheduleDay,
        classData.startTime,
        classData.endTime,
        classData.classroom,
      ]
    );

    await connection.commit();
    return { classId, message: "班级添加成功" };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

/**
 * 获取课程详情，包括班级和助教信息
 */
async function getCourseDetails(courseId, teacherId) {
  const connection = db.promise();
  try {
    // 获取教师uid
    const [teacherResult] = await connection.query(
      "SELECT uid FROM loginverification WHERE id = ?",
      [teacherId]
    );

    if (teacherResult.length === 0) {
      throw new Error("教师不存在");
    }

    const teacherUid = teacherResult[0].uid;

    // 获取课程信息
    const [courseRows] = await connection.query(
      "SELECT * FROM course WHERE id = ?",
      [courseId]
    );

    if (courseRows.length === 0) {
      throw new Error("课程不存在");
    }

    // 检查教师是否与课程关联
    const [teacherCheck] = await connection.query(
      "SELECT is_main_teacher FROM teacher_course WHERE course_id = ? AND teacher_id = ? AND status = 1",
      [courseId, teacherUid]
    );

    if (teacherCheck.length === 0) {
      throw new Error("您不是该课程的教师，无权查看详情");
    }

    const isMainTeacher = teacherCheck[0].is_main_teacher === 1;

    // 获取关联到课程的班级（含学生数）
    const [classRows] = await connection.query(
      `SELECT cc.*, c.class_name AS name, c.grade, c.capacity, c.schoolId,
              (SELECT COUNT(*) FROM class_student cs WHERE cs.class_id = cc.class_id AND cs.status = 1) AS student_count
       FROM course_class cc
       JOIN class c ON cc.class_id = c.id
       WHERE cc.course_id = ? AND cc.status = 1`,
      [courseId]
    );

    // 获取助教（非主讲教师）
    const [assistantRows] = await connection.query(
      `SELECT tc.*, u.username as teacher_name, u.email, u.phoneNumber
       FROM teacher_course tc
       JOIN user u ON tc.teacher_id = u.id
       WHERE tc.course_id = ? AND tc.is_main_teacher = 0 AND tc.status = 1`,
      [courseId]
    );

    return {
      course: courseRows[0],
      classes: classRows,
      assistants: assistantRows,
      isMainTeacher,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 更新课程信息
 */
async function updateCourse(courseId, teacherId, courseData) {
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

    // 验证是否为主讲教师
    const [teacherCourse] = await connection.query(
      "SELECT * FROM teacher_course WHERE teacher_id = ? AND course_id = ? AND is_main_teacher = 1",
      [teacherUid, courseId]
    );

    if (teacherCourse.length === 0) {
      throw new Error("只有主讲教师可以编辑课程");
    }

    // 构建更新字段
    const updates = [];
    const values = [];

    if (courseData.name !== undefined) {
      updates.push("name = ?");
      values.push(courseData.name);
    }
    if (courseData.subject !== undefined) {
      updates.push("subject = ?");
      values.push(courseData.subject);
    }
    if (courseData.description !== undefined) {
      updates.push("description = ?");
      values.push(courseData.description);
    }
    if (courseData.credit !== undefined) {
      updates.push("credit = ?");
      values.push(courseData.credit);
    }
    if (courseData.hours !== undefined) {
      updates.push("hours = ?");
      values.push(courseData.hours);
    }
    if (courseData.gradeLevel !== undefined) {
      updates.push("grade_level = ?");
      values.push(courseData.gradeLevel);
    }
    if (courseData.difficulty !== undefined) {
      updates.push("difficulty = ?");
      values.push(courseData.difficulty);
    }
    if (courseData.isElective !== undefined) {
      updates.push("is_elective = ?");
      values.push(courseData.isElective ? 1 : 0);
    }
    if (courseData.coverImage !== undefined) {
      updates.push("cover_image = ?");
      values.push(courseData.coverImage);
    }
    if (courseData.textbookId !== undefined) {
      updates.push("textbook_id = ?");
      values.push(courseData.textbookId);
    }

    if (updates.length === 0) {
      throw new Error("没有需要更新的字段");
    }

    // 更新课程
    values.push(courseId);
    await connection.query(
      `UPDATE course SET ${updates.join(", ")}, updateTime = NOW() WHERE id = ?`,
      values
    );

    return { message: "课程更新成功" };
  } catch (error) {
    throw error;
  }
}

/**
 * 删除课程
 */
async function deleteCourse(courseId, userId, userRole) {
  const connection = db.promise();
  await connection.beginTransaction();

  try {
    // 检查权限：管理员(3)、超级管理员(4) 或 主讲教师
    let hasPermission = false;

    if (userRole >= 3) {
      // 管理员和超级管理员可以删除任何课程
      hasPermission = true;
    } else {
      // 普通教师需要验证是否为主讲教师
      const [userResult] = await connection.query(
        "SELECT uid FROM loginverification WHERE id = ?",
        [userId]
      );

      if (userResult.length > 0) {
        const teacherUid = userResult[0].uid;
        const [teacherCourse] = await connection.query(
          "SELECT * FROM teacher_course WHERE teacher_id = ? AND course_id = ? AND is_main_teacher = 1",
          [teacherUid, courseId]
        );
        hasPermission = teacherCourse.length > 0;
      }
    }

    if (!hasPermission) {
      throw new Error("没有权限删除此课程");
    }

    // 删除关联的助教记录
    await connection.query(
      "DELETE FROM teacher_course WHERE course_id = ?",
      [courseId]
    );

    // 删除关联的班级记录
    await connection.query(
      "DELETE FROM course_class WHERE course_id = ?",
      [courseId]
    );

    // 删除课程
    await connection.query("DELETE FROM course WHERE id = ?", [courseId]);

    await connection.commit();
    return { message: "课程删除成功" };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

module.exports = {
  createCourse,
  getTeacherCourses,
  addCourseAssistant,
  removeCourseAssistant,
  addClassToCourse,
  getCourseDetails,
  updateCourse,
  deleteCourse,
};
