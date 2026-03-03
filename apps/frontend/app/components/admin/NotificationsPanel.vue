<script setup lang="ts">
import type { AuthRequest } from '~/types/auth'

const {
  activeTab,
  notifications,
  loading,
  sendType,
  title,
  content,
  receiverId,
  receiverIdsText,
  sending,
  sendSuccess,
  sendTypeOptions,
  handleMarkRead,
  handleDelete,
  handleSend,
  formatTime,
} = useNotificationSend()

// 认证申请相关
const { fetchRequests, approveRequest, rejectRequest, deleteRequest } = useAuthRequests()
const authRequests = ref<AuthRequest[]>([])
const authLoading = ref(false)
const authTotal = ref(0)
const processing = ref<number | null>(null)

async function loadAuthRequests() {
  authLoading.value = true
  try {
    const data = await fetchRequests(1, 50)
    authRequests.value = data.requests
    authTotal.value = data.total
  }
  catch (error) {
    console.error('加载认证申请失败:', error)
  }
  finally {
    authLoading.value = false
  }
}

async function handleApprove(id: number) {
  if (!confirm('确认通过该教师的认证申请？')) return
  processing.value = id
  try {
    await approveRequest(id)
    await loadAuthRequests()
  }
  catch (error) {
    console.error('审批失败:', error)
  }
  finally {
    processing.value = null
  }
}

async function handleRejectAuth(id: number) {
  if (!confirm('确认拒绝该教师的认证申请？')) return
  processing.value = id
  try {
    await rejectRequest(id)
    await loadAuthRequests()
  }
  catch (error) {
    console.error('拒绝失败:', error)
  }
  finally {
    processing.value = null
  }
}

async function handleDeleteAuth(id: number) {
  if (!confirm('确认删除该认证申请记录？')) return
  processing.value = id
  try {
    await deleteRequest(id)
    await loadAuthRequests()
  }
  catch (error) {
    console.error('删除失败:', error)
  }
  finally {
    processing.value = null
  }
}

function getStatusText(status: number) {
  switch (status) {
    case 0: return '待审核'
    case 1: return '已通过'
    case 2: return '已拒绝'
    case 3: return '已过期'
    default: return '未知'
  }
}

function getStatusColor(status: number) {
  switch (status) {
    case 0: return 'warning'
    case 1: return 'success'
    case 2: return 'error'
    case 3: return 'neutral'
    default: return 'neutral'
  }
}

function formatAuthTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const pendingAuthCount = computed(() => authRequests.value.filter(r => r.status === 0).length)

watch(activeTab, (newTab) => {
  if (newTab === 'auth' && authRequests.value.length === 0) {
    loadAuthRequests()
  }
})
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
            :variant="activeTab === 'auth' ? 'solid' : 'ghost'"
            color="primary"
            @click="activeTab = 'auth'"
          >
            <template #leading>
              <UIcon name="i-lucide-user-check" />
            </template>
            认证消息
            <UBadge v-if="pendingAuthCount > 0" color="warning" variant="solid" size="xs" class="ml-2">
              {{ pendingAuthCount }}
            </UBadge>
          </UButton>
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

        <!-- Auth Tab -->
        <div v-if="activeTab === 'auth'">
          <div v-if="authLoading" class="flex items-center justify-center py-24">
            <UIcon name="i-lucide-loader-2" class="text-3xl animate-spin text-muted" />
          </div>

          <div v-else-if="authRequests.length === 0" class="flex flex-col items-center justify-center py-24 text-muted">
            <UIcon name="i-lucide-user-check" class="text-4xl mb-3" />
            <p>暂无认证申请</p>
          </div>

          <div v-else class="space-y-3">
            <UCard
              v-for="req in authRequests"
              :key="req.id"
              :class="{ 'border-warning/50': req.status === 0 }"
            >
              <div class="space-y-3">
                <!-- 头部信息 -->
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <UIcon name="i-lucide-user" class="text-xl text-primary" />
                    <div>
                      <p class="text-sm font-medium text-highlighted">{{ req.username || '未知用户' }}</p>
                      <p class="text-xs text-dimmed">教师 ID: {{ req.teacher_uid }}</p>
                    </div>
                  </div>
                  <UBadge :color="getStatusColor(req.status)" variant="subtle" size="xs">
                    {{ getStatusText(req.status) }}
                  </UBadge>
                </div>

                <!-- 申请信息 -->
                <div class="bg-muted/30 rounded-lg p-3">
                  <p class="text-xs text-dimmed mb-1">申请理由：</p>
                  <p class="text-sm text-muted">{{ req.request_message || '无' }}</p>
                </div>

                <!-- 时间信息 -->
                <div class="flex items-center gap-3 text-xs text-dimmed">
                  <span class="flex items-center gap-1">
                    <UIcon name="i-lucide-clock" />
                    {{ formatAuthTime(req.created_at) }}
                  </span>
                  <span class="flex items-center gap-1">
                    <UIcon name="i-lucide-timer" />
                    过期: {{ formatAuthTime(req.expires_at) }}
                  </span>
                </div>

                <!-- 操作按钮 -->
                <div class="flex items-center gap-2 pt-2 border-t border-border">
                  <template v-if="req.status === 0">
                    <UButton
                      label="通过"
                      icon="i-lucide-check"
                      color="success"
                      size="xs"
                      :loading="processing === req.id"
                      @click="handleApprove(req.id)"
                    />
                    <UButton
                      label="拒绝"
                      icon="i-lucide-x"
                      color="error"
                      size="xs"
                      variant="outline"
                      :loading="processing === req.id"
                      @click="handleRejectAuth(req.id)"
                    />
                  </template>
                  <UButton
                    icon="i-lucide-trash-2"
                    size="xs"
                    color="error"
                    variant="ghost"
                    :loading="processing === req.id"
                    @click="handleDeleteAuth(req.id)"
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
