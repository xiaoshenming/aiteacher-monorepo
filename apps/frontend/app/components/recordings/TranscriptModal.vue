<script setup lang="ts">
const { formatTimestamp } = useRecordingFormat()

const {
  showTranscriptModal: open,
  transcriptSegments,
  transcriptFullText,
  transcriptLoading,
  transcriptTitle,
  transcriptStatus,
} = useTranscript()

// Re-export for parent to call viewTranscript
defineExpose({ open })
</script>

<template>
  <UModal v-model:open="open" :title="'转录内容 - ' + transcriptTitle">
    <template #content>
      <div class="p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon name="i-lucide-captions" class="text-indigo-500 shrink-0" />
            <h3 class="text-sm font-semibold truncate">{{ transcriptTitle }}</h3>
          </div>
          <UBadge v-if="transcriptStatus" :color="transcriptStatus === 'completed' ? 'success' : transcriptStatus === 'failed' ? 'error' : 'warning'" variant="subtle" size="sm">
            {{ transcriptStatus === 'completed' ? '已完成' : transcriptStatus === 'failed' ? '失败' : '处理中' }}
          </UBadge>
        </div>

        <div v-if="transcriptLoading" class="flex items-center justify-center py-10 gap-2">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-xl text-indigo-500" />
          <span class="text-sm text-[var(--ui-text-dimmed)]">加载中...</span>
        </div>
        <template v-else>
          <div v-if="transcriptSegments.length" class="max-h-96 overflow-y-auto space-y-0.5 rounded-lg border border-[var(--ui-border)] p-2">
            <div v-for="(seg, i) in transcriptSegments" :key="i"
              class="flex gap-3 text-sm px-2 py-1.5 rounded hover:bg-[var(--ui-bg-elevated)] transition-colors">
              <span class="text-primary-600 dark:text-primary-400 shrink-0 font-mono text-xs mt-0.5">{{ formatTimestamp(seg.start) }}</span>
              <span v-if="seg.speaker" class="text-indigo-600 dark:text-indigo-400 shrink-0 font-medium">{{ seg.speaker }}:</span>
              <span>{{ seg.text }}</span>
            </div>
          </div>
          <div v-else-if="transcriptFullText" class="max-h-96 overflow-y-auto rounded-lg border border-[var(--ui-border)] p-3">
            <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ transcriptFullText }}</p>
          </div>
          <div v-else class="flex flex-col items-center py-8 gap-2 text-[var(--ui-text-dimmed)]">
            <UIcon name="i-lucide-file-question" class="text-2xl" />
            <p class="text-sm">暂无转录内容</p>
          </div>
        </template>
        <div class="flex justify-end pt-2 border-t border-[var(--ui-border)]">
          <UButton variant="ghost" label="关闭" size="sm" @click="open = false" />
        </div>
      </div>
    </template>
  </UModal>
</template>
