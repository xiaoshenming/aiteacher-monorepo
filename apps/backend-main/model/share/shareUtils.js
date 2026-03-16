const db = require("../../config/db");
const logger = require("../../utils/logger");

function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

// 创建共享记录
async function createShare(data) {
  const {
    resource_type,
    resource_id,
    sharer_id,
    share_scope,
    target_user_id,
    school_id,
    permission,
    message,
  } = data;
  const sql = `INSERT INTO resource_shares
    (resource_type, resource_id, sharer_id, share_scope, target_user_id, school_id, permission, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const result = await dbQuery(sql, [
    resource_type,
    resource_id,
    sharer_id,
    share_scope || "public",
    target_user_id || null,
    school_id || null,
    permission || "view",
    message || null,
  ]);
  return result;
}

// 撤销共享（验证 sharer_id）
async function deleteShare(id, userId) {
  const sql = `DELETE FROM resource_shares WHERE id = ? AND sharer_id = ?`;
  const result = await dbQuery(sql, [id, userId]);
  return result;
}

// 我分享的资源（分页）
async function getMyShares(userId, page = 1, pageSize = 10) {
  const offset = (page - 1) * pageSize;
  const countSql = `SELECT COUNT(*) AS total FROM resource_shares WHERE sharer_id = ?`;
  const dataSql = `SELECT * FROM resource_shares WHERE sharer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const [countResult, dataResult] = await Promise.all([
    dbQuery(countSql, [userId]),
    dbQuery(dataSql, [userId, pageSize, offset]),
  ]);
  return { total: countResult[0].total, list: dataResult };
}

// 分享给我的
async function getSharedToMe(userId, page = 1, pageSize = 10) {
  const offset = (page - 1) * pageSize;
  const countSql = `SELECT COUNT(*) AS total FROM resource_shares
    WHERE target_user_id = ? OR (share_scope = 'school' AND school_id IN
      (SELECT school_id FROM resource_shares WHERE sharer_id = ?))`;
  const dataSql = `SELECT * FROM resource_shares
    WHERE target_user_id = ? OR (share_scope = 'school' AND school_id IN
      (SELECT school_id FROM resource_shares WHERE sharer_id = ?))
    ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const [countResult, dataResult] = await Promise.all([
    dbQuery(countSql, [userId, userId]),
    dbQuery(dataSql, [userId, userId, pageSize, offset]),
  ]);
  return { total: countResult[0].total, list: dataResult };
}

// 公开资源广场
async function getPublicShares(page = 1, pageSize = 10, filters = {}) {
  const offset = (page - 1) * pageSize;
  let where = `share_scope = 'public'`;
  const params = [];
  if (filters.resource_type) {
    where += ` AND resource_type = ?`;
    params.push(filters.resource_type);
  }
  const countSql = `SELECT COUNT(*) AS total FROM resource_shares WHERE ${where}`;
  const dataSql = `SELECT * FROM resource_shares WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const [countResult, dataResult] = await Promise.all([
    dbQuery(countSql, params),
    dbQuery(dataSql, [...params, pageSize, offset]),
  ]);
  return { total: countResult[0].total, list: dataResult };
}

// 校内共享
async function getSchoolShares(schoolId, page = 1, pageSize = 10) {
  const offset = (page - 1) * pageSize;
  const countSql = `SELECT COUNT(*) AS total FROM resource_shares WHERE share_scope = 'school' AND school_id = ?`;
  const dataSql = `SELECT * FROM resource_shares WHERE share_scope = 'school' AND school_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const [countResult, dataResult] = await Promise.all([
    dbQuery(countSql, [schoolId]),
    dbQuery(dataSql, [schoolId, pageSize, offset]),
  ]);
  return { total: countResult[0].total, list: dataResult };
}

// 收藏
async function addFavorite(userId, resourceType, resourceId) {
  const sql = `INSERT IGNORE INTO resource_favorites (user_id, resource_type, resource_id) VALUES (?, ?, ?)`;
  return await dbQuery(sql, [userId, resourceType, resourceId]);
}

// 取消收藏
async function removeFavorite(id, userId) {
  const sql = `DELETE FROM resource_favorites WHERE id = ? AND user_id = ?`;
  return await dbQuery(sql, [id, userId]);
}

// 收藏列表
async function getFavorites(userId, page = 1, pageSize = 10) {
  const offset = (page - 1) * pageSize;
  const countSql = `SELECT COUNT(*) AS total FROM resource_favorites WHERE user_id = ?`;
  const dataSql = `SELECT * FROM resource_favorites WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const [countResult, dataResult] = await Promise.all([
    dbQuery(countSql, [userId]),
    dbQuery(dataSql, [userId, pageSize, offset]),
  ]);
  return { total: countResult[0].total, list: dataResult };
}

// 创建标签
async function createTag(userId, name, color) {
  const sql = `INSERT INTO resource_tags (user_id, name, color) VALUES (?, ?, ?)`;
  return await dbQuery(sql, [userId, name, color || null]);
}

// 删除标签（级联删除 tag_map）
async function deleteTag(id, userId) {
  await dbQuery(`DELETE FROM resource_tag_map WHERE tag_id = ?`, [id]);
  const result = await dbQuery(
    `DELETE FROM resource_tags WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return result;
}

// 标签列表
async function getTags(userId) {
  const sql = `SELECT * FROM resource_tags WHERE user_id = ? ORDER BY created_at DESC`;
  return await dbQuery(sql, [userId]);
}

// 打标签
async function bindTag(tagId, resourceType, resourceId) {
  const sql = `INSERT IGNORE INTO resource_tag_map (tag_id, resource_type, resource_id) VALUES (?, ?, ?)`;
  return await dbQuery(sql, [tagId, resourceType, resourceId]);
}

// 移除标签
async function unbindTag(tagId, resourceType, resourceId) {
  const sql = `DELETE FROM resource_tag_map WHERE tag_id = ? AND resource_type = ? AND resource_id = ?`;
  return await dbQuery(sql, [tagId, resourceType, resourceId]);
}

module.exports = {
  createShare,
  deleteShare,
  getMyShares,
  getSharedToMe,
  getPublicShares,
  getSchoolShares,
  addFavorite,
  removeFavorite,
  getFavorites,
  createTag,
  deleteTag,
  getTags,
  bindTag,
  unbindTag,
};
