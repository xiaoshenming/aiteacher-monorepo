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
    questions?: any[]
  }]
}>()

const currentStep = ref(1)

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

const selectedQuestions = ref<any[]>([])

const typeOptions = [
  { label: '作业', value: 'homework' },
  { label: '测验', value: 'quiz' },
  { label: '考试', value: 'exam' },
]

const stepLabels = ['基本信息', '选择题目', '预览确认']

function resetForm() {
  form.value = { title: '', description: '', course_id: undefined, class_id: undefined, type: 'homework', deadline: '', total_score: 100, status: 'draft' }
  selectedQuestions.value = []
  currentStep.value = 1
}

function nextStep() {
  if (currentStep.value < 3) currentStep.value++
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--
}

function skipToPreview() {
  currentStep.value = 3
}

function submitAs(status: string) {
  form.value.status = status
  const payload: any = { ...form.value }
  if (selectedQuestions.value.length > 0) {
    payload.questions = selectedQuestions.value.map((q, i) => ({
      question_id: q.id,
      score: q.score || 0,
      order_num: i + 1,
    }))
  }
  emit('submit', payload)
}

watch(open, (val) => {
  if (val) resetForm()
})
</script>

<template>
  <UModal v-model:open="open" :ui="{ width: 'sm:max-w-2xl' }">
    <template #content>
      <div class="p-6 space-y-4">
        <h3 class="text-lg font-semibold text-highlighted">发布作业</h3>

        <!-- 步骤指示器 -->
        <div class="flex items-center gap-2 mb-4">
          <template v-for="(label, i) in stepLabels" :key="i">
            <div class="flex items-center gap-1.5">
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                :class="currentStep > i + 1 ? 'bg-primary-500 text-white' : currentStep === i + 1 ? 'bg-primary-500/20 text-primary-600 dark:text-primary-400' : 'bg-zinc-200 dark:bg-zinc-700 text-muted'"
              >{{ i + 1 }}</div>
              <span class="text-sm" :class="currentStep === i + 1 ? 'text-highlighted font-medium' : 'text-muted'">{{ label }}</span>
            </div>
            <div v-if="i < 2" class="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
          </template>
        </div>

        <!-- Step 1: 基本信息 -->
        <div v-show="currentStep === 1" class="space-y-3">
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
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium text-muted mb-1 block">选择班级</label>
              <USelectMenu v-model="form.class_id" :items="props.classOptions" value-key="value" placeholder="请选择班级" />
            </div>
            <div>
              <label class="text-sm font-medium text-muted mb-1 block">选择课程</label>
              <USelectMenu v-model="form.course_id" :items="props.courseOptions" value-key="value" placeholder="请选择课程" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium text-muted mb-1 block">截止日期</label>
              <UInput v-model="form.deadline" type="date" />
            </div>
            <div>
              <label class="text-sm font-medium text-muted mb-1 block">总分</label>
              <UInput v-model.number="form.total_score" type="number" placeholder="100" />
            </div>
          </div>
        </div>

        <!-- Step 2: 选题 -->
        <div v-show="currentStep === 2">
          <AssignmentQuestionPicker v-model="selectedQuestions" />
        </div>

        <!-- Step 3: 预览 -->
        <div v-show="currentStep === 3">
          <AssignmentPreview :assignment="form" :questions="selectedQuestions" @update:questions="selectedQuestions = $event" />
        </div>

        <!-- 底部导航 -->
        <div class="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <div>
            <UButton v-if="currentStep > 1" variant="ghost" label="上一步" icon="i-lucide-arrow-left" @click="prevStep" />
          </div>
          <div class="flex gap-2">
            <UButton v-if="currentStep === 1" variant="ghost" label="取消" @click="open = false" />
            <UButton v-if="currentStep === 1" label="下一步" @click="nextStep" />
            <UButton v-if="currentStep === 2" variant="outline" label="跳过选题" @click="skipToPreview" />
            <UButton v-if="currentStep === 2" label="下一步" @click="nextStep" />
            <UButton v-if="currentStep === 3" label="保存为草稿" variant="outline" @click="submitAs('draft')" />
            <UButton v-if="currentStep === 3" label="直接发布" @click="submitAs('published')" />
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
