<script setup lang="ts">
const systemInfo = [
  { label: '系统版本', value: 'AI Teacher v1.0.0', icon: 'i-lucide-package' },
  { label: '运行时间', value: '15天 8小时 32分', icon: 'i-lucide-clock' },
  { label: 'Node.js 版本', value: 'v20.11.0', icon: 'i-lucide-hexagon' },
  { label: '操作系统', value: 'Linux 6.1.0', icon: 'i-lucide-monitor' },
  { label: '数据库', value: 'MySQL 8.0.36', icon: 'i-lucide-database' },
  { label: 'Redis', value: '7.2.4', icon: 'i-lucide-zap' },
  { label: 'CPU 核心', value: '8 核', icon: 'i-lucide-cpu' },
  { label: '内存', value: '16 GB', icon: 'i-lucide-memory-stick' },
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="系统管理">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UCard v-for="item in systemInfo" :key="item.label">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-primary/10">
                <UIcon :name="item.icon" class="text-xl text-primary" />
              </div>
              <div>
                <p class="text-xs text-muted">{{ item.label }}</p>
                <p class="text-sm font-semibold text-highlighted">{{ item.value }}</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
