<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  classOptions: { label: string, value: number }[]
  courseOptions: { label: string, value: number }[]
}>()

const emit = defineEmits<{
  submit: [form: {
    title: string
    description: string
    course_id: number | undefined
    class_id: number | undefined
    type: string
    deadline: string
    total_score: number
    status: string
  }]
}>()

const form = ref({
  title: '',
  description: '',
  course_id: undefined as number | undefined,
  class_id: undefined as number | undefined,
  type: 'homework',
  deadline: '',
  total_score: 100,
  status: 'draft',
})

const typeOptions = [
  { label: '作业', value: 'homework' },
  { label: '测验', value: 'quiz' },
  { label: '考试', value: 'exam' },
]

function resetForm() {
  form.value = { title: '', description: '', course_id: undefined, class_id: undefined, type: 'homework', deadline: '', total_score: 100, status: 'draft' }
}

function submitAs(status: string) {
  form.value.status = status
  emit('submit', { ...form.value })
}

watch(open, (val) => {
  if (val) resetForm()
})
</script>

<template>
  <UModal v-model:open="open">
    <template #content>
      <div class="p-6 space-y-4">
        <h3 class="text-lg font-semibold text-highlighted">发布作业</h3>
        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium text-muted mb-1 block">作业标题 *</label>
            <UInput v-model="form.title" placeholder="请输入作业标题" />
          </div>
          <div>
            <label class="text-sm font-medium text-muted mb-1 block">作业描述</label>
            <UTextarea v-model="form.description" placeholder="请输入作业描述和要求" :rows="3" />
          </div>
          <div>
            <label class="text-sm font-medium text-muted mb-1 block">类型</label>
            <USelectMenu v-model="form.type" :items="typeOptions" value-key="value" placeholder="选择类型" />
          </div>
          <div>
            <label class="text-sm font-medium text-muted mb-1 block">选择班级</label>
            <USelectMenu v-model="form.class_id" :items="props.classOptions" value-key="value" placeholder="请选择班级" />
          </div>
          <div>
            <label class="text-sm font-medium text-muted mb-1 block">选择课程</label>
            <USelectMenu v-model="form.course_id" :items="props.courseOptions" value-key="value" placeholder="请选择课程" />
          </div>
          <div>
            <label class="text-sm font-medium text-muted mb-1 block">截止日期</label>
            <UInput v-model="form.deadline" type="date" />
          </div>
          <div>
            <label class="text-sm font-medium text-muted mb-1 block">总分</label>
            <UInput v-model.number="form.total_score" type="number" placeholder="100" />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <UButton variant="ghost" label="取消" @click="open = false" />
          <UButton label="保存为草稿" variant="outline" @click="submitAs('draft')" />
          <UButton label="直接发布" @click="submitAs('published')" />
        </div>
      </div>
    </template>
  </UModal>
</template>
