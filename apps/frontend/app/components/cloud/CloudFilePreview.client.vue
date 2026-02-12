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
  emit('update:open', false)
}
</script>

<template>
  <UModal :open="open" fullscreen @update:open="emit('update:open', $event)">
    <template #content>
      <div class="flex flex-col h-screen">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-default">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon :name="strategy.icon" class="text-lg shrink-0" />
            <span class="truncate font-medium">{{ file?.name }}</span>
            <UBadge variant="subtle" size="sm">{{ strategy.label }}</UBadge>
          </div>
          <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="close" />
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-auto relative">
          <!-- Loading -->
          <div v-if="previewLoading && !['image', 'video', 'audio'].includes(strategy.type)" class="absolute inset-0 flex items-center justify-center bg-default/50 z-10">
            <UIcon name="i-lucide-loader-2" class="text-3xl animate-spin text-muted" />
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
                class="max-w-full max-h-full object-contain"
                @load="previewLoading = false"
                @error="onError"
              >
            </div>

            <!-- Video -->
            <div v-else-if="strategy.type === 'video'" class="flex items-center justify-center h-full p-4">
              <video
                :src="previewUrl"
                controls
                class="max-w-full max-h-full"
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
    </template>
  </UModal>
</template>
