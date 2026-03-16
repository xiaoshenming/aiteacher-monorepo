# 教师备课增强功能实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 5 个教师备课增强模块：作业与题库集成、学生作业批改、教学资源库、教案/资源共享、课堂互动工具。

**Architecture:** 后端在 backend-main（Express 5 + MySQL + Redis）上扩展路由和 WebSocket；前端在 Nuxt 4 中新增 4 个页面和 7 个 composable。数据库新增 9 张表、修改 1 张表。按 Phase 顺序实施，每个 Phase 产出可独立运行的功能。

**Tech Stack:** Nuxt 4 / Vue 3 / Nuxt UI 4 / Tailwind CSS 4 / Express 5 / mysql2 / ioredis / ws / OpenAI SDK (DeepSeek) / RabbitMQ

**Spec:** `docs/superpowers/specs/2026-03-17-teacher-prep-features-design.md`

---

## 文件结构总览

### 后端新增文件（apps/backend-main/）

```
model/edu/assignmentUtils.js          — 作业批改工具函数（自动批改+AI批改）
model/knowledge/knowledgeTreeRouter.js — 知识点树 REST API
model/knowledge/knowledgeTreeUtils.js  — 知识点树数据库操作
model/share/shareRouter.js             — 资源共享 REST API
model/share/shareUtils.js              — 共享数据库操作
model/classroom/classroomRouter.js     — 课堂互动 REST API
model/classroom/classroomSocket.js     — 课堂互动 WebSocket
model/classroom/classroomUtils.js      — 课堂互动数据库操作
```

### 后端修改文件

```
model/edu/assignmentRouter.js  — 扩展：题目关联 + 批改 API（7个新端点）
app.js                         — 注册新路由 + 新 WebSocket
```

### 前端新增文件（apps/frontend/app/）

```
composables/useKnowledgeTree.ts
composables/useResourceShare.ts
composables/useFavorites.ts
composables/useTags.ts
composables/useGrading.ts
composables/useClassroom.ts
composables/useClassroomWS.ts

pages/user/resource-library.vue
pages/user/shared-resources.vue
pages/user/classroom.vue
pages/student/classroom.vue

components/assignment/QuestionPicker.vue
components/assignment/QuestionPickerCard.vue
components/assignment/AssignmentPreview.vue
components/assignment/GradingPanel.vue
components/assignment/SubmissionList.vue
components/assignment/SubmissionDetail.vue
components/assignment/QuestionGradeCard.vue
components/assignment/AIGradeSuggestion.vue
components/assignment/GradeSummaryChart.vue

components/resource-library/ResourceLibraryPanel.vue
components/resource-library/KnowledgeTree.vue
components/resource-library/KnowledgeTreeNode.vue
components/resource-library/ResourceList.vue
components/resource-library/ResourceAttachModal.vue
components/resource-library/CreateNodeModal.vue

components/share/SharedResourcesPanel.vue
components/share/ShareModal.vue
components/share/SharedResourceCard.vue
components/share/FavoriteButton.vue
components/share/TagManager.vue

components/classroom/ClassroomPanel.vue
components/classroom/ClassroomToolbar.vue
components/classroom/RandomPicker.vue
components/classroom/PollCreator.vue
components/classroom/PollResult.vue
components/classroom/QuizLauncher.vue
components/classroom/QuizResult.vue
components/classroom/CountdownTimer.vue
components/classroom/StudentList.vue
components/classroom/StudentClassroomPanel.vue
components/classroom/StudentPollView.vue
components/classroom/StudentQuizView.vue
components/classroom/StudentWaiting.vue
```

### 前端修改文件

```
composables/useDashboardNav.ts         — 新增 3 个导航项
components/assignment/CreateAssignmentModal.vue — 改造为分步表单
components/assignment/AssignmentPanel.vue       — 新增"批改"按钮
```

---

## Chunk 1: Phase 1A — 作业与题库集成（后端）

### Task 1: 创建 assignment_questions 数据库表

**Files:**
- 无文件变更，纯 SQL 操作

- [ ] **Step 1: 创建 assignment_questions 表**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "
CREATE TABLE assignment_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assignment_id INT NOT NULL,
  question_id BIGINT NOT NULL,
  sort_order INT DEFAULT 0,
  score INT DEFAULT 10,
  INDEX idx_assignment (assignment_id),
  INDEX idx_question (question_id),
  FOREIGN KEY (assignment_id)
    REFERENCES assignments(id) ON DELETE CASCADE
);"
```

- [ ] **Step 2: 验证表创建成功**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "DESCRIBE assignment_questions;"
```

Expected: 5 列（id, assignment_id, question_id, sort_order, score）

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(db): 创建 assignment_questions 表，关联作业与题库"
```

### Task 2: 扩展作业创建 API 支持题目关联

**Files:**
- Modify: `apps/backend-main/model/edu/assignmentRouter.js`

- [ ] **Step 1: 修改 POST `/` 创建作业接口**

在现有创建作业的回调中，`INSERT INTO assignments` 成功后，检查 `req.body.questions` 数组。如果存在，批量插入 `assignment_questions`：

```js
// 在 POST "/" 路由的 INSERT 回调成功分支中追加：
const { questions } = req.body
if (questions && Array.isArray(questions) && questions.length > 0) {
  const values = questions.map((q, i) => [
    result.insertId, q.question_id, q.sort_order ?? i, q.score ?? 10
  ])
  db.query(
    `INSERT INTO assignment_questions (assignment_id, question_id, sort_order, score) VALUES ?`,
    [values],
    (err3) => {
      if (err3) {
        return res.status(500).json({ code: 500, message: "关联题目失败", error: err3 })
      }
      res.json({ code: 200, message: "创建成功", data: { id: result.insertId } })
    }
  )
} else {
  res.json({ code: 200, message: "创建成功", data: { id: result.insertId } })
}
```

注意：将原来的 `res.json(...)` 成功响应替换为上述条件分支。

- [ ] **Step 2: 修改 PUT `/:id` 更新作业接口**

在更新作业基本信息后，如果 `req.body.questions` 存在，先删除旧关联再重新插入：

```js
// 在 PUT "/:id" 路由的 UPDATE 回调成功分支中追加：
const { questions } = req.body
if (questions && Array.isArray(questions)) {
  db.query(`DELETE FROM assignment_questions WHERE assignment_id = ?`, [req.params.id], (delErr) => {
    if (delErr) return res.status(500).json({ code: 500, message: "更新题目关联失败" })
    if (questions.length === 0) {
      return res.json({ code: 200, message: "更新成功" })
    }
    const values = questions.map((q, i) => [
      parseInt(req.params.id), q.question_id, q.sort_order ?? i, q.score ?? 10
    ])
    db.query(
      `INSERT INTO assignment_questions (assignment_id, question_id, sort_order, score) VALUES ?`,
      [values],
      (insErr) => {
        if (insErr) return res.status(500).json({ code: 500, message: "关联题目失败" })
        res.json({ code: 200, message: "更新成功" })
      }
    )
  })
} else {
  res.json({ code: 200, message: "更新成功" })
}
```

- [ ] **Step 3: 修改 GET `/:id` 作业详情接口**

在返回作业详情时，额外查询关联题目：

```js
// 在 GET "/:id" 路由的查询回调成功分支中，追加查询：
db.query(
  `SELECT aq.*, q.title, q.type, q.difficulty, q.content, q.options, q.answer, q.explanation
   FROM assignment_questions aq
   LEFT JOIN question q ON aq.question_id = q.id
   WHERE aq.assignment_id = ?
   ORDER BY aq.sort_order`,
  [req.params.id],
  (err2, questions) => {
    if (err2) questions = []
    res.json({ code: 200, message: "查询成功", data: { ...assignment, questions } })
  }
)
```

- [ ] **Step 4: 新增 GET `/:id/questions` 获取作业题目列表**

```js
// 在 assignmentRouter.js 中新增路由
Router.get("/:id/questions", authorize(["0","1","2","3","4"]), (req, res) => {
  db.query(
    `SELECT aq.id, aq.question_id, aq.sort_order, aq.score,
            q.title, q.type, q.difficulty, q.content, q.options, q.answer, q.explanation
     FROM assignment_questions aq
     LEFT JOIN question q ON aq.question_id = q.id
     WHERE aq.assignment_id = ?
     ORDER BY aq.sort_order`,
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ code: 500, message: "查询失败" })
      res.json({ code: 200, message: "查询成功", data: results })
    }
  )
})
```

- [ ] **Step 5: 验证所有修改的接口可正常调用**

```bash
# 创建带题目的作业（假设已有 question id=1,2）
curl -X POST http://localhost:10001/api/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"测试作业","course_id":1,"class_id":1,"type":"homework","total_score":100,"questions":[{"question_id":1,"score":50},{"question_id":2,"score":50}]}'

# 查询作业详情（应包含 questions 数组）
curl http://localhost:10001/api/assignments/1 -H "Authorization: Bearer <token>"

# 查询作业题目列表
curl http://localhost:10001/api/assignments/1/questions -H "Authorization: Bearer <token>"
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend-main/model/edu/assignmentRouter.js
git commit -m "feat(assignment): 扩展作业 API 支持题目关联（创建/更新/查询）"
```

### Task 3: 修改学生提交接口支持逐题作答

**Files:**
- Modify: `apps/backend-main/model/edu/assignmentRouter.js`

- [ ] **Step 1: 修改 POST `/:id/submit` 提交接口**

现有提交接口接收 `answers` 字段（纯文本）。修改为：如果 `answers` 是对象（包含 `question_answers` 数组），则 JSON.stringify 后存入；如果是字符串，保持原样（向后兼容）。

```js
// 在 POST "/:id/submit" 路由中，处理 answers：
let answersValue = req.body.answers
if (typeof answersValue === 'object') {
  answersValue = JSON.stringify(answersValue)
}
// 然后用 answersValue 替代原来的 req.body.answers 传入 SQL
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend-main/model/edu/assignmentRouter.js
git commit -m "feat(assignment): 学生提交支持 JSON 格式逐题作答，兼容纯文本"
```

### Task 4: 创建题库选题器组件

**Files:**
- Create: `apps/frontend/app/components/assignment/QuestionPickerCard.vue`
- Create: `apps/frontend/app/components/assignment/QuestionPicker.vue`

- [ ] **Step 1: 创建 QuestionPickerCard.vue**

单个题目卡片，显示题目标题、类型、难度、分值输入框、选中状态。

```vue
<script setup lang="ts">
const props = defineProps<{
  question: any
  selected: boolean
  score: number
}>()
const emit = defineEmits<{
  toggle: []
  'update:score': [value: number]
}>()
</script>
```

模板要点：
- 卡片样式：`rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-4`
- 选中态：`border-primary-400 dark:border-primary-600 bg-primary-50/50 dark:bg-primary-900/20`
- 左侧 checkbox（UCheckbox），右侧题目信息
- 底部：分值输入（UInput type="number" size="sm"）
- UBadge 显示题目类型和难度

- [ ] **Step 2: 创建 QuestionPicker.vue**

题库选题器主组件，包含筛选栏 + 题目列表 + 已选题目摘要。

```vue
<script setup lang="ts">
const props = defineProps<{
  modelValue: Array<{ question_id: number; score: number; sort_order: number }>
}>()
const emit = defineEmits<{
  'update:modelValue': [value: typeof props.modelValue]
}>()

const { apiFetch } = useApi()
const questions = ref<any[]>([])
const loading = ref(false)
const filters = reactive({ subject: '', type: '', difficulty: '', keyword: '' })

async function fetchQuestions() {
  loading.value = true
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
  const { data } = await apiFetch(`/api/question-bank?${params}`)
  questions.value = data?.list || data || []
  loading.value = false
}

function toggleQuestion(q: any) {
  const idx = props.modelValue.findIndex(s => s.question_id === q.id)
  const newVal = [...props.modelValue]
  if (idx >= 0) {
    newVal.splice(idx, 1)
  } else {
    newVal.push({ question_id: q.id, score: 10, sort_order: newVal.length })
  }
  emit('update:modelValue', newVal)
}

onMounted(fetchQuestions)
</script>
```

模板要点：
- 顶部筛选栏：学科/类型/难度下拉 + 关键词搜索（UInput + USelect）
- 中间：题目卡片网格（QuestionPickerCard v-for）
- 底部：已选 N 题，总分 X 分的摘要条

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/app/components/assignment/QuestionPickerCard.vue \
        apps/frontend/app/components/assignment/QuestionPicker.vue
git commit -m "feat(frontend): 创建题库选题器组件 QuestionPicker + QuestionPickerCard"
```

### Task 5: 创建作业预览组件

**Files:**
- Create: `apps/frontend/app/components/assignment/AssignmentPreview.vue`

- [ ] **Step 1: 创建 AssignmentPreview.vue**

作业发布前的预览确认页面，展示基本信息 + 题目列表 + 分值分配。

```vue
<script setup lang="ts">
defineProps<{
  assignment: {
    title: string; description: string; type: string
    deadline: string; total_score: number
    course_name?: string; class_name?: string
  }
  questions: Array<{ question_id: number; score: number; title?: string; type?: string }>
}>()
</script>
```

模板要点：
- 基本信息卡片（标题、描述、类型、截止日期、总分）
- 题目列表：序号 + 标题 + 类型 Badge + 分值
- 底部统计：共 N 题，总分 X 分
- 如果无题目，显示"纯文本作业（无关联题目）"

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/app/components/assignment/AssignmentPreview.vue
git commit -m "feat(frontend): 创建作业预览组件 AssignmentPreview"
```

### Task 6: 改造 CreateAssignmentModal 为分步表单

**Files:**
- Modify: `apps/frontend/app/components/assignment/CreateAssignmentModal.vue`

- [ ] **Step 1: 读取现有 CreateAssignmentModal.vue 了解结构**

先 Read 文件，理解现有表单字段和提交逻辑。

- [ ] **Step 2: 添加步骤状态管理**

在 `<script setup>` 中新增：

```ts
const currentStep = ref(1)
const selectedQuestions = ref<Array<{ question_id: number; score: number; sort_order: number }>>([])
const totalSteps = 3

function nextStep() { if (currentStep.value < totalSteps) currentStep.value++ }
function prevStep() { if (currentStep.value > 1) currentStep.value-- }
function skipToPreview() { currentStep.value = 3 }
```

- [ ] **Step 3: 改造模板为三步布局**

```
Step 1（保持现有表单字段）→ Step 2（QuestionPicker）→ Step 3（AssignmentPreview + 提交）
```

- 顶部：步骤指示器（3 个圆点/标签，当前步骤高亮 primary）
- Step 1：保持现有 7 个字段不变
- Step 2：`<QuestionPicker v-model="selectedQuestions" />`，底部有"跳过选题"按钮
- Step 3：`<AssignmentPreview :assignment="form" :questions="selectedQuestions" />`
- 底部按钮：上一步 / 下一步 / 跳过选题 / 保存草稿 / 发布

- [ ] **Step 4: 修改提交逻辑**

在提交时将 `selectedQuestions` 作为 `questions` 字段一起发送：

```ts
const submitData = {
  ...form,
  questions: selectedQuestions.value.length > 0 ? selectedQuestions.value : undefined
}
await apiFetch('/api/assignments', { method: isEdit ? 'PUT' : 'POST', body: submitData })
```

- [ ] **Step 5: 验证分步表单流程**

手动测试：打开创建作业弹窗 → 填写基本信息 → 下一步 → 选择题目 → 下一步 → 预览 → 发布。
也测试：跳过选题直接发布纯文本作业。

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/app/components/assignment/CreateAssignmentModal.vue
git commit -m "feat(frontend): 改造作业创建弹窗为三步表单（基本信息→选题→预览）"
```

---

## Chunk 2: Phase 1B — 学生作业批改与反馈（后端）

### Task 7: 修改 assignment_submissions 表结构

**Files:**
- 无文件变更，纯 SQL 操作

- [ ] **Step 1: 扩展 status 枚举值**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "
ALTER TABLE assignment_submissions
  MODIFY status ENUM('pending','submitted','auto_graded','ai_graded','graded')
  DEFAULT 'pending';"
```

- [ ] **Step 2: 新增 ai_scores 和 detail_scores 字段**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "
ALTER TABLE assignment_submissions
  ADD COLUMN ai_scores JSON DEFAULT NULL
    COMMENT 'AI建议评分 [{question_id, score, feedback}]',
  ADD COLUMN detail_scores JSON DEFAULT NULL
    COMMENT '逐题得分 [{question_id, score, is_correct}]';"
```

- [ ] **Step 3: 验证表结构**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "DESCRIBE assignment_submissions;"
```

Expected: status 列显示新枚举值，新增 ai_scores 和 detail_scores 列

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(db): 扩展 assignment_submissions 表，新增批改状态和评分字段"
```

### Task 8: 创建作业批改工具函数

**Files:**
- Create: `apps/backend-main/model/edu/assignmentUtils.js`

- [ ] **Step 1: 创建 assignmentUtils.js 基础结构**

```js
const db = require("../../config/db")
const logger = require("../../utils/logger")

// Promise 化 db.query
function dbQuery(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err)
      else resolve(results)
    })
  })
}

// 获取作业关联的题目及标准答案
async function getAssignmentQuestions(assignmentId) {
  return dbQuery(
    `SELECT aq.question_id, aq.score AS max_score, q.type, q.answer AS standard_answer,
            q.title, q.content, q.options, q.explanation
     FROM assignment_questions aq
     LEFT JOIN question q ON aq.question_id = q.id
     WHERE aq.assignment_id = ?
     ORDER BY aq.sort_order`,
    [assignmentId]
  )
}

// 获取作业的所有提交
async function getSubmissions(assignmentId) {
  return dbQuery(
    `SELECT s.*, st.name AS student_name
     FROM assignment_submissions s
     LEFT JOIN student st ON s.student_id = st.id
     WHERE s.assignment_id = ?
     ORDER BY s.submit_time DESC`,
    [assignmentId]
  )
}

// 获取单个提交详情
async function getSubmissionById(assignmentId, submissionId) {
  const rows = await dbQuery(
    `SELECT s.*, st.name AS student_name
     FROM assignment_submissions s
     LEFT JOIN student st ON s.student_id = st.id
     WHERE s.id = ? AND s.assignment_id = ?`,
    [submissionId, assignmentId]
  )
  return rows[0] || null
}

module.exports = {
  dbQuery, getAssignmentQuestions, getSubmissions, getSubmissionById
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend-main/model/edu/assignmentUtils.js
git commit -m "feat(assignment): 创建批改工具函数 assignmentUtils.js"
```

### Task 9: 实现自动批改客观题 API

**Files:**
- Modify: `apps/backend-main/model/edu/assignmentUtils.js`
- Modify: `apps/backend-main/model/edu/assignmentRouter.js`

- [ ] **Step 1: 在 assignmentUtils.js 中添加自动批改函数**

```js
// 客观题类型列表
const OBJECTIVE_TYPES = ['选择题', '判断题', '填空题', 'single_choice', 'multiple_choice', 'true_false', 'fill_blank']

function isObjectiveType(type) {
  return OBJECTIVE_TYPES.includes(type)
}

// 比较答案（支持填空题多答案用 | 分隔）
function compareAnswer(studentAnswer, standardAnswer, questionType) {
  if (!studentAnswer || !standardAnswer) return false
  const s = String(studentAnswer).trim()
  const std = String(standardAnswer).trim()
  if (questionType === '填空题' || questionType === 'fill_blank') {
    return std.split('|').map(a => a.trim()).includes(s)
  }
  return s === std
}

// 自动批改一个提交的客观题
function autoGradeSubmission(submission, questions) {
  let answers
  try {
    const parsed = JSON.parse(submission.answers)
    answers = parsed.question_answers || []
  } catch {
    return null // 纯文本答案，跳过
  }

  const detailScores = []
  let totalScore = 0

  for (const q of questions) {
    if (!isObjectiveType(q.type)) continue
    const studentAns = answers.find(a => a.question_id === q.question_id)
    const isCorrect = studentAns
      ? compareAnswer(studentAns.answer, q.standard_answer, q.type)
      : false
    const score = isCorrect ? q.max_score : 0
    totalScore += score
    detailScores.push({
      question_id: q.question_id,
      score,
      is_correct: isCorrect
    })
  }

  return { detailScores, totalScore }
}

module.exports = {
  dbQuery, getAssignmentQuestions, getSubmissions,
  getSubmissionById, autoGradeSubmission, isObjectiveType
}
```

- [ ] **Step 2: 在 assignmentRouter.js 中新增 POST `/:id/auto-grade`**

```js
const {
  getAssignmentQuestions, getSubmissions,
  autoGradeSubmission, dbQuery
} = require("./assignmentUtils")

Router.post("/:id/auto-grade", authorize(["2","3","4"]), async (req, res) => {
  try {
    const assignmentId = req.params.id
    const questions = await getAssignmentQuestions(assignmentId)
    if (!questions.length) {
      return res.status(400).json({ code: 400, message: "该作业未关联题目" })
    }
    const submissions = await getSubmissions(assignmentId)
    let gradedCount = 0

    for (const sub of submissions) {
      if (sub.status === 'graded') continue
      const result = autoGradeSubmission(sub, questions)
      if (!result) continue

      // 合并已有的 detail_scores（保留主观题的 AI 评分）
      let existingDetails = []
      try { existingDetails = JSON.parse(sub.detail_scores) || [] } catch {}
      const objectiveIds = new Set(result.detailScores.map(d => d.question_id))
      const merged = [
        ...result.detailScores,
        ...existingDetails.filter(d => !objectiveIds.has(d.question_id))
      ]

      await dbQuery(
        `UPDATE assignment_submissions
         SET detail_scores = ?, status = 'auto_graded'
         WHERE id = ?`,
        [JSON.stringify(merged), sub.id]
      )
      gradedCount++
    }

    res.json({ code: 200, message: "自动批改完成", data: { graded_count: gradedCount } })
  } catch (err) {
    res.status(500).json({ code: 500, message: "自动批改失败", error: err.message })
  }
})
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend-main/model/edu/assignmentUtils.js \
        apps/backend-main/model/edu/assignmentRouter.js
git commit -m "feat(assignment): 实现客观题自动批改 API POST /:id/auto-grade"
```

### Task 10: 实现 AI 辅助批改主观题 API（SSE）

**Files:**
- Modify: `apps/backend-main/model/edu/assignmentRouter.js`

- [ ] **Step 1: 新增 POST `/:id/ai-grade` SSE 端点**

参考 `model/ai/aiUtils.js` 中 DeepSeek 调用方式（OpenAI SDK）。

```js
const OpenAI = require("openai")

Router.post("/:id/ai-grade", authorize(["2","3","4"]), async (req, res) => {
  try {
    const assignmentId = req.params.id
    const questions = await getAssignmentQuestions(assignmentId)
    const submissions = await getSubmissions(assignmentId)
    const subjectiveQs = questions.filter(q => !isObjectiveType(q.type))
    if (!subjectiveQs.length) {
      return res.json({ code: 200, message: "无主观题", data: { graded_count: 0 } })
    }

    // SSE 头
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"
    })

    for (const sub of submissions) {
      if (sub.status === 'graded') continue
      let answers
      try { answers = JSON.parse(sub.answers).question_answers || [] } catch { continue }

      const aiScores = []
      for (const q of subjectiveQs) {
        const studentAns = answers.find(a => a.question_id === q.question_id)
        if (!studentAns) continue
        const prompt = `你是严谨的教师，请批改主观题。
题目：${q.title}\n${q.content || ''}
标准答案：${q.standard_answer}
满分：${q.max_score}分
学生答案：${studentAns.answer}
请返回 JSON：{"score": 分数, "feedback": "评语"}，只返回 JSON。`

        try {
          const completion = await client.chat.completions.create({
            model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3, max_tokens: 500
          })
          const raw = completion.choices[0]?.message?.content || '{}'
          const parsed = JSON.parse(raw.replace(/```json?\n?/g,'').replace(/```/g,'').trim())
          aiScores.push({
            question_id: q.question_id,
            score: Math.min(parsed.score || 0, q.max_score),
            feedback: parsed.feedback || ''
          })
        } catch (aiErr) {
          aiScores.push({ question_id: q.question_id, score: 0, feedback: `AI批改失败: ${aiErr.message}` })
        }
      }

      if (aiScores.length > 0) {
        await dbQuery(
          `UPDATE assignment_submissions SET ai_scores = ?, status = 'ai_graded' WHERE id = ?`,
          [JSON.stringify(aiScores), sub.id]
        )
      }
      res.write(`data: ${JSON.stringify({ submission_id: sub.id, student_name: sub.student_name, ai_scores: aiScores })}\n\n`)
    }

    res.write(`data: ${JSON.stringify({ type: "complete" })}\n\n`)
    res.end()
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ code: 500, message: "AI批改失败", error: err.message })
    } else {
      res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`)
      res.end()
    }
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend-main/model/edu/assignmentRouter.js
git commit -m "feat(assignment): 实现 AI 辅助批改主观题 SSE 端点"
```

### Task 11: 实现提交列表、手动批改、批量确认、统计 API

**Files:**
- Modify: `apps/backend-main/model/edu/assignmentRouter.js`

- [ ] **Step 1: 新增 GET `/:id/submissions` 提交列表**

```js
Router.get("/:id/submissions", authorize(["2","3","4"]), async (req, res) => {
  try {
    const submissions = await getSubmissions(req.params.id)
    res.json({ code: 200, message: "查询成功", data: submissions })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败", error: err.message })
  }
})
```

- [ ] **Step 2: 新增 GET `/:id/submissions/:sid` 单个提交详情**

```js
Router.get("/:id/submissions/:sid", authorize(["2","3","4"]), async (req, res) => {
  try {
    const sub = await getSubmissionById(req.params.id, req.params.sid)
    if (!sub) return res.status(404).json({ code: 404, message: "提交不存在" })
    try { sub.answers = JSON.parse(sub.answers) } catch {}
    try { sub.detail_scores = JSON.parse(sub.detail_scores) } catch {}
    try { sub.ai_scores = JSON.parse(sub.ai_scores) } catch {}
    res.json({ code: 200, message: "查询成功", data: sub })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败", error: err.message })
  }
})
```

- [ ] **Step 3: 新增 PUT `/:id/submissions/:sid/grade` 手动批改**

```js
Router.put("/:id/submissions/:sid/grade", authorize(["2","3","4"]), async (req, res) => {
  try {
    const { score, feedback, detail_scores } = req.body
    const updates = ["status = 'graded'", "grade_time = NOW()"]
    const params = []
    if (score !== undefined) { updates.push("score = ?"); params.push(score) }
    if (feedback !== undefined) { updates.push("feedback = ?"); params.push(feedback) }
    if (detail_scores) { updates.push("detail_scores = ?"); params.push(JSON.stringify(detail_scores)) }
    params.push(req.params.sid, req.params.id)
    await dbQuery(`UPDATE assignment_submissions SET ${updates.join(', ')} WHERE id = ? AND assignment_id = ?`, params)
    res.json({ code: 200, message: "批改成功" })
  } catch (err) {
    res.status(500).json({ code: 500, message: "批改失败", error: err.message })
  }
})
```

- [ ] **Step 4: 新增 POST `/:id/batch-grade` 批量确认**

```js
Router.post("/:id/batch-grade", authorize(["2","3","4"]), async (req, res) => {
  try {
    const submissions = await getSubmissions(req.params.id)
    let count = 0
    for (const sub of submissions) {
      if (sub.status !== 'ai_graded' && sub.status !== 'auto_graded') continue
      let aiScores = [], detailScores = []
      try { aiScores = JSON.parse(sub.ai_scores) || [] } catch {}
      try { detailScores = JSON.parse(sub.detail_scores) || [] } catch {}
      const ids = new Set(detailScores.map(d => d.question_id))
      for (const ai of aiScores) {
        if (!ids.has(ai.question_id)) detailScores.push({ question_id: ai.question_id, score: ai.score })
      }
      const total = detailScores.reduce((s, d) => s + (d.score || 0), 0)
      const fb = aiScores.map(a => a.feedback).filter(Boolean).join('\n')
      await dbQuery(
        `UPDATE assignment_submissions SET score=?, feedback=?, detail_scores=?, status='graded', grade_time=NOW() WHERE id=?`,
        [total, fb || sub.feedback, JSON.stringify(detailScores), sub.id]
      )
      count++
    }
    res.json({ code: 200, message: "批量确认完成", data: { confirmed_count: count } })
  } catch (err) {
    res.status(500).json({ code: 500, message: "批量确认失败", error: err.message })
  }
})
```

- [ ] **Step 5: 新增 GET `/:id/grade-summary` 统计概览**

```js
Router.get("/:id/grade-summary", authorize(["2","3","4"]), async (req, res) => {
  try {
    const subs = await getSubmissions(req.params.id)
    const scores = subs.filter(s => s.score != null).map(s => s.score)
    res.json({ code: 200, message: "查询成功", data: {
      total: subs.length,
      graded: subs.filter(s => s.status === 'graded').length,
      auto_graded: subs.filter(s => s.status === 'auto_graded').length,
      ai_graded: subs.filter(s => s.status === 'ai_graded').length,
      pending: subs.filter(s => s.status === 'submitted' || s.status === 'pending').length,
      avg_score: scores.length ? (scores.reduce((a,b) => a+b, 0) / scores.length).toFixed(1) : 0,
      max_score: scores.length ? Math.max(...scores) : 0,
      min_score: scores.length ? Math.min(...scores) : 0
    }})
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败", error: err.message })
  }
})
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend-main/model/edu/assignmentRouter.js
git commit -m "feat(assignment): 实现提交列表、手动批改、批量确认、统计概览 API"
```

### Task 12: 创建批改 composable useGrading

**Files:**
- Create: `apps/frontend/app/composables/useGrading.ts`

- [ ] **Step 1: 创建 useGrading.ts**

```ts
export function useGrading(assignmentId: Ref<number | string>) {
  const { apiFetch } = useApi()
  const submissions = ref<any[]>([])
  const currentSubmission = ref<any>(null)
  const summary = ref<any>(null)
  const loading = ref(false)
  const grading = ref(false)

  async function fetchSubmissions() {
    loading.value = true
    const { data } = await apiFetch(`/api/assignments/${assignmentId.value}/submissions`)
    submissions.value = data || []
    loading.value = false
  }

  async function fetchSubmission(sid: number) {
    const { data } = await apiFetch(`/api/assignments/${assignmentId.value}/submissions/${sid}`)
    currentSubmission.value = data
  }

  async function fetchSummary() {
    const { data } = await apiFetch(`/api/assignments/${assignmentId.value}/grade-summary`)
    summary.value = data
  }

  async function autoGrade() {
    grading.value = true
    await apiFetch(`/api/assignments/${assignmentId.value}/auto-grade`, { method: 'POST' })
    await fetchSubmissions()
    await fetchSummary()
    grading.value = false
  }

  function aiGrade(onProgress?: (data: any) => void) {
    grading.value = true
    const evtSource = new EventSource(
      `/api/assignments/${assignmentId.value}/ai-grade`
    )
    // 注意：EventSource 只支持 GET，实际需用 fetch + ReadableStream
    // 改用 fetch SSE：
    return apiFetch(`/api/assignments/${assignmentId.value}/ai-grade`, {
      method: 'POST',
      responseType: 'stream',
      onDownloadProgress: (evt: any) => {
        // 解析 SSE data 行
        const lines = new TextDecoder().decode(evt.event?.target?.response || '')
        // 简化处理：由组件层用 useSSE 或 fetch 直接处理
      }
    }).finally(() => { grading.value = false })
  }

  async function gradeSubmission(sid: number, payload: { score?: number; feedback?: string; detail_scores?: any[] }) {
    await apiFetch(`/api/assignments/${assignmentId.value}/submissions/${sid}/grade`, {
      method: 'PUT', body: payload
    })
    await fetchSubmissions()
    await fetchSummary()
  }

  async function batchGrade() {
    grading.value = true
    await apiFetch(`/api/assignments/${assignmentId.value}/batch-grade`, { method: 'POST' })
    await fetchSubmissions()
    await fetchSummary()
    grading.value = false
  }

  return {
    submissions, currentSubmission, summary, loading, grading,
    fetchSubmissions, fetchSubmission, fetchSummary,
    autoGrade, aiGrade, gradeSubmission, batchGrade
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/app/composables/useGrading.ts
git commit -m "feat(frontend): 创建作业批改 composable useGrading"
```

### Task 13: 创建批改前端组件（6 个）

**Files:**
- Create: `apps/frontend/app/components/assignment/SubmissionList.vue`
- Create: `apps/frontend/app/components/assignment/QuestionGradeCard.vue`
- Create: `apps/frontend/app/components/assignment/AIGradeSuggestion.vue`
- Create: `apps/frontend/app/components/assignment/SubmissionDetail.vue`
- Create: `apps/frontend/app/components/assignment/GradeSummaryChart.vue`
- Create: `apps/frontend/app/components/assignment/GradingPanel.vue`

- [ ] **Step 1: 创建 SubmissionList.vue — 提交列表（左侧面板）**

```vue
<script setup lang="ts">
defineProps<{
  submissions: any[]
  currentId: number | null
}>()
defineEmits<{ select: [id: number] }>()
</script>
```

模板要点：
- 列表项：学生姓名 + 提交时间 + 状态 Badge（pending/submitted/auto_graded/ai_graded/graded）
- 状态颜色映射：pending→neutral, submitted→info, auto_graded→warning, ai_graded→primary, graded→success
- 选中项高亮 `bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary`
- 显示分数（如已批改）

- [ ] **Step 2: 创建 QuestionGradeCard.vue — 逐题批改卡片**

```vue
<script setup lang="ts">
const props = defineProps<{
  question: any       // 题目信息（title, type, content, options, answer）
  studentAnswer: any  // 学生答案
  detailScore: any    // 当前得分 { score, is_correct }
  aiScore: any        // AI 建议 { score, feedback }
  maxScore: number
}>()
const emit = defineEmits<{
  'update:score': [value: number]
  'update:feedback': [value: string]
}>()
const localScore = ref(props.detailScore?.score ?? props.aiScore?.score ?? 0)
const localFeedback = ref(props.aiScore?.feedback ?? '')
</script>
```

模板要点：
- 题目标题 + 类型 Badge + 满分
- 标准答案（折叠展示）
- 学生答案（高亮显示）
- 得分输入（UInput type="number"）+ 反馈输入（UTextarea）
- 如果有 AI 建议，显示 AIGradeSuggestion 组件
- 正确/错误状态图标

- [ ] **Step 3: 创建 AIGradeSuggestion.vue — AI 评分建议**

```vue
<script setup lang="ts">
defineProps<{
  aiScore: { score: number; feedback: string }
  maxScore: number
}>()
defineEmits<{ accept: [] }>()
</script>
```

模板要点：
- 卡片样式：`bg-primary-50/50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3`
- 左侧 AI 图标 + "AI 建议"标签
- 建议分数 + 评语
- "采纳"按钮（UButton variant="soft" size="xs"）

- [ ] **Step 4: 创建 SubmissionDetail.vue — 提交详情（右侧面板）**

```vue
<script setup lang="ts">
const props = defineProps<{
  submission: any
  questions: any[]
}>()
const emit = defineEmits<{ graded: [] }>()
</script>
```

模板要点：
- 顶部：学生姓名 + 提交时间 + 当前状态
- 中间：QuestionGradeCard v-for 逐题展示
- 底部：总分显示 + 总评反馈 UTextarea + "确认批改"按钮
- 调用 useGrading 的 gradeSubmission 提交

- [ ] **Step 5: 创建 GradeSummaryChart.vue — 统计图表**

```vue
<script setup lang="ts">
defineProps<{ summary: any }>()
</script>
```

模板要点：
- 统计卡片行：总提交数、已批改、待批改、平均分、最高分、最低分
- 使用 ECharts 饼图展示批改状态分布
- 图表容器：`<ClientOnly><DashboardChartLazy title="批改统计" :option="chartOption" /></ClientOnly>`
- 颜色：graded→#14b8a6, auto_graded→#f59e0b, ai_graded→#3b82f6, pending→#a1a1aa

- [ ] **Step 6: 创建 GradingPanel.vue — 批改主面板**

```vue
<script setup lang="ts">
const props = defineProps<{ assignmentId: number }>()
const id = computed(() => props.assignmentId)
const { submissions, currentSubmission, summary, loading, grading,
  fetchSubmissions, fetchSubmission, fetchSummary,
  autoGrade, batchGrade } = useGrading(id)
const questions = ref<any[]>([])
const selectedSubId = ref<number | null>(null)

onMounted(async () => {
  await fetchSubmissions()
  await fetchSummary()
  const { data } = await useApi().apiFetch(`/api/assignments/${id.value}/questions`)
  questions.value = data || []
})

async function selectSubmission(sid: number) {
  selectedSubId.value = sid
  await fetchSubmission(sid)
}
</script>
```

模板要点：
- UDashboardPanel 布局
- 顶部工具栏：返回按钮 + "自动批改" + "AI 辅助批改" + "批量确认" 按钮
- GradeSummaryChart 统计区
- 左右分栏：SubmissionList（左 1/3）+ SubmissionDetail（右 2/3）
- 空状态：无提交时显示提示

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/app/components/assignment/SubmissionList.vue \
        apps/frontend/app/components/assignment/QuestionGradeCard.vue \
        apps/frontend/app/components/assignment/AIGradeSuggestion.vue \
        apps/frontend/app/components/assignment/SubmissionDetail.vue \
        apps/frontend/app/components/assignment/GradeSummaryChart.vue \
        apps/frontend/app/components/assignment/GradingPanel.vue
git commit -m "feat(frontend): 创建作业批改组件（6个：列表/逐题/AI建议/详情/统计/主面板）"
```

### Task 14: 修改 AssignmentPanel 添加批改入口

**Files:**
- Modify: `apps/frontend/app/components/assignment/AssignmentPanel.vue`

- [ ] **Step 1: 读取现有 AssignmentPanel.vue**

先 Read 文件了解表格列定义和操作按钮区域。

- [ ] **Step 2: 添加批改状态和路由**

在 script setup 中新增：

```ts
const gradingAssignmentId = ref<number | null>(null)
const showGrading = ref(false)

function openGrading(id: number) {
  gradingAssignmentId.value = id
  showGrading.value = true
}
```

- [ ] **Step 3: 在作业列表操作列添加"批改"按钮**

在每行操作区域（已有编辑/删除按钮的位置）添加：

```vue
<UButton v-if="row.status === 'published' || row.status === 'closed'"
  icon="i-lucide-check-circle" variant="soft" color="primary" size="xs"
  @click="openGrading(row.id)">
  批改
</UButton>
```

- [ ] **Step 4: 添加批改面板条件渲染**

在模板中，当 `showGrading` 为 true 时显示 GradingPanel 替代列表：

```vue
<GradingPanel v-if="showGrading && gradingAssignmentId"
  :assignment-id="gradingAssignmentId"
  @back="showGrading = false" />
```

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/app/components/assignment/AssignmentPanel.vue
git commit -m "feat(frontend): 作业列表添加批改入口按钮和批改面板切换"
```

### Task 15: Phase 1 集成验证

- [ ] **Step 1: 启动后端验证 API**

```bash
source ~/.zshrc && pnpm nx dev backend-main
```

手动测试流程：
1. 创建带题目的作业 → 验证 assignment_questions 写入
2. 学生提交 JSON 格式答案 → 验证存储
3. 调用自动批改 → 验证客观题评分
4. 调用 AI 批改 → 验证 SSE 流式返回
5. 手动批改 → 验证分数更新
6. 批量确认 → 验证状态变更
7. 统计概览 → 验证数据正确

- [ ] **Step 2: 启动前端验证 UI**

```bash
source ~/.zshrc && pnpm nx dev frontend
```

手动测试：创建作业弹窗三步流程 → 批改面板 → 自动批改 → AI 批改 → 确认

- [ ] **Step 3: Commit Phase 1 完成标记**

```bash
git add -A && git commit -m "feat: Phase 1 完成 — 作业与题库集成 + 学生作业批改与反馈"
```

---

## Chunk 3: Phase 2 — 教学资源库（结构化）

### Task 16: 创建知识点树数据库表

**Files:**
- 无文件变更，纯 SQL 操作

- [ ] **Step 1: 创建 knowledge_tree 表**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "
CREATE TABLE knowledge_tree (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parent_id INT DEFAULT NULL COMMENT '父节点ID',
  name VARCHAR(100) NOT NULL,
  node_type ENUM('subject','textbook','chapter','section','knowledge_point') NOT NULL,
  sort_order INT DEFAULT 0,
  grade VARCHAR(20) DEFAULT NULL,
  subject VARCHAR(50) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  created_by INT NOT NULL COMMENT 'user.id',
  is_public TINYINT(1) DEFAULT 0,
  school_id INT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_parent (parent_id),
  INDEX idx_subject_grade (subject, grade),
  INDEX idx_school (school_id, is_public)
);"
```

- [ ] **Step 2: 创建 resource_node_map 表**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "
CREATE TABLE resource_node_map (
  id INT PRIMARY KEY AUTO_INCREMENT,
  node_id INT NOT NULL,
  resource_type ENUM('lesson_plan','testpaper','textbook','question','file','ppt') NOT NULL,
  resource_id INT NOT NULL,
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_node (node_id),
  INDEX idx_resource (resource_type, resource_id),
  UNIQUE KEY uk_node_resource (node_id, resource_type, resource_id)
);"
```

- [ ] **Step 3: 验证**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "SHOW TABLES LIKE 'knowledge%'; SHOW TABLES LIKE 'resource_node%';"
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(db): 创建 knowledge_tree 和 resource_node_map 表"
```

### Task 17: 创建知识点树后端 API

**Files:**
- Create: `apps/backend-main/model/knowledge/knowledgeTreeUtils.js`
- Create: `apps/backend-main/model/knowledge/knowledgeTreeRouter.js`
- Modify: `apps/backend-main/app.js`

- [ ] **Step 1: 创建 knowledgeTreeUtils.js**

```js
const db = require("../../config/db")

function dbQuery(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err); else resolve(results)
    })
  })
}

async function getTree(filters = {}) {
  let where = "WHERE 1=1"
  const params = []
  if (filters.subject) { where += " AND subject = ?"; params.push(filters.subject) }
  if (filters.grade) { where += " AND grade = ?"; params.push(filters.grade) }
  if (filters.school_id) {
    where += " AND (school_id = ? OR is_public = 1)"; params.push(filters.school_id)
  }
  return dbQuery(`SELECT * FROM knowledge_tree ${where} ORDER BY sort_order, id`, params)
}

async function getChildren(parentId) {
  return dbQuery(
    `SELECT * FROM knowledge_tree WHERE parent_id = ? ORDER BY sort_order, id`,
    [parentId]
  )
}

async function createNode(data) {
  const { parent_id, name, node_type, sort_order, grade, subject, description, created_by, is_public, school_id } = data
  const result = await dbQuery(
    `INSERT INTO knowledge_tree (parent_id, name, node_type, sort_order, grade, subject, description, created_by, is_public, school_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [parent_id || null, name, node_type, sort_order || 0, grade, subject, description, created_by, is_public || 0, school_id]
  )
  return result.insertId
}

async function updateNode(id, data) {
  const fields = []; const params = []
  for (const [k, v] of Object.entries(data)) {
    if (['name','node_type','sort_order','grade','subject','description','is_public','school_id','parent_id'].includes(k)) {
      fields.push(`${k} = ?`); params.push(v)
    }
  }
  if (!fields.length) return
  params.push(id)
  await dbQuery(`UPDATE knowledge_tree SET ${fields.join(', ')} WHERE id = ?`, params)
}

async function deleteNode(id) {
  // 级联删除：先删子节点的资源映射，再删子节点，最后删自身
  const children = await dbQuery(`SELECT id FROM knowledge_tree WHERE parent_id = ?`, [id])
  for (const child of children) { await deleteNode(child.id) }
  await dbQuery(`DELETE FROM resource_node_map WHERE node_id = ?`, [id])
  await dbQuery(`DELETE FROM knowledge_tree WHERE id = ?`, [id])
}

async function attachResource(nodeId, resourceType, resourceId, createdBy) {
  await dbQuery(
    `INSERT IGNORE INTO resource_node_map (node_id, resource_type, resource_id, created_by) VALUES (?, ?, ?, ?)`,
    [nodeId, resourceType, resourceId, createdBy]
  )
}

async function detachResource(mapId) {
  await dbQuery(`DELETE FROM resource_node_map WHERE id = ?`, [mapId])
}

async function getNodeResources(nodeId, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize
  const [countRes, rows] = await Promise.all([
    dbQuery(`SELECT COUNT(*) AS total FROM resource_node_map WHERE node_id = ?`, [nodeId]),
    dbQuery(`SELECT * FROM resource_node_map WHERE node_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`, [nodeId, pageSize, offset])
  ])
  return { list: rows, total: countRes[0].total }
}

module.exports = { getTree, getChildren, createNode, updateNode, deleteNode, attachResource, detachResource, getNodeResources }
```

- [ ] **Step 2: 创建 knowledgeTreeRouter.js**

```js
const express = require("express")
const authorize = require("../auth/authUtils")
const utils = require("./knowledgeTreeUtils")
const Router = express.Router()

Router.get("/", authorize(["1","2","3","4"]), async (req, res) => {
  try {
    const tree = await utils.getTree(req.query)
    res.json({ code: 200, message: "查询成功", data: tree })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败", error: err.message })
  }
})

Router.get("/:id/children", authorize(["1","2","3","4"]), async (req, res) => {
  try {
    const children = await utils.getChildren(req.params.id)
    res.json({ code: 200, message: "查询成功", data: children })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败", error: err.message })
  }
})

Router.post("/", authorize(["2","3","4"]), async (req, res) => {
  try {
    const id = await utils.createNode({ ...req.body, created_by: req.user.id })
    res.json({ code: 200, message: "创建成功", data: { id } })
  } catch (err) {
    res.status(500).json({ code: 500, message: "创建失败", error: err.message })
  }
})

Router.put("/:id", authorize(["2","3","4"]), async (req, res) => {
  try {
    await utils.updateNode(req.params.id, req.body)
    res.json({ code: 200, message: "更新成功" })
  } catch (err) {
    res.status(500).json({ code: 500, message: "更新失败", error: err.message })
  }
})

Router.delete("/:id", authorize(["2","3","4"]), async (req, res) => {
  try {
    await utils.deleteNode(req.params.id)
    res.json({ code: 200, message: "删除成功" })
  } catch (err) {
    res.status(500).json({ code: 500, message: "删除失败", error: err.message })
  }
})

Router.post("/:id/resources", authorize(["2","3","4"]), async (req, res) => {
  try {
    const { resource_type, resource_id } = req.body
    await utils.attachResource(req.params.id, resource_type, resource_id, req.user.id)
    res.json({ code: 200, message: "挂载成功" })
  } catch (err) {
    res.status(500).json({ code: 500, message: "挂载失败", error: err.message })
  }
})

Router.delete("/:id/resources/:mapId", authorize(["2","3","4"]), async (req, res) => {
  try {
    await utils.detachResource(req.params.mapId)
    res.json({ code: 200, message: "取消挂载成功" })
  } catch (err) {
    res.status(500).json({ code: 500, message: "操作失败", error: err.message })
  }
})

Router.get("/:id/resources", authorize(["1","2","3","4"]), async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const data = await utils.getNodeResources(req.params.id, +page, +pageSize)
    res.json({ code: 200, message: "查询成功", data })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败", error: err.message })
  }
})

module.exports = Router
```

- [ ] **Step 3: 在 app.js 中注册路由**

在 `app.js` 顶部 require 区域添加：
```js
const knowledgeTreeRouter = require("./model/knowledge/knowledgeTreeRouter")
```

在路由注册区域（`app.use("/api/assignments", ...)` 之后）添加：
```js
app.use("/api/knowledge-tree", knowledgeTreeRouter)
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend-main/model/knowledge/ apps/backend-main/app.js
git commit -m "feat(knowledge-tree): 实现知识点树完整 CRUD + 资源挂载 API"
```

### Task 18: 创建 useKnowledgeTree composable

**Files:**
- Create: `apps/frontend/app/composables/useKnowledgeTree.ts`

- [ ] **Step 1: 创建 useKnowledgeTree.ts**

```ts
export function useKnowledgeTree() {
  const { apiFetch } = useApi()
  const tree = ref<any[]>([])
  const loading = ref(false)
  const selectedNode = ref<any>(null)
  const nodeResources = ref<{ list: any[]; total: number }>({ list: [], total: 0 })

  async function fetchTree(filters: { subject?: string; grade?: string } = {}) {
    loading.value = true
    const params = new URLSearchParams()
    if (filters.subject) params.set('subject', filters.subject)
    if (filters.grade) params.set('grade', filters.grade)
    const { data } = await apiFetch(`/api/knowledge-tree?${params}`)
    tree.value = buildTreeStructure(data || [])
    loading.value = false
  }

  // 将扁平列表构建为嵌套树
  function buildTreeStructure(nodes: any[]) {
    const map = new Map()
    const roots: any[] = []
    nodes.forEach(n => map.set(n.id, { ...n, children: [] }))
    nodes.forEach(n => {
      const node = map.get(n.id)
      if (n.parent_id && map.has(n.parent_id)) {
        map.get(n.parent_id).children.push(node)
      } else {
        roots.push(node)
      }
    })
    return roots
  }

  async function fetchChildren(parentId: number) {
    const { data } = await apiFetch(`/api/knowledge-tree/${parentId}/children`)
    return data || []
  }

  async function createNode(payload: any) {
    const { data } = await apiFetch('/api/knowledge-tree', { method: 'POST', body: payload })
    return data
  }

  async function updateNode(id: number, payload: any) {
    await apiFetch(`/api/knowledge-tree/${id}`, { method: 'PUT', body: payload })
  }

  async function deleteNode(id: number) {
    await apiFetch(`/api/knowledge-tree/${id}`, { method: 'DELETE' })
  }

  async function attachResource(nodeId: number, resourceType: string, resourceId: number) {
    await apiFetch(`/api/knowledge-tree/${nodeId}/resources`, {
      method: 'POST', body: { resource_type: resourceType, resource_id: resourceId }
    })
  }

  async function detachResource(nodeId: number, mapId: number) {
    await apiFetch(`/api/knowledge-tree/${nodeId}/resources/${mapId}`, { method: 'DELETE' })
  }

  async function fetchNodeResources(nodeId: number, page = 1) {
    const { data } = await apiFetch(`/api/knowledge-tree/${nodeId}/resources?page=${page}`)
    nodeResources.value = data || { list: [], total: 0 }
  }

  function selectNode(node: any) {
    selectedNode.value = node
    if (node) fetchNodeResources(node.id)
  }

  return {
    tree, loading, selectedNode, nodeResources,
    fetchTree, fetchChildren, createNode, updateNode, deleteNode,
    attachResource, detachResource, fetchNodeResources, selectNode
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/app/composables/useKnowledgeTree.ts
git commit -m "feat(frontend): 创建知识点树 composable useKnowledgeTree"
```

### Task 19: 创建资源库前端组件（6 个）

**Files:**
- Create: `apps/frontend/app/components/resource-library/KnowledgeTreeNode.vue`
- Create: `apps/frontend/app/components/resource-library/KnowledgeTree.vue`
- Create: `apps/frontend/app/components/resource-library/ResourceList.vue`
- Create: `apps/frontend/app/components/resource-library/CreateNodeModal.vue`
- Create: `apps/frontend/app/components/resource-library/ResourceAttachModal.vue`
- Create: `apps/frontend/app/components/resource-library/ResourceLibraryPanel.vue`

- [ ] **Step 1: 创建 KnowledgeTreeNode.vue — 递归树节点**

```vue
<script setup lang="ts">
const props = defineProps<{
  node: any
  selectedId: number | null
  depth?: number
}>()
defineEmits<{ select: [node: any]; create: [parentId: number]; delete: [id: number] }>()
const expanded = ref(props.depth === 0)
const nodeTypeIcons: Record<string, string> = {
  subject: 'i-lucide-book-open', textbook: 'i-lucide-book',
  chapter: 'i-lucide-folder', section: 'i-lucide-file-text',
  knowledge_point: 'i-lucide-lightbulb'
}
</script>
```

模板要点：
- 缩进：`pl-${(depth || 0) * 4}`
- 展开/折叠箭头（有 children 时显示）
- 节点类型图标 + 名称
- 选中态：`bg-primary-50 dark:bg-primary-900/20`
- 右键或 hover 显示操作（新增子节点、删除）
- 递归渲染 `<KnowledgeTreeNode>` for children

- [ ] **Step 2: 创建 KnowledgeTree.vue — 树形导航容器**

```vue
<script setup lang="ts">
defineProps<{ tree: any[]; selectedId: number | null }>()
defineEmits<{ select: [node: any]; create: [parentId: number | null]; delete: [id: number] }>()
</script>
```

模板要点：
- 顶部：学科/年级筛选下拉 + "新建根节点"按钮
- 树列表：KnowledgeTreeNode v-for
- 空状态提示
- 滚动容器：`overflow-y-auto max-h-[calc(100vh-200px)]`

- [ ] **Step 3: 创建 ResourceList.vue — 节点资源列表**

```vue
<script setup lang="ts">
defineProps<{
  resources: any[]
  total: number
  nodeName: string
}>()
defineEmits<{ detach: [mapId: number]; attach: []; pageChange: [page: number] }>()
</script>
```

模板要点：
- 标题：当前节点名 + 资源数量
- "挂载资源"按钮
- 资源卡片列表：类型图标 + 资源名称 + 创建时间 + "取消挂载"按钮
- 资源类型颜色映射：lesson_plan→teal, testpaper→blue, textbook→amber, question→purple, file→zinc, ppt→orange
- 分页组件

- [ ] **Step 4: 创建 CreateNodeModal.vue — 创建节点弹窗**

```vue
<script setup lang="ts">
const props = defineProps<{ parentId?: number | null; parentType?: string }>()
const emit = defineEmits<{ created: []; close: [] }>()
const form = reactive({
  name: '', node_type: 'chapter', grade: '', subject: '',
  description: '', is_public: false
})
</script>
```

模板要点：
- UModal + 表单
- 节点名称（UInput）、类型（USelect：subject/textbook/chapter/section/knowledge_point）
- 年级、学科（UInput）、描述（UTextarea）
- 是否公开（UToggle）
- 根据 parentType 自动推断子节点类型

- [ ] **Step 5: 创建 ResourceAttachModal.vue — 挂载资源弹窗**

```vue
<script setup lang="ts">
defineProps<{ nodeId: number }>()
defineEmits<{ attached: []; close: [] }>()
const activeTab = ref('lesson_plan')
const tabs = [
  { label: '教案', value: 'lesson_plan' },
  { label: '题库', value: 'question' },
  { label: '试卷', value: 'testpaper' },
  { label: '课本', value: 'textbook' },
  { label: '云盘文件', value: 'file' }
]
</script>
```

模板要点：
- UModal 大尺寸
- Tab 切换不同资源类型
- 每个 Tab 下加载对应资源列表（调用现有 API）
- 勾选 + "确认挂载"按钮
- 支持搜索筛选

- [ ] **Step 6: 创建 ResourceLibraryPanel.vue — 主面板**

```vue
<script setup lang="ts">
const { tree, loading, selectedNode, nodeResources,
  fetchTree, selectNode, deleteNode } = useKnowledgeTree()
const showCreateModal = ref(false)
const showAttachModal = ref(false)
const createParentId = ref<number | null>(null)

onMounted(() => fetchTree())
</script>
```

模板要点：
- UDashboardPanel + UDashboardNavbar（title="教学资源库"）
- 左右分栏：左侧 1/3 KnowledgeTree，右侧 2/3 ResourceList
- 左侧底部："新建根节点"按钮
- CreateNodeModal + ResourceAttachModal 条件渲染
- 响应式：移动端上下布局

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/app/components/resource-library/
git commit -m "feat(frontend): 创建资源库组件（6个：树节点/树/资源列表/创建弹窗/挂载弹窗/主面板）"
```

### Task 20: 创建资源库页面 + 注册导航

**Files:**
- Create: `apps/frontend/app/pages/user/resource-library.vue`
- Modify: `apps/frontend/app/composables/useDashboardNav.ts`

- [ ] **Step 1: 创建 resource-library.vue 页面**

```vue
<template>
  <ResourceLibraryPanel />
</template>
```

遵循教师端页面模式：页面文件极简，委托给 Panel 组件。

- [ ] **Step 2: 在 useDashboardNav.ts 中添加"资源库"导航项**

在教师端导航数组中，找到"课本阅览"（textbooks）项之后插入：

```ts
{
  label: '资源库',
  icon: 'i-lucide-library',
  to: '/user/resource-library',
  tooltip: { text: '教学资源库', shortcuts: [] }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/app/pages/user/resource-library.vue \
        apps/frontend/app/composables/useDashboardNav.ts
git commit -m "feat(frontend): 新增资源库页面和导航项"
```

### Task 21: Phase 2 集成验证

- [ ] **Step 1: 验证后端 API**

```bash
# 创建根节点
curl -X POST http://localhost:10001/api/knowledge-tree \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"name":"数学","node_type":"subject","grade":"高一","subject":"数学"}'

# 获取树
curl http://localhost:10001/api/knowledge-tree?subject=数学 -H "Authorization: Bearer <token>"

# 挂载资源
curl -X POST http://localhost:10001/api/knowledge-tree/1/resources \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"resource_type":"lesson_plan","resource_id":1}'
```

- [ ] **Step 2: 验证前端页面**

访问 `/user/resource-library`，测试：创建节点 → 展开树 → 挂载资源 → 查看资源列表

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: Phase 2 完成 — 教学资源库（结构化）"
```

---

## Chunk 4: Phase 3 — 教案/资源共享

### Task 22: 创建共享相关数据库表（4 张）

**Files:**
- 无文件变更，纯 SQL 操作

- [ ] **Step 1: 创建 resource_share 表**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "
CREATE TABLE resource_share (
  id INT PRIMARY KEY AUTO_INCREMENT,
  resource_type ENUM('lesson_plan','question','file','knowledge_tree') NOT NULL,
  resource_id INT NOT NULL,
  sharer_id INT NOT NULL COMMENT 'user.id',
  share_scope ENUM('specific','school','public') NOT NULL,
  target_user_id INT DEFAULT NULL,
  school_id INT DEFAULT NULL,
  permission ENUM('view','copy') DEFAULT 'view',
  message VARCHAR(500) DEFAULT NULL,
  status TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_sharer (sharer_id),
  INDEX idx_target (target_user_id),
  INDEX idx_scope_school (share_scope, school_id)
);"
```

- [ ] **Step 2: 创建 resource_favorite 表**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "
CREATE TABLE resource_favorite (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  resource_type ENUM('lesson_plan','question','file','testpaper','textbook') NOT NULL,
  resource_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_resource (user_id, resource_type, resource_id),
  INDEX idx_user (user_id)
);"
```

- [ ] **Step 3: 创建 resource_tag 和 resource_tag_map 表**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "
CREATE TABLE resource_tag (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  user_id INT NOT NULL,
  color VARCHAR(7) DEFAULT '#14b8a6',
  UNIQUE KEY uk_user_tag (user_id, name)
);

CREATE TABLE resource_tag_map (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tag_id INT NOT NULL,
  resource_type ENUM('lesson_plan','question','file','testpaper','textbook') NOT NULL,
  resource_id INT NOT NULL,
  UNIQUE KEY uk_tag_resource (tag_id, resource_type, resource_id),
  INDEX idx_resource (resource_type, resource_id)
);"
```

- [ ] **Step 4: 验证**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "SHOW TABLES LIKE 'resource%';"
```

Expected: resource_favorite, resource_node_map, resource_share, resource_tag, resource_tag_map

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(db): 创建共享相关表（resource_share/favorite/tag/tag_map）"
```

### Task 23: 创建共享后端 API

**Files:**
- Create: `apps/backend-main/model/share/shareUtils.js`
- Create: `apps/backend-main/model/share/shareRouter.js`
- Modify: `apps/backend-main/app.js`

- [ ] **Step 1: 创建 shareUtils.js**

```js
const db = require("../../config/db")

function dbQuery(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err); else resolve(results)
    })
  })
}

// 共享
async function createShare(data) {
  const { resource_type, resource_id, sharer_id, share_scope, target_user_id, school_id, permission, message } = data
  const result = await dbQuery(
    `INSERT INTO resource_share (resource_type, resource_id, sharer_id, share_scope, target_user_id, school_id, permission, message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [resource_type, resource_id, sharer_id, share_scope, target_user_id || null, school_id || null, permission || 'view', message || null]
  )
  return result.insertId
}

async function deleteShare(id, userId) {
  await dbQuery(`DELETE FROM resource_share WHERE id = ? AND sharer_id = ?`, [id, userId])
}

async function getMyShares(userId, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize
  const [countRes, rows] = await Promise.all([
    dbQuery(`SELECT COUNT(*) AS total FROM resource_share WHERE sharer_id = ?`, [userId]),
    dbQuery(`SELECT * FROM resource_share WHERE sharer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`, [userId, pageSize, offset])
  ])
  return { list: rows, total: countRes[0].total }
}

async function getSharedToMe(userId, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize
  const [countRes, rows] = await Promise.all([
    dbQuery(`SELECT COUNT(*) AS total FROM resource_share WHERE target_user_id = ? AND status = 1`, [userId]),
    dbQuery(`SELECT * FROM resource_share WHERE target_user_id = ? AND status = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?`, [userId, pageSize, offset])
  ])
  return { list: rows, total: countRes[0].total }
}

async function getPublicShares(filters = {}, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize
  let where = "WHERE share_scope = 'public' AND status = 1"
  const params = []
  if (filters.resource_type) { where += " AND resource_type = ?"; params.push(filters.resource_type) }
  const [countRes, rows] = await Promise.all([
    dbQuery(`SELECT COUNT(*) AS total FROM resource_share ${where}`, params),
    dbQuery(`SELECT * FROM resource_share ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, pageSize, offset])
  ])
  return { list: rows, total: countRes[0].total }
}

async function getSchoolShares(schoolId, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize
  const where = "WHERE share_scope = 'school' AND school_id = ? AND status = 1"
  const [countRes, rows] = await Promise.all([
    dbQuery(`SELECT COUNT(*) AS total FROM resource_share ${where}`, [schoolId]),
    dbQuery(`SELECT * FROM resource_share ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [schoolId, pageSize, offset])
  ])
  return { list: rows, total: countRes[0].total }
}

// 收藏
async function addFavorite(userId, resourceType, resourceId) {
  await dbQuery(
    `INSERT IGNORE INTO resource_favorite (user_id, resource_type, resource_id) VALUES (?, ?, ?)`,
    [userId, resourceType, resourceId]
  )
}

async function removeFavorite(id, userId) {
  await dbQuery(`DELETE FROM resource_favorite WHERE id = ? AND user_id = ?`, [id, userId])
}

async function getFavorites(userId, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize
  const [countRes, rows] = await Promise.all([
    dbQuery(`SELECT COUNT(*) AS total FROM resource_favorite WHERE user_id = ?`, [userId]),
    dbQuery(`SELECT * FROM resource_favorite WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`, [userId, pageSize, offset])
  ])
  return { list: rows, total: countRes[0].total }
}

// 标签
async function createTag(userId, name, color) {
  const result = await dbQuery(
    `INSERT INTO resource_tag (user_id, name, color) VALUES (?, ?, ?)`,
    [userId, name, color || '#14b8a6']
  )
  return result.insertId
}

async function deleteTag(id, userId) {
  await dbQuery(`DELETE FROM resource_tag_map WHERE tag_id = ?`, [id])
  await dbQuery(`DELETE FROM resource_tag WHERE id = ? AND user_id = ?`, [id, userId])
}

async function getTags(userId) {
  return dbQuery(`SELECT * FROM resource_tag WHERE user_id = ? ORDER BY name`, [userId])
}

async function bindTag(tagId, resourceType, resourceId) {
  await dbQuery(
    `INSERT IGNORE INTO resource_tag_map (tag_id, resource_type, resource_id) VALUES (?, ?, ?)`,
    [tagId, resourceType, resourceId]
  )
}

async function unbindTag(tagId, resourceType, resourceId) {
  await dbQuery(
    `DELETE FROM resource_tag_map WHERE tag_id = ? AND resource_type = ? AND resource_id = ?`,
    [tagId, resourceType, resourceId]
  )
}

module.exports = {
  createShare, deleteShare, getMyShares, getSharedToMe, getPublicShares, getSchoolShares,
  addFavorite, removeFavorite, getFavorites,
  createTag, deleteTag, getTags, bindTag, unbindTag
}
```

- [ ] **Step 2: Commit shareUtils.js**

```bash
git add apps/backend-main/model/share/shareUtils.js
git commit -m "feat(share): 创建共享/收藏/标签工具函数 shareUtils.js"
```

- [ ] **Step 3: 创建 shareRouter.js**

```js
const express = require("express")
const authorize = require("../auth/authUtils")
const utils = require("./shareUtils")
const Router = express.Router()

// 共享
Router.post("/", authorize(["2","3","4"]), async (req, res) => {
  try {
    const id = await utils.createShare({ ...req.body, sharer_id: req.user.id })
    // TODO: 如果 share_scope === 'specific'，通过 RabbitMQ 推送通知
    res.json({ code: 200, message: "共享成功", data: { id } })
  } catch (err) {
    res.status(500).json({ code: 500, message: "共享失败", error: err.message })
  }
})

Router.delete("/:id", authorize(["2","3","4"]), async (req, res) => {
  try {
    await utils.deleteShare(req.params.id, req.user.id)
    res.json({ code: 200, message: "撤销成功" })
  } catch (err) {
    res.status(500).json({ code: 500, message: "操作失败", error: err.message })
  }
})

Router.get("/my-shares", authorize(["2","3","4"]), async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const data = await utils.getMyShares(req.user.id, +page, +pageSize)
    res.json({ code: 200, message: "查询成功", data })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败", error: err.message })
  }
})

Router.get("/shared-to-me", authorize(["1","2","3","4"]), async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const data = await utils.getSharedToMe(req.user.id, +page, +pageSize)
    res.json({ code: 200, message: "查询成功", data })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败", error: err.message })
  }
})

Router.get("/public", authorize(["1","2","3","4"]), async (req, res) => {
  try {
    const { page = 1, pageSize = 20, resource_type } = req.query
    const data = await utils.getPublicShares({ resource_type }, +page, +pageSize)
    res.json({ code: 200, message: "查询成功", data })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败", error: err.message })
  }
})

Router.get("/school", authorize(["1","2","3","4"]), async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const schoolId = req.user.schoolId
    if (!schoolId) return res.status(400).json({ code: 400, message: "未关联学校" })
    const data = await utils.getSchoolShares(schoolId, +page, +pageSize)
    res.json({ code: 200, message: "查询成功", data })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败", error: err.message })
  }
})

// 收藏
Router.post("/favorite", authorize(["1","2","3","4"]), async (req, res) => {
  try {
    const { resource_type, resource_id } = req.body
    await utils.addFavorite(req.user.id, resource_type, resource_id)
    res.json({ code: 200, message: "收藏成功" })
  } catch (err) {
    res.status(500).json({ code: 500, message: "收藏失败", error: err.message })
  }
})

Router.delete("/favorite/:id", authorize(["1","2","3","4"]), async (req, res) => {
  try {
    await utils.removeFavorite(req.params.id, req.user.id)
    res.json({ code: 200, message: "取消收藏" })
  } catch (err) {
    res.status(500).json({ code: 500, message: "操作失败", error: err.message })
  }
})

Router.get("/favorites", authorize(["1","2","3","4"]), async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const data = await utils.getFavorites(req.user.id, +page, +pageSize)
    res.json({ code: 200, message: "查询成功", data })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败", error: err.message })
  }
})

// 标签
Router.post("/tag", authorize(["1","2","3","4"]), async (req, res) => {
  try {
    const id = await utils.createTag(req.user.id, req.body.name, req.body.color)
    res.json({ code: 200, message: "创建成功", data: { id } })
  } catch (err) {
    res.status(500).json({ code: 500, message: "创建失败", error: err.message })
  }
})

Router.delete("/tag/:id", authorize(["1","2","3","4"]), async (req, res) => {
  try {
    await utils.deleteTag(req.params.id, req.user.id)
    res.json({ code: 200, message: "删除成功" })
  } catch (err) {
    res.status(500).json({ code: 500, message: "删除失败", error: err.message })
  }
})

Router.get("/tags", authorize(["1","2","3","4"]), async (req, res) => {
  try {
    const data = await utils.getTags(req.user.id)
    res.json({ code: 200, message: "查询成功", data })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败", error: err.message })
  }
})

Router.post("/tag/:id/bindResource", authorize(["1","2","3","4"]), async (req, res) => {
  try {
    await utils.bindTag(req.params.id, req.body.resource_type, req.body.resource_id)
    res.json({ code: 200, message: "标签绑定成功" })
  } catch (err) {
    res.status(500).json({ code: 500, message: "绑定失败", error: err.message })
  }
})

Router.delete("/tag/:id/unbindResource", authorize(["1","2","3","4"]), async (req, res) => {
  try {
    await utils.unbindTag(req.params.id, req.body.resource_type, req.body.resource_id)
    res.json({ code: 200, message: "标签解绑成功" })
  } catch (err) {
    res.status(500).json({ code: 500, message: "解绑失败", error: err.message })
  }
})

module.exports = Router
```

- [ ] **Step 4: 在 app.js 中注册 shareRouter**

在 `app.js` 顶部 require 区域添加：
```js
const shareRouter = require("./model/share/shareRouter")
```

在路由注册区域（`knowledgeTreeRouter` 之后）添加：
```js
app.use("/api/share", shareRouter)
```

- [ ] **Step 5: Commit**

```bash
git add apps/backend-main/model/share/shareRouter.js apps/backend-main/app.js
git commit -m "feat(share): 实现共享/收藏/标签完整 REST API + 注册路由"
```

### Task 24: 创建共享前端 composables（3 个）

**Files:**
- Create: `apps/frontend/app/composables/useResourceShare.ts`
- Create: `apps/frontend/app/composables/useFavorites.ts`
- Create: `apps/frontend/app/composables/useTags.ts`

- [ ] **Step 1: 创建 useResourceShare.ts**

```ts
export function useResourceShare() {
  const { apiFetch } = useApi()
  const myShares = ref<{ list: any[]; total: number }>({ list: [], total: 0 })
  const sharedToMe = ref<{ list: any[]; total: number }>({ list: [], total: 0 })
  const publicShares = ref<{ list: any[]; total: number }>({ list: [], total: 0 })
  const schoolShares = ref<{ list: any[]; total: number }>({ list: [], total: 0 })
  const loading = ref(false)

  async function share(payload: { resource_type: string; resource_id: number; share_scope: string; target_user_id?: number; school_id?: number; permission?: string; message?: string }) {
    await apiFetch('/api/share', { method: 'POST', body: payload })
  }
  async function revokeShare(id: number) {
    await apiFetch(`/api/share/${id}`, { method: 'DELETE' })
  }
  async function fetchMyShares(page = 1) {
    loading.value = true
    const { data } = await apiFetch(`/api/share/my-shares?page=${page}`)
    myShares.value = data || { list: [], total: 0 }
    loading.value = false
  }
  async function fetchSharedToMe(page = 1) {
    loading.value = true
    const { data } = await apiFetch(`/api/share/shared-to-me?page=${page}`)
    sharedToMe.value = data || { list: [], total: 0 }
    loading.value = false
  }
  async function fetchPublic(page = 1, resourceType?: string) {
    loading.value = true
    const params = new URLSearchParams({ page: String(page) })
    if (resourceType) params.set('resource_type', resourceType)
    const { data } = await apiFetch(`/api/share/public?${params}`)
    publicShares.value = data || { list: [], total: 0 }
    loading.value = false
  }
  async function fetchSchool(page = 1) {
    loading.value = true
    const { data } = await apiFetch(`/api/share/school?page=${page}`)
    schoolShares.value = data || { list: [], total: 0 }
    loading.value = false
  }

  return { myShares, sharedToMe, publicShares, schoolShares, loading, share, revokeShare, fetchMyShares, fetchSharedToMe, fetchPublic, fetchSchool }
}
```

- [ ] **Step 2: 创建 useFavorites.ts**

```ts
export function useFavorites() {
  const { apiFetch } = useApi()
  const favorites = ref<{ list: any[]; total: number }>({ list: [], total: 0 })
  const loading = ref(false)

  async function addFavorite(resourceType: string, resourceId: number) {
    await apiFetch('/api/share/favorite', { method: 'POST', body: { resource_type: resourceType, resource_id: resourceId } })
  }
  async function removeFavorite(id: number) {
    await apiFetch(`/api/share/favorite/${id}`, { method: 'DELETE' })
  }
  async function fetchFavorites(page = 1) {
    loading.value = true
    const { data } = await apiFetch(`/api/share/favorites?page=${page}`)
    favorites.value = data || { list: [], total: 0 }
    loading.value = false
  }

  return { favorites, loading, addFavorite, removeFavorite, fetchFavorites }
}
```

- [ ] **Step 3: 创建 useTags.ts**

```ts
export function useTags() {
  const { apiFetch } = useApi()
  const tags = ref<any[]>([])

  async function fetchTags() {
    const { data } = await apiFetch('/api/share/tags')
    tags.value = data || []
  }
  async function createTag(name: string, color?: string) {
    await apiFetch('/api/share/tag', { method: 'POST', body: { name, color } })
    await fetchTags()
  }
  async function deleteTag(id: number) {
    await apiFetch(`/api/share/tag/${id}`, { method: 'DELETE' })
    await fetchTags()
  }
  async function bindTag(tagId: number, resourceType: string, resourceId: number) {
    await apiFetch(`/api/share/tag/${tagId}/bindResource`, { method: 'POST', body: { resource_type: resourceType, resource_id: resourceId } })
  }
  async function unbindTag(tagId: number, resourceType: string, resourceId: number) {
    await apiFetch(`/api/share/tag/${tagId}/unbindResource`, { method: 'DELETE', body: { resource_type: resourceType, resource_id: resourceId } })
  }

  return { tags, fetchTags, createTag, deleteTag, bindTag, unbindTag }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/app/composables/useResourceShare.ts \
        apps/frontend/app/composables/useFavorites.ts \
        apps/frontend/app/composables/useTags.ts
git commit -m "feat(frontend): 创建共享/收藏/标签 composables"
```

### Task 25: 创建共享前端组件（5 个）

**Files:**
- Create: `apps/frontend/app/components/share/FavoriteButton.vue`
- Create: `apps/frontend/app/components/share/TagManager.vue`
- Create: `apps/frontend/app/components/share/ShareModal.vue`
- Create: `apps/frontend/app/components/share/SharedResourceCard.vue`
- Create: `apps/frontend/app/components/share/SharedResourcesPanel.vue`

- [ ] **Step 1: 创建 FavoriteButton.vue — 通用收藏按钮**

```vue
<script setup lang="ts">
const props = defineProps<{
  resourceType: string
  resourceId: number
  favoriteId?: number | null
}>()
const emit = defineEmits<{ toggled: [] }>()
const { addFavorite, removeFavorite } = useFavorites()
const isFav = ref(!!props.favoriteId)
const localFavId = ref(props.favoriteId)
</script>
```

模板：心形图标按钮，收藏态 `text-red-500`，未收藏 `text-muted`。点击切换。

- [ ] **Step 2: 创建 TagManager.vue — 标签管理组件**

```vue
<script setup lang="ts">
const { tags, fetchTags, createTag, deleteTag, bindTag, unbindTag } = useTags()
const props = defineProps<{ resourceType?: string; resourceId?: number }>()
const newTagName = ref('')
const newTagColor = ref('#14b8a6')
onMounted(fetchTags)
</script>
```

模板要点：
- 标签列表（彩色 Badge）+ 删除按钮
- 新建标签输入框 + 颜色选择器
- 如果传入 resourceType/resourceId，显示"绑定/解绑"操作

- [ ] **Step 3: 创建 ShareModal.vue — 共享弹窗**

```vue
<script setup lang="ts">
const props = defineProps<{ resourceType: string; resourceId: number }>()
const emit = defineEmits<{ shared: []; close: [] }>()
const { share } = useResourceShare()
const form = reactive({
  share_scope: 'public' as 'specific' | 'school' | 'public',
  target_user_id: null as number | null,
  permission: 'view' as 'view' | 'copy',
  message: ''
})
</script>
```

模板要点：
- UModal
- 共享范围选择（URadioGroup：指定用户/校内/公开）
- 指定用户时显示用户搜索输入框
- 权限选择（查看/复制）
- 留言输入
- 确认按钮

- [ ] **Step 4: 创建 SharedResourceCard.vue — 共享资源卡片**

```vue
<script setup lang="ts">
defineProps<{ share: any }>()
defineEmits<{ revoke: [id: number] }>()
</script>
```

模板要点：
- 卡片样式遵循项目规范
- 资源类型图标 + 名称
- 共享范围 Badge（public→green, school→blue, specific→amber）
- 权限 Badge（view/copy）
- 分享者/接收者信息
- 时间 + 操作按钮

- [ ] **Step 5: 创建 SharedResourcesPanel.vue — 主面板**

```vue
<script setup lang="ts">
const { myShares, sharedToMe, publicShares, schoolShares, loading,
  fetchMyShares, fetchSharedToMe, fetchPublic, fetchSchool, revokeShare } = useResourceShare()
const activeTab = ref('shared-to-me')
const tabs = [
  { label: '分享给我的', value: 'shared-to-me' },
  { label: '我分享的', value: 'my-shares' },
  { label: '公开广场', value: 'public' },
  { label: '校内共享', value: 'school' }
]
onMounted(() => fetchSharedToMe())
watch(activeTab, (tab) => {
  if (tab === 'shared-to-me') fetchSharedToMe()
  else if (tab === 'my-shares') fetchMyShares()
  else if (tab === 'public') fetchPublic()
  else if (tab === 'school') fetchSchool()
})
</script>
```

模板要点：
- UDashboardPanel + UDashboardNavbar（title="共享资源中心"）
- Tab 切换栏（UTabs）
- 每个 Tab 下：SharedResourceCard 网格 + 分页
- 公开广场 Tab 额外有资源类型筛选
- 空状态提示

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/app/components/share/
git commit -m "feat(frontend): 创建共享组件（5个：收藏按钮/标签管理/共享弹窗/资源卡片/主面板）"
```

### Task 26: 创建共享页面 + 注册导航

**Files:**
- Create: `apps/frontend/app/pages/user/shared-resources.vue`
- Modify: `apps/frontend/app/composables/useDashboardNav.ts`

- [ ] **Step 1: 创建 shared-resources.vue**

```vue
<template>
  <SharedResourcesPanel />
</template>
```

- [ ] **Step 2: 在 useDashboardNav.ts 添加"共享中心"导航项**

在"资源库"导航项之后插入：

```ts
{
  label: '共享中心',
  icon: 'i-lucide-share-2',
  to: '/user/shared-resources',
  tooltip: { text: '共享资源中心', shortcuts: [] }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/app/pages/user/shared-resources.vue \
        apps/frontend/app/composables/useDashboardNav.ts
git commit -m "feat(frontend): 新增共享资源中心页面和导航项"
```

### Task 27: Phase 3 集成验证

- [ ] **Step 1: 验证后端 API**

```bash
# 创建共享
curl -X POST http://localhost:10001/api/share \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"resource_type":"lesson_plan","resource_id":1,"share_scope":"public","permission":"view"}'

# 收藏
curl -X POST http://localhost:10001/api/share/favorite \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"resource_type":"lesson_plan","resource_id":1}'

# 标签
curl -X POST http://localhost:10001/api/share/tag \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"name":"重点","color":"#ef4444"}'
```

- [ ] **Step 2: 验证前端页面**

访问 `/user/shared-resources`，测试 Tab 切换、共享弹窗、收藏按钮

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: Phase 3 完成 — 教案/资源共享"
```

---

## Chunk 5: Phase 4 — 课堂互动工具

### Task 28: 创建课堂互动数据库表（3 张）

**Files:**
- 无文件变更，纯 SQL 操作

- [ ] **Step 1: 创建 classroom_session 表**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "
CREATE TABLE classroom_session (
  id INT PRIMARY KEY AUTO_INCREMENT,
  class_id INT NOT NULL,
  course_id INT DEFAULT NULL,
  teacher_id INT NOT NULL,
  status ENUM('active','ended') DEFAULT 'active',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME DEFAULT NULL,
  participant_count INT DEFAULT 0,
  INDEX idx_teacher (teacher_id),
  INDEX idx_class (class_id, status)
);"
```

- [ ] **Step 2: 创建 classroom_interaction 表**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "
CREATE TABLE classroom_interaction (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  type ENUM('random_pick','poll','quiz','timer') NOT NULL,
  config JSON NOT NULL COMMENT '互动配置',
  result JSON DEFAULT NULL COMMENT '互动结果',
  status ENUM('active','closed') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME DEFAULT NULL,
  INDEX idx_session (session_id),
  FOREIGN KEY (session_id) REFERENCES classroom_session(id) ON DELETE CASCADE
);"
```

- [ ] **Step 3: 创建 classroom_response 表**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "
CREATE TABLE classroom_response (
  id INT PRIMARY KEY AUTO_INCREMENT,
  interaction_id INT NOT NULL,
  student_id INT NOT NULL,
  response JSON NOT NULL COMMENT '学生响应',
  is_correct TINYINT(1) DEFAULT NULL,
  responded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_interaction (interaction_id),
  UNIQUE KEY uk_interaction_student (interaction_id, student_id),
  FOREIGN KEY (interaction_id) REFERENCES classroom_interaction(id) ON DELETE CASCADE
);"
```

- [ ] **Step 4: 验证**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "SHOW TABLES LIKE 'classroom%';"
```

Expected: classroom_interaction, classroom_response, classroom_session

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(db): 创建课堂互动表（session/interaction/response）"
```

### Task 29: 创建课堂互动后端工具函数

**Files:**
- Create: `apps/backend-main/model/classroom/classroomUtils.js`

- [ ] **Step 1: 创建 classroomUtils.js**

```js
const db = require("../../config/db")

function dbQuery(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err); else resolve(results)
    })
  })
}

async function createSession(teacherId, classId, courseId) {
  const result = await dbQuery(
    `INSERT INTO classroom_session (teacher_id, class_id, course_id) VALUES (?, ?, ?)`,
    [teacherId, classId, courseId || null]
  )
  return result.insertId
}

async function endSession(sessionId) {
  await dbQuery(
    `UPDATE classroom_session SET status = 'ended', ended_at = NOW() WHERE id = ?`,
    [sessionId]
  )
}

async function getSession(sessionId) {
  const rows = await dbQuery(`SELECT * FROM classroom_session WHERE id = ?`, [sessionId])
  return rows[0] || null
}

async function getTeacherSessions(teacherId, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize
  const [countRes, rows] = await Promise.all([
    dbQuery(`SELECT COUNT(*) AS total FROM classroom_session WHERE teacher_id = ?`, [teacherId]),
    dbQuery(
      `SELECT cs.*, c.class_name, co.name AS course_name
       FROM classroom_session cs
       LEFT JOIN class c ON cs.class_id = c.id
       LEFT JOIN course co ON cs.course_id = co.id
       WHERE cs.teacher_id = ?
       ORDER BY cs.started_at DESC LIMIT ? OFFSET ?`,
      [teacherId, pageSize, offset]
    )
  ])
  return { list: rows, total: countRes[0].total }
}

async function updateParticipantCount(sessionId, count) {
  await dbQuery(`UPDATE classroom_session SET participant_count = ? WHERE id = ?`, [count, sessionId])
}

async function createInteraction(sessionId, type, config) {
  const result = await dbQuery(
    `INSERT INTO classroom_interaction (session_id, type, config) VALUES (?, ?, ?)`,
    [sessionId, type, JSON.stringify(config)]
  )
  return result.insertId
}

async function closeInteraction(interactionId, result) {
  await dbQuery(
    `UPDATE classroom_interaction SET status = 'closed', result = ?, closed_at = NOW() WHERE id = ?`,
    [JSON.stringify(result), interactionId]
  )
}

async function saveResponse(interactionId, studentId, response, isCorrect) {
  await dbQuery(
    `INSERT INTO classroom_response (interaction_id, student_id, response, is_correct)
     VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE response = VALUES(response), is_correct = VALUES(is_correct)`,
    [interactionId, studentId, JSON.stringify(response), isCorrect]
  )
}

async function getInteractionResponses(interactionId) {
  return dbQuery(
    `SELECT cr.*, s.name AS student_name
     FROM classroom_response cr
     LEFT JOIN student s ON cr.student_id = s.id
     WHERE cr.interaction_id = ?`,
    [interactionId]
  )
}

async function getSessionInteractions(sessionId) {
  return dbQuery(
    `SELECT * FROM classroom_interaction WHERE session_id = ? ORDER BY created_at`,
    [sessionId]
  )
}

async function getSessionStats(sessionId) {
  const session = await getSession(sessionId)
  const interactions = await getSessionInteractions(sessionId)
  const stats = { total_interactions: interactions.length, by_type: {} }
  for (const i of interactions) {
    stats.by_type[i.type] = (stats.by_type[i.type] || 0) + 1
  }
  return { session, interactions, stats }
}

async function getClassStudents(classId) {
  return dbQuery(
    `SELECT s.id, s.name FROM class_student cs
     LEFT JOIN student s ON cs.student_id = s.id
     WHERE cs.class_id = ? AND cs.status = 1`,
    [classId]
  )
}

module.exports = {
  createSession, endSession, getSession, getTeacherSessions,
  updateParticipantCount, createInteraction, closeInteraction,
  saveResponse, getInteractionResponses, getSessionInteractions,
  getSessionStats, getClassStudents
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend-main/model/classroom/classroomUtils.js
git commit -m "feat(classroom): 创建课堂互动工具函数 classroomUtils.js"
```

### Task 30: 创建课堂互动 REST API

**Files:**
- Create: `apps/backend-main/model/classroom/classroomRouter.js`
- Modify: `apps/backend-main/app.js`

- [ ] **Step 1: 创建 classroomRouter.js**

```js
const express = require("express")
const authorize = require("../auth/authUtils")
const utils = require("./classroomUtils")
const Router = express.Router()

Router.get("/sessions", authorize(["2","3","4"]), async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const data = await utils.getTeacherSessions(req.user.id, +page, +pageSize)
    res.json({ code: 200, message: "查询成功", data })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败", error: err.message })
  }
})

Router.get("/sessions/:id", authorize(["2","3","4"]), async (req, res) => {
  try {
    const session = await utils.getSession(req.params.id)
    if (!session) return res.status(404).json({ code: 404, message: "会话不存在" })
    const interactions = await utils.getSessionInteractions(req.params.id)
    // 解析 JSON 字段
    for (const i of interactions) {
      try { i.config = JSON.parse(i.config) } catch {}
      try { i.result = JSON.parse(i.result) } catch {}
    }
    res.json({ code: 200, message: "查询成功", data: { ...session, interactions } })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败", error: err.message })
  }
})

Router.get("/sessions/:id/stats", authorize(["2","3","4"]), async (req, res) => {
  try {
    const data = await utils.getSessionStats(req.params.id)
    res.json({ code: 200, message: "查询成功", data })
  } catch (err) {
    res.status(500).json({ code: 500, message: "查询失败", error: err.message })
  }
})

module.exports = Router
```

- [ ] **Step 2: 在 app.js 中注册 classroomRouter**

在 `app.js` 顶部 require 区域添加：
```js
const classroomRouter = require("./model/classroom/classroomRouter")
```

在路由注册区域（`shareRouter` 之后）添加：
```js
app.use("/api/classroom", classroomRouter)
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend-main/model/classroom/classroomRouter.js apps/backend-main/app.js
git commit -m "feat(classroom): 实现课堂互动 REST API（会话历史/详情/统计）"
```

### Task 31: 创建课堂互动 WebSocket

**Files:**
- Create: `apps/backend-main/model/classroom/classroomSocket.js`
- Modify: `apps/backend-main/app.js`

- [ ] **Step 1: 创建 classroomSocket.js**

复用 `wxsocket.js` 的认证模式（JWT query 参数 + Redis 校验）。

```js
const WebSocket = require("ws")
const jwt = require("jsonwebtoken")
const redis = require("../../config/redis")
const logger = require("../../utils/logger")
const utils = require("./classroomUtils")
require("dotenv").config()

const secret = process.env.JWT_SECRET

// 房间管理：Map<sessionId, { teacher: ws, students: Map<studentId, ws> }>
const rooms = new Map()

async function verifyToken(request) {
  const url = new URL(request.url, `http://${request.headers.host}`)
  const token = url.searchParams.get("token")
  if (!token) return { valid: false, error: "未提供 Token" }
  try {
    const decoded = jwt.verify(token, secret)
    const deviceType = request.headers.devicetype || "web"
    const storedToken = await redis.get(`user_${decoded.id}_${deviceType}_token`)
    if (storedToken !== token) return { valid: false, error: "Token 无效" }
    await redis.expire(`user_${decoded.id}_${deviceType}_token`, 3600)
    return { valid: true, user: decoded }
  } catch (err) {
    return { valid: false, error: err.message }
  }
}

function broadcast(sessionId, data, excludeWs = null) {
  const room = rooms.get(sessionId)
  if (!room) return
  const msg = JSON.stringify(data)
  if (room.teacher && room.teacher !== excludeWs && room.teacher.readyState === WebSocket.OPEN) {
    room.teacher.send(msg)
  }
  for (const [, ws] of room.students) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) ws.send(msg)
  }
}

function setupClassroomWebSocket(server) {
  const wss = new WebSocket.Server({ noServer: true, path: "/api/classroom-ws" })

  // 在 server 的 upgrade 事件中处理（需要与 wxsocket 共存）
  // 注意：app.js 中需要修改 upgrade 处理逻辑
  server.on("upgrade", async (request, socket, head) => {
    if (!request.url.startsWith("/api/classroom-ws")) return
    // 如果 wxsocket 已经处理了，这里不会到达（wxsocket 对非自身路径调用 socket.destroy）
    // 需要修改 wxsocket.js 的 else 分支，改为不处理非自身路径

    const auth = await verifyToken(request)
    if (!auth.valid) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
      socket.destroy()
      return
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, auth.user)
    })
  })

  wss.on("connection", (ws, request, user) => {
    logger.info(`课堂 WS 连接: userId=${user.id}, role=${user.role}`)
    ws.user = user
    ws.sessionId = null

    ws.on("message", async (raw) => {
      let msg
      try { msg = JSON.parse(raw) } catch {
        return ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }))
      }

      try {
        await handleMessage(ws, msg)
      } catch (err) {
        logger.error(`课堂 WS 错误: ${err.message}`)
        ws.send(JSON.stringify({ type: "error", message: err.message }))
      }
    })

    ws.on("close", () => {
      if (ws.sessionId && rooms.has(ws.sessionId)) {
        const room = rooms.get(ws.sessionId)
        if (room.teacher === ws) {
          // 教师断开，通知学生
          broadcast(ws.sessionId, { type: "session_ended", data: { reason: "teacher_disconnected" } })
        } else {
          room.students.delete(ws.user.id)
          utils.updateParticipantCount(ws.sessionId, room.students.size).catch(() => {})
          broadcast(ws.sessionId, {
            type: "student_left",
            data: { student_id: ws.user.id, count: room.students.size }
          })
        }
      }
    })
  })
}

async function handleMessage(ws, msg) {
  const { type, data } = msg

  switch (type) {
    case "start_session": {
      const { class_id, course_id } = data
      const sessionId = await utils.createSession(ws.user.id, class_id, course_id)
      ws.sessionId = sessionId
      rooms.set(sessionId, { teacher: ws, students: new Map() })
      ws.send(JSON.stringify({ type: "session_started", data: { session_id: sessionId } }))
      break
    }

    case "end_session": {
      if (!ws.sessionId) return
      await utils.endSession(ws.sessionId)
      broadcast(ws.sessionId, { type: "session_ended", data: { reason: "teacher_ended" } })
      rooms.delete(ws.sessionId)
      ws.sessionId = null
      break
    }

    case "join_session": {
      const { session_id } = data
      const room = rooms.get(session_id)
      if (!room) return ws.send(JSON.stringify({ type: "error", message: "会话不存在" }))
      ws.sessionId = session_id
      room.students.set(ws.user.id, ws)
      await utils.updateParticipantCount(session_id, room.students.size)
      broadcast(session_id, {
        type: "student_joined",
        data: { student_id: ws.user.id, count: room.students.size }
      })
      break
    }

    case "random_pick": {
      if (!ws.sessionId) return
      const students = await utils.getClassStudents(data.class_id || 0)
      if (!students.length) return ws.send(JSON.stringify({ type: "error", message: "无学生" }))
      const count = data.count || 1
      const shuffled = students.sort(() => Math.random() - 0.5)
      const picked = shuffled.slice(0, count)
      const intId = await utils.createInteraction(ws.sessionId, "random_pick", { count })
      await utils.closeInteraction(intId, { picked })
      broadcast(ws.sessionId, { type: "student_picked", data: { interaction_id: intId, picked } })
      break
    }

    case "start_poll": {
      if (!ws.sessionId) return
      const intId = await utils.createInteraction(ws.sessionId, "poll", data)
      ws.currentInteraction = intId
      broadcast(ws.sessionId, {
        type: "poll_started",
        data: { interaction_id: intId, ...data }
      }, null)
      break
    }

    case "poll_vote": {
      if (!ws.sessionId || !data.interaction_id) return
      await utils.saveResponse(data.interaction_id, ws.user.id, { option: data.option }, null)
      const responses = await utils.getInteractionResponses(data.interaction_id)
      const tally = {}
      for (const r of responses) {
        const opt = JSON.parse(r.response).option
        tally[opt] = (tally[opt] || 0) + 1
      }
      broadcast(ws.sessionId, {
        type: "poll_result",
        data: { interaction_id: data.interaction_id, tally, total: responses.length }
      })
      break
    }

    case "close_poll": {
      if (!data.interaction_id) return
      const responses = await utils.getInteractionResponses(data.interaction_id)
      const tally = {}
      for (const r of responses) {
        const opt = JSON.parse(r.response).option
        tally[opt] = (tally[opt] || 0) + 1
      }
      await utils.closeInteraction(data.interaction_id, { tally, total: responses.length })
      broadcast(ws.sessionId, {
        type: "poll_closed",
        data: { interaction_id: data.interaction_id, tally, total: responses.length }
      })
      break
    }

    case "start_quiz": {
      if (!ws.sessionId) return
      const intId = await utils.createInteraction(ws.sessionId, "quiz", data)
      broadcast(ws.sessionId, {
        type: "quiz_started",
        data: { interaction_id: intId, questions: data.questions, time_limit: data.time_limit }
      }, null)
      break
    }

    case "quiz_answer": {
      if (!ws.sessionId || !data.interaction_id) return
      await utils.saveResponse(data.interaction_id, ws.user.id, data.answers, null)
      break
    }

    case "close_quiz": {
      if (!data.interaction_id) return
      const responses = await utils.getInteractionResponses(data.interaction_id)
      const result = { total: responses.length, responses: responses.map(r => ({
        student_id: r.student_id, student_name: r.student_name,
        answers: JSON.parse(r.response)
      }))}
      await utils.closeInteraction(data.interaction_id, result)
      broadcast(ws.sessionId, { type: "quiz_result", data: { interaction_id: data.interaction_id, ...result } })
      break
    }

    case "start_timer": {
      if (!ws.sessionId) return
      const intId = await utils.createInteraction(ws.sessionId, "timer", { duration: data.duration })
      broadcast(ws.sessionId, { type: "timer_started", data: { interaction_id: intId, duration: data.duration } })
      // 倒计时由前端处理，服务端只记录
      await utils.closeInteraction(intId, { duration: data.duration })
      break
    }

    default:
      ws.send(JSON.stringify({ type: "error", message: `未知消息类型: ${type}` }))
  }
}

module.exports = { setupClassroomWebSocket }
```

- [ ] **Step 2: 修改 wxsocket.js 的 upgrade 处理**

当前 `wxsocket.js` 在 `server.on("upgrade")` 的 else 分支中调用 `socket.destroy()`，这会阻止课堂 WS 连接。需要修改为：只处理 `/api/wxsocket` 路径，其他路径不处理（不 destroy）。

在 `wxsocket.js` 的 `server.on("upgrade")` 回调中：

```js
// 修改前：
} else {
  socket.destroy();
}

// 修改后：
} else {
  // 不处理非 wxsocket 路径，留给其他 WS 处理器
  return;
}
```

- [ ] **Step 3: 在 app.js 中注册课堂 WebSocket**

在 `app.js` 顶部添加：
```js
const { setupClassroomWebSocket } = require("./model/classroom/classroomSocket")
```

在 `setupWebSocketServer(server)` 之后添加：
```js
setupClassroomWebSocket(server)
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend-main/model/classroom/classroomSocket.js \
        apps/backend-main/model/ai/wxsocket.js \
        apps/backend-main/app.js
git commit -m "feat(classroom): 实现课堂互动 WebSocket（房间管理/点名/投票/测验/计时）"
```

### Task 32: 创建课堂互动 composables（2 个）

**Files:**
- Create: `apps/frontend/app/composables/useClassroom.ts`
- Create: `apps/frontend/app/composables/useClassroomWS.ts`

- [ ] **Step 1: 创建 useClassroomWS.ts — WebSocket 连接管理**

```ts
export function useClassroomWS() {
  const { apiFetch } = useApi()
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)
  const messages = ref<any[]>([])
  const lastMessage = ref<any>(null)

  function connect() {
    const userStore = useUserStore()
    const token = userStore.token
    const config = useRuntimeConfig()
    const baseUrl = (config.public.apiBase as string || 'http://localhost:10001').replace('http', 'ws')
    const socket = new WebSocket(`${baseUrl}/api/classroom-ws?token=${token}`)

    socket.onopen = () => { connected.value = true }
    socket.onclose = () => { connected.value = false; ws.value = null }
    socket.onerror = () => { connected.value = false }
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      lastMessage.value = data
      messages.value.push(data)
    }
    ws.value = socket
  }

  function send(type: string, data: any = {}) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type, data }))
    }
  }

  function disconnect() {
    ws.value?.close()
    ws.value = null
    connected.value = false
  }

  function onMessage(type: string, callback: (data: any) => void) {
    watch(lastMessage, (msg) => {
      if (msg?.type === type) callback(msg.data)
    })
  }

  onUnmounted(disconnect)

  return { ws, connected, messages, lastMessage, connect, send, disconnect, onMessage }
}
```

- [ ] **Step 2: 创建 useClassroom.ts — 课堂互动状态管理**

```ts
export function useClassroom() {
  const { apiFetch } = useApi()
  const sessions = ref<{ list: any[]; total: number }>({ list: [], total: 0 })
  const currentSession = ref<any>(null)
  const loading = ref(false)

  async function fetchSessions(page = 1) {
    loading.value = true
    const { data } = await apiFetch(`/api/classroom/sessions?page=${page}`)
    sessions.value = data || { list: [], total: 0 }
    loading.value = false
  }

  async function fetchSession(id: number) {
    const { data } = await apiFetch(`/api/classroom/sessions/${id}`)
    currentSession.value = data
  }

  async function fetchSessionStats(id: number) {
    const { data } = await apiFetch(`/api/classroom/sessions/${id}/stats`)
    return data
  }

  return { sessions, currentSession, loading, fetchSessions, fetchSession, fetchSessionStats }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/app/composables/useClassroomWS.ts \
        apps/frontend/app/composables/useClassroom.ts
git commit -m "feat(frontend): 创建课堂互动 composables（useClassroom + useClassroomWS）"
```

### Task 33: 创建教师端课堂互动组件（9 个）

**Files:**
- Create: `apps/frontend/app/components/classroom/StudentList.vue`
- Create: `apps/frontend/app/components/classroom/CountdownTimer.vue`
- Create: `apps/frontend/app/components/classroom/RandomPicker.vue`
- Create: `apps/frontend/app/components/classroom/PollCreator.vue`
- Create: `apps/frontend/app/components/classroom/PollResult.vue`
- Create: `apps/frontend/app/components/classroom/QuizLauncher.vue`
- Create: `apps/frontend/app/components/classroom/QuizResult.vue`
- Create: `apps/frontend/app/components/classroom/ClassroomToolbar.vue`
- Create: `apps/frontend/app/components/classroom/ClassroomPanel.vue`

- [ ] **Step 1: 创建 StudentList.vue — 在线学生列表**

```vue
<script setup lang="ts">
defineProps<{ students: Array<{ student_id: number; name?: string }>; count: number }>()
</script>
```

模板：学生头像列表 + 在线人数 Badge。每个学生显示名字首字母圆形头像。

- [ ] **Step 2: 创建 CountdownTimer.vue — 倒计时器**

```vue
<script setup lang="ts">
const props = defineProps<{ duration: number; active: boolean }>()
const emit = defineEmits<{ finished: [] }>()
const remaining = ref(props.duration)
let timer: ReturnType<typeof setInterval> | null = null

watch(() => props.active, (val) => {
  if (val) {
    remaining.value = props.duration
    timer = setInterval(() => {
      remaining.value--
      if (remaining.value <= 0) {
        clearInterval(timer!); timer = null; emit('finished')
      }
    }, 1000)
  } else if (timer) { clearInterval(timer); timer = null }
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>
```

模板：大字体倒计时显示（分:秒），圆形进度环，到时闪烁动画。

- [ ] **Step 3: 创建 RandomPicker.vue — 随机点名动画**

```vue
<script setup lang="ts">
defineProps<{ picked: Array<{ id: number; name: string }> | null; animating: boolean }>()
defineEmits<{ pick: [count: number] }>()
</script>
```

模板：
- 点名前：选择人数（1/2/3）+ "开始点名"按钮
- 动画中：名字滚动效果（CSS animation）
- 点名后：被点学生大字显示 + 高亮卡片

- [ ] **Step 4: 创建 PollCreator.vue — 投票创建**

```vue
<script setup lang="ts">
const emit = defineEmits<{ start: [config: any] }>()
const question = ref('')
const options = ref(['', ''])
function addOption() { if (options.value.length < 6) options.value.push('') }
function removeOption(i: number) { if (options.value.length > 2) options.value.splice(i, 1) }
</script>
```

模板：问题输入 + 选项列表（可增删，2-6 个）+ "发起投票"按钮。

- [ ] **Step 5: 创建 PollResult.vue — 投票结果柱状图**

```vue
<script setup lang="ts">
defineProps<{ tally: Record<string, number>; total: number; options: string[]; closed: boolean }>()
</script>
```

模板：ECharts 水平柱状图，实时更新。颜色用 teal 系列。显示每个选项的票数和百分比。

- [ ] **Step 6: 创建 QuizLauncher.vue — 测验发起**

```vue
<script setup lang="ts">
const emit = defineEmits<{ start: [config: any] }>()
const { apiFetch } = useApi()
const selectedQuestions = ref<any[]>([])
const timeLimit = ref(300) // 秒
</script>
```

模板：从题库选题（复用 QuestionPicker 或简化版）+ 时间限制设置 + "发起测验"按钮。

- [ ] **Step 7: 创建 QuizResult.vue — 测验结果统计**

```vue
<script setup lang="ts">
defineProps<{ result: any; closed: boolean }>()
</script>
```

模板：参与人数、正确率统计、每题正确率柱状图、学生答题明细表格。

- [ ] **Step 8: 创建 ClassroomToolbar.vue — 工具栏**

```vue
<script setup lang="ts">
defineProps<{ sessionActive: boolean }>()
defineEmits<{ 'random-pick': []; poll: []; quiz: []; timer: [] }>()
</script>
```

模板：4 个工具按钮横排（随机点名/投票/测验/计时），图标 + 文字，`variant="soft"` 样式。会话未开启时禁用。

- [ ] **Step 9: 创建 ClassroomPanel.vue — 教师端主面板**

```vue
<script setup lang="ts">
const { connected, connect, send, disconnect, onMessage } = useClassroomWS()
const { fetchSessions, sessions } = useClassroom()
const sessionActive = ref(false)
const sessionId = ref<number | null>(null)
const activeTool = ref<string | null>(null) // 'random_pick' | 'poll' | 'quiz' | 'timer'
const students = ref<any[]>([])
const selectedClass = ref<number | null>(null)
const selectedCourse = ref<number | null>(null)

// 班级/课程列表复用作业模块的 API
const { apiFetch } = useApi()
const classes = ref<any[]>([])
const courses = ref<any[]>([])
onMounted(async () => {
  const [c1, c2] = await Promise.all([
    apiFetch('/api/assignments/teacher/classes'),
    apiFetch('/api/assignments/teacher/courses')
  ])
  classes.value = c1.data || []
  courses.value = c2.data || []
  await fetchSessions()
})

function startSession() {
  connect()
  // 等连接成功后发送 start_session
}

onMessage('session_started', (data) => {
  sessionId.value = data.session_id
  sessionActive.value = true
})
onMessage('student_joined', (data) => { students.value.push(data) })
onMessage('student_left', (data) => {
  students.value = students.value.filter(s => s.student_id !== data.student_id)
})
</script>
```

模板要点：
- UDashboardPanel + UDashboardNavbar（title="课堂互动"）
- 未开启会话：选择班级 + 课程 + "开启课堂"按钮 + 历史会话列表
- 已开启会话：
  - 顶部：ClassroomToolbar + StudentList + "结束课堂"按钮
  - 中间：根据 activeTool 切换显示对应组件
  - RandomPicker / PollCreator+PollResult / QuizLauncher+QuizResult / CountdownTimer

- [ ] **Step 10: Commit**

```bash
git add apps/frontend/app/components/classroom/StudentList.vue \
        apps/frontend/app/components/classroom/CountdownTimer.vue \
        apps/frontend/app/components/classroom/RandomPicker.vue \
        apps/frontend/app/components/classroom/PollCreator.vue \
        apps/frontend/app/components/classroom/PollResult.vue \
        apps/frontend/app/components/classroom/QuizLauncher.vue \
        apps/frontend/app/components/classroom/QuizResult.vue \
        apps/frontend/app/components/classroom/ClassroomToolbar.vue \
        apps/frontend/app/components/classroom/ClassroomPanel.vue
git commit -m "feat(frontend): 创建教师端课堂互动组件（9个）"
```

### Task 34: 创建学生端课堂互动组件（4 个）

**Files:**
- Create: `apps/frontend/app/components/classroom/StudentWaiting.vue`
- Create: `apps/frontend/app/components/classroom/StudentPollView.vue`
- Create: `apps/frontend/app/components/classroom/StudentQuizView.vue`
- Create: `apps/frontend/app/components/classroom/StudentClassroomPanel.vue`

- [ ] **Step 1: 创建 StudentWaiting.vue — 等待状态**

```vue
<script setup lang="ts">
defineProps<{ sessionId: number; message?: string }>()
</script>
```

模板：居中显示等待动画（脉冲圆点）+ "等待老师发起互动..." 文字。

- [ ] **Step 2: 创建 StudentPollView.vue — 学生投票界面**

```vue
<script setup lang="ts">
defineProps<{ question: string; options: string[]; interactionId: number }>()
defineEmits<{ vote: [option: string] }>()
const selected = ref<string | null>(null)
const voted = ref(false)
</script>
```

模板：问题标题 + 选项按钮列表（大按钮，点击选中高亮）+ "提交投票"按钮。投票后显示"已投票"状态。

- [ ] **Step 3: 创建 StudentQuizView.vue — 学生答题界面**

```vue
<script setup lang="ts">
defineProps<{ questions: any[]; timeLimit: number; interactionId: number }>()
defineEmits<{ submit: [answers: any[]] }>()
const answers = ref<Record<number, string>>({})
const currentIndex = ref(0)
</script>
```

模板：
- 顶部：题号导航 + 倒计时
- 中间：当前题目内容 + 选项/输入框
- 底部：上一题/下一题 + "提交答案"按钮
- 到时自动提交

- [ ] **Step 4: 创建 StudentClassroomPanel.vue — 学生端主面板**

```vue
<script setup lang="ts">
const { connected, connect, send, onMessage } = useClassroomWS()
const sessionId = ref<number | null>(null)
const currentView = ref<'waiting' | 'poll' | 'quiz' | 'picked' | 'timer'>('waiting')
const interactionData = ref<any>(null)

// 学生通过 URL 参数或输入会话 ID 加入
const route = useRoute()
const inputSessionId = ref('')

function joinSession() {
  const sid = Number(route.query.session || inputSessionId.value)
  if (!sid) return
  connect()
  // 连接成功后发送 join_session
}

onMessage('poll_started', (data) => { currentView.value = 'poll'; interactionData.value = data })
onMessage('quiz_started', (data) => { currentView.value = 'quiz'; interactionData.value = data })
onMessage('student_picked', (data) => { currentView.value = 'picked'; interactionData.value = data })
onMessage('timer_started', (data) => { currentView.value = 'timer'; interactionData.value = data })
onMessage('poll_closed', () => { currentView.value = 'waiting' })
onMessage('quiz_result', () => { currentView.value = 'waiting' })
onMessage('session_ended', () => { sessionId.value = null; currentView.value = 'waiting' })
</script>
```

模板要点：
- UDashboardPanel + UDashboardNavbar（title="课堂互动"）
- 未加入：输入会话 ID + "加入课堂"按钮
- 已加入：根据 currentView 切换显示
  - waiting → StudentWaiting
  - poll → StudentPollView
  - quiz → StudentQuizView
  - picked → 被点名高亮显示
  - timer → CountdownTimer（复用）

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/app/components/classroom/StudentWaiting.vue \
        apps/frontend/app/components/classroom/StudentPollView.vue \
        apps/frontend/app/components/classroom/StudentQuizView.vue \
        apps/frontend/app/components/classroom/StudentClassroomPanel.vue
git commit -m "feat(frontend): 创建学生端课堂互动组件（4个）"
```

### Task 35: 创建课堂互动页面 + 注册导航

**Files:**
- Create: `apps/frontend/app/pages/user/classroom.vue`
- Create: `apps/frontend/app/pages/student/classroom.vue`
- Modify: `apps/frontend/app/composables/useDashboardNav.ts`

- [ ] **Step 1: 创建教师端 classroom.vue**

```vue
<template>
  <ClassroomPanel />
</template>
```

- [ ] **Step 2: 创建学生端 classroom.vue**

```vue
<template>
  <StudentClassroomPanel />
</template>
```

- [ ] **Step 3: 在 useDashboardNav.ts 添加"课堂互动"导航项**

在教师端导航中，找到"课堂录制"（recordings）项之后插入：

```ts
{
  label: '课堂互动',
  icon: 'i-lucide-hand',
  to: '/user/classroom',
  tooltip: { text: '课堂互动工具', shortcuts: [] }
}
```

在学生端导航中添加：

```ts
{
  label: '课堂互动',
  icon: 'i-lucide-hand',
  to: '/student/classroom',
  tooltip: { text: '加入课堂互动', shortcuts: [] }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/app/pages/user/classroom.vue \
        apps/frontend/app/pages/student/classroom.vue \
        apps/frontend/app/composables/useDashboardNav.ts
git commit -m "feat(frontend): 新增课堂互动页面（教师端+学生端）和导航项"
```

### Task 36: Phase 4 集成验证

- [ ] **Step 1: 验证 WebSocket 连接**

启动后端，用 wscat 测试：

```bash
# 安装 wscat（如未安装）
npx wscat -c "ws://localhost:10001/api/classroom-ws?token=<teacher_token>"
# 发送：{"type":"start_session","data":{"class_id":1}}
# 期望收到：{"type":"session_started","data":{"session_id":1}}
```

- [ ] **Step 2: 验证 REST API**

```bash
curl http://localhost:10001/api/classroom/sessions -H "Authorization: Bearer <token>"
```

- [ ] **Step 3: 验证前端页面**

教师端访问 `/user/classroom`，学生端访问 `/student/classroom`。
测试：开启会话 → 学生加入 → 随机点名 → 投票 → 测验 → 计时 → 结束会话。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: Phase 4 完成 — 课堂互动工具"
```

---

## Chunk 6: 收尾

### Task 37: 全局集成验证

- [ ] **Step 1: 验证所有数据库表**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "
SELECT TABLE_NAME FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'aiteacher'
AND TABLE_NAME IN ('assignment_questions','knowledge_tree','resource_node_map',
  'resource_share','resource_favorite','resource_tag','resource_tag_map',
  'classroom_session','classroom_interaction','classroom_response')
ORDER BY TABLE_NAME;"
```

Expected: 10 张新表全部存在

- [ ] **Step 2: 验证 assignment_submissions 表变更**

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "DESCRIBE assignment_submissions;" | grep -E "status|ai_scores|detail_scores"
```

Expected: status 包含 auto_graded/ai_graded，ai_scores 和 detail_scores 列存在

- [ ] **Step 3: 验证后端路由注册**

```bash
# 启动后端后检查所有新路由是否可访问（返回 401 而非 404 即表示路由已注册）
curl -s -o /dev/null -w "%{http_code}" http://localhost:10001/api/knowledge-tree
curl -s -o /dev/null -w "%{http_code}" http://localhost:10001/api/share/public
curl -s -o /dev/null -w "%{http_code}" http://localhost:10001/api/classroom/sessions
```

Expected: 全部返回 401（需要认证），而非 404

- [ ] **Step 4: 验证前端页面路由**

访问以下页面确认不报 404：
- `/user/resource-library`
- `/user/shared-resources`
- `/user/classroom`
- `/student/classroom`

- [ ] **Step 5: 验证导航菜单**

教师端侧边栏应显示：资源库、共享中心、课堂互动（3 个新菜单项）

- [ ] **Step 6: 最终 Commit**

```bash
git add -A && git commit -m "feat: 教师备课增强功能全部完成（5个模块/9张新表/4个新页面/7个composable）"
```
