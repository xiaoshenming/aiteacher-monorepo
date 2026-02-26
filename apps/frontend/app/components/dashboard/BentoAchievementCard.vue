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
  { label: '生成内容', value: props.totalGenerates, display: String(props.totalGenerates), percent: percent(props.totalGenerates, targets.generates), color: '#0ea5e9' },
  { label: 'AI 调用', value: props.totalCalls, display: String(props.totalCalls), percent: percent(props.totalCalls, targets.calls), color: '#f59e0b' },
  { label: 'Token 消耗', value: props.totalTokens, display: formatTokens(props.totalTokens), percent: percent(props.totalTokens, targets.tokens), color: '#f43f5e' },
])
</script>

<template>
  <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-5">
    <h3 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-4 flex items-center gap-2">
      <UIcon name="i-lucide-award" class="w-4 h-4" />
      教学成就
    </h3>

    <template v-if="loading">
      <div class="grid grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="flex flex-col items-center gap-2">
          <div class="w-16 h-16 rounded-full bg-[var(--ui-bg-elevated)] animate-pulse" />
          <div class="h-4 w-10 bg-[var(--ui-bg-elevated)] rounded animate-pulse" />
          <div class="h-3 w-12 bg-[var(--ui-bg-elevated)] rounded animate-pulse" />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="grid grid-cols-3 gap-4">
        <div v-for="m in metrics" :key="m.label" class="flex flex-col items-center gap-1.5">
          <svg viewBox="0 0 36 36" class="w-16 h-16">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" stroke-width="2" class="text-zinc-100 dark:text-zinc-700" />
            <circle
              cx="18" cy="18" r="15.9" fill="none" :stroke="m.color" stroke-width="2.5"
              stroke-linecap="round" :stroke-dasharray="`${m.percent}, 100`"
              transform="rotate(-90 18 18)" class="transition-all duration-1000"
            />
            <text x="18" y="19.5" text-anchor="middle" class="fill-[var(--ui-text-highlighted)]" font-size="7" font-weight="600">
              {{ m.display }}
            </text>
          </svg>
          <span class="text-xs text-[var(--ui-text-muted)]">{{ m.label }}</span>
        </div>
      </div>
    </template>
  </div>
</template>
