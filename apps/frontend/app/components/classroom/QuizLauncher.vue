<template>
  <UModal v-model:open="open">
    <template #content>
      <div class="p-6 space-y-4">
        <h3 class="text-lg font-semibold">发起随堂测验</h3>
        <UFormField label="题目">
          <UInput v-model="question" placeholder="请输入题目" class="w-full" />
        </UFormField>
        <UFormField label="选项">
          <div class="space-y-2">
            <div v-for="(opt, i) in options" :key="i" class="flex items-center gap-2">
              <UInput v-model="options[i]" :placeholder="`选项 ${String.fromCharCode(65 + i)}`" class="flex-1" />
              <UButton v-if="options.length > 2" icon="i-lucide-x" size="xs" color="neutral" variant="ghost"
                @click="options.splice(i, 1)" />
            </div>
            <UButton v-if="options.length < 6" icon="i-lucide-plus" size="sm" variant="soft" @click="options.push('')">
              添加选项
            </UButton>
          </div>
        </UFormField>
        <UFormField label="正确答案">
          <USelectMenu v-model="correctAnswer" :items="answerOptions" value-key="value" placeholder="选择正确答案" class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-2 pt-2">
          <UButton variant="ghost" color="neutral" @click="open = false">取消</UButton>
          <UButton color="primary" :disabled="!canSubmit" @click="handleLaunch">发起测验</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ launch: [question: string, options: string[], correctAnswer: string] }>()

const question = ref('')
const options = ref(['', '', '', ''])
const correctAnswer = ref('')

const answerOptions = computed(() =>
  options.value.filter(Boolean).map((opt, i) => ({
    label: `${String.fromCharCode(65 + i)}. ${opt}`,
    value: opt,
  })),
)

const canSubmit = computed(() =>
  question.value && options.value.filter(Boolean).length >= 2 && correctAnswer.value,
)

function handleLaunch() {
  emit('launch', question.value, options.value.filter(Boolean), correctAnswer.value)
  question.value = ''
  options.value = ['', '', '', '']
  correctAnswer.value = ''
  open.value = false
}
</script>
