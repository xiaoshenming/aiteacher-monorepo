<script setup lang="ts">
import type { ChatMessage } from '~/stores/chatSessions'

const props = defineProps<{
  messages: ChatMessage[]
  chatStatus: 'ready' | 'streaming' | 'submitted' | 'error'
  assistantActions: Record<string, any>
  userActions: Record<string, any>
  editingMessageId: string | null
  editingContent: string
  activeConversation: { messages: ChatMessage[] } | null
}>()

const emit = defineEmits<{
  'update:editingContent': [value: string]
  confirmEdit: []
  cancelEdit: []
}>()

const editValue = computed({
  get: () => props.editingContent,
  set: (val: string) => emit('update:editingContent', val),
})
</script>

<template>
  <div class="flex-1 overflow-y-auto min-h-0">
    <UContainer class="flex flex-col h-full">
      <ClientOnly>
        <UChatMessages
          :messages="(messages as any)"
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
                v-model="editValue"
                autoresize
                :rows="2"
                class="w-full"
              />
              <div class="flex gap-1.5">
                <UButton size="xs" label="保存" @click="emit('confirmEdit')" />
                <UButton size="xs" label="取消" color="neutral" variant="ghost" @click="emit('cancelEdit')" />
              </div>
            </div>
            <template v-else-if="message.role === 'assistant' && message.content">
              <StreamingMarkdown
                v-if="chatStatus === 'streaming' && message.id === activeConversation?.messages[activeConversation.messages.length - 1]?.id"
                :content="message.content"
                :streaming="true"
              />
              <MDC
                v-else
                :value="message.content"
                class="prose prose-sm dark:prose-invert max-w-none *:first:mt-0 *:last:mb-0"
              />
            </template>
            <p v-else class="whitespace-pre-wrap">
              {{ message.content }}
            </p>
          </template>
        </UChatMessages>
      </ClientOnly>
    </UContainer>
  </div>
</template>
