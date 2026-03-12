<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()
const config = useRuntimeConfig()
const userStore = useUserStore()

const uploading = ref(false)
const fileInputRef = ref<HTMLInputElement>()

const resolvedSrc = computed(() => {
  let src = props.node.attrs.src
  if (src && !src.startsWith('http') && src.startsWith('/api/')) {
    const base = (config.public.apiCloud as string).replace(/\/$/, '')
    src = `${base}${src.replace(/^\/api/, '')}`
  }
  return src
})

function triggerUpload() {
  fileInputRef.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', input.files[0]!)
    const result = await $fetch<{ code: number, data: { url: string } }>('editor/upload', {
      baseURL: config.public.apiCloud as string,
      method: 'POST',
      body: formData,
      headers: {
        Authorization: userStore.token ? `Bearer ${userStore.token}` : '',
        deviceType: 'pc',
      },
    })
    props.updateAttributes({ src: result.data.url })
  } catch (e) {
    console.error('背景图上传失败', e)
  } finally {
    uploading.value = false
    if (input) input.value = ''
  }
}

const containerStyle = computed(() => ({
  minHeight: `${props.node.attrs.minHeight}px`,
  borderRadius: `${props.node.attrs.borderRadius}px`,
  position: 'relative' as const,
  overflow: 'hidden' as const,
}))

const bgImgStyle = computed(() => ({
  position: 'absolute' as const,
  inset: '0',
  width: '100%',
  height: '100%',
  objectFit: props.node.attrs.objectFit as 'cover' | 'contain',
}))

const overlayStyle = computed(() => ({
  position: 'absolute' as const,
  inset: '0',
  backgroundColor: props.node.attrs.overlayColor,
  opacity: props.node.attrs.overlayOpacity / 100,
}))

const contentStyle = computed(() => ({
  position: 'relative' as const,
  zIndex: 10,
  color: props.node.attrs.textColor,
  padding: `${props.node.attrs.padding}px`,
}))
</script>

<template>
  <NodeViewWrapper>
    <div class="cover-block" :style="containerStyle" data-type="cover-block">
      <img v-if="resolvedSrc" :src="resolvedSrc" class="cover-bg" :style="bgImgStyle" draggable="false" />
      <div v-if="resolvedSrc" class="cover-overlay" :style="overlayStyle" />

      <div v-if="!node.attrs.src" class="cover-upload-placeholder" @click="triggerUpload">
        <div class="placeholder-content">
          <UIcon name="i-lucide-image-plus" class="w-8 h-8 text-gray-400" />
          <span class="text-sm text-gray-500 mt-2">点击上传背景图</span>
        </div>
      </div>

      <NodeViewContent class="cover-content" :style="contentStyle" />

      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileChange"
      />
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
.cover-block {
  position: relative;
  overflow: hidden;
  transition: border-radius 0.2s;
}

.cover-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cover-content {
  position: relative;
  z-index: 10;
  min-height: 60px;
}

.cover-content :deep(p) {
  margin: 0;
}

.cover-upload-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #f3f4f6;
  transition: background 0.2s;
}

.cover-upload-placeholder:hover {
  background: #e5e7eb;
}

.dark .cover-upload-placeholder {
  background: #1f2937;
}

.dark .cover-upload-placeholder:hover {
  background: #374151;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
