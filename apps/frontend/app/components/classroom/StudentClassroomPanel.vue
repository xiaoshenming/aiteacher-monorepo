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
      <div class="p-4">
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-6 min-h-[400px]">
          <StudentPollView v-if="currentView === 'poll'"
            :question="pollQuestion" :options="pollOptions" :interaction-id="interactionId"
            @vote="handleVote" />
          <StudentQuizView v-else-if="currentView === 'quiz'"
            :question="quizQuestion" :options="quizOptions" :interaction-id="interactionId"
            :correct-answer="quizCorrectAnswer"
            @answer="handleAnswer" />
          <CountdownTimer v-else-if="currentView === 'timer'" :remaining="timerRemaining" />
          <div v-else-if="currentView === 'picked'" class="text-center py-16">
            <div class="text-4xl mb-4">{{ pickedIsMe ? '🎯' : '👀' }}</div>
            <p class="text-lg" :class="pickedIsMe ? 'text-primary font-bold' : 'text-muted'">
              {{ pickedIsMe ? '你被点名了！' : `${pickedName} 被点名了` }}
            </p>
          </div>
          <StudentWaiting v-else />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
const userStore = useUserStore()
const { connected, lastMessage, connect, send, disconnect } = useClassroomWS()

const currentView = ref('waiting')
const interactionId = ref(0)
const pollQuestion = ref('')
const pollOptions = ref<string[]>([])
const quizQuestion = ref('')
const quizOptions = ref<string[]>([])
const quizCorrectAnswer = ref('')
const timerRemaining = ref(0)
const pickedIsMe = ref(false)
const pickedName = ref('')

onMounted(() => {
  const token = userStore.token
  if (token) {
    connect(token)
    nextTick(() => send('join_session'))
  }
})

function handleVote(option: string) {
  send('poll_vote', { interaction_id: interactionId.value, option })
}

function handleAnswer(answer: string) {
  send('quiz_answer', { interaction_id: interactionId.value, answer })
}

watch(lastMessage, (msg) => {
  if (!msg) return
  switch (msg.type) {
    case 'poll_started':
      currentView.value = 'poll'
      interactionId.value = msg.interaction_id
      pollQuestion.value = msg.question
      pollOptions.value = msg.options
      break
    case 'poll_closed':
      currentView.value = 'waiting'
      break
    case 'quiz_started':
      currentView.value = 'quiz'
      interactionId.value = msg.interaction_id
      quizQuestion.value = msg.question
      quizOptions.value = msg.options
      quizCorrectAnswer.value = ''
      break
    case 'quiz_closed':
      quizCorrectAnswer.value = msg.correct_answer || ''
      setTimeout(() => { currentView.value = 'waiting' }, 5000)
      break
    case 'random_pick_result':
      currentView.value = 'picked'
      pickedIsMe.value = String(msg.student_id) === String(userStore.userInfo?.id)
      pickedName.value = msg.student_name || `学生${msg.student_id}`
      setTimeout(() => { currentView.value = 'waiting' }, 5000)
      break
    case 'timer_started':
      currentView.value = 'timer'
      timerRemaining.value = msg.seconds
      break
    case 'timer_tick':
      timerRemaining.value = msg.remaining
      break
    case 'timer_ended':
      currentView.value = 'waiting'
      break
    case 'session_ended':
      currentView.value = 'waiting'
      break
  }
})

onUnmounted(() => disconnect())
</script>
