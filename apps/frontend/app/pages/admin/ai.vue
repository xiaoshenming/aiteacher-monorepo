<script setup lang="ts">
import type { ChatConversation } from '~/stores/chatSessions'
import { useClipboard } from '@vueuse/core'

const chatStore = useChatSessionsStore()
const sse = useSSE()
const clipboard = useClipboard()

const input = ref('')
const sidebarOpen = ref(true)
const copied = ref(false)
const editingMessageId = ref<string | null>(null)
const editingContent = ref('')

const modelOptions = [
  { label: 'DeepSeek Chat', value: 'deepseek-chat', icon: 'i-lucide-message-circle' },
  { label: 'DeepSeek R1', value: 'deepseek-reasoner', icon: 'i-lucide-brain' },
]

const currentModel = computed({
  get: () => chatStore.activeConversation?.model || 'deepseek-chat',
  set: (val: string) => {
    if (chatStore.activeConversationId) {
      chatStore.updateModel(chatStore.activeConversationId, val)
    }
  },
})

const chatStatus = computed<'ready' | 'streaming' | 'submitted' | 'error'>(() => {
  if (sse.error.value) return 'error'
  if (sse.isStreaming.value) return 'streaming'
  return 'ready'
})

function ensureConversation(): string {
  if (!chatStore.activeConversationId) {
    return chatStore.createConversation(currentModel.value)
  }
  return chatStore.activeConversationId
}

async function handleSubmit(e: Event): Promise<void> {
  e.preventDefault()
  const content = input.value.trim()
  if (!content) return

  const conversationId = ensureConversation()
  const conversation = chatStore.activeConversation
  if (!conversation) return

  input.value = ''
  chatStore.addUserMessage(conversationId, content)
  chatStore.startAssistantMessage(conversationId)

  await sse.stream({
    url: 'ai/chat-stream',
    body: {
      prompt: content,
      model: conversation.model,
    },
    callbacks: {
      onMessage(chunk: string) {
        chatStore.appendAssistantChunk(conversationId, chunk)
      },
      onDone() {
        chatStore.finishAssistantMessage(conversationId)
      },
      onError(error: string) {
        chatStore.setAssistantError(conversationId, error)
      },
    },
  })
}

function handleStop(): void {
  sse.abort()
  if (chatStore.activeConversationId) {
    chatStore.finishAssistantMessage(chatStore.activeConversationId)
  }
}

function handleCreateConversation(): void {
  chatStore.createConversation(currentModel.value)
  input.value = ''
}

function handleDeleteConversation(id: string): void {
  chatStore.deleteConversation(id)
}

// 消息操作
function copyMessage(_e: MouseEvent, message: { content: string }) {
  clipboard.copy(message.content || '')
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function deleteMessage(_e: MouseEvent, message: { id: string }) {
  if (chatStore.activeConversationId) {
    chatStore.deleteMessage(chatStore.activeConversationId, message.id)
  }
}

function startEdit(message: { id: string, content: string }) {
  editingMessageId.value = message.id
  editingContent.value = message.content || ''
}

function confirmEdit() {
  if (editingMessageId.value && chatStore.activeConversationId) {
    chatStore.editMessage(chatStore.activeConversationId, editingMessageId.value, editingContent.value)
  }
  editingMessageId.value = null
  editingContent.value = ''
}

function cancelEdit() {
  editingMessageId.value = null
  editingContent.value = ''
}

const assistantActions = computed(() => {
  if (chatStatus.value === 'streaming') return { actions: [] }
  return {
    avatar: { icon: 'i-lucide-bot', class: 'bg-primary/10 text-primary' },
    actions: [
      {
        label: '复制',
        icon: copied.value ? 'i-lucide-copy-check' : 'i-lucide-copy',
        onClick: copyMessage,
      },
      {
        label: '删除',
        icon: 'i-lucide-trash-2',
        onClick: deleteMessage,
      },
    ],
  }
})

const userActions = computed(() => ({
  avatar: { icon: 'i-lucide-user', class: 'bg-neutral-100 dark:bg-neutral-800 text-muted' },
  actions: chatStatus.value === 'streaming'
    ? []
    : [
        {
          label: '复制',
          icon: copied.value ? 'i-lucide-copy-check' : 'i-lucide-copy',
          onClick: copyMessage,
        },
        {
          label: '编辑',
          icon: 'i-lucide-pencil',
          onClick: (_e: MouseEvent, message: { id: string, content: string }) => startEdit(message),
        },
        {
          label: '删除',
          icon: 'i-lucide-trash-2',
          onClick: deleteMessage,
        },
      ],
}))

const quickQuestions = [
  { label: '分析本月平台使用数据', icon: 'i-lucide-bar-chart-3' },
  { label: '查看教师活跃度排名', icon: 'i-lucide-users' },
  { label: '生成系统安全报告', icon: 'i-lucide-shield' },
  { label: '优化平台配置建议', icon: 'i-lucide-settings' },
]

function sendQuickQuestion(text: string): void {
  input.value = text
  handleSubmit(new Event('submit'))
}

const conversationGroups = computed(() => {
  const now = new Date()
  const today: ChatConversation[] = []
  const yesterday: ChatConversation[] = []
  const earlier: ChatConversation[] = []

  for (const conv of chatStore.sortedConversations) {
    const date = new Date(conv.updatedAt)
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) today.push(conv)
    else if (diffDays === 1) yesterday.push(conv)
    else earlier.push(conv)
  }

  const groups: Array<{ label: string, items: typeof today }> = []
  if (today.length) groups.push({ label: '今天', items: today })
  if (yesterday.length) groups.push({ label: '昨天', items: yesterday })
  if (earlier.length) groups.push({ label: '更早', items: earlier })
  return groups
})
</script>

<template>
  <UDashboardPanel :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <UDashboardNavbar title="AI 助手">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-1.5">
            <UButton
              icon="i-lucide-plus"
              label="新对话"
              size="sm"
              variant="soft"
              @click="handleCreateConversation"
            />
            <UButton
              :icon="sidebarOpen ? 'i-lucide-panel-right-close' : 'i-lucide-panel-right-open'"
              size="sm"
              color="neutral"
              variant="ghost"
              class="lg:hidden"
              @click="sidebarOpen = !sidebarOpen"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex h-full overflow-hidden">
        <!-- 右侧会话列表侧边栏 -->
        <div
          class="order-2 shrink-0 border-l border-default bg-elevated/50 transition-all duration-300 overflow-hidden"
          :class="sidebarOpen ? 'w-64' : 'w-0 lg:w-64'"
        >
          <div class="flex flex-col h-full w-64">
            <div class="flex items-center justify-between px-4 py-3 border-b border-default">
              <span class="text-sm font-medium text-highlighted">对话记录</span>
              <UButton
                icon="i-lucide-plus"
                size="xs"
                color="neutral"
                variant="ghost"
                @click="handleCreateConversation"
              />
            </div>

            <div class="flex-1 overflow-y-auto">
              <template v-if="conversationGroups.length">
                <div v-for="group in conversationGroups" :key="group.label" class="py-1">
                  <div class="px-4 py-1.5 text-xs font-medium text-muted">
                    {{ group.label }}
                  </div>
                  <button
                    v-for="conv in group.items"
                    :key="conv.id"
                    class="w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors group cursor-pointer"
                    :class="conv.id === chatStore.activeConversationId
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:bg-elevated hover:text-highlighted'"
                    @click="chatStore.setActiveConversation(conv.id)"
                  >
                    <UIcon name="i-lucide-message-circle" class="shrink-0 size-4" />
                    <span class="truncate flex-1">{{ conv.title }}</span>
                    <UButton
                      icon="i-lucide-x"
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      class="opacity-0 group-hover:opacity-100 shrink-0 -mr-1"
                      @click.stop="handleDeleteConversation(conv.id)"
                    />
                  </button>
                </div>
              </template>
              <div v-else class="flex flex-col items-center justify-center py-12 text-muted">
                <UIcon name="i-lucide-message-square-dashed" class="size-8 mb-2" />
                <span class="text-sm">暂无对话</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 左侧聊天区域 -->
        <div class="order-1 flex-1 flex flex-col min-w-0 overflow-hidden">
          <!-- 等待 IndexedDB hydration -->
          <div v-if="!chatStore._hydrated" class="flex-1 flex items-center justify-center">
            <UIcon name="i-lucide-loader-2" class="size-6 text-muted animate-spin" />
          </div>
          <template v-else-if="chatStore.activeConversation">
            <template v-if="chatStore.activeConversation.messages.length > 0">
              <div class="flex-1 overflow-y-auto min-h-0">
                <UContainer class="flex flex-col h-full">
                  <ClientOnly>
                    <UChatMessages
                      :messages="(chatStore.activeConversation.messages as any)"
                      :status="chatStatus"
                      should-auto-scroll
                      :spacing-offset="160"
                      :assistant="assistantActions"
                      :user="userActions"
                      class="flex-1 pb-4"
                    >
                      <template #content="{ message }">
                        <div v-if="editingMessageId === message.id" class="flex flex-col gap-2">
                          <UTextarea
                            v-model="editingContent"
                            autoresize
                            :rows="2"
                            class="w-full"
                          />
                          <div class="flex gap-1.5">
                            <UButton size="xs" label="保存" @click="confirmEdit" />
                            <UButton size="xs" label="取消" color="neutral" variant="ghost" @click="cancelEdit" />
                          </div>
                        </div>
                        <template v-else-if="message.role === 'assistant' && message.content">
                          <!-- 流式传输中用纯文本渲染，完成后才用 MDC 渲染（避免每个 chunk 都触发 highlight API） -->
                          <MDC v-if="chatStatus !== 'streaming' || message.id !== chatStore.activeConversation?.messages[chatStore.activeConversation.messages.length - 1]?.id" :value="message.content" class="prose prose-sm dark:prose-invert max-w-none *:first:mt-0 *:last:mb-0" />
                          <div v-else class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{{ message.content }}</div>
                        </template>
                        <p v-else class="whitespace-pre-wrap">
                          {{ message.content }}
                        </p>
                      </template>
                    </UChatMessages>
                  </ClientOnly>
                </UContainer>
              </div>

              <div class="shrink-0 border-t border-default">
                <UContainer>
                  <UChatPrompt
                    v-model="input"
                    variant="subtle"
                    placeholder="输入你的问题..."
                    autofocus
                    :ui="{ base: 'px-1.5' }"
                    @submit="handleSubmit"
                  >
                    <template #footer>
                      <ClientOnly>
                        <div class="flex items-center gap-2">
                          <USelectMenu
                            v-model="currentModel"
                            :items="modelOptions"
                            value-key="value"
                            size="xs"
                            variant="ghost"
                            color="neutral"
                            class="w-auto"
                          />
                        </div>
                      </ClientOnly>
                      <UChatPromptSubmit
                        :status="chatStatus"
                        color="neutral"
                        size="sm"
                        @stop="handleStop"
                      />
                    </template>
                  </UChatPrompt>
                </UContainer>
              </div>
            </template>

            <!-- 无消息时：欢迎界面 -->
            <template v-else>
              <UContainer class="flex-1 flex flex-col justify-center gap-6 py-8">
                <div class="text-center">
                  <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                    <UIcon name="i-lucide-bot" class="size-8 text-primary" />
                  </div>
                  <h2 class="text-2xl font-bold text-highlighted mb-2">
                    AI 管理助手
                  </h2>
                  <p class="text-muted max-w-md mx-auto">
                    我可以帮你分析平台数据、生成报告、优化系统配置。试试下面的快捷问题。
                  </p>
                </div>

                <UChatPrompt
                  v-model="input"
                  variant="subtle"
                  placeholder="输入你的问题..."
                  autofocus
                  :ui="{ base: 'px-1.5' }"
                  @submit="handleSubmit"
                >
                  <template #footer>
                    <ClientOnly>
                      <div class="flex items-center gap-2">
                        <USelectMenu
                          v-model="currentModel"
                          :items="modelOptions"
                          value-key="value"
                          size="xs"
                          variant="ghost"
                          color="neutral"
                          class="w-auto"
                        />
                      </div>
                    </ClientOnly>
                    <UChatPromptSubmit
                      :status="chatStatus"
                      color="neutral"
                      size="sm"
                    />
                  </template>
                </UChatPrompt>

                <div class="flex flex-wrap justify-center gap-2">
                  <UButton
                    v-for="q in quickQuestions"
                    :key="q.label"
                    :icon="q.icon"
                    :label="q.label"
                    size="sm"
                    color="neutral"
                    variant="outline"
                    class="rounded-full"
                    @click="sendQuickQuestion(q.label)"
                  />
                </div>
              </UContainer>
            </template>
          </template>

          <!-- 无活跃会话 -->
          <div v-else class="flex-1 flex flex-col items-center justify-center gap-4">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10">
              <UIcon name="i-lucide-bot" class="size-10 text-primary" />
            </div>
            <h2 class="text-2xl font-bold text-highlighted">
              AI 管理助手
            </h2>
            <p class="text-muted text-center max-w-md">
              平台数据分析、系统优化建议、智能报告生成，管理员专属 AI 助手。
            </p>
            <UButton
              icon="i-lucide-plus"
              label="开始新对话"
              size="lg"
              @click="handleCreateConversation"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
