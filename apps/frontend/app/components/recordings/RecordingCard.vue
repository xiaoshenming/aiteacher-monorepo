<script setup lang="ts">
import type { Recording } from '~/types/recording'

const { formatDuration, formatDate, formatFileSize, getMediaUrl } = useRecordingFormat()

const statusLabels: Record<string, string> = {
  pending: '待上传',
  uploading: '上传中',
  synced: '已同步',
  failed: '上传失败',
}

const statusColors: Record<string, string> = {
  pending: 'warning',
  uploading: 'info',
  synced: 'success',
  failed: 'error',
}

defineProps<{
  recording: Recording
}>()

defineEmits<{
  play: [recording: Recording]
  transcribe: [id: string]
  viewTranscript: [recording: Recording]
  viewNotes: [recording: Recording]
  delete: [id: string]
}>()
</script>

<template>
  <div class="group flex flex-col rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] overflow-hidden hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200">
    <!-- 卡片顶部：缩略图/图标区域 -->
    <div
      class="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center cursor-pointer"
      @click="getMediaUrl(recording) ? $emit('play', recording) : undefined"
    >
      <UIcon name="i-lucide-film" class="text-4xl text-slate-300 dark:text-slate-600" />
      <span v-if="recording.duration" class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-mono tabular-nums">
        {{ formatDuration(recording.duration) }}
      </span>
      <div v-if="getMediaUrl(recording)" class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
        <div class="size-10 rounded-full bg-white/90 dark:bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
          <UIcon name="i-lucide-play" class="text-lg text-slate-800 ml-0.5" />
        </div>
      </div>
      <UBadge
        :color="(statusColors[recording.sync_status] as any) || 'neutral'"
        variant="subtle"
        size="xs"
        class="absolute top-2 left-2"
      >
        {{ statusLabels[recording.sync_status] || recording.sync_status }}
      </UBadge>
    </div>

    <!-- 卡片内容 -->
    <div class="flex-1 flex flex-col p-3 gap-2">
      <h3 class="text-sm font-semibold leading-snug line-clamp-2" :title="recording.title">{{ recording.title }}</h3>
      <div class="flex items-center gap-3 text-xs text-[var(--ui-text-dimmed)] mt-auto">
        <span>{{ formatDate(recording.created_at) }}</span>
        <span v-if="recording.file_size">{{ formatFileSize(recording.file_size) }}</span>
      </div>
    </div>

    <!-- 卡片操作栏 -->
    <div class="flex items-center gap-0.5 px-2 py-1.5 border-t border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]/50">
      <UButton v-if="getMediaUrl(recording)" size="xs" variant="ghost" icon="i-lucide-play" title="播放" @click="$emit('play', recording)" />
      <UButton v-if="recording.sync_status === 'synced'" size="xs" variant="ghost" icon="i-lucide-file-text" title="转录" @click="$emit('transcribe', recording.id)" />
      <UButton v-if="recording.sync_status === 'synced'" size="xs" variant="ghost" icon="i-lucide-captions" title="查看转录" @click="$emit('viewTranscript', recording)" />
      <UButton v-if="recording.sync_status === 'synced'" size="xs" variant="ghost" icon="i-lucide-sparkles" title="AI笔记" @click="$emit('viewNotes', recording)" />
      <div class="flex-1" />
      <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" title="删除" @click="$emit('delete', recording.id)" />
    </div>
  </div>
</template>
