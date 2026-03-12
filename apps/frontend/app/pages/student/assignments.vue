<script setup lang="ts">
const { assignments, loading, fetchAssignments } = useStudentAssignments()

const statusColors: Record<string, string> = {
  pending: 'warning',
  submitted: 'info',
  graded: 'success',
}
const statusLabels: Record<string, string> = {
  pending: '待提交',
  submitted: '已提交',
  graded: '已批改',
}
const statusIcons: Record<string, string> = {
  pending: 'i-lucide-clock',
  submitted: 'i-lucide-send',
  graded: 'i-lucide-check-circle',
}

const activeFilter = ref('all')
const expandedId = ref<number | null>(null)

const filters = [
  { label: '全部', value: 'all' },
  { label: '待提交', value: 'pending' },
  { label: '已提交', value: 'submitted' },
  { label: '已批改', value: 'graded' },
]

const stats = computed(() => {
  const list = assignments.value
  return [
    { label: '总作业', value: list.length, icon: 'i-lucide-clipboard-list', color: 'text-teal-500', bg: 'bg-teal-500/10' },
    { label: '待提交', value: list.filter(a => a.submission_status === 'pending').length, icon: 'i-lucide-clock', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: '已提交', value: list.filter(a => a.submission_status === 'submitted').length, icon: 'i-lucide-send', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: '已批改', value: list.filter(a => a.submission_status === 'graded').length, icon: 'i-lucide-check-circle', color: 'text-green-500', bg: 'bg-green-500/10' },
  ]
})

const filteredAssignments = computed(() => {
  if (activeFilter.value === 'all') return assignments.value
  return assignments.value.filter(a => a.submission_status === activeFilter.value)
})

function formatDate(d: string | null) {
  if (!d) return '未设置'
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })
}

function isUrgent(d: string | null) {
  if (!d) return false
  const diff = new Date(d).getTime() - Date.now()
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000
}

function isOverdue(d: string | null) {
  if (!d) return false
  return new Date(d).getTime() < Date.now()
}

function toggleExpand(id: number) {
  expandedId.value = expandedId.value === id ? null : id
}

function scorePercent(score: number | null, total: number) {
  if (score === null || !total) return 0
  return Math.round((score / total) * 100)
}

onMounted(() => {
  fetchAssignments()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="作业中心">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <div v-if="loading" class="flex justify-center py-16">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-primary" />
        </div>

        <template v-else>
          <!-- 统计卡片 -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="s in stats" :key="s.label"
              class="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-4"
            >
              <div :class="['w-10 h-10 rounded-lg flex items-center justify-center shrink-0', s.bg]">
                <UIcon :name="s.icon" :class="['text-xl', s.color]" />
              </div>
              <div>
                <p class="text-2xl font-bold text-highlighted">{{ s.value }}</p>
                <p class="text-xs text-muted">{{ s.label }}</p>
              </div>
            </div>
          </div>

          <!-- 筛选 -->
          <div class="flex gap-2">
            <UButton
              v-for="f in filters" :key="f.value"
              size="sm"
              :variant="activeFilter === f.value ? 'solid' : 'ghost'"
              :color="activeFilter === f.value ? 'primary' : 'neutral'"
              @click="activeFilter = f.value"
            >
              {{ f.label }}
            </UButton>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredAssignments.length === 0" class="flex flex-col items-center py-16 gap-3">
            <div class="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center">
              <UIcon name="i-lucide-inbox" class="text-3xl text-primary" />
            </div>
            <p class="text-muted">
              {{ activeFilter === 'all' ? '暂无作业' : `没有${filters.find(f => f.value === activeFilter)?.label}的作业` }}
            </p>
          </div>

          <!-- 作业卡片列表 -->
          <div v-else class="space-y-3">
            <div
              v-for="a in filteredAssignments" :key="a.id"
              class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              @click="toggleExpand(a.id)"
            >
              <!-- 卡片主体 -->
              <div class="p-5 flex items-start gap-4">
                <!-- 左侧内容 -->
                <div class="flex-1 min-w-0 space-y-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-highlighted font-medium truncate">{{ a.title }}</h3>
                    <UBadge color="neutral" variant="subtle" size="sm">{{ a.course_name }}</UBadge>
                  </div>
                  <div class="flex items-center gap-3 text-sm text-muted">
                    <span class="flex items-center gap-1">
                      <UIcon name="i-lucide-calendar" class="text-sm" />
                      <span
                        :class="{
                          'text-red-500 font-medium': a.submission_status === 'pending' && isUrgent(a.deadline),
                          'text-red-400 line-through': a.submission_status === 'pending' && isOverdue(a.deadline),
                        }"
                      >
                        {{ formatDate(a.deadline) }}
                        <template v-if="a.submission_status === 'pending' && isUrgent(a.deadline)"> (即将截止)</template>
                        <template v-if="a.submission_status === 'pending' && isOverdue(a.deadline)"> (已过期)</template>
                      </span>
                    </span>
                    <span v-if="a.submit_time" class="flex items-center gap-1">
                      <UIcon name="i-lucide-send" class="text-sm" />
                      {{ formatDate(a.submit_time) }} 提交
                    </span>
                  </div>
                </div>

                <!-- 右侧状态 + 成绩 -->
                <div class="flex items-center gap-3 shrink-0">
                  <div v-if="a.submission_status === 'graded' && a.score !== null" class="text-right">
                    <p class="text-lg font-bold text-primary">
                      {{ a.score }}
                    </p>
                    <p class="text-xs text-muted">/ {{ a.total_score }}</p>
                  </div>
                  <UBadge
                    :color="(statusColors[a.submission_status] as any) || 'neutral'"
                    variant="subtle"
                    size="sm"
                    :icon="statusIcons[a.submission_status]"
                  >
                    {{ statusLabels[a.submission_status] || a.submission_status }}
                  </UBadge>
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="text-muted transition-transform duration-200"
                    :class="{ 'rotate-180': expandedId === a.id }"
                  />
                </div>
              </div>

              <!-- 展开详情 -->
              <Transition name="expand">
                <div v-if="expandedId === a.id" class="px-5 pb-5">
                  <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 space-y-3">
                    <div v-if="a.description" class="text-sm text-muted leading-relaxed">
                      {{ a.description }}
                    </div>
                    <div class="flex flex-wrap gap-4 text-xs text-muted">
                      <span>类型：{{ a.type === 'homework' ? '作业' : a.type === 'quiz' ? '测验' : '考试' }}</span>
                      <span>满分：{{ a.total_score }}</span>
                      <span v-if="a.submit_time">提交时间：{{ formatDate(a.submit_time) }}</span>
                    </div>
                    <div v-if="a.feedback" class="rounded-lg bg-white dark:bg-zinc-900/50 p-3 border border-zinc-200 dark:border-zinc-700">
                      <p class="text-xs text-muted mb-1">教师反馈</p>
                      <p class="text-sm text-highlighted">{{ a.feedback }}</p>
                    </div>
                    <div v-if="a.submission_status === 'graded' && a.score !== null" class="flex items-center gap-3">
                      <div class="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                        <div
                          class="h-2 rounded-full transition-all"
                          :class="scorePercent(a.score, a.total_score) >= 60 ? 'bg-teal-500' : 'bg-red-500'"
                          :style="{ width: `${scorePercent(a.score, a.total_score)}%` }"
                        />
                      </div>
                      <span class="text-xs text-muted shrink-0">{{ scorePercent(a.score, a.total_score) }}%</span>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 400px;
}
</style>
