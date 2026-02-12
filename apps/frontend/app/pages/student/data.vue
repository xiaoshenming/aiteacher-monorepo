<script setup lang="ts">
const scoreOption = {
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周'],
  },
  yAxis: { type: 'value', min: 0, max: 100 },
  series: [
    {
      name: '成绩',
      type: 'line',
      smooth: true,
      data: [72, 75, 80, 78, 85, 82, 88, 90],
      areaStyle: { opacity: 0.15 },
    },
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
        { value: [85, 78, 82, 92, 88], name: '我的成绩' },
        { value: [75, 72, 70, 80, 76], name: '班级平均' },
      ],
    },
  ],
}
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
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClientOnly>
            <DashboardChart title="成绩趋势" subtitle="近8周" :option="scoreOption" />
          </ClientOnly>
          <ClientOnly>
            <DashboardChart title="科目能力雷达图" :option="radarOption" />
          </ClientOnly>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
