<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

defineProps<{
  starting: boolean
}>()

const emit = defineEmits<{
  start: [title: string]
}>()

const newTitle = ref('')

const { cameraLayout, previewContainer, cameraStyle, startDragging, startResizing } = useCameraLayout()
const mediaStream = useMediaStream(cameraLayout)
const { userStreamRaw, previewStream, previewVideo, cameraOverlayVideo, recordingSource, getMediaStream, preparePreview, cleanupStreams } = mediaStream

function handleStart() {
  if (!newTitle.value.trim()) return
  emit('start', newTitle.value.trim())
  newTitle.value = ''
}

function handleCancel() {
  open.value = false
  cleanupStreams()
}

defineExpose({ previewStream, getMediaStream, cleanupStreams, recordingSource })
</script>

<template>
  <UModal v-model:open="open" title="开始录制">
    <template #content>
      <div class="p-5 space-y-4">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-[var(--ui-text-muted)]">录制标题</label>
          <UInput v-model="newTitle" placeholder="例如：第三章 数据结构与算法" autofocus @keyup.enter="handleStart" />
        </div>

        <!-- 录制源选择 -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-[var(--ui-text-muted)]">录制模式</label>
          <div class="grid grid-cols-3 gap-2">
            <label v-for="opt in [
              { value: 'camera', label: '摄像头', icon: 'i-lucide-camera' },
              { value: 'screen', label: '屏幕共享', icon: 'i-lucide-monitor' },
              { value: 'both', label: '双路录制', icon: 'i-lucide-picture-in-picture-2' },
            ]" :key="opt.value"
              class="flex flex-col items-center gap-1.5 p-3 rounded-lg border cursor-pointer transition-colors"
              :class="recordingSource === opt.value
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
                : 'border-[var(--ui-border)] hover:bg-[var(--ui-bg-elevated)]'"
            >
              <input type="radio" v-model="recordingSource" :value="opt.value" class="sr-only" />
              <UIcon :name="opt.icon" class="text-lg" :class="recordingSource === opt.value ? 'text-teal-600 dark:text-teal-400' : 'text-[var(--ui-text-dimmed)]'" />
              <span class="text-xs font-medium">{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-[var(--ui-text-muted)]">画面预览</label>
            <UButton size="xs" variant="soft" :label="previewStream ? '重新预览' : '开启预览'" icon="i-lucide-eye" @click="preparePreview" />
          </div>
          <div ref="previewContainer" class="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-[var(--ui-border)]">
            <video ref="previewVideo" autoplay muted playsinline class="w-full h-full object-contain" />
            <div
              v-if="recordingSource === 'both' && userStreamRaw"
              :style="cameraStyle"
              @mousedown="startDragging"
            >
              <video ref="cameraOverlayVideo" autoplay muted playsinline class="w-full h-full object-cover pointer-events-none" />
              <div class="absolute right-0 bottom-0 w-5 h-5 bg-teal-500 cursor-nwse-resize rounded-tl z-[11]" @mousedown.stop="startResizing" title="拖拽缩放" />
              <span class="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">摄像头</span>
            </div>
            <div v-if="!previewStream" class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-2">
              <UIcon name="i-lucide-monitor-play" class="text-2xl text-white/40" />
              <span class="text-xs text-white/60">点击「开启预览」配置画面</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-[var(--ui-border)]">
          <UButton variant="ghost" label="取消" @click="handleCancel" />
          <UButton
            icon="i-lucide-circle"
            color="error"
            label="开始录制"
            :loading="starting"
            :disabled="!newTitle.trim()"
            @click="handleStart"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
