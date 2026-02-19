<script setup lang="ts">
import type { QuickQuestion } from '~/composables/useAIChat'

defineProps<{
  navTitle: string
  welcomeTitle: string
  welcomeDescription: string
  noSessionTitle: string
  noSessionDescription: string
  quickQuestions: QuickQuestion[]
}>()

const {
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
} = useAIChat()
</script>

<template>
  <UDashboardPanel :ui="{ root: 'min-h-0 h-full', body: 'p-0 sm:p-0' }">
    <template #header>
      <UDashboardNavbar :title="navTitle">
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
        <AIChatSidebar
          :sidebar-open="sidebarOpen"
          :conversation-groups="conversationGroups"
          :active-conversation-id="chatStore.activeConversationId"
          @create="handleCreateConversation"
          @select="chatStore.setActiveConversation"
          @delete="handleDeleteConversation"
        />

        <!-- 左侧聊天区域 -->
        <div class="order-1 flex-1 flex flex-col min-w-0 overflow-hidden">
          <!-- 等待 IndexedDB hydration -->
          <div v-if="!chatStore._hydrated" class="flex-1 flex items-center justify-center">
            <UIcon name="i-lucide-loader-2" class="size-6 text-muted animate-spin" />
          </div>
          <template v-else-if="chatStore.activeConversation">
            <template v-if="chatStore.activeConversation.messages.length > 0">
              <!-- 消息列表 -->
              <AIChatMessages
                :messages="chatStore.activeConversation.messages"
                :chat-status="chatStatus"
                :assistant-actions="assistantActions"
                :user-actions="userActions"
                :editing-message-id="editingMessageId"
                :editing-content="editingContent"
                :active-conversation="chatStore.activeConversation"
                @update:editing-content="editingContent = $event"
                @confirm-edit="confirmEdit"
                @cancel-edit="cancelEdit"
              />

              <!-- 底部输入框 -->
              <div class="shrink-0 bg-gradient-to-t from-default via-default to-transparent pt-4 pb-4 px-4">
                <UContainer>
                  <AIChatInput
                    :model-value="input"
                    :current-model="currentModel"
                    :chat-status="chatStatus"
                    :model-options="modelOptions"
                    show-stop
                    @update:model-value="input = $event"
                    @update:current-model="currentModel = $event"
                    @submit="handleSubmit"
                    @stop="handleStop"
                  />
                </UContainer>
              </div>
            </template>

            <!-- 无消息时：欢迎界面 -->
            <template v-else>
              <div class="flex-1 flex flex-col justify-center bg-gradient-to-b from-primary/5 via-transparent to-primary/5">
                <UContainer class="flex flex-col gap-6 py-8">
                  <AIChatWelcome
                    :title="welcomeTitle"
                    :description="welcomeDescription"
                    :quick-questions="quickQuestions"
                    @quick-question="sendQuickQuestion"
                  >
                    <AIChatInput
                      :model-value="input"
                      :current-model="currentModel"
                      :chat-status="chatStatus"
                      :model-options="modelOptions"
                      @update:model-value="input = $event"
                      @update:current-model="currentModel = $event"
                      @submit="handleSubmit"
                      @stop="handleStop"
                    />
                  </AIChatWelcome>
                </UContainer>
              </div>
            </template>
          </template>

          <!-- 无活跃会话 -->
          <div v-else class="flex-1 flex flex-col items-center justify-center gap-4">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10">
              <UIcon name="i-lucide-bot" class="size-10 text-primary" />
            </div>
            <h2 class="text-2xl font-bold text-highlighted">
              {{ noSessionTitle }}
            </h2>
            <p class="text-muted text-center max-w-md">
              {{ noSessionDescription }}
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
