<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  parentNode?: Record<string, any> | null
}>()
const emit = defineEmits<{ created: [] }>()

const { createNode } = useKnowledgeTree()
const submitting = ref(false)

const form = reactive({
  name: '',
  node_type: 'chapter',
  grade: '',
  subject: '',
  description: '',
  is_public: true,
})

const typeOptions = [
  { label: '学科', value: 'subject' },
  { label: '教材', value: 'textbook' },
  { label: '章', value: 'chapter' },
  { label: '节', value: 'section' },
  { label: '知识点', value: 'knowledge_point' },
]

async function handleSubmit() {
  if (!form.name.trim()) return
  submitting.value = true
  try {
    await createNode({
      ...form,
      parent_id: props.parentNode?.id || null,
    })
    Object.assign(form, { name: '', node_type: 'chapter', grade: '', subject: '', description: '', is_public: true })
    emit('created')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="创建知识节点">
    <template #body>
      <div class="space-y-4">
        <div v-if="parentNode" class="text-sm text-zinc-500 dark:text-zinc-400">
          父节点：<span class="text-zinc-800 dark:text-zinc-200">{{ parentNode.name }}</span>
        </div>
        <UFormField label="名称" required>
          <UInput v-model="form.name" placeholder="请输入节点名称" />
        </UFormField>
        <UFormField label="类型">
          <USelect v-model="form.node_type" :items="typeOptions" />
        </UFormField>
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="学科">
            <UInput v-model="form.subject" placeholder="如：数学" />
          </UFormField>
          <UFormField label="年级">
            <UInput v-model="form.grade" placeholder="如：高一" />
          </UFormField>
        </div>
        <UFormField label="描述">
          <UTextarea v-model="form.description" placeholder="可选描述" :rows="2" />
        </UFormField>
        <div class="flex items-center gap-2">
          <USwitch v-model="form.is_public" />
          <span class="text-sm text-zinc-600 dark:text-zinc-400">公开</span>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="open = false">取消</UButton>
        <UButton color="primary" :loading="submitting" @click="handleSubmit">创建</UButton>
      </div>
    </template>
  </UModal>
</template>
