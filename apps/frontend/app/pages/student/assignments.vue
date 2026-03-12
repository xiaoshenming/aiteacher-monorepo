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
    { label: '总作业', value: list.length, icon: 'i-lucide-clipboard-list', color: 'text-primary' },
    { label: '待提交', value: list.filter(a => a.submission_status === 'pending').length, icon: 'i-lucide-clock', color: 'text-orange-500' },
    { label: '已提交', value: list.filter(a => a.submission_status === 'submitted').length, icon: 'i-lucide-send', color: 'text-blue-500' },
    { label: '已批改', value: list.filter(a => a.submission_status === 'graded').length, icon: 'i-lucide-check-circle', color: 'text-green-500' },
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
              class="flex items-center gap-3 p-4 rounded-xl border border-default bg-default/50"
            >
              <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
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
            <button
              v-for="f in filters" :key="f.value"
              class="px-3 py-1.5 text-sm rounded-lg transition-colors"
              :class="activeFilter === f.value
                ? 'bg-primary text-white'
                : 'bg-elevated text-muted hover:text-highlighted'"
              @click="activeFilter = f.value"
            >
              {{ f.label }}
            </button>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredAssignments.length === 0" class="flex flex-col items-center py-16 gap-3">
            <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
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
              class="rounded-xl border border-default overflow-hidden transition-all hover:shadow-sm cursor-pointer"
              @click="toggleExpand(a.id)"
            >
              <!-- 卡片主体 -->
              <div class="p-4 flex items-start gap-4">
                <!-- 左侧内容 -->
                <div class="flex-1 min-w-0 space-y-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-base font-semibold text-highlighted truncate">{{ a.title }}</h3>
                    <UBadge color="neutral" variant="subtle" size="xs">{{ a.course_name }}</UBadge>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-muted">
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
                  <!-- 成绩展示 -->
                  <div v-if="a.submission_status === 'graded' && a.score !== null" class="text-right">
                    <p class="text-2xl font-bold" :class="scorePercent(a.score, a.total_score) >= 60 ? 'text-green-500' : 'text-red-500'">
                      {{ a.score }}
                    </p>
                    <p class="text-xs text-muted">/ {{ a.total_score }}</p>
                  </div>
                  <UBadge
                    :color="(statusColors[a.submission_status] as any) || 'neutral'"
                    variant="subtle"
                    :icon="statusIcons[a.submission_status]"
                  >
                    {{ statusLabels[a.submission_status] || a.submission_status }}
                  </UBadge>
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="text-muted transition-transform"
                    :class="{ 'rotate-180': expandedId === a.id }"
                  />
                </div>
              </div>

              <!-- 展开详情 -->
              <Transition name="expand">
                <div v-if="expandedId === a.id" class="border-t border-default bg-elevated/50 p-4 space-y-3">
                  <div v-if="a.description" class="text-sm text-muted leading-relaxed">
                    {{ a.description }}
                  </div>
                  <div class="flex flex-wrap gap-4 text-xs text-muted">
                    <span>类型：{{ a.type === 'homework' ? '作业' : a.type === 'quiz' ? '测验' : '考试' }}</span>
                    <span>满分：{{ a.total_score }}</span>
                    <span v-if="a.submit_time">提交时间：{{ formatDate(a.submit_time) }}</span>
                  </div>
                  <div v-if="a.feedback" class="rounded-lg bg-default p-3">
                    <p class="text-xs text-muted mb-1">教师反馈</p>
                    <p class="text-sm text-highlighted">{{ a.feedback }}</p>
                  </div>
                  <div v-if="a.submission_status === 'graded' && a.score !== null" class="flex items-center gap-3">
                    <div class="w-full bg-default rounded-full h-2">
                      <div
                        class="h-2 rounded-full transition-all"
                        :class="scorePercent(a.score, a.total_score) >= 60 ? 'bg-green-500' : 'bg-red-500'"
                        :style="{ width: `${scorePercent(a.score, a.total_score)}%` }"
                      />
                    </div>
                    <span class="text-xs text-muted shrink-0">{{ scorePercent(a.score, a.total_score) }}%</span>
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
  transition: all 0.2s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 300px;
}
</style>
