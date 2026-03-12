<script setup lang="ts">
const { apiFetch } = useApi()
const loading = ref(true)
const exams = ref<any[]>([])

const statusLabels: Record<string, string> = {
  pending: '未参加',
  submitted: '已提交',
  graded: '已批改',
}
const statusColors: Record<string, string> = {
  pending: 'warning',
  submitted: 'info',
  graded: 'success',
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
  { label: '未参加', value: 'pending' },
  { label: '已提交', value: 'submitted' },
  { label: '已批改', value: 'graded' },
]

const stats = computed(() => {
  const list = exams.value
  return [
    { label: '总考试', value: list.length, icon: 'i-lucide-file-check', color: 'text-primary' },
    { label: '未参加', value: list.filter(e => e.submission_status === 'pending').length, icon: 'i-lucide-clock', color: 'text-orange-500' },
    { label: '已提交', value: list.filter(e => e.submission_status === 'submitted').length, icon: 'i-lucide-send', color: 'text-blue-500' },
    { label: '已批改', value: list.filter(e => e.submission_status === 'graded').length, icon: 'i-lucide-check-circle', color: 'text-green-500' },
  ]
})

const filteredExams = computed(() => {
  if (activeFilter.value === 'all') return exams.value
  return exams.value.filter(e => e.submission_status === activeFilter.value)
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

onMounted(async () => {
  try {
    const res = await apiFetch<{ code: number, data: { exams: any[] } }>('/students/exams')
    if (res.code === 200) exams.value = res.data.exams
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="考试中心">
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
          <div v-if="filteredExams.length === 0" class="flex flex-col items-center py-16 gap-3">
            <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UIcon name="i-lucide-inbox" class="text-3xl text-primary" />
            </div>
            <p class="text-muted">
              {{ activeFilter === 'all' ? '暂无考试' : `没有${filters.find(f => f.value === activeFilter)?.label}的考试` }}
            </p>
          </div>

          <!-- 考试卡片列表 -->
          <div v-else class="space-y-3">
            <div
              v-for="e in filteredExams" :key="e.id"
              class="rounded-xl border border-default overflow-hidden transition-all hover:shadow-sm cursor-pointer"
              @click="toggleExpand(e.id)"
            >
              <!-- 卡片主体 -->
              <div class="p-4 flex items-start gap-4">
                <div class="flex-1 min-w-0 space-y-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-base font-semibold text-highlighted truncate">{{ e.title }}</h3>
                    <UBadge v-if="e.subject" color="neutral" variant="subtle" size="xs">{{ e.subject }}</UBadge>
                    <UBadge v-if="e.course_name" color="neutral" variant="outline" size="xs">{{ e.course_name }}</UBadge>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-muted">
                    <span class="flex items-center gap-1">
                      <UIcon name="i-lucide-calendar" class="text-sm" />
                      <span
                        :class="{
                          'text-red-500 font-medium': e.submission_status === 'pending' && isUrgent(e.deadline),
                          'text-red-400 line-through': e.submission_status === 'pending' && isOverdue(e.deadline),
                        }"
                      >
                        {{ formatDate(e.deadline) }}
                        <template v-if="e.submission_status === 'pending' && isUrgent(e.deadline)"> (即将开考)</template>
                        <template v-if="e.submission_status === 'pending' && isOverdue(e.deadline)"> (已过期)</template>
                      </span>
                    </span>
                    <span class="flex items-center gap-1">
                      <UIcon name="i-lucide-trophy" class="text-sm" />
                      满分 {{ e.total_score }}
                    </span>
                    <span v-if="e.submit_time" class="flex items-center gap-1">
                      <UIcon name="i-lucide-send" class="text-sm" />
                      {{ formatDate(e.submit_time) }} 提交
                    </span>
                  </div>
                </div>

                <!-- 右侧状态 + 成绩 -->
                <div class="flex items-center gap-3 shrink-0">
                  <div v-if="e.submission_status === 'graded' && e.score !== null" class="text-right">
                    <p class="text-2xl font-bold" :class="scorePercent(e.score, e.total_score) >= 60 ? 'text-green-500' : 'text-red-500'">
                      {{ e.score }}
                    </p>
                    <p class="text-xs text-muted">/ {{ e.total_score }}</p>
                  </div>
                  <UBadge
                    :color="(statusColors[e.submission_status] as any) || 'neutral'"
                    variant="subtle"
                    :icon="statusIcons[e.submission_status]"
                  >
                    {{ statusLabels[e.submission_status] || e.submission_status }}
                  </UBadge>
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="text-muted transition-transform"
                    :class="{ 'rotate-180': expandedId === e.id }"
                  />
                </div>
              </div>

              <!-- 展开详情 -->
              <Transition name="expand">
                <div v-if="expandedId === e.id" class="border-t border-default bg-elevated/50 p-4 space-y-3">
                  <div v-if="e.description" class="text-sm text-muted leading-relaxed">
                    {{ e.description }}
                  </div>
                  <div class="flex flex-wrap gap-4 text-xs text-muted">
                    <span>满分：{{ e.total_score }}</span>
                    <span v-if="e.submit_time">提交时间：{{ formatDate(e.submit_time) }}</span>
                    <span v-if="e.grade_time">批改时间：{{ formatDate(e.grade_time) }}</span>
                  </div>
                  <div v-if="e.submission_status === 'graded' && e.score !== null" class="flex items-center gap-3">
                    <div class="w-full bg-default rounded-full h-2">
                      <div
                        class="h-2 rounded-full transition-all"
                        :class="scorePercent(e.score, e.total_score) >= 60 ? 'bg-green-500' : 'bg-red-500'"
                        :style="{ width: `${scorePercent(e.score, e.total_score)}%` }"
                      />
                    </div>
                    <span class="text-xs text-muted shrink-0">{{ scorePercent(e.score, e.total_score) }}%</span>
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
