<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()

const fileUploadRef = useTemplateRef('fileUploadRef')

const error = ref<string | null>(null)
const loading = ref(false)

const config = useRuntimeConfig()
const userStore = useUserStore()

async function onFileChange() {
  const target = fileUploadRef.value?.inputRef
  if (!target?.files?.length) {
    return
  }

  loading.value = true
  error.value = null

  try {
    const formData = new FormData()
    formData.append('file', target.files[0]!)

    const result = await $fetch<{ code: number, data: { url: string } }>('editor/upload', {
      baseURL: config.public.apiCloud as string,
      method: 'POST',
      body: formData,
      headers: {
        Authorization: userStore.token ? `Bearer ${userStore.token}` : '',
        deviceType: 'pc'
      }
    })

    const pos = props.getPos()
    if (typeof pos !== 'number') {
      return
    }

    // 只存相对路径，渲染时由 Image 扩展动态拼接域名
    const imageUrl = result.data.url

    props.editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + 1 })
      .setImage({ src: imageUrl })
      .run()
  } catch (e) {
    const fetchError = e as { data?: { message?: string }, message?: string }
    error.value = fetchError.data?.message || fetchError.message || '上传失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <NodeViewWrapper>
    <UFileUpload
      ref="fileUploadRef"
      accept="image/*"
      label="上传图片"
      :description="error || '支持 SVG、PNG、JPG、GIF（最大 2MB）'"
      :preview="false"
      class="min-h-48"
      :ui="{ description: error ? 'text-error' : '' }"
      @update:model-value="onFileChange"
    >
      <template #leading>
        <UAvatar
          :icon="error ? 'i-lucide-alert-circle' : loading ? 'i-lucide-loader-circle' : 'i-lucide-image'"
          size="xl"
          :ui="{ icon: [loading && 'animate-spin', error && 'text-error'] }"
        />
      </template>
    </UFileUpload>
  </NodeViewWrapper>
</template>
