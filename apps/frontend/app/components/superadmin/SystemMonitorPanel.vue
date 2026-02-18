<script setup lang="ts">
const {
  systemData,
  services,
  bizStats,
  loading,
  autoRefresh,
  cpuGaugeOption,
  memGaugeOption,
  diskGaugeOption,
  uptimeRingOption,
  formatBytes,
  formatUptime,
  getUsageColor,
  getProgressColor,
  fetchData,
} = useSystemMonitor()
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="性能监控">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <div class="flex items-center gap-3">
            <span class="text-sm text-muted">自动刷新</span>
            <USwitch v-model="autoRefresh" />
            <UButton icon="i-lucide-refresh-cw" variant="ghost" :loading="loading" @click="fetchData" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- 资源使用概览 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- CPU Gauge -->
          <ClientOnly>
            <DashboardChartLazy title="CPU 使用率" :subtitle="`${systemData?.cpu.cores ?? '-'} 核心`" :option="cpuGaugeOption" height="220px" />
          </ClientOnly>

          <!-- 内存 Gauge -->
          <ClientOnly>
            <DashboardChartLazy
              title="内存使用率"
              :subtitle="systemData ? `${formatBytes(systemData.memory.used)} / ${formatBytes(systemData.memory.total)}` : '-'"
              :option="memGaugeOption"
              height="220px"
            />
          </ClientOnly>

          <!-- 磁盘 Gauge -->
          <ClientOnly>
            <DashboardChartLazy
              title="磁盘使用率"
              :subtitle="systemData ? `${systemData.disk.used} / ${systemData.disk.total}` : '-'"
              :option="diskGaugeOption"
              height="220px"
            />
          </ClientOnly>

          <!-- 运行时间 Gauge -->
          <ClientOnly>
            <DashboardChartLazy
              title="系统运行时间"
              :subtitle="systemData ? `进程: ${formatUptime(systemData.system.processUptime)}` : '-'"
              :option="uptimeRingOption"
              height="220px"
            />
          </ClientOnly>
        </div>

        <!-- 服务状态 -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-activity" class="text-primary" />
              <span class="font-semibold">服务状态</span>
            </div>
          </template>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              v-for="svc in services"
              :key="svc.name"
              class="flex items-center gap-3 p-3 rounded-lg border border-default"
            >
              <span
                class="w-3 h-3 rounded-full shrink-0"
                :class="svc.status === 'online' ? 'bg-green-500' : 'bg-red-500'"
              />
              <div class="min-w-0">
                <div class="font-medium text-sm">
                  {{ svc.name }}
                </div>
                <div class="text-xs text-muted truncate">
                  {{ svc.message }}
                </div>
              </div>
              <UBadge
                :color="svc.status === 'online' ? 'success' : 'error'"
                variant="subtle"
                size="xs"
                class="ml-auto shrink-0"
              >
                {{ svc.status === 'online' ? '在线' : '离线' }}
              </UBadge>
            </div>
          </div>
          <div v-if="services.length === 0" class="text-center text-muted py-4">
            加载中...
          </div>
        </UCard>

        <!-- 业务统计 -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <UCard>
            <div class="text-center">
              <UIcon name="i-lucide-users" class="text-2xl text-primary mb-2" />
              <div class="text-2xl font-bold text-highlighted">
                {{ bizStats?.totalUsers ?? '-' }}
              </div>
              <div class="text-sm text-muted">
                总用户数
              </div>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <UIcon name="i-lucide-user-check" class="text-2xl text-green-500 mb-2" />
              <div class="text-2xl font-bold text-highlighted">
                {{ bizStats?.todayActive ?? '-' }}
              </div>
              <div class="text-sm text-muted">
                今日活跃
              </div>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <UIcon name="i-lucide-book-open" class="text-2xl text-amber-500 mb-2" />
              <div class="text-2xl font-bold text-highlighted">
                {{ bizStats?.totalCourses ?? '-' }}
              </div>
              <div class="text-sm text-muted">
                总课程数
              </div>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <UIcon name="i-lucide-bot" class="text-2xl text-violet-500 mb-2" />
              <div class="text-2xl font-bold text-highlighted">
                {{ bizStats?.aiCalls ?? '-' }}
              </div>
              <div class="text-sm text-muted">
                AI 调用次数
              </div>
            </div>
          </UCard>
        </div>

        <!-- 系统信息 -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-server" class="text-primary" />
              <span class="font-semibold">系统信息</span>
            </div>
          </template>
          <div v-if="systemData" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-muted">主机名</span>
              <span class="font-medium">{{ systemData.system.hostname }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">平台</span>
              <span class="font-medium">{{ systemData.system.platform }} / {{ systemData.system.arch }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Node 版本</span>
              <span class="font-medium">{{ systemData.system.nodeVersion }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">CPU 型号</span>
              <span class="font-medium truncate ml-4">{{ systemData.cpu.model }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">负载均值</span>
              <span class="font-medium">{{ systemData.cpu.loadAvg.map(v => v.toFixed(2)).join(' / ') }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">进程 RSS</span>
              <span class="font-medium">{{ formatBytes(systemData.system.processMemory.rss) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">堆内存使用</span>
              <span class="font-medium">{{ formatBytes(systemData.system.processMemory.heapUsed) }} / {{ formatBytes(systemData.system.processMemory.heapTotal) }}</span>
            </div>
          </div>
          <div v-else class="text-center text-muted py-4">
            加载中...
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
