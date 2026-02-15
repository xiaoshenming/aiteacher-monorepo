<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'

const props = defineProps<{
  editor?: Editor
  loading?: boolean
}>()

const emit = defineEmits<{
  generate: [prompt: string]
  stop: []
}>()

const open = defineModel<boolean>({ default: false })
const prompt = ref('')

function onGenerate() {
  if (!prompt.value.trim()) return
  emit('generate', prompt.value.trim())
}

function onStop() {
  emit('stop')
}

function onClose() {
  if (!props.loading) {
    open.value = false
    prompt.value = ''
  }
}
</script>

<template>
  <UModal v-model:open="open" title="AI 智能生成教案" @close="onClose">
    <template #body>
      <div class="flex flex-col gap-4">
        <UTextarea
          v-model="prompt"
          :disabled="loading"
          placeholder="请描述您的教案需求，例如：&#10;• 小学三年级语文《荷花》第一课时教案&#10;• 初中物理《牛顿第一定律》探究式教学设计&#10;• 高中英语 Unit 3 Reading 阅读课教案"
          :rows="5"
          autofocus
          @keydown.meta.enter="onGenerate"
          @keydown.ctrl.enter="onGenerate"
        />
        <p class="text-xs text-muted">按 Ctrl+Enter 快速生成</p>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton v-if="loading" color="error" variant="soft" icon="i-lucide-square" @click="onStop">
          停止生成
        </UButton>
        <UButton v-if="!loading" variant="soft" @click="onClose">
          取消
        </UButton>
        <UButton v-if="!loading" :disabled="!prompt.trim()" icon="i-lucide-wand-sparkles" @click="onGenerate">
          生成教案
        </UButton>
      </div>
    </template>
  </UModal>
</template>
