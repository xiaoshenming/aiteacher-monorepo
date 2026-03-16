<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
          <span class="ml-2 font-semibold">课堂互动</span>
        </template>
        <template #trailing>
          <UBadge v-if="connected" variant="subtle" size="sm" color="success">已连接</UBadge>
          <UBadge v-else variant="subtle" size="sm" color="error">未连接</UBadge>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="p-4 space-y-4">
        <!-- 会话控制 -->
        <div class="flex items-center gap-3 flex-wrap">
          <UButton v-if="!sessionActive" color="primary" icon="i-lucide-play" @click="startSession">
            开启课堂
          </UButton>
          <UButton v-else color="error" variant="soft" icon="i-lucide-square" @click="endSession">
            结束课堂
          </UButton>
          <span v-if="sessionActive" class="text-sm text-muted">
            在线学生：{{ onlineStudents.length }}
          </span>
        </div>

        <!-- 工具栏 -->
        <ClassroomToolbar v-if="sessionActive"
          @random-pick="handleRandomPick"
          @start-poll="showPollCreator = true"
          @start-quiz="showQuizLauncher = true"
          @start-timer="handleStartTimer" />

        <!-- 互动区域 -->
        <div v-if="sessionActive" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="lg:col-span-2">
            <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-4 min-h-[300px]">
              <ClassroomRandomPicker v-if="interactionType === 'random_pick'" :students="onlineStudents" :picked-id="pickedStudentId" />
              <ClassroomPollResult v-else-if="interactionType === 'poll'" :question="pollData.question" :options="pollData.options" :votes="pollData.votes" />
              <ClassroomQuizResult v-else-if="interactionType === 'quiz_closed'" :total-students="quizData.total" :correct-count="quizData.correct" />
              <ClassroomCountdownTimer v-else-if="interactionType === 'timer'" :remaining="timerRemaining" :total="timerTotal" />
              <div v-else class="flex items-center justify-center h-64 text-muted">
                <p>选择上方工具开始互动</p>
              </div>
            </div>
          </div>
          <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-4">
            <ClassroomStudentList :students="onlineStudents" />
          </div>
        </div>
      </div>

      <!-- 弹窗 -->
      <ClassroomPollCreator v-model:open="showPollCreator" @create="handleCreatePoll" />
      <ClassroomQuizLauncher v-model:open="showQuizLauncher" @launch="handleLaunchQuiz" />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
const userStore = useUserStore()
const { connected, lastMessage, connect, send, disconnect } = useClassroomWS()

const sessionActive = ref(false)
const interactionType = ref('')
const onlineStudents = ref<{ id: string, name?: string }[]>([])
const pickedStudentId = ref<string | null>(null)
const showPollCreator = ref(false)
const showQuizLauncher = ref(false)

const pollData = ref({ question: '', options: [] as string[], votes: {} as Record<string, number> })
const quizData = ref({ total: 0, correct: 0 })
const timerRemaining = ref(0)
const timerTotal = ref(60)

let timerInterval: ReturnType<typeof setInterval> | null = null

function startSession() {
  const token = userStore.token
  if (!token) return
  connect(token)
  sessionActive.value = true
  nextTick(() => send('start_session', { course_id: 1, class_id: 1 }))
}

function endSession() {
  send('end_session')
  sessionActive.value = false
  interactionType.value = ''
  onlineStudents.value = []
  disconnect()
}

function handleRandomPick() {
  send('random_pick')
}

function handleCreatePoll(question: string, options: string[]) {
  send('start_poll', { question, options })
  pollData.value = { question, options, votes: {} }
  interactionType.value = 'poll'
}

function handleLaunchQuiz(question: string, options: string[], correctAnswer: string) {
  send('start_quiz', { question, options, correct_answer: correctAnswer })
  interactionType.value = 'quiz'
}

function handleStartTimer() {
  const seconds = 60
  timerTotal.value = seconds
  timerRemaining.value = seconds
  interactionType.value = 'timer'
  send('start_timer', { seconds })
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    timerRemaining.value--
    if (timerRemaining.value <= 0) {
      clearInterval(timerInterval!)
      timerInterval = null
    }
  }, 1000)
}

watch(lastMessage, (msg) => {
  if (!msg) return
  switch (msg.type) {
    case 'student_joined':
      if (!onlineStudents.value.find(s => s.id === msg.user_id))
        onlineStudents.value.push({ id: msg.user_id, name: msg.name })
      break
    case 'student_left':
      onlineStudents.value = onlineStudents.value.filter(s => s.id !== msg.user_id)
      break
    case 'random_pick_result':
      interactionType.value = 'random_pick'
      pickedStudentId.value = msg.student_id
      break
    case 'poll_vote':
      if (pollData.value.votes[msg.option] !== undefined)
        pollData.value.votes[msg.option]++
      else
        pollData.value.votes[msg.option] = 1
      break
    case 'poll_closed':
      pollData.value.votes = msg.results || pollData.value.votes
      break
    case 'quiz_closed':
      interactionType.value = 'quiz_closed'
      quizData.value = { total: msg.total || 0, correct: msg.correct || 0 }
      break
    case 'timer_tick':
      timerRemaining.value = msg.remaining
      break
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  disconnect()
})
</script>
