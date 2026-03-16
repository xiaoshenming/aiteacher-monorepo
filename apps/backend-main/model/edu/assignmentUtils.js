const db = require("../../config/db")
const logger = require("../../utils/logger")

function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err)
      else resolve(results)
    })
  })
}

async function getSubmissions(assignmentId, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize
  const [countResult, rows] = await Promise.all([
    dbQuery(
      `SELECT COUNT(*) AS total FROM assignment_submissions WHERE assignment_id = ?`,
      [assignmentId]
    ),
    dbQuery(
      `SELECT s.*, lv.name AS student_name
       FROM assignment_submissions s
       LEFT JOIN loginverification lv ON s.student_id = lv.uid
       WHERE s.assignment_id = ?
       ORDER BY s.submit_time DESC LIMIT ? OFFSET ?`,
      [assignmentId, pageSize, offset]
    ),
  ])
  return { list: rows, total: countResult[0].total }
}

async function getSubmissionDetail(assignmentId, submissionId) {
  const rows = await dbQuery(
    `SELECT s.*, lv.name AS student_name
     FROM assignment_submissions s
     LEFT JOIN loginverification lv ON s.student_id = lv.uid
     WHERE s.id = ? AND s.assignment_id = ?`,
    [submissionId, assignmentId]
  )
  return rows[0] || null
}

async function autoGradeObjective(assignmentId) {
  const questions = await dbQuery(
    `SELECT aq.question_id, aq.score, q.type, q.answer AS standard_answer
     FROM assignment_questions aq
     LEFT JOIN question q ON aq.question_id = q.id
     WHERE aq.assignment_id = ? AND q.type IN ('single_choice','multiple_choice','true_false','fill_blank')`,
    [assignmentId]
  )
  if (questions.length === 0) return { graded: 0, message: "无客观题" }

  const submissions = await dbQuery(
    `SELECT * FROM assignment_submissions WHERE assignment_id = ? AND status IN ('submitted')`,
    [assignmentId]
  )

  let gradedCount = 0
  for (const sub of submissions) {
    let answers = []
    try { answers = JSON.parse(sub.answers)?.question_answers || [] } catch (e) { continue }

    const detailScores = []
    let totalScore = 0

    for (const q of questions) {
      const sa = answers.find((a) => a.question_id === q.question_id)
      if (!sa) { detailScores.push({ question_id: q.question_id, score: 0, max: q.score }); continue }

      let earned = 0
      const studentAns = String(sa.answer || "").trim()
      const stdAns = String(q.standard_answer || "").trim()

      if (q.type === "fill_blank") {
        const acceptable = stdAns.split("|").map((s) => s.trim())
        if (acceptable.includes(studentAns)) earned = q.score
      } else {
        if (studentAns === stdAns) earned = q.score
      }
      totalScore += earned
      detailScores.push({ question_id: q.question_id, score: earned, max: q.score })
    }

    await dbQuery(
      `UPDATE assignment_submissions SET detail_scores = ?, score = ?, status = 'auto_graded' WHERE id = ?`,
      [JSON.stringify(detailScores), totalScore, sub.id]
    )
    gradedCount++
  }
  return { graded: gradedCount, total: submissions.length }
}

async function manualGrade(submissionId, score, feedback, detailScores) {
  await dbQuery(
    `UPDATE assignment_submissions SET score = ?, feedback = ?, detail_scores = ?, status = 'graded' WHERE id = ?`,
    [score, feedback || null, detailScores ? JSON.stringify(detailScores) : null, submissionId]
  )
}

async function batchConfirmGrades(assignmentId, submissionIds) {
  if (!submissionIds || submissionIds.length === 0) return { confirmed: 0 }
  const subs = await dbQuery(
    `SELECT id, ai_scores FROM assignment_submissions WHERE assignment_id = ? AND id IN (?) AND ai_scores IS NOT NULL`,
    [assignmentId, submissionIds]
  )
  let confirmed = 0
  for (const sub of subs) {
    let aiScores = []
    try { aiScores = JSON.parse(sub.ai_scores) } catch (e) { continue }
    const totalAiScore = aiScores.reduce((sum, s) => sum + (s.score || 0), 0)
    await dbQuery(
      `UPDATE assignment_submissions SET detail_scores = ?, score = score + ?, status = 'graded' WHERE id = ?`,
      [JSON.stringify(aiScores), totalAiScore, sub.id]
    )
    confirmed++
  }
  return { confirmed }
}

async function getGradeSummary(assignmentId) {
  const rows = await dbQuery(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status IN ('graded','auto_graded','ai_graded') THEN 1 ELSE 0 END) AS graded,
       AVG(CASE WHEN score IS NOT NULL THEN score END) AS avg_score,
       MAX(score) AS max_score,
       MIN(CASE WHEN score IS NOT NULL THEN score END) AS min_score
     FROM assignment_submissions WHERE assignment_id = ?`,
    [assignmentId]
  )
  const stats = rows[0]
  const dist = await dbQuery(
    `SELECT
       SUM(CASE WHEN score >= 90 THEN 1 ELSE 0 END) AS excellent,
       SUM(CASE WHEN score >= 70 AND score < 90 THEN 1 ELSE 0 END) AS good,
       SUM(CASE WHEN score >= 60 AND score < 70 THEN 1 ELSE 0 END) AS pass,
       SUM(CASE WHEN score < 60 AND score IS NOT NULL THEN 1 ELSE 0 END) AS fail
     FROM assignment_submissions WHERE assignment_id = ?`,
    [assignmentId]
  )
  return { ...stats, distribution: dist[0] }
}

module.exports = {
  dbQuery, getSubmissions, getSubmissionDetail,
  autoGradeObjective, manualGrade, batchConfirmGrades, getGradeSummary,
}
