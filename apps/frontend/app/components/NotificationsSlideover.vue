<script setup lang="ts">
import type { Notification } from '~/types/notification'

const { isNotificationsSlideoverOpen } = useDashboard()
const { fetchNotifications, markAsRead, deleteNotification, fetchCount } = useNotifications()

const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const [list, countRes] = await Promise.all([fetchNotifications(), fetchCount()])
    notifications.value = list
    unreadCount.value = countRes.count
  }
  catch {
    // silent
  }
  finally {
    loading.value = false
  }
}

async function handleMarkRead(id: number) {
  await markAsRead(id)
  const item = notifications.value.find(n => n.id === id)
  if (item) item.status = 1
  unreadCount.value = Math.max(0, unreadCount.value - 1)
}

async function handleDelete(id: number) {
  await deleteNotification(id)
  const item = notifications.value.find(n => n.id === id)
  if (item && item.status === 0) unreadCount.value = Math.max(0, unreadCount.value - 1)
  notifications.value = notifications.value.filter(n => n.id !== id)
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

watch(isNotificationsSlideoverOpen, (open) => {
  if (open) load()
})
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideoverOpen"
    title="通知"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <span class="text-lg font-semibold">通知</span>
        <UBadge v-if="unreadCount > 0" color="error" variant="subtle" size="sm">
          {{ unreadCount }}
        </UBadge>
      </div>
    </template>

    <template #body>
      <div v-if="loading" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="text-2xl animate-spin text-muted" />
      </div>

      <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-12 text-muted">
        <UIcon name="i-lucide-bell-off" class="text-3xl mb-2" />
        <p>暂无通知</p>
      </div>

      <div v-else class="divide-y divide-default">
        <div
          v-for="n in notifications"
          :key="n.id"
          class="p-4 flex gap-3"
          :class="{ 'bg-primary/5': n.status === 0 }"
        >
          <div class="mt-1 shrink-0">
            <span
              class="block w-2 h-2 rounded-full"
              :class="n.status === 0 ? 'bg-primary' : 'bg-transparent'"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p v-if="n.title" class="text-sm font-medium text-highlighted truncate">
              {{ n.title }}
            </p>
            <p class="text-sm text-muted line-clamp-2">
              {{ n.content }}
            </p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs text-dimmed">{{ formatTime(n.create_time) }}</span>
              <UBadge variant="subtle" size="xs">
                {{ n.level === 1 ? '普通' : n.level === 2 ? '重要' : '紧急' }}
              </UBadge>
            </div>
          </div>
          <div class="flex items-start gap-1 shrink-0">
            <UButton
              v-if="n.status === 0"
              icon="i-lucide-check"
              size="xs"
              color="primary"
              variant="ghost"
              @click="handleMarkRead(n.id)"
            />
            <UButton
              icon="i-lucide-trash-2"
              size="xs"
              color="error"
              variant="ghost"
              @click="handleDelete(n.id)"
            />
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>
