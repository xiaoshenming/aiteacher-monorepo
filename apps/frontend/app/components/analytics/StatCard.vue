<script setup lang="ts">
defineProps<{
  icon: string
  label: string
  value: string | number
  unit?: string
  color?: 'teal' | 'indigo' | 'amber' | 'rose' | 'sky'
  trend?: number
  loading?: boolean
}>()

const colorMap: Record<string, { bg: string, icon: string }> = {
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', icon: 'text-teal-500' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: 'text-indigo-500' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-500' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', icon: 'text-rose-500' },
  sky: { bg: 'bg-sky-50 dark:bg-sky-900/20', icon: 'text-sky-500' },
}
</script>

<template>
  <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-5 transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600">
    <div class="flex items-start justify-between">
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center"
        :class="colorMap[color ?? 'teal'].bg"
      >
        <UIcon
          :name="icon"
          class="w-5 h-5"
          :class="colorMap[color ?? 'teal'].icon"
        />
      </div>

      <!-- 趋势指示 -->
      <div
        v-if="trend !== undefined && !loading"
        class="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
        :class="
          trend >= 0
            ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20'
            : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
        "
      >
        <UIcon
          :name="trend >= 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
          class="w-3 h-3"
        />
        <span>{{ Math.abs(trend) }}%</span>
      </div>
    </div>

    <div class="mt-4">
      <!-- 骨架屏 -->
      <template v-if="loading">
        <div class="h-8 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        <div class="h-4 w-16 bg-zinc-100 dark:bg-zinc-700/50 rounded animate-pulse mt-1" />
      </template>

      <template v-else>
        <div class="flex items-baseline gap-1">
          <span class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {{ typeof value === 'number' ? value.toLocaleString() : value }}
          </span>
          <span v-if="unit" class="text-sm text-zinc-400">
            {{ unit }}
          </span>
        </div>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {{ label }}
        </p>
      </template>
    </div>
  </div>
</template>
