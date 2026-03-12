<script setup lang="ts">
const { listMyRooms } = useWhiteboard()
const loading = ref(true)
const rooms = ref<any[]>([])

const WHITEBOARD_URL = 'http://localhost:10007'

function openWhiteboard(roomKey?: string) {
  const url = roomKey ? `${WHITEBOARD_URL}/#room=${roomKey}` : WHITEBOARD_URL
  window.open(url, '_blank')
}

function formatTime(ts: number) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function timeAgo(ts: number) {
  if (!ts) return ''
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

onMounted(async () => {
  try {
    rooms.value = await listMyRooms()
  } catch {
    // API may not be available
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="协作白板">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Hero card -->
        <div class="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8">
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-pen-tool" class="text-3xl text-primary" />
            </div>
            <div class="text-center sm:text-left flex-1">
              <h1 class="text-2xl font-bold text-highlighted">协作白板</h1>
              <p class="text-muted text-sm mt-2 max-w-lg">
                基于 Excalidraw 的实时协作白板，支持多人同时编辑、手绘风格图形、无限画布。
                适合课堂讨论、头脑风暴、知识梳理等场景。
              </p>
              <UButton
                class="mt-4"
                color="primary"
                icon="i-lucide-external-link"
                @click="openWhiteboard()"
              >
                进入白板
              </UButton>
            </div>
          </div>
        </div>

        <!-- Features -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="flex items-start gap-3 p-4 rounded-xl border border-default">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-users" class="text-lg text-primary" />
            </div>
            <div>
              <p class="text-sm font-medium text-highlighted">实时协作</p>
              <p class="text-xs text-muted mt-1">多人同时在线编辑，实时同步所有操作</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-4 rounded-xl border border-default">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-infinity" class="text-lg text-primary" />
            </div>
            <div>
              <p class="text-sm font-medium text-highlighted">无限画布</p>
              <p class="text-xs text-muted mt-1">自由缩放和平移，不受空间限制</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-4 rounded-xl border border-default">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-save" class="text-lg text-primary" />
            </div>
            <div>
              <p class="text-sm font-medium text-highlighted">自动保存</p>
              <p class="text-xs text-muted mt-1">内容自动持久化，随时恢复历史状态</p>
            </div>
          </div>
        </div>

        <!-- Recent rooms -->
        <div class="rounded-xl border border-default p-5">
          <h2 class="text-sm font-medium text-muted mb-4 flex items-center gap-2">
            <UIcon name="i-lucide-history" class="text-purple-500" />
            最近使用的白板
          </h2>

          <div v-if="loading" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-primary" />
          </div>

          <div v-else-if="rooms.length === 0" class="text-center py-10">
            <div class="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <UIcon name="i-lucide-layout-dashboard" class="text-2xl text-muted" />
            </div>
            <p class="text-sm text-muted">暂无白板记录</p>
            <p class="text-xs text-muted mt-1">点击上方按钮创建你的第一个白板</p>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="room in rooms" :key="room.id"
              class="p-4 rounded-lg border border-default hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
              @click="openWhiteboard(room.roomKey)"
            >
              <div class="flex items-start justify-between">
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-highlighted truncate group-hover:text-primary transition-colors">
                    {{ room.title || '未命名白板' }}
                  </p>
                  <p class="text-xs text-muted mt-1">{{ formatTime(room.createdAt) }}</p>
                </div>
                <UBadge v-if="room.isActive" color="success" variant="subtle" class="shrink-0 ml-2">
                  活跃
                </UBadge>
              </div>
              <p class="text-xs text-muted mt-2">
                最后活跃：{{ timeAgo(room.lastActiveAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
