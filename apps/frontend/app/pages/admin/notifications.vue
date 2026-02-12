<script setup lang="ts">
import type { Notification, SendNotificationPayload } from '~/types/notification'

const { fetchNotifications, markAsRead, deleteNotification, sendToOne, sendToMany, sendGlobal } = useNotifications()

const activeTab = ref('list')
const notifications = ref<Notification[]>([])
const loading = ref(true)

// Send form
const sendType = ref<'one' | 'many' | 'global'>('one')
const title = ref('')
const content = ref('')
const receiverId = ref<number | undefined>()
const receiverIdsText = ref('')
const sending = ref(false)
const sendSuccess = ref(false)

async function load() {
  loading.value = true
  try {
    notifications.value = await fetchNotifications()
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
}

async function handleDelete(id: number) {
  await deleteNotification(id)
  notifications.value = notifications.value.filter(n => n.id !== id)
}

async function handleSend() {
  if (!content.value.trim()) return
  sending.value = true
  sendSuccess.value = false
  try {
    const payload: SendNotificationPayload = { title: title.value || undefined, content: content.value }
    if (sendType.value === 'one') {
      payload.receiverId = receiverId.value
      await sendToOne(payload)
    }
    else if (sendType.value === 'many') {
      payload.receiverIds = receiverIdsText.value.split(',').map(s => Number(s.trim())).filter(Boolean)
      await sendToMany(payload)
    }
    else {
      await sendGlobal(payload)
    }
    sendSuccess.value = true
    title.value = ''
    content.value = ''
    receiverId.value = undefined
    receiverIdsText.value = ''
  }
  catch {
    // silent
  }
  finally {
    sending.value = false
  }
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const sendTypeOptions = [
  { label: '单发', value: 'one' },
  { label: '群发', value: 'many' },
  { label: '广播', value: 'global' },
]

onMounted(load)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="消息通知">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-4">
        <!-- Tabs -->
        <div class="flex gap-2">
          <UButton
            label="通知列表"
            :variant="activeTab === 'list' ? 'solid' : 'ghost'"
            color="primary"
            @click="activeTab = 'list'"
          />
          <UButton
            label="发送通知"
            :variant="activeTab === 'send' ? 'solid' : 'ghost'"
            color="primary"
            @click="activeTab = 'send'"
          />
        </div>

        <!-- List Tab -->
        <div v-if="activeTab === 'list'">
          <div v-if="loading" class="flex items-center justify-center py-24">
            <UIcon name="i-lucide-loader-2" class="text-3xl animate-spin text-muted" />
          </div>

          <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-24 text-muted">
            <UIcon name="i-lucide-bell-off" class="text-4xl mb-3" />
            <p>暂无通知</p>
          </div>

          <div v-else class="space-y-2">
            <UCard
              v-for="n in notifications"
              :key="n.id"
              :class="{ 'border-primary/30': n.status === 0 }"
            >
              <div class="flex items-start gap-3">
                <span
                  class="mt-1.5 block w-2 h-2 rounded-full shrink-0"
                  :class="n.status === 0 ? 'bg-primary' : 'bg-gray-300'"
                />
                <div class="flex-1 min-w-0">
                  <p v-if="n.title" class="text-sm font-medium text-highlighted">{{ n.title }}</p>
                  <p class="text-sm text-muted">{{ n.content }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs text-dimmed">{{ formatTime(n.create_time) }}</span>
                    <UBadge variant="subtle" size="xs">
                      {{ n.level === 1 ? '普通' : n.level === 2 ? '重要' : '紧急' }}
                    </UBadge>
                    <span v-if="n.sender_username" class="text-xs text-dimmed">来自 {{ n.sender_username }}</span>
                  </div>
                </div>
                <div class="flex gap-1 shrink-0">
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
            </UCard>
          </div>
        </div>

        <!-- Send Tab -->
        <div v-if="activeTab === 'send'">
          <UCard>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-highlighted mb-1 block">发送类型</label>
                <div class="flex gap-2">
                  <UButton
                    v-for="opt in sendTypeOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :variant="sendType === opt.value ? 'solid' : 'outline'"
                    color="primary"
                    size="sm"
                    @click="sendType = opt.value as 'one' | 'many' | 'global'"
                  />
                </div>
              </div>

              <div v-if="sendType === 'one'">
                <label class="text-sm font-medium text-highlighted mb-1 block">接收者 ID</label>
                <UInput v-model.number="receiverId" type="number" placeholder="输入用户 ID" />
              </div>

              <div v-if="sendType === 'many'">
                <label class="text-sm font-medium text-highlighted mb-1 block">接收者 ID（逗号分隔）</label>
                <UInput v-model="receiverIdsText" placeholder="例如: 1,2,3" />
              </div>

              <div>
                <label class="text-sm font-medium text-highlighted mb-1 block">标题（可选）</label>
                <UInput v-model="title" placeholder="通知标题" />
              </div>

              <div>
                <label class="text-sm font-medium text-highlighted mb-1 block">内容</label>
                <UTextarea v-model="content" placeholder="通知内容" :rows="4" />
              </div>

              <div class="flex items-center gap-3">
                <UButton
                  label="发送"
                  icon="i-lucide-send"
                  color="primary"
                  :loading="sending"
                  :disabled="!content.trim()"
                  @click="handleSend"
                />
                <span v-if="sendSuccess" class="text-sm text-green-600">发送成功</span>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
