import type { ChatConversation } from '~/stores/chatSessions'

export interface QuickQuestion {
  label: string
  icon: string
}

export function useAIChat() {
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

  return {
    chatStore,
    input,
    sidebarOpen,
    editingMessageId,
    editingContent,
    modelOptions,
    currentModel,
    chatStatus,
    assistantActions,
    userActions,
    conversationGroups,
    handleSubmit,
    handleStop,
    handleCreateConversation,
    handleDeleteConversation,
    sendQuickQuestion,
    confirmEdit,
    cancelEdit,
  }
}
