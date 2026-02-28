<script setup lang="ts">
import type { CloudFile } from '~/types/cloud'

const props = defineProps<{
  file: CloudFile | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { getPreviewUrl } = useCloudDisk()
const { resolveStrategy } = useFilePreview()

const previewLoading = ref(true)
const previewError = ref(false)
const isFullscreen = ref(false)

const strategy = computed(() => resolveStrategy(props.file?.type))
const previewUrl = computed(() => props.file ? getPreviewUrl(props.file.id) : '')

// Word/Excel/PPT 按需加载（PDF 用 iframe 原生渲染，不需要 vue-office）
const componentCache: Record<string, any> = {}
const cssLoaded = new Set<string>()

async function loadOfficeComponent(type: string) {
  if (componentCache[type]) return componentCache[type]
  let mod: any
  switch (type) {
    case 'word':
      if (!cssLoaded.has('word')) {
        cssLoaded.add('word')
        await import('@vue-office/docx/lib/v3/index.css')
      }
      mod = await import('@vue-office/docx/lib/v3/vue-office-docx.mjs')
      break
    case 'excel':
      if (!cssLoaded.has('excel')) {
        cssLoaded.add('excel')
        await import('@vue-office/excel/lib/v3/index.css')
      }
      mod = await import('@vue-office/excel/lib/v3/vue-office-excel.mjs')
      break
    case 'ppt':
      mod = await import('@vue-office/pptx/lib/v3/vue-office-pptx.mjs')
      break
    default:
      return null
  }
  componentCache[type] = mod.default || mod
  return componentCache[type]
}

const activeComponent = shallowRef<any>(null)

watch([() => props.file, () => props.open], async () => {
  previewLoading.value = true
  previewError.value = false
  activeComponent.value = null
  isFullscreen.value = false
  if (!props.open || !props.file) return
  const t = strategy.value.type
  if (['word', 'excel', 'ppt'].includes(t)) {
    try {
      activeComponent.value = await loadOfficeComponent(t)
    } catch (err) {
      console.error('[Preview] Load failed:', err)
      previewError.value = true
      previewLoading.value = false
    }
  } else if (t === 'pdf') {
    // PDF 用 iframe，加载由 iframe onload 处理
  } else if (['image', 'video', 'audio'].includes(t)) {
    // 由各自元素的事件处理
  } else {
    previewLoading.value = false
  }
}, { immediate: true })

function onRendered() {
  previewLoading.value = false
}

function onError() {
  previewLoading.value = false
  previewError.value = true
}

function close() {
  isFullscreen.value = false
  emit('update:open', false)
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

// --- 拖拽移动 ---
const panelRef = ref<HTMLElement>()
const isDragging = ref(false)
const panelPos = reactive({ x: 0, y: 0 })
const dragStart = reactive({ x: 0, y: 0, panelX: 0, panelY: 0 })

function onDragStart(e: MouseEvent) {
  if (isFullscreen.value) return
  isDragging.value = true
  dragStart.x = e.clientX
  dragStart.y = e.clientY
  dragStart.panelX = panelPos.x
  dragStart.panelY = panelPos.y
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  if (!isDragging.value) return
  panelPos.x = dragStart.panelX + (e.clientX - dragStart.x)
  panelPos.y = dragStart.panelY + (e.clientY - dragStart.y)
}

function onDragEnd() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

// --- 拖拽缩放 ---
const panelSize = reactive({ w: 720, h: 520 })
const isResizing = ref(false)
const resizeStart = reactive({ x: 0, y: 0, w: 0, h: 0 })
const MIN_W = 400
const MIN_H = 300

function onResizeStart(e: MouseEvent) {
  if (isFullscreen.value) return
  e.preventDefault()
  e.stopPropagation()
  isResizing.value = true
  resizeStart.x = e.clientX
  resizeStart.y = e.clientY
  resizeStart.w = panelSize.w
  resizeStart.h = panelSize.h
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
}

function onResizeMove(e: MouseEvent) {
  if (!isResizing.value) return
  panelSize.w = Math.max(MIN_W, resizeStart.w + (e.clientX - resizeStart.x))
  panelSize.h = Math.max(MIN_H, resizeStart.h + (e.clientY - resizeStart.y))
}

function onResizeEnd() {
  isResizing.value = false
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
}

// 重置面板位置
watch(() => props.open, (v) => {
  if (v) {
    panelPos.x = 0
    panelPos.y = 0
    panelSize.w = 720
    panelSize.h = 520
  }
})

// ESC 键关闭
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    if (isFullscreen.value) {
      isFullscreen.value = false
    } else {
      close()
    }
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="preview-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[9999]"
        :class="isDragging || isResizing ? 'select-none' : ''"
      >
        <!-- 毛玻璃遮罩 -->
        <div
          class="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
          @click="close"
        />

        <!-- 面板 -->
        <div
          ref="panelRef"
          class="preview-panel absolute transition-all duration-300 ease-out"
          :class="[
            isFullscreen
              ? 'inset-2 !translate-x-0 !translate-y-0'
              : 'top-1/2 left-1/2',
            isDragging || isResizing ? '!transition-none' : '',
          ]"
          :style="isFullscreen ? undefined : {
            width: `${panelSize.w}px`,
            height: `${panelSize.h}px`,
            transform: `translate(calc(-50% + ${panelPos.x}px), calc(-50% + ${panelPos.y}px))`,
          }"
        >
          <!-- 面板内容容器 -->
          <div class="relative flex flex-col h-full w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-[var(--ui-bg)]/80 backdrop-blur-xl">
            <!-- Header - 可拖拽区域 -->
            <div
              class="flex items-center justify-between px-4 py-2.5 border-b border-[var(--ui-border)]/50 shrink-0 cursor-move bg-[var(--ui-bg)]/60 backdrop-blur-sm"
              @mousedown="onDragStart"
            >
              <div class="flex items-center gap-2 min-w-0 pointer-events-none">
                <UIcon :name="strategy.icon" class="text-lg shrink-0 text-[var(--ui-primary)]" />
                <span class="truncate font-medium text-sm">{{ file?.name }}</span>
                <UBadge variant="subtle" size="xs">{{ strategy.label }}</UBadge>
              </div>
              <div class="flex items-center gap-0.5 pointer-events-auto">
                <UButton
                  :icon="isFullscreen ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
                  variant="ghost"
                  size="xs"
                  :title="isFullscreen ? '退出全屏' : '全屏预览'"
                  @click="toggleFullscreen"
                />
                <UButton
                  icon="i-lucide-x"
                  variant="ghost"
                  size="xs"
                  title="关闭"
                  @click="close"
                />
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-auto relative">
              <!-- Loading -->
              <div
                v-if="previewLoading && !['image', 'video', 'audio'].includes(strategy.type)"
                class="absolute inset-0 flex items-center justify-center bg-[var(--ui-bg)]/50 z-10"
              >
                <div class="flex flex-col items-center gap-3">
                  <UIcon name="i-lucide-loader-2" class="text-3xl animate-spin text-[var(--ui-primary)]" />
                  <span class="text-xs text-muted">加载中...</span>
                </div>
              </div>

              <!-- Error -->
              <div v-if="previewError" class="flex flex-col items-center justify-center h-full text-muted">
                <UIcon name="i-lucide-alert-circle" class="text-4xl mb-2" />
                <p>预览加载失败</p>
              </div>

              <template v-else>
                <!-- Image -->
                <div v-if="strategy.type === 'image'" class="flex items-center justify-center h-full p-4">
                  <img
                    :src="previewUrl"
                    :alt="file?.name"
                    class="max-w-full max-h-full object-contain rounded-lg"
                    @load="previewLoading = false"
                    @error="onError"
                  >
                </div>

                <!-- Video -->
                <div v-else-if="strategy.type === 'video'" class="flex items-center justify-center h-full p-4">
                  <video
                    :src="previewUrl"
                    controls
                    class="max-w-full max-h-full rounded-lg"
                    @loadeddata="previewLoading = false"
                    @error="onError"
                  />
                </div>

                <!-- Audio -->
                <div v-else-if="strategy.type === 'audio'" class="flex items-center justify-center h-full p-4">
                  <audio
                    :src="previewUrl"
                    controls
                    class="w-full max-w-md"
                    @loadeddata="previewLoading = false"
                    @error="onError"
                  />
                </div>

                <!-- PDF: 浏览器原生渲染 -->
                <iframe
                  v-else-if="strategy.type === 'pdf'"
                  :src="previewUrl"
                  class="w-full h-full border-0"
                  @load="previewLoading = false"
                  @error="onError"
                />

                <!-- Word/Excel/PPT: vue-office -->
                <component
                  :is="activeComponent"
                  v-else-if="activeComponent"
                  :src="previewUrl"
                  class="h-full"
                  @rendered="onRendered"
                  @error="onError"
                />

                <!-- Unsupported -->
                <div v-else-if="strategy.type === 'unsupported'" class="flex flex-col items-center justify-center h-full text-muted">
                  <UIcon name="i-lucide-file-question" class="text-4xl mb-2" />
                  <p>该文件类型暂不支持在线预览</p>
                  <p class="text-sm mt-1">请下载后使用本地应用打开</p>
                </div>
              </template>
            </div>
          </div>

          <!-- 右下角缩放手柄 -->
          <div
            v-if="!isFullscreen"
            class="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-10 group"
            @mousedown="onResizeStart"
          >
            <svg
              class="absolute bottom-1 right-1 w-3 h-3 text-[var(--ui-text-muted)] opacity-40 group-hover:opacity-80 transition-opacity"
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="6" cy="10" r="1.5" />
              <circle cx="10" cy="6" r="1.5" />
              <circle cx="2" cy="10" r="1.5" />
              <circle cx="10" cy="2" r="1.5" />
              <circle cx="6" cy="6" r="1.5" />
            </svg>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.25s ease;
}
.preview-fade-enter-active .preview-panel {
  transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.preview-fade-leave-active .preview-panel {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}
.preview-fade-enter-from .preview-panel {
  transform: translate(-50%, -50%) scale(0.92);
}
.preview-fade-leave-to .preview-panel {
  transform: translate(-50%, -50%) scale(0.95);
}
</style>
