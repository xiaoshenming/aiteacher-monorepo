// model/admin/adminUtils.js
const db = require("../../config/db");
const bcrypt = require("bcryptjs");

/** 获取管理员所在学校的所有用户 */
async function getSchoolUsers(adminId) {
  const connection = db.promise();
  const [lvRows] = await connection.query(
    "SELECT * FROM loginverification WHERE id = ?",
    [adminId]
  );
  if (!lvRows || lvRows.length === 0) {
    throw new Error("管理员信息不存在");
  }
  const loginUser = lvRows[0];
  let adminSchoolId = null;
  if (loginUser.uid) {
    const [adminUserRows] = await connection.query(
      "SELECT * FROM user WHERE id = ?",
      [loginUser.uid]
    );
    if (!adminUserRows || adminUserRows.length === 0) {
      throw new Error("管理员用户表信息不存在");
    }
    adminSchoolId = adminUserRows[0].schoolId;
  }
  if (!adminSchoolId) {
    throw new Error("管理员尚未绑定schoolId，无法操作用户");
  }
  const [rows] = await connection.query(
    `SELECT u.*, lv.role FROM user u
       LEFT JOIN loginverification lv ON u.id = lv.uid
      WHERE u.schoolId = ? ORDER BY u.id ASC`,
    [adminSchoolId]
  );
  return rows;
}

/** 新增用户（管理员） */
async function addUser(adminId, userData) {
  const connection = db.promise();
  const [lvRows] = await connection.query(
    "SELECT * FROM loginverification WHERE id = ?",
    [adminId]
  );
  if (!lvRows || lvRows.length === 0) {
    throw new Error("管理员信息不存在");
  }
  const loginUser = lvRows[0];
  let adminSchoolId = null;
  if (loginUser.uid) {
    const [adminUserRows] = await connection.query(
      "SELECT * FROM user WHERE id = ?",
      [loginUser.uid]
    );
    if (!adminUserRows || adminUserRows.length === 0) {
      throw new Error("管理员用户表信息不存在");
    }
    adminSchoolId = adminUserRows[0].schoolId;
  }
  if (!adminSchoolId) {
    throw new Error("管理员尚未绑定 schoolId，无法操作用户");
  }
  // 检查手机号是否已存在
  if (userData.phoneNumber) {
    const [existingPhone] = await connection.query(
      "SELECT id FROM user WHERE phoneNumber = ?",
      [userData.phoneNumber]
    );
    if (existingPhone.length > 0) {
      throw new Error("手机号已被注册");
    }
  }
  const newSchoolId = adminSchoolId;
  const hashedPassword = await bcrypt.hash(userData.password || "123456", 10);
  const finalRole = userData.role || "2";
  const finalopenid = "未绑定";
  await connection.beginTransaction();
  try {
    const [insertUserResult] = await connection.execute(
      `INSERT INTO user 
         (username, password, phoneNumber, email, schoolId, idCard, wechatId, avatar, openid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.username,
        hashedPassword,
        userData.phoneNumber,
        userData.email,
        newSchoolId,
        userData.idCard,
        userData.wechatId,
        userData.avatar,
        finalopenid,
      ]
    );
    const newUserId = insertUserResult.insertId;
    await connection.execute(
      `INSERT INTO loginverification 
         (name, email, password, phoneNumber, role, uid, openid)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.username,
        userData.email,
        hashedPassword,
        userData.phoneNumber,
        finalRole,
        newUserId,
        finalopenid,
      ]
    );
    await connection.commit();
    return { insertId: newUserId, message: "新增用户成功，并已同步到鉴权表" };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

/** 更新用户（管理员） */
async function updateUser(adminId, userId, updateData) {
  const connection = db.promise();
  const [rows] = await connection.query("SELECT * FROM user WHERE id = ?", [
    userId,
  ]);
  if (!rows || rows.length === 0) {
    throw new Error("要更新的用户不存在");
  }
  const targetUser = rows[0];
  const [lvRows] = await connection.query(
    "SELECT * FROM loginverification WHERE id = ?",
    [adminId]
  );
  if (!lvRows || lvRows.length === 0) {
    throw new Error("管理员信息不存在");
  }
  const loginUser = lvRows[0];
  let adminSchoolId = null;
  if (loginUser.uid) {
    const [adminUserRows] = await connection.query(
      "SELECT * FROM user WHERE id = ?",
      [loginUser.uid]
    );
    if (!adminUserRows || adminUserRows.length === 0) {
      throw new Error("管理员用户表信息不存在");
    }
    adminSchoolId = adminUserRows[0].schoolId;
  }
  if (!adminSchoolId) {
    throw new Error("管理员尚未绑定schoolId，无法操作用户");
  }
  if (targetUser.schoolId !== adminSchoolId) {
    throw new Error("无权限更新其他学校的用户");
  }
  // 检查新手机号是否重复
  if (updateData.phoneNumber) {
    const [existingPhone] = await connection.query(
      "SELECT id FROM user WHERE phoneNumber = ? AND id != ?",
      [updateData.phoneNumber, userId]
    );
    if (existingPhone.length > 0) {
      throw new Error("手机号已被其他用户使用");
    }
  }
  if (updateData.openid) {
    const [existingOpenid] = await connection.query(
      "SELECT id FROM user WHERE openid = ?",
      [updateData.openid]
    );
    if (existingOpenid.length > 0) {
      throw new Error("微信号已被注册");
    }
  }
  await connection.beginTransaction();
  try {
    let hashedPassword = null;
    if (updateData.password) {
      hashedPassword = await bcrypt.hash(updateData.password, 10);
    }
    const updateFields = [];
    const updateValues = [];
    if (updateData.username) {
      updateFields.push("username = ?");
      updateValues.push(updateData.username);
    }
    if (updateData.phoneNumber) {
      updateFields.push("phoneNumber = ?");
      updateValues.push(updateData.phoneNumber);
    }
    if (updateData.email) {
      updateFields.push("email = ?");
      updateValues.push(updateData.email);
    }
    if (hashedPassword) {
      updateFields.push("password = ?");
      updateValues.push(hashedPassword);
    }
    if (updateData.idCard) {
      updateFields.push("idCard = ?");
      updateValues.push(updateData.idCard);
    }
    if (updateData.wechatId) {
      updateFields.push("wechatId = ?");
      updateValues.push(updateData.wechatId);
    }
    if (updateData.avatar) {
      updateFields.push("avatar = ?");
      updateValues.push(updateData.avatar);
    }
    if (updateData.openid) {
      updateFields.push("openid = ?");
      updateValues.push(updateData.openid);
    }
    if (updateFields.length > 0) {
      updateValues.push(userId);
      const updateUserSql = `UPDATE user SET ${updateFields.join(
        ", "
      )} WHERE id = ?`;
      await connection.execute(updateUserSql, updateValues);
    }
    const [lvLinkedRows] = await connection.query(
      "SELECT * FROM loginverification WHERE uid = ?",
      [userId]
    );
    if (lvLinkedRows && lvLinkedRows.length > 0) {
      const linkedLV = lvLinkedRows[0];
      const lvUpdateFields = [];
      const lvUpdateValues = [];
      if (updateData.username) {
        lvUpdateFields.push("name = ?");
        lvUpdateValues.push(updateData.username);
      }
      if (updateData.phoneNumber) {
        lvUpdateFields.push("phoneNumber = ?");
        lvUpdateValues.push(updateData.phoneNumber);
      }
      if (updateData.email) {
        lvUpdateFields.push("email = ?");
        lvUpdateValues.push(updateData.email);
      }
      if (hashedPassword) {
        lvUpdateFields.push("password = ?");
        lvUpdateValues.push(hashedPassword);
      }
      if (updateData.role) {
        lvUpdateFields.push("role = ?");
        lvUpdateValues.push(updateData.role);
      }
      if (updateData.openid) {
        lvUpdateFields.push("openid = ?");
        lvUpdateValues.push(updateData.openid);
      }
      if (lvUpdateFields.length > 0) {
        lvUpdateValues.push(linkedLV.id);
        const updateLVSql = `UPDATE loginverification SET ${lvUpdateFields.join(
          ", "
        )} WHERE id = ?`;
        await connection.execute(updateLVSql, lvUpdateValues);
      }
    }
    await connection.commit();
    return { message: "更新用户成功(含鉴权表)" };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

/** 删除用户（管理员） */
async function deleteUser(adminId, userId) {
  const connection = db.promise();
  const [rows] = await connection.query("SELECT * FROM user WHERE id = ?", [
    userId,
  ]);
  if (!rows || rows.length === 0) {
    throw new Error("要删除的用户不存在");
  }
  const targetUser = rows[0];
  const [lvRows] = await connection.query(
    "SELECT * FROM loginverification WHERE id = ?",
    [adminId]
  );
  if (!lvRows || lvRows.length === 0) {
    throw new Error("管理员信息不存在");
  }
  const loginUser = lvRows[0];
  let adminSchoolId = null;
  if (loginUser.uid) {
    const [adminUserRows] = await connection.query(
      "SELECT * FROM user WHERE id = ?",
      [loginUser.uid]
    );
    if (!adminUserRows || adminUserRows.length === 0) {
      throw new Error("管理员用户表信息不存在");
    }
    adminSchoolId = adminUserRows[0].schoolId;
  }
  if (!adminSchoolId) {
    throw new Error("管理员尚未绑定schoolId，无法操作用户");
  }
  if (targetUser.schoolId !== adminSchoolId) {
    throw new Error("无权限删除其他学校的用户");
  }
  await connection.beginTransaction();
  try {
    await connection.execute("DELETE FROM loginverification WHERE uid = ?", [
      userId,
    ]);
    await connection.execute("DELETE FROM user WHERE id = ?", [userId]);
    await connection.commit();
    return { message: "删除用户成功(含鉴权表)" };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

module.exports = {
  getSchoolUsers,
  addUser,
  updateUser,
  deleteUser,
};
