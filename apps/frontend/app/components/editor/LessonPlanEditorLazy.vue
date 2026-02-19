<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'

const modelValue = defineModel<string>({ default: '' })

const LessonPlanEditor = defineAsyncComponent(() =>
  import('./LessonPlanEditor.vue')
)

const editorRef = ref<{ editor: Editor | undefined }>()

defineExpose({
  editor: computed(() => editorRef.value?.editor)
})
</script>

<template>
  <Suspense>
    <LessonPlanEditor ref="editorRef" v-model="modelValue" />
    <template #fallback>
      <div class="flex items-center justify-center min-h-[400px]">
        <div class="text-center space-y-3">
          <div class="w-12 h-12 mx-auto rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-primary-500 animate-spin" />
          <p class="text-sm text-zinc-500 dark:text-zinc-400">加载编辑器中...</p>
        </div>
      </div>
    </template>
  </Suspense>
</template>
