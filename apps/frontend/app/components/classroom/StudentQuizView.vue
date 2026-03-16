<template>
  <div class="space-y-4">
    <h4 class="font-medium text-highlighted">{{ question }}</h4>
    <div v-if="!submitted" class="grid grid-cols-1 gap-2">
      <button v-for="(opt, i) in options" :key="i"
        class="p-3 text-left rounded-xl border transition-all duration-200"
        :class="selected === opt
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-primary-300 dark:hover:border-primary-700'"
        @click="selected = opt">
        {{ String.fromCharCode(65 + i) }}. {{ opt }}
      </button>
    </div>
    <UButton v-if="!submitted && selected" color="primary" class="w-full" @click="handleSubmit">
      提交答案
    </UButton>
    <div v-if="submitted" class="flex items-center gap-2" :class="isCorrect ? 'text-green-600' : 'text-red-500'">
      <UIcon :name="isCorrect ? 'i-lucide-check-circle' : 'i-lucide-x-circle'" />
      <span>{{ isCorrect ? '回答正确' : '回答错误' }}，你的答案：{{ selected }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  question: string
  options: string[]
  interactionId: number
  correctAnswer?: string
}>()

const emit = defineEmits<{ answer: [answer: string] }>()
const selected = ref('')
const submitted = ref(false)

const isCorrect = computed(() => selected.value === props.correctAnswer)

function handleSubmit() {
  submitted.value = true
  emit('answer', selected.value)
}
</script>
