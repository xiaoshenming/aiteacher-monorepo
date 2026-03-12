<script setup lang="ts">
const { apiFetch } = useApi()
const loading = ref(true)
const data = ref<any>(null)

// 概览统计
const totalSubjects = computed(() => data.value?.subjects?.length || 0)
const avgAccuracy = computed(() => {
  const subs = data.value?.subjects
  if (!subs?.length) return 0
  const sum = subs.reduce((a: number, s: any) => a + Number(s.homework_accuracy || 0), 0)
  return (sum / subs.length).toFixed(1)
})
const totalPractice = computed(() => {
  const subs = data.value?.subjects
  if (!subs?.length) return 0
  return subs.reduce((a: number, s: any) => a + Number(s.practice_count || 0), 0)
})
const bestSubject = computed(() => {
  const subs = data.value?.subjects
  if (!subs?.length) return '-'
  const best = subs.reduce((a: any, b: any) =>
    Number(a.homework_accuracy || 0) >= Number(b.homework_accuracy || 0) ? a : b
  )
  return best.subject || '-'
})

const overviewCards = computed(() => [
  { label: '总科目数', value: totalSubjects.value, icon: 'i-lucide-book-open', gradient: 'from-blue-500 to-cyan-500' },
  { label: '平均正确率', value: `${avgAccuracy.value}%`, icon: 'i-lucide-target', gradient: 'from-emerald-500 to-teal-500' },
  { label: '总练习次数', value: totalPractice.value, icon: 'i-lucide-pencil-line', gradient: 'from-purple-500 to-pink-500' },
  { label: '最强科目', value: bestSubject.value, icon: 'i-lucide-trophy', gradient: 'from-orange-500 to-amber-500' },
])

// 成绩趋势图（带平均线）
const scoreOption = computed(() => {
  if (!data.value?.trend?.length) return null
  const scores = data.value.trend.map((t: any) => t.score)
  const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    grid: { top: 40, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: data.value.trend.map((t: any) => t.title?.slice(0, 8)),
      axisLabel: { fontSize: 11, color: '#999' },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
    },
    yAxis: {
      type: 'value', min: 0, max: 100,
      axisLabel: { fontSize: 11, color: '#999' },
      splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
    },
    series: [{
      name: '成绩', type: 'line', smooth: true,
      data: scores,
      symbol: 'circle', symbolSize: 8,
      itemStyle: { color: '#6366f1' },
      lineStyle: { width: 3 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(99,102,241,0.3)' },
            { offset: 1, color: 'rgba(99,102,241,0.02)' },
          ],
        },
      },
      markLine: {
        silent: true,
        data: [{ yAxis: avg, name: '平均' }],
        lineStyle: { color: '#f59e0b', type: 'dashed', width: 2 },
        label: { formatter: `平均 ${avg.toFixed(1)}`, color: '#f59e0b' },
      },
    }],
  }
})

// 雷达图（渐变填充）
const radarOption = computed(() => {
  if (!data.value?.scores?.length) return null
  const names = data.value.scores.map((s: any) => s.course_name || s.subject || '未知')
  return {
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    radar: {
      indicator: names.map((n: string) => ({ name: n, max: 100 })),
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: '#666', fontSize: 12 },
      splitLine: { lineStyle: { color: '#e5e7eb' } },
      splitArea: {
        areaStyle: { color: ['rgba(99,102,241,0.02)', 'rgba(99,102,241,0.05)'] },
      },
    },
    series: [{
      type: 'radar',
      data: [{
        value: data.value.scores.map((s: any) => s.avg_score || 0),
        name: '平均分',
        symbol: 'circle', symbolSize: 6,
        lineStyle: { width: 2, color: '#8b5cf6' },
        areaStyle: {
          color: {
            type: 'radial', x: 0.5, y: 0.5, r: 0.5,
            colorStops: [
              { offset: 0, color: 'rgba(139,92,246,0.4)' },
              { offset: 1, color: 'rgba(139,92,246,0.05)' },
            ],
          },
        },
        itemStyle: { color: '#8b5cf6' },
      }],
    }],
  }
})

// 完成情况柱状图（渐变色）
const completionOption = computed(() => {
  if (!data.value?.completion?.length) return null
  const names = data.value.completion.map((c: any) => c.course_name || '未知')
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    legend: { top: 0, textStyle: { fontSize: 12, color: '#999' } },
    grid: { top: 40, right: 20, bottom: 40, left: 50 },
    xAxis: {
      type: 'category', data: names,
      axisLabel: { rotate: 20, fontSize: 11, color: '#999' },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: '#999' },
      splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
    },
    series: [
      {
        name: '总数', type: 'bar', barGap: '10%',
        data: data.value.completion.map((c: any) => c.total),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#93c5fd' },
              { offset: 1, color: '#3b82f6' },
            ],
          },
        },
      },
      {
        name: '已完成', type: 'bar',
        data: data.value.completion.map((c: any) => c.completed),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#6ee7b7' },
              { offset: 1, color: '#10b981' },
            ],
          },
        },
      },
    ],
  }
})

// 知识点掌握等级配色
const masteryConfig: Record<string, { color: string, badge: string }> = {
  '优秀': { color: 'success', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  '良好': { color: 'info', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  '一般': { color: 'warning', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  '需加强': { color: 'error', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}
const subjectColors = [
  'from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800',
  'from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800',
  'from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800',
  'from-orange-500/10 to-amber-500/10 border-orange-200 dark:border-orange-800',
  'from-rose-500/10 to-red-500/10 border-rose-200 dark:border-rose-800',
  'from-indigo-500/10 to-violet-500/10 border-indigo-200 dark:border-indigo-800',
]
function accuracyBarColor(acc: number) {
  if (acc >= 90) return 'bg-emerald-500'
  if (acc >= 70) return 'bg-blue-500'
  if (acc >= 50) return 'bg-orange-500'
  return 'bg-red-500'
}

// 学习建议
const suggestions = computed(() => {
  const tips: string[] = []
  const subs = data.value?.subjects
  if (!subs?.length) return tips
  const weak = subs.filter((s: any) => Number(s.homework_accuracy) < 60)
  const medium = subs.filter((s: any) => {
    const acc = Number(s.homework_accuracy)
    return acc >= 60 && acc < 80
  })
  const strong = subs.filter((s: any) => Number(s.homework_accuracy) >= 90)
  if (weak.length) {
    tips.push(`${weak.map((s: any) => s.subject).join('、')} 正确率偏低，建议加强基础练习，每天安排 15-30 分钟专项训练。`)
  }
  if (medium.length) {
    tips.push(`${medium.map((s: any) => s.subject).join('、')} 处于中等水平，可以通过错题回顾和针对性练习来提升。`)
  }
  if (strong.length) {
    tips.push(`${strong.map((s: any) => s.subject).join('、')} 表现优秀，继续保持！可以尝试更有挑战性的题目。`)
  }
  const lowPractice = subs.filter((s: any) => Number(s.practice_count) < 5)
  if (lowPractice.length) {
    tips.push(`${lowPractice.map((s: any) => s.subject).join('、')} 练习次数较少，建议增加练习频率以巩固知识。`)
  }
  if (!tips.length) tips.push('整体学习状态良好，继续保持稳定的学习节奏！')
  return tips
})

onMounted(async () => {
  try {
    const res = await apiFetch<{ code: number, data: any }>('/students/learning-stats')
    if (res.code === 200) data.value = res.data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="学情数据">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-8">
        <div v-if="loading" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl" />
        </div>
        <template v-else-if="data">
          <!-- 概览统计卡片 -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="card in overviewCards" :key="card.label"
              class="relative overflow-hidden rounded-xl bg-gradient-to-br p-5"
              :class="card.gradient"
            >
              <div class="relative z-10">
                <UIcon :name="card.icon" class="text-2xl text-white/80 mb-2" />
                <p class="text-2xl font-bold text-white">{{ card.value }}</p>
                <p class="text-xs text-white/70 mt-1">{{ card.label }}</p>
              </div>
              <div class="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
            </div>
          </div>

          <!-- 图表区域 -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ClientOnly v-if="scoreOption">
              <DashboardChartLazy title="成绩趋势" subtitle="按作业时间" :option="scoreOption" height="380px" />
            </ClientOnly>
            <ClientOnly v-if="radarOption">
              <DashboardChartLazy title="科目能力雷达图" :option="radarOption" height="380px" />
            </ClientOnly>
          </div>
          <div v-if="completionOption">
            <ClientOnly>
              <DashboardChartLazy title="各科作业完成情况" :option="completionOption" height="380px" />
            </ClientOnly>
          </div>

          <!-- 知识点掌握情况 -->
          <div v-if="data.subjects?.length">
            <h2 class="text-base font-semibold text-highlighted mb-4">知识点掌握情况</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="(s, i) in data.subjects" :key="s.id"
                class="rounded-xl border bg-gradient-to-br p-5 transition-all hover:shadow-md"
                :class="subjectColors[i % subjectColors.length]"
              >
                <div class="flex items-start justify-between mb-3">
                  <p class="text-sm font-semibold text-highlighted">{{ s.subject }}</p>
                  <span
                    class="text-xs font-medium rounded-full px-2.5 py-0.5"
                    :class="masteryConfig[s.mastery_level]?.badge || 'bg-gray-100 text-gray-600'"
                  >
                    {{ s.mastery_level }}
                  </span>
                </div>
                <div class="mb-2">
                  <div class="flex justify-between text-xs text-muted mb-1">
                    <span>正确率</span>
                    <span class="font-medium text-highlighted">{{ s.homework_accuracy }}%</span>
                  </div>
                  <div class="w-full h-2.5 rounded-full bg-default/30">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="accuracyBarColor(Number(s.homework_accuracy))"
                      :style="{ width: `${Math.min(Number(s.homework_accuracy), 100)}%` }"
                    />
                  </div>
                </div>
                <p class="text-xs text-muted">
                  练习 <span class="font-medium text-highlighted">{{ s.practice_count }}</span> 次
                </p>
              </div>
            </div>
          </div>

          <!-- 学习建议 -->
          <div v-if="suggestions.length">
            <h2 class="text-base font-semibold text-highlighted mb-4">学习建议</h2>
            <div class="rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10 p-5 space-y-3">
              <div
                v-for="(tip, i) in suggestions" :key="i"
                class="flex gap-3 items-start"
              >
                <UIcon name="i-lucide-lightbulb" class="text-primary-500 mt-0.5 shrink-0" />
                <p class="text-sm text-highlighted leading-relaxed">{{ tip }}</p>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="text-center py-12 text-muted">暂无学情数据</div>
      </div>
    </template>
  </UDashboardPanel>
</template>
