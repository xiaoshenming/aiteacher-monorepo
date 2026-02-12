<script setup lang="ts">
const toast = useToast()

const typeOptions = [
  { label: 'Bug 反馈', value: 'bug' },
  { label: '功能建议', value: 'suggestion' },
  { label: '其他', value: 'other' },
]

const form = reactive({
  type: 'bug',
  title: '',
  description: '',
})

const submitting = ref(false)

async function submitFeedback() {
  if (!form.title.trim()) {
    toast.add({ title: '请填写标题', color: 'error' })
    return
  }
  if (!form.description.trim()) {
    toast.add({ title: '请填写详细描述', color: 'error' })
    return
  }
  submitting.value = true
  // Simulate submission
  await new Promise(resolve => setTimeout(resolve, 500))
  submitting.value = false
  toast.add({ title: '反馈提交成功，感谢您的反馈！', color: 'success' })
  form.title = ''
  form.description = ''
  form.type = 'bug'
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="反馈">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 max-w-2xl mx-auto space-y-4">
        <div>
          <label class="text-sm font-medium text-highlighted mb-1 block">反馈类型</label>
          <USelectMenu v-model="form.type" :items="typeOptions" />
        </div>
        <div>
          <label class="text-sm font-medium text-highlighted mb-1 block">标题</label>
          <UInput v-model="form.title" placeholder="请简要描述问题或建议" />
        </div>
        <div>
          <label class="text-sm font-medium text-highlighted mb-1 block">详细描述</label>
          <UTextarea v-model="form.description" placeholder="请详细描述您遇到的问题或建议..." :rows="6" />
        </div>
        <div class="flex justify-end">
          <UButton label="提交反馈" :loading="submitting" @click="submitFeedback" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
