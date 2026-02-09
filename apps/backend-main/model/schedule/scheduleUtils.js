// model\schedule\scheduleUtils.js
const db = require("../../config/db");

/**
 * 根据鉴权 token 中的 id 获取真实用户 uid
 * @param {number|string} authId
 * @returns {Promise<number>}
 */
async function getUserUid(authId) {
  const [lvRows] = await db
    .promise()
    .query("SELECT uid FROM loginverification WHERE id = ?", [authId]);
  if (!lvRows || lvRows.length === 0) {
    throw new Error("用户不存在");
  }
  return lvRows[0].uid;
}

/**
 * 获取指定用户的所有课程表（按状态和创建时间排序）
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function getCourseSchedules(userId) {
  const [rows] = await db
    .promise()
    .query(
      "SELECT * FROM course_schedule WHERE user_id = ? ORDER BY status DESC, created_at DESC",
      [userId]
    );
  return rows;
}

/**
 * 创建新的课程表，如果 status 为 1，则先将其他课程表置为历史记录状态（0）
 * @param {number} userId
 * @param {Object} data
 * @param {string} data.schedule_name
 * @param {Object|string} data.schedule_data
 * @param {number} [data.status=0]
 * @returns {Promise<number>} 插入记录的 ID
 */
async function createCourseSchedule(
  userId,
  { schedule_name, schedule_data, status }
) {
  if (!schedule_name || !schedule_data) {
    throw new Error("缺少必要字段：课程表名称或详细数据");
  }
  let scheduleDataJson;
  if (typeof schedule_data === "object") {
    scheduleDataJson = JSON.stringify(schedule_data);
  } else {
    try {
      JSON.parse(schedule_data);
      scheduleDataJson = schedule_data;
    } catch (error) {
      throw new Error("课程表详细数据格式错误，应为有效的 JSON");
    }
  }

  // 如果新建时 status 为 1（当前使用），则将该用户其他课程表状态置为 0（历史记录）
  if (status == 1) {
    await db
      .promise()
      .execute("UPDATE course_schedule SET status = 0 WHERE user_id = ?", [
        userId,
      ]);
  }
  const [result] = await db
    .promise()
    .execute(
      "INSERT INTO course_schedule (user_id, schedule_name, schedule_data, status) VALUES (?, ?, ?, ?)",
      [userId, schedule_name, scheduleDataJson, status || 0]
    );
  return result.insertId;
}

/**
 * 更新指定的课程表记录
 * @param {number} userId
 * @param {number|string} scheduleId
 * @param {Object} data
 * @param {string} [data.schedule_name]
 * @param {Object|string} [data.schedule_data]
 * @param {number} [data.status]
 * @returns {Promise<void>}
 */
async function updateCourseSchedule(
  userId,
  scheduleId,
  { schedule_name, schedule_data, status }
) {
  if (!schedule_name && !schedule_data && status === undefined) {
    throw new Error("没有需要更新的字段");
  }
  const fields = [];
  const params = [];

  if (schedule_name) {
    fields.push("schedule_name = ?");
    params.push(schedule_name);
  }
  if (schedule_data) {
    let scheduleDataJson;
    if (typeof schedule_data === "object") {
      scheduleDataJson = JSON.stringify(schedule_data);
    } else {
      try {
        JSON.parse(schedule_data);
        scheduleDataJson = schedule_data;
      } catch (error) {
        throw new Error("课程表详细数据格式错误，应为有效的 JSON");
      }
    }
    fields.push("schedule_data = ?");
    params.push(scheduleDataJson);
  }
  if (status !== undefined) {
    if (status == 1) {
      // 将当前用户其他课程表状态置为 0，再将选中记录更新为 1
      await db
        .promise()
        .execute("UPDATE course_schedule SET status = 0 WHERE user_id = ?", [
          userId,
        ]);
    }
    fields.push("status = ?");
    params.push(status);
  }

  params.push(scheduleId);
  params.push(userId);
  const sql = `UPDATE course_schedule SET ${fields.join(
    ", "
  )} WHERE id = ? AND user_id = ?`;
  await db.promise().execute(sql, params);
}

/**
 * 删除指定的课程表记录（需确保记录存在且归属当前用户）
 * @param {number} userId
 * @param {number|string} scheduleId
 * @returns {Promise<void>}
 */
async function deleteCourseSchedule(userId, scheduleId) {
  const [existingRows] = await db
    .promise()
    .query("SELECT * FROM course_schedule WHERE id = ? AND user_id = ?", [
      scheduleId,
      userId,
    ]);
  if (!existingRows || existingRows.length === 0) {
    throw new Error("课程表不存在或无权限操作");
  }
  await db
    .promise()
    .execute("DELETE FROM course_schedule WHERE id = ? AND user_id = ?", [
      scheduleId,
      userId,
    ]);
}

module.exports = {
  getUserUid,
  getCourseSchedules,
  createCourseSchedule,
  updateCourseSchedule,
  deleteCourseSchedule,
};
