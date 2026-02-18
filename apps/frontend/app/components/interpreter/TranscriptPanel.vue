<script setup lang="ts">
interface TranscriptItem {
  id: string
  text: string
  corrected: string
  translation: string
  timestamp: number
  isFinal: boolean
  cutReason?: string
}

const props = defineProps<{
  transcripts: TranscriptItem[]
  type: 'source' | 'translation'
  isRecording?: boolean
  calibratingId?: string | null
  getTranslation?: (id: string) => string | undefined
}>()

const emit = defineEmits<{
  calibrate: [id: string, text: string]
}>()

const isSource = computed(() => props.type === 'source')
const themeColor = computed(() => isSource.value ? 'teal' : 'sky')
</script>

<template>
  <div class="group/panel">
    <div class="flex items-center gap-2 mb-3 px-1">
      <div
        class="flex items-center justify-center size-7 rounded-lg"
        :class="isSource ? 'bg-teal-500/10' : 'bg-sky-500/10'"
      >
        <UIcon
          :name="isSource ? 'i-lucide-text' : 'i-lucide-languages'"
          class="size-4"
          :class="isSource ? 'text-teal-500' : 'text-sky-500'"
        />
      </div>
      <span class="text-sm font-semibold text-highlighted">{{ isSource ? '原文转写' : '翻译结果' }}</span>
      <ClientOnly>
        <UBadge v-if="isSource && isRecording" color="error" size="xs" variant="subtle" class="animate-pulse">
          <span class="flex items-center gap-1">
            <span class="size-1.5 rounded-full bg-red-500" />
            录音中
          </span>
        </UBadge>
      </ClientOnly>
    </div>
    <UCard class="!hover:shadow-none">
      <div class="space-y-1 min-h-[350px] max-h-[500px] overflow-y-auto scrollbar-thin">
        <ClientOnly>
          <template v-if="transcripts.length">
            <!-- 原文面板 -->
            <template v-if="isSource">
              <div
                v-for="(t, idx) in transcripts"
                :key="t.id"
                class="group relative flex items-start gap-3 p-3 rounded-lg hover:bg-teal-500/5 dark:hover:bg-teal-500/10 transition-all duration-200"
                :class="idx === transcripts.length - 1 ? 'bg-teal-500/5 dark:bg-teal-500/8' : ''"
              >
                <div class="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                  <span class="text-[10px] font-mono text-muted tabular-nums">{{ new Date(t.timestamp).toLocaleTimeString() }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-highlighted leading-relaxed">{{ t.text }}</p>
                </div>
                <UButton
                  icon="i-lucide-languages"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  class="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
                  :loading="calibratingId === t.id"
                  title="AI校准翻译"
                  @click="emit('calibrate', t.id, t.text)"
                />
              </div>
            </template>
            <!-- 翻译面板 -->
            <template v-else>
              <div
                v-for="(t, idx) in transcripts"
                :key="t.id"
                class="p-3 rounded-lg hover:bg-sky-500/5 dark:hover:bg-sky-500/10 transition-all duration-200"
                :class="idx === transcripts.length - 1 ? 'bg-sky-500/5 dark:bg-sky-500/8' : ''"
              >
                <span class="text-[10px] font-mono text-muted tabular-nums">{{ new Date(t.timestamp).toLocaleTimeString() }}</span>
                <p class="text-sm text-highlighted mt-1 leading-relaxed">
                  {{ getTranslation?.(t.id) || t.translation || '等待翻译...' }}
                </p>
              </div>
            </template>
          </template>
          <div v-else class="flex flex-col items-center justify-center py-20 text-muted">
            <div class="relative mb-4">
              <div
                class="absolute inset-0 rounded-full animate-pulse scale-150"
                :class="isSource ? 'bg-teal-500/10' : 'bg-sky-500/10'"
              />
              <div
                class="relative flex items-center justify-center size-16 rounded-full border"
                :class="isSource
                  ? 'bg-gradient-to-br from-teal-500/20 to-sky-500/20 border-teal-500/20'
                  : 'bg-gradient-to-br from-sky-500/20 to-teal-500/20 border-sky-500/20'"
              >
                <UIcon
                  :name="isSource ? 'i-lucide-mic' : 'i-lucide-languages'"
                  class="size-7"
                  :class="isSource ? 'text-teal-500' : 'text-sky-500'"
                />
              </div>
            </div>
            <p class="text-sm font-medium text-highlighted mb-1">{{ isSource ? '准备就绪' : '等待翻译' }}</p>
            <p class="text-xs text-muted">{{ isSource ? '点击「开始录音」进行语音转写' : '翻译结果将在此实时显示' }}</p>
          </div>
        </ClientOnly>
      </div>
    </UCard>
  </div>
</template>
