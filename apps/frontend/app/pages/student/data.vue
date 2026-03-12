<script setup lang="ts">
const { apiFetch } = useApi()
const loading = ref(true)
const data = ref<any>(null)

const scoreOption = computed(() => {
  if (!data.value?.trend?.length) return null
  return {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: data.value.trend.map((t: any) => t.title?.slice(0, 8)),
    },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [{
      name: '成绩', type: 'line', smooth: true,
      data: data.value.trend.map((t: any) => t.score),
      areaStyle: { opacity: 0.15 },
    }],
  }
})

const radarOption = computed(() => {
  if (!data.value?.scores?.length) return null
  const names = data.value.scores.map((s: any) => s.course_name || s.subject || '未知')
  return {
    tooltip: {},
    radar: {
      indicator: names.map((n: string) => ({ name: n, max: 100 })),
    },
    series: [{
      type: 'radar',
      data: [{
        value: data.value.scores.map((s: any) => s.avg_score || 0),
        name: '平均分',
      }],
    }],
  }
})

const completionOption = computed(() => {
  if (!data.value?.completion?.length) return null
  const names = data.value.completion.map((c: any) => c.course_name || '未知')
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: names, axisLabel: { rotate: 30 } },
    yAxis: { type: 'value' },
    series: [
      { name: '总数', type: 'bar', data: data.value.completion.map((c: any) => c.total) },
      { name: '已完成', type: 'bar', data: data.value.completion.map((c: any) => c.completed) },
    ],
  }
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
      <div class="p-6 space-y-6">
        <div v-if="loading" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl" />
        </div>
        <template v-else-if="data">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ClientOnly v-if="scoreOption">
              <DashboardChartLazy title="成绩趋势" subtitle="按作业时间" :option="scoreOption" />
            </ClientOnly>
            <ClientOnly v-if="radarOption">
              <DashboardChartLazy title="科目能力雷达图" :option="radarOption" />
            </ClientOnly>
            <ClientOnly v-if="completionOption">
              <DashboardChartLazy title="各科作业完成情况" :option="completionOption" />
            </ClientOnly>
          </div>

          <div v-if="data.subjects?.length">
            <h2 class="text-sm font-medium text-muted mb-3">知识点掌握情况</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div
                v-for="s in data.subjects" :key="s.id"
                class="p-3 rounded-lg border border-default"
              >
                <p class="text-sm font-medium text-highlighted">{{ s.subject }}</p>
                <p class="text-xs text-muted mt-1">
                  正确率 {{ s.homework_accuracy }}% · {{ s.mastery_level }} · 练习 {{ s.practice_count }} 次
                </p>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="text-center py-12 text-muted">暂无学情数据</div>
      </div>
    </template>
  </UDashboardPanel>
</template>
