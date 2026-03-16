const db = require("../../config/db");

function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

async function createSession(classId, courseId, teacherId) {
  const result = await dbQuery(
    `INSERT INTO classroom_sessions (class_id, course_id, teacher_id, status, started_at)
     VALUES (?, ?, ?, 'active', NOW())`,
    [classId, courseId, teacherId]
  );
  return { sessionId: result.insertId };
}

async function endSession(sessionId, teacherId) {
  const result = await dbQuery(
    `UPDATE classroom_sessions SET status = 'ended', ended_at = NOW()
     WHERE id = ? AND teacher_id = ? AND status = 'active'`,
    [sessionId, teacherId]
  );
  if (result.affectedRows === 0) throw new Error("会话不存在或已结束");
  return { sessionId };
}

async function getTeacherSessions(teacherId, page = 1, pageSize = 10) {
  const offset = (page - 1) * pageSize;
  const [rows, countResult] = await Promise.all([
    dbQuery(
      `SELECT cs.*, c.name as class_name, co.title as course_title
       FROM classroom_sessions cs
       LEFT JOIN class c ON cs.class_id = c.id
       LEFT JOIN courses co ON cs.course_id = co.id
       WHERE cs.teacher_id = ? ORDER BY cs.started_at DESC LIMIT ? OFFSET ?`,
      [teacherId, pageSize, offset]
    ),
    dbQuery(
      `SELECT COUNT(*) as total FROM classroom_sessions WHERE teacher_id = ?`,
      [teacherId]
    ),
  ]);
  return { list: rows, total: countResult[0].total, page, pageSize };
}

async function getSessionDetail(sessionId) {
  const [sessions, interactions] = await Promise.all([
    dbQuery(`SELECT * FROM classroom_sessions WHERE id = ?`, [sessionId]),
    dbQuery(
      `SELECT * FROM classroom_interactions WHERE session_id = ? ORDER BY created_at ASC`,
      [sessionId]
    ),
  ]);
  if (sessions.length === 0) throw new Error("会话不存在");
  return { ...sessions[0], interactions };
}

async function getSessionStats(sessionId) {
  const [session] = await dbQuery(
    `SELECT * FROM classroom_sessions WHERE id = ?`,
    [sessionId]
  );
  if (!session) throw new Error("会话不存在");
  const interactions = await dbQuery(
    `SELECT type, COUNT(*) as count FROM classroom_interactions
     WHERE session_id = ? GROUP BY type`,
    [sessionId]
  );
  const responses = await dbQuery(
    `SELECT COUNT(*) as total, SUM(is_correct) as correct
     FROM classroom_responses cr
     JOIN classroom_interactions ci ON cr.interaction_id = ci.id
     WHERE ci.session_id = ?`,
    [sessionId]
  );
  return {
    sessionId,
    participantCount: session.participant_count || 0,
    interactionStats: interactions,
    responseStats: responses[0],
  };
}

async function createInteraction(sessionId, type, config) {
  const result = await dbQuery(
    `INSERT INTO classroom_interactions (session_id, type, config, status, created_at)
     VALUES (?, ?, ?, 'active', NOW())`,
    [sessionId, type, JSON.stringify(config)]
  );
  return { interactionId: result.insertId };
}

async function closeInteraction(interactionId, result) {
  const res = await dbQuery(
    `UPDATE classroom_interactions SET status = 'closed', result = ?, closed_at = NOW()
     WHERE id = ? AND status = 'active'`,
    [JSON.stringify(result), interactionId]
  );
  if (res.affectedRows === 0) throw new Error("互动不存在或已关闭");
  return { interactionId };
}

async function saveResponse(interactionId, studentId, response, isCorrect) {
  const result = await dbQuery(
    `INSERT INTO classroom_responses (interaction_id, student_id, response, is_correct, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [interactionId, studentId, JSON.stringify(response), isCorrect ? 1 : 0]
  );
  return { responseId: result.insertId };
}

async function updateParticipantCount(sessionId, count) {
  await dbQuery(
    `UPDATE classroom_sessions SET participant_count = ? WHERE id = ?`,
    [count, sessionId]
  );
}

module.exports = {
  createSession,
  endSession,
  getTeacherSessions,
  getSessionDetail,
  getSessionStats,
  createInteraction,
  closeInteraction,
  saveResponse,
  updateParticipantCount,
};
