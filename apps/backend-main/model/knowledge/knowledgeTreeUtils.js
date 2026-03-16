const db = require("../../config/db");

function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

async function getTree(filters = {}) {
  let sql = "SELECT * FROM knowledge_tree WHERE 1=1";
  const params = [];
  if (filters.subject) {
    sql += " AND subject = ?";
    params.push(filters.subject);
  }
  if (filters.grade) {
    sql += " AND grade = ?";
    params.push(filters.grade);
  }
  if (filters.school_id) {
    sql += " AND (school_id = ? OR is_public = 1)";
    params.push(filters.school_id);
  }
  sql += " ORDER BY sort_order ASC, id ASC";
  return dbQuery(sql, params);
}

async function getChildren(parentId) {
  return dbQuery(
    "SELECT * FROM knowledge_tree WHERE parent_id = ? ORDER BY sort_order ASC",
    [parentId]
  );
}

async function createNode(data) {
  const {
    parent_id = null, name, node_type = "chapter", sort_order = 0,
    grade = null, subject = null, description = null,
    created_by, is_public = 0, school_id = null,
  } = data;
  const result = await dbQuery(
    `INSERT INTO knowledge_tree
     (parent_id, name, node_type, sort_order, grade, subject, description, created_by, is_public, school_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [parent_id, name, node_type, sort_order, grade, subject, description, created_by, is_public, school_id]
  );
  return { id: result.insertId, ...data };
}

async function updateNode(id, data) {
  const fields = [];
  const params = [];
  for (const key of ["name", "node_type", "sort_order", "grade", "subject", "description", "is_public", "parent_id"]) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }
  if (!fields.length) return { affectedRows: 0 };
  params.push(id);
  return dbQuery(`UPDATE knowledge_tree SET ${fields.join(", ")} WHERE id = ?`, params);
}

async function deleteNode(id) {
  const children = await dbQuery("SELECT id FROM knowledge_tree WHERE parent_id = ?", [id]);
  for (const child of children) {
    await deleteNode(child.id);
  }
  await dbQuery("DELETE FROM resource_node_map WHERE node_id = ?", [id]);
  return dbQuery("DELETE FROM knowledge_tree WHERE id = ?", [id]);
}

async function attachResource(nodeId, resourceType, resourceId, createdBy) {
  const result = await dbQuery(
    "INSERT INTO resource_node_map (node_id, resource_type, resource_id, created_by) VALUES (?, ?, ?, ?)",
    [nodeId, resourceType, resourceId, createdBy]
  );
  return { id: result.insertId };
}

async function detachResource(mapId) {
  return dbQuery("DELETE FROM resource_node_map WHERE id = ?", [mapId]);
}

async function getNodeResources(nodeId, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  const [rows, countResult] = await Promise.all([
    dbQuery(
      `SELECT m.id AS map_id, m.resource_type, m.resource_id, m.created_at,
              COALESCE(q.title, f.name, e.name, cf.name) AS resource_name
       FROM resource_node_map m
       LEFT JOIN question q ON m.resource_type = 'question' AND m.resource_id = q.id
       LEFT JOIN file f ON m.resource_type = 'resource' AND m.resource_id = f.id
       LEFT JOIN lessonplans e ON m.resource_type = 'lesson_plan' AND m.resource_id = e.id
       LEFT JOIN file cf ON m.resource_type = 'cloud_file' AND m.resource_id = cf.id
       WHERE m.node_id = ?
       ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
      [nodeId, pageSize, offset]
    ),
    dbQuery("SELECT COUNT(*) AS total FROM resource_node_map WHERE node_id = ?", [nodeId]),
  ]);
  return { list: rows, total: countResult[0].total, page, pageSize };
}

module.exports = {
  getTree, getChildren, createNode, updateNode, deleteNode,
  attachResource, detachResource, getNodeResources,
};
