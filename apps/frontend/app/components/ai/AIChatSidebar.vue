<script setup lang="ts">
import type { ChatConversation } from '~/stores/chatSessions'

defineProps<{
  sidebarOpen: boolean
  conversationGroups: Array<{ label: string, items: ChatConversation[] }>
  activeConversationId: string | null
}>()

const emit = defineEmits<{
  create: []
  select: [id: string]
  delete: [id: string]
}>()
</script>

<template>
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
          @click="emit('create')"
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
              :class="conv.id === activeConversationId
                ? 'bg-primary/10 text-primary'
                : 'text-muted hover:bg-elevated hover:text-highlighted'"
              @click="emit('select', conv.id)"
            >
              <UIcon name="i-lucide-message-circle" class="shrink-0 size-4" />
              <span class="truncate flex-1">{{ conv.title }}</span>
              <UButton
                icon="i-lucide-x"
                size="xs"
                color="neutral"
                variant="ghost"
                class="opacity-0 group-hover:opacity-100 shrink-0 -mr-1"
                @click.stop="emit('delete', conv.id)"
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
</template>
