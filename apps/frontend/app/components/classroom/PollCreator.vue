<template>
  <UModal v-model:open="open">
    <template #header>
      <h3 class="text-lg font-semibold">发起投票</h3>
    </template>
    <div class="p-4 space-y-4">
      <UFormField label="投票问题">
        <UInput v-model="question" placeholder="请输入投票问题" class="w-full" />
      </UFormField>
      <UFormField label="选项">
        <div class="space-y-2">
          <div v-for="(opt, i) in options" :key="i" class="flex items-center gap-2">
            <UInput v-model="options[i]" :placeholder="`选项 ${i + 1}`" class="flex-1" />
            <UButton v-if="options.length > 2" icon="i-lucide-x" size="xs" color="neutral" variant="ghost"
              @click="options.splice(i, 1)" />
          </div>
          <UButton v-if="options.length < 6" icon="i-lucide-plus" size="sm" variant="soft" @click="options.push('')">
            添加选项
          </UButton>
        </div>
      </UFormField>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="open = false">取消</UButton>
        <UButton color="primary" :disabled="!question || options.filter(Boolean).length < 2" @click="handleCreate">
          发起投票
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ create: [question: string, options: string[]] }>()

const question = ref('')
const options = ref(['', ''])

function handleCreate() {
  emit('create', question.value, options.value.filter(Boolean))
  question.value = ''
  options.value = ['', '']
  open.value = false
}
</script>
