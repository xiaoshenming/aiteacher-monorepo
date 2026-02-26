<script setup lang="ts">
const props = defineProps<{
  totalGenerates: number
  totalCalls: number
  totalTokens: number
  loading?: boolean
}>()

const targets = { generates: 100, calls: 1000, tokens: 1_000_000 }

function percent(value: number, target: number) {
  return Math.min(Math.round((value / target) * 100), 100)
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

const metrics = computed(() => [
  {
    label: '生成内容',
    icon: 'i-lucide-file-text',
    value: String(props.totalGenerates),
    target: targets.generates,
    percent: percent(props.totalGenerates, targets.generates),
    gradient: 'from-sky-400 to-blue-600',
    bgLight: 'bg-sky-50',
    bgDark: 'dark:bg-sky-900/20',
    textColor: 'text-sky-500',
  },
  {
    label: 'AI 调用',
    icon: 'i-lucide-bot',
    value: String(props.totalCalls),
    target: targets.calls,
    percent: percent(props.totalCalls, targets.calls),
    gradient: 'from-amber-400 to-orange-600',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-900/20',
    textColor: 'text-amber-500',
  },
  {
    label: 'Token 消耗',
    icon: 'i-lucide-coins',
    value: formatTokens(props.totalTokens),
    target: targets.tokens,
    percent: percent(props.totalTokens, targets.tokens),
    gradient: 'from-rose-400 to-pink-600',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-900/20',
    textColor: 'text-rose-500',
  },
])

// 教学等级计算
const totalScore = computed(() => {
  return metrics.value.reduce((sum, m) => sum + m.percent, 0)
})

const levelInfo = computed(() => {
  const s = totalScore.value
  if (s <= 50) return { name: '初学者', icon: 'i-lucide-sprout', color: 'text-emerald-500', ring: '#10b981' }
  if (s <= 100) return { name: '进阶教师', icon: 'i-lucide-book-open', color: 'text-sky-500', ring: '#0ea5e9' }
  if (s <= 200) return { name: '资深教师', icon: 'i-lucide-graduation-cap', color: 'text-violet-500', ring: '#8b5cf6' }
  return { name: '教学专家', icon: 'i-lucide-crown', color: 'text-amber-500', ring: '#f59e0b' }
})

const ringPercent = computed(() => Math.round((totalScore.value / 300) * 100))

// 里程碑提示
interface Milestone {
  metric: string
  current: number
  target: number
  name: string
}

const nextMilestone = computed((): Milestone | null => {
  const milestones: Milestone[] = [
    { metric: '生成内容', current: props.totalGenerates, target: 10, name: '初试锋芒' },
    { metric: '生成内容', current: props.totalGenerates, target: 50, name: '半百达人' },
    { metric: '生成内容', current: props.totalGenerates, target: 100, name: '百篇达人' },
    { metric: 'AI 调用', current: props.totalCalls, target: 100, name: '百次探索' },
    { metric: 'AI 调用', current: props.totalCalls, target: 500, name: '深度用户' },
    { metric: 'AI 调用', current: props.totalCalls, target: 1000, name: '千次大师' },
    { metric: 'Token', current: props.totalTokens, target: 100_000, name: '十万词汇' },
    { metric: 'Token', current: props.totalTokens, target: 500_000, name: '五十万里程' },
    { metric: 'Token', current: props.totalTokens, target: 1_000_000, name: '百万词王' },
  ]
  return milestones.find(m => m.current < m.target) ?? null
})

function formatMilestoneGap(m: Milestone): string {
  const gap = m.target - m.current
  if (m.metric === 'Token') return `再消耗 ${formatTokens(gap)} Token`
  return `再${m.metric === '生成内容' ? '生成' : '调用'} ${gap} 次`
}
</script>

<template>
  <div
    class="dashboard-card rounded-xl border border-[var(--ui-border-accented)]/60 bg-gradient-to-br from-[var(--ui-bg)] to-[var(--ui-bg-elevated)]/50 p-5 dark:border-white/[0.06]"
  >
    <h3 class="text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
      <UIcon name="i-lucide-award" class="w-4 h-4" />
      教学成就
    </h3>

    <!-- Loading 骨架 -->
    <template v-if="loading">
      <div class="flex items-center gap-4 mb-5">
        <USkeleton class="w-16 h-16 rounded-full shrink-0" />
        <div class="space-y-2 flex-1">
          <USkeleton class="h-4 w-20" />
          <USkeleton class="h-3 w-28" />
        </div>
      </div>
      <div class="space-y-4">
        <div v-for="i in 3" :key="i" class="space-y-1.5">
          <USkeleton class="h-3.5 w-24" />
          <USkeleton class="h-2.5 w-full rounded-full" />
        </div>
      </div>
    </template>

    <template v-else>
      <!-- 教学等级区域 -->
      <div class="flex items-center gap-4 mb-5">
        <!-- 环形进度 -->
        <div class="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
            <circle
              cx="18" cy="18" r="15.5" fill="none"
              stroke="currentColor" stroke-width="2"
              class="text-[var(--ui-border)]"
            />
            <circle
              cx="18" cy="18" r="15.5" fill="none"
              :stroke="levelInfo.ring" stroke-width="2.5"
              stroke-linecap="round"
              :stroke-dasharray="`${ringPercent}, 100`"
              class="transition-all duration-1000 ease-out"
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <UIcon :name="levelInfo.icon" class="w-5 h-5" :class="levelInfo.color" />
          </div>
        </div>
        <!-- 等级信息 -->
        <div class="min-w-0">
          <div class="text-sm font-semibold text-[var(--ui-text-highlighted)]" :class="levelInfo.color">
            {{ levelInfo.name }}
          </div>
          <div class="text-xs text-[var(--ui-text-muted)] mt-0.5 tabular-nums">
            总分 {{ totalScore }} / 300
          </div>
        </div>
      </div>

      <!-- 进度条区域 -->
      <div class="space-y-3.5">
        <div v-for="m in metrics" :key="m.label">
          <div class="flex items-center gap-2 mb-1.5">
            <div
              class="w-5 h-5 rounded flex items-center justify-center shrink-0"
              :class="[m.bgLight, m.bgDark]"
            >
              <UIcon :name="m.icon" class="w-3 h-3" :class="m.textColor" />
            </div>
            <span class="text-sm font-medium text-[var(--ui-text-highlighted)] flex-1 truncate">{{ m.label }}</span>
            <span class="text-xs text-[var(--ui-text-muted)] tabular-nums shrink-0">
              {{ m.value }} / {{ m.target.toLocaleString() }}
            </span>
            <span
              class="text-xs font-semibold tabular-nums w-9 text-right shrink-0"
              :class="m.textColor"
            >
              {{ m.percent }}%
            </span>
          </div>
          <div class="h-2.5 bg-[var(--ui-bg-elevated)] rounded-full overflow-hidden">
            <div
              class="h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out"
              :class="m.gradient"
              :style="{ width: `${m.percent}%` }"
            />
          </div>
        </div>
      </div>

      <!-- 里程碑提示 -->
      <div
        v-if="nextMilestone"
        class="mt-4 pt-3.5 border-t border-[var(--ui-border)]/50 flex items-center gap-2"
      >
        <UIcon name="i-lucide-flag" class="w-3.5 h-3.5 text-[var(--ui-text-dimmed)] shrink-0" />
        <span class="text-xs text-[var(--ui-text-muted)] truncate">
          {{ formatMilestoneGap(nextMilestone) }}即可达成
          <span class="font-medium text-[var(--ui-text-highlighted)]">「{{ nextMilestone.name }}」</span>
        </span>
      </div>
    </template>
  </div>
</template>
