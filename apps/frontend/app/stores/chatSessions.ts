import { defineStore } from 'pinia'
import { get, set } from 'idb-keyval'

/**
 * 与 @ai-sdk/vue 的 Message 类型结构兼容，
 * 用于 UChatMessages 组件
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'data'
  content: string
  createdAt?: Date
  parts?: ChatMessagePart[]
}

export interface ChatMessagePart {
  type: 'text' | 'image' | 'tool-call' | 'tool-result'
  content?: string
  [key: string]: any
}

export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  model: string
  createdAt: number
  updatedAt: number
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateTitle(content: string): string {
  const trimmed = content.trim().replace(/\n/g, ' ')
  return trimmed.length > 30 ? `${trimmed.slice(0, 30)}...` : trimmed
}

// IndexedDB keys
const IDB_CONVERSATIONS_KEY = 'aiteacher-chat-conversations'
const IDB_ACTIVE_ID_KEY = 'aiteacher-chat-active-id'

// 旧 localStorage keys（用于迁移后清理）
const OLD_LS_KEYS = ['aiteacher-chat-sessions', 'chatSessions']

/**
 * 序列化对话数据（Date -> ISO string）
 */
function serializeConversations(conversations: ChatConversation[]): ChatConversation[] {
  return conversations.map(conv => ({
    ...conv,
    messages: conv.messages.map(msg => ({
      ...msg,
      createdAt: msg.createdAt instanceof Date ? (msg.createdAt.toISOString() as unknown as Date) : msg.createdAt,
    })),
  }))
}

/**
 * 反序列化对话数据（ISO string -> Date）
 */
function deserializeConversations(conversations: ChatConversation[]): ChatConversation[] {
  if (!Array.isArray(conversations)) return []
  return conversations.map(conv => ({
    ...conv,
    messages: Array.isArray(conv.messages)
      ? conv.messages.map(msg => ({
          ...msg,
          createdAt: msg.createdAt ? new Date(msg.createdAt as unknown as string) : undefined,
        }))
      : [],
  }))
}

/**
 * 从旧 localStorage 迁移数据到 IndexedDB（一次性）
 */
async function migrateFromLocalStorage(): Promise<{ conversations: ChatConversation[], activeId: string | null } | null> {
  try {
    const raw = localStorage.getItem('aiteacher-chat-sessions')
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed.conversations?.length) return null

    const conversations = deserializeConversations(parsed.conversations)
    const activeId = parsed.activeConversationId || null

    // 写入 IndexedDB
    await set(IDB_CONVERSATIONS_KEY, serializeConversations(conversations))
    await set(IDB_ACTIVE_ID_KEY, activeId)

    // 清理所有旧 localStorage keys
    for (const key of OLD_LS_KEYS) {
      localStorage.removeItem(key)
    }

    return { conversations, activeId }
  }
  catch {
    return null
  }
}

/**
 * 从 IndexedDB 加载数据
 */
async function loadFromIDB(): Promise<{ conversations: ChatConversation[], activeId: string | null }> {
  try {
    const [rawConversations, activeId] = await Promise.all([
      get<ChatConversation[]>(IDB_CONVERSATIONS_KEY),
      get<string | null>(IDB_ACTIVE_ID_KEY),
    ])

    if (rawConversations?.length) {
      return {
        conversations: deserializeConversations(rawConversations),
        activeId: activeId ?? null,
      }
    }

    // IndexedDB 为空，尝试从 localStorage 迁移
    const migrated = await migrateFromLocalStorage()
    if (migrated) return migrated

    return { conversations: [], activeId: null }
  }
  catch {
    return { conversations: [], activeId: null }
  }
}

/**
 * 保存到 IndexedDB
 */
async function saveToIDB(conversations: ChatConversation[], activeId: string | null): Promise<void> {
  try {
    await Promise.all([
      set(IDB_CONVERSATIONS_KEY, serializeConversations(conversations)),
      set(IDB_ACTIVE_ID_KEY, activeId),
    ])
  }
  catch {
    // IndexedDB 写入失败，静默忽略
  }
}

export const useChatSessionsStore = defineStore('chatSessions', () => {
  // 清理旧 localStorage keys
  if (import.meta.client) {
    for (const key of OLD_LS_KEYS) {
      localStorage.removeItem(key)
    }
  }

  const conversations = ref<ChatConversation[]>([])
  const activeConversationId = ref<string | null>(null)
  const _isStreaming = ref(false)
  const _hydrated = ref(false)

  const activeConversation = computed(() =>
    conversations.value.find(c => c.id === activeConversationId.value) ?? null,
  )

  const sortedConversations = computed(() =>
    [...conversations.value].sort((a, b) => b.updatedAt - a.updatedAt),
  )

  /** 从 IndexedDB 恢复数据（异步，页面加载时调用） */
  async function hydrate(): Promise<void> {
    if (!import.meta.client || _hydrated.value) return
    const data = await loadFromIDB()
    conversations.value = data.conversations
    activeConversationId.value = data.activeId

    // 迁移旧消息，确保所有消息都有 parts 属性
    conversations.value.forEach(conv => {
      conv.messages.forEach(msg => {
        if (!msg.parts || msg.parts.length === 0) {
          msg.parts = [{ type: 'text', content: msg.content }]
        }
      })
    })

    _hydrated.value = true
  }

  /** 持久化到 IndexedDB */
  function persist(): void {
    if (import.meta.client) {
      saveToIDB(conversations.value, activeConversationId.value)
    }
  }

  // 页面加载时自动恢复
  if (import.meta.client) {
    hydrate()

    // 页面关闭/隐藏时保存（兜底）
    window.addEventListener('beforeunload', persist)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') persist()
    })
  }

  function createConversation(model: string = 'deepseek-chat'): string {
    const id = generateId()
    const now = Date.now()
    conversations.value.push({
      id,
      title: '新对话',
      messages: [],
      model,
      createdAt: now,
      updatedAt: now,
    })
    activeConversationId.value = id
    persist()
    return id
  }

  function deleteConversation(id: string): void {
    const index = conversations.value.findIndex(c => c.id === id)
    if (index === -1) return

    conversations.value.splice(index, 1)

    if (activeConversationId.value === id) {
      activeConversationId.value = conversations.value[0]?.id ?? null
    }
    persist()
  }

  function renameConversation(id: string, title: string): void {
    const conversation = conversations.value.find(c => c.id === id)
    if (conversation) {
      conversation.title = title
      conversation.updatedAt = Date.now()
      persist()
    }
  }

  function setActiveConversation(id: string): void {
    activeConversationId.value = id
    persist()
  }

  function addUserMessage(conversationId: string, content: string): string {
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (!conversation) return ''

    const messageId = generateId()
    conversation.messages.push({
      id: messageId,
      role: 'user',
      content,
      createdAt: new Date(),
      parts: [{ type: 'text', content }],
    })
    conversation.updatedAt = Date.now()

    if (conversation.messages.length === 1) {
      conversation.title = generateTitle(content)
    }

    persist()
    return messageId
  }

  function startAssistantMessage(conversationId: string): string {
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (!conversation) return ''

    _isStreaming.value = true

    const messageId = generateId()
    conversation.messages.push({
      id: messageId,
      role: 'assistant',
      content: '',
      createdAt: new Date(),
      parts: [{ type: 'text', content: '' }],
    })
    conversation.updatedAt = Date.now()

    return messageId
  }

  function appendAssistantChunk(conversationId: string, chunk: string): void {
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (!conversation) return

    const lastMessage = conversation.messages[conversation.messages.length - 1]
    if (lastMessage?.role === 'assistant') {
      lastMessage.content += chunk
      if (lastMessage.parts && lastMessage.parts[0]?.type === 'text') {
        lastMessage.parts[0].content = lastMessage.content
      }
    }
    // 流式传输中不触发持久化，避免性能问题
  }

  function finishAssistantMessage(conversationId: string): void {
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (!conversation) return

    _isStreaming.value = false
    conversation.updatedAt = Date.now()
    persist()
  }

  function setAssistantError(conversationId: string, errorMsg: string): void {
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (!conversation) return

    _isStreaming.value = false
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    if (lastMessage?.role === 'assistant' && !lastMessage.content) {
      lastMessage.content = `抱歉，请求出错了：${errorMsg}`
    }
    conversation.updatedAt = Date.now()
    persist()
  }

  function deleteMessage(conversationId: string, messageId: string): void {
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (!conversation) return

    const index = conversation.messages.findIndex(m => m.id === messageId)
    if (index === -1) return

    conversation.messages.splice(index, 1)
    conversation.updatedAt = Date.now()
    persist()
  }

  function editMessage(conversationId: string, messageId: string, content: string): void {
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (!conversation) return

    const message = conversation.messages.find(m => m.id === messageId)
    if (message) {
      message.content = content
      conversation.updatedAt = Date.now()
      persist()
    }
  }

  function clearConversation(id: string): void {
    const conversation = conversations.value.find(c => c.id === id)
    if (conversation) {
      conversation.messages = []
      conversation.updatedAt = Date.now()
      persist()
    }
  }

  function updateModel(conversationId: string, model: string): void {
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (conversation) {
      conversation.model = model
      persist()
    }
  }

  return {
    conversations,
    activeConversationId,
    activeConversation,
    sortedConversations,
    _hydrated,
    hydrate,
    createConversation,
    deleteConversation,
    renameConversation,
    setActiveConversation,
    addUserMessage,
    startAssistantMessage,
    appendAssistantChunk,
    finishAssistantMessage,
    setAssistantError,
    deleteMessage,
    editMessage,
    clearConversation,
    updateModel,
    persist,
  }
}, {
  // 禁用 pinia-plugin-persistedstate，完全由 IndexedDB 管理持久化
  persist: false,
})
