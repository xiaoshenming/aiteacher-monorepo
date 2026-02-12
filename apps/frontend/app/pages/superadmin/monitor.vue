<script setup lang="ts">
const cpuOption = {
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
  },
  yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
  series: [
    { name: 'CPU', type: 'line', smooth: true, data: [15, 12, 45, 68, 72, 55, 30], areaStyle: { opacity: 0.15 } },
  ],
}

const memoryOption = {
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
  },
  yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
  series: [
    { name: '内存', type: 'line', smooth: true, data: [52, 50, 58, 72, 78, 65, 55], areaStyle: { opacity: 0.15 } },
  ],
}

const diskOption = {
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      radius: ['50%', '75%'],
      data: [
        { value: 320, name: '已使用 (320GB)' },
        { value: 180, name: '可用 (180GB)' },
      ],
    },
  ],
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="性能监控">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClientOnly>
            <DashboardChart title="CPU 使用率" subtitle="今日" :option="cpuOption" />
          </ClientOnly>
          <ClientOnly>
            <DashboardChart title="内存使用率" subtitle="今日" :option="memoryOption" />
          </ClientOnly>
        </div>
        <ClientOnly>
          <DashboardChart title="磁盘使用" subtitle="总容量 500GB" :option="diskOption" height="280px" />
        </ClientOnly>
      </div>
    </template>
  </UDashboardPanel>
</template>
