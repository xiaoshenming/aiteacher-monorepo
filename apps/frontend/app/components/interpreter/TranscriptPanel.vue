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

// Virtual scroll setup
const { measureHeight } = usePretext()
const scrollContainerRef = ref<HTMLElement | null>(null)
const useVirtual = computed(() => props.transcripts.length > 100)

const ITEM_FONT = '14px "Noto Sans SC", "Inter", sans-serif'
const ITEM_LINE_HEIGHT = 22
const ITEM_PADDING = 24 // p-3 = 12px * 2
const TIMESTAMP_HEIGHT = 18 // text-[10px] + margin

function estimateItemHeight(index: number): number {
  const item = props.transcripts[index]
  if (!item) return 60
  const text = isSource.value
    ? item.text
    : (props.getTranslation?.(item.id) || item.translation || '等待翻译...')
  const containerWidth = scrollContainerRef.value?.clientWidth ?? 400
  const textWidth = containerWidth - ITEM_PADDING - (isSource.value ? 80 : 0)
  const textHeight = measureHeight(text, textWidth, ITEM_FONT, ITEM_LINE_HEIGHT)
  return textHeight + ITEM_PADDING + (isSource.value ? 0 : TIMESTAMP_HEIGHT)
}

const virtualScroll = useVirtualScroll({
  itemCount: computed(() => props.transcripts.length),
  estimateHeight: estimateItemHeight,
  containerRef: scrollContainerRef,
  overscan: 10,
})

// Auto-scroll to bottom when new items arrive
watch(() => props.transcripts.length, () => {
  nextTick(() => virtualScroll.scrollToBottom())
})
</script>

<template>
  <div class="group/panel">
    <div class="flex items-center gap-2 mb-3 px-1">
      <div
        class="flex items-center justify-center size-7 rounded-lg"
        :class="isSource ? 'bg-primary-500/10' : 'bg-sky-500/10'"
      >
        <UIcon
          :name="isSource ? 'i-lucide-text' : 'i-lucide-languages'"
          class="size-4"
          :class="isSource ? 'text-primary-500' : 'text-sky-500'"
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
      <div ref="scrollContainerRef" class="space-y-1 min-h-[350px] max-h-[500px] overflow-y-auto scrollbar-thin">
        <ClientOnly>
          <template v-if="transcripts.length">
            <!-- 虚拟滚动模式 -->
            <template v-if="useVirtual">
              <div :style="{ height: `${virtualScroll.totalHeight.value}px`, position: 'relative' }">
                <div
                  v-for="vItem in virtualScroll.visibleItems.value"
                  :key="transcripts[vItem.index]!.id"
                  :style="{ position: 'absolute', top: `${vItem.offsetTop}px`, left: 0, right: 0 }"
                >
                  <div
                    v-if="isSource"
                    class="group relative flex items-start gap-3 p-3 rounded-lg hover:bg-primary-500/5 dark:hover:bg-primary-500/10 transition-all duration-200"
                    :class="vItem.index === transcripts.length - 1 ? 'bg-primary-500/5 dark:bg-primary-500/8' : ''"
                  >
                    <div class="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                      <span class="text-[10px] font-mono text-muted tabular-nums">{{ new Date(transcripts[vItem.index]!.timestamp).toLocaleTimeString() }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-highlighted leading-relaxed">{{ transcripts[vItem.index]!.text }}</p>
                    </div>
                    <UButton
                      icon="i-lucide-languages"
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      class="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
                      :loading="calibratingId === transcripts[vItem.index]!.id"
                      title="AI校准翻译"
                      @click="emit('calibrate', transcripts[vItem.index]!.id, transcripts[vItem.index]!.text)"
                    />
                  </div>
                  <div
                    v-else
                    class="p-3 rounded-lg hover:bg-sky-500/5 dark:hover:bg-sky-500/10 transition-all duration-200"
                    :class="vItem.index === transcripts.length - 1 ? 'bg-sky-500/5 dark:bg-sky-500/8' : ''"
                  >
                    <span class="text-[10px] font-mono text-muted tabular-nums">{{ new Date(transcripts[vItem.index]!.timestamp).toLocaleTimeString() }}</span>
                    <p class="text-sm text-highlighted mt-1 leading-relaxed">
                      {{ getTranslation?.(transcripts[vItem.index]!.id) || transcripts[vItem.index]!.translation || '等待翻译...' }}
                    </p>
                  </div>
                </div>
              </div>
            </template>

            <!-- 普通模式 -->
            <template v-else>
              <template v-if="isSource">
                <div
                  v-for="(t, idx) in transcripts"
                  :key="t.id"
                  class="group relative flex items-start gap-3 p-3 rounded-lg hover:bg-primary-500/5 dark:hover:bg-primary-500/10 transition-all duration-200"
                  :class="idx === transcripts.length - 1 ? 'bg-primary-500/5 dark:bg-primary-500/8' : ''"
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
          </template>
          <div v-else class="flex flex-col items-center justify-center py-20 text-muted">
            <div class="relative mb-4">
              <div
                class="absolute inset-0 rounded-full animate-pulse scale-150"
                :class="isSource ? 'bg-primary-500/10' : 'bg-sky-500/10'"
              />
              <div
                class="relative flex items-center justify-center size-16 rounded-full border"
                :class="isSource
                  ? 'bg-gradient-to-br from-primary-500/20 to-sky-500/20 border-primary-500/20'
                  : 'bg-gradient-to-br from-sky-500/20 to-primary-500/20 border-sky-500/20'"
              >
                <UIcon
                  :name="isSource ? 'i-lucide-mic' : 'i-lucide-languages'"
                  class="size-7"
                  :class="isSource ? 'text-primary-500' : 'text-sky-500'"
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