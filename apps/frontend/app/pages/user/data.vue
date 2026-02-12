<script setup lang="ts">
import type { Stat } from '~/types/dashboard'

const stats: Stat[] = [
  { title: '平均分', icon: 'i-lucide-trophy', value: 78.5 },
  { title: '及格率', icon: 'i-lucide-check-circle', value: '86%' },
  { title: '出勤率', icon: 'i-lucide-calendar-check', value: '94%' },
  { title: '作业完成率', icon: 'i-lucide-clipboard-check', value: '91%' },
]

const distributionOption = {
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: ['0-59', '60-69', '70-79', '80-89', '90-100'],
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '人数',
      type: 'bar',
      data: [5, 12, 18, 25, 15],
      itemStyle: { borderRadius: [4, 4, 0, 0] },
    },
  ],
}

const trendOption = {
  tooltip: { trigger: 'axis' },
  legend: { bottom: 0 },
  xAxis: {
    type: 'category',
    data: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周'],
  },
  yAxis: { type: 'value', min: 0, max: 100 },
  series: [
    { name: '班级平均', type: 'line', smooth: true, data: [72, 74, 73, 76, 78, 77, 80, 82] },
    { name: '最高分', type: 'line', smooth: true, data: [95, 98, 92, 96, 99, 95, 97, 100] },
    { name: '最低分', type: 'line', smooth: true, data: [35, 40, 38, 42, 45, 48, 50, 52] },
  ],
}

const radarOption = {
  tooltip: {},
  radar: {
    indicator: [
      { name: '数学', max: 100 },
      { name: '英语', max: 100 },
      { name: '物理', max: 100 },
      { name: '编程', max: 100 },
      { name: '数据结构', max: 100 },
    ],
  },
  series: [
    {
      type: 'radar',
      data: [
        { value: [82, 75, 78, 88, 80], name: '班级平均' },
      ],
    },
  ],
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="学情分析">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <ClientOnly>
          <DashboardStats :stats="stats" />
        </ClientOnly>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClientOnly>
            <DashboardChart title="成绩分布" subtitle="本学期" :option="distributionOption" />
          </ClientOnly>
          <ClientOnly>
            <DashboardChart title="学情趋势" subtitle="近8周" :option="trendOption" />
          </ClientOnly>
        </div>

        <ClientOnly>
          <DashboardChart title="科目对比" subtitle="班级平均" :option="radarOption" height="360px" />
        </ClientOnly>
      </div>
    </template>
  </UDashboardPanel>
</template>
