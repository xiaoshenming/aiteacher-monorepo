<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const lessonPlans = useLessonPlans()
const toast = useToast()

const planId = computed(() => Number(route.params.id))
const loading = ref(true)
const saving = ref(false)
const planName = ref('')
const planContent = ref('')
const lastSavedContent = ref('')

async function loadPlan() {
  loading.value = true
  try {
    const plan = await lessonPlans.fetchDetail(planId.value)
    planName.value = plan.name
    planContent.value = plan.content || ' '
    lastSavedContent.value = plan.content || ' '
  }
  catch (err) {
    console.error('加载教案失败:', err)
    toast.add({ title: '教案加载失败', color: 'error' })
    router.push('/user/lesson-plans')
  }
  finally {
    loading.value = false
  }
}

async function savePlan() {
  if (saving.value) return
  saving.value = true
  try {
    await lessonPlans.update(planId.value, {
      name: planName.value,
      content: planContent.value,
    })
    lastSavedContent.value = planContent.value
  }
  catch (err) {
    console.error('保存教案失败:', err)
    toast.add({ title: '保存失败，请重试', color: 'error' })
  }
  finally {
    saving.value = false
  }
}

const hasUnsavedChanges = computed(() => planContent.value !== lastSavedContent.value)

// 自动保存：内容变化后 3 秒
let autoSaveTimer: ReturnType<typeof setTimeout>
watch(planContent, () => {
  clearTimeout(autoSaveTimer)
  if (hasUnsavedChanges.value) {
    autoSaveTimer = setTimeout(() => savePlan(), 3000)
  }
})

function goBack() {
  router.push('/user/lesson-plans')
}

onMounted(() => loadPlan())

onBeforeUnmount(() => {
  clearTimeout(autoSaveTimer)
  // 离开前保存未保存的内容
  if (hasUnsavedChanges.value) {
    lessonPlans.update(planId.value, {
      name: planName.value,
      content: planContent.value,
    }).catch(() => {})
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-2">
            <UDashboardSidebarCollapse />
            <button
              class="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="返回列表"
              @click="goBack"
            >
              <UIcon name="i-lucide-arrow-left" class="w-4 h-4 text-zinc-500" />
            </button>
            <input
              v-model="planName"
              type="text"
              class="text-sm font-semibold bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 w-48 sm:w-64"
              placeholder="教案名称"
              @blur="savePlan"
            >
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <span v-if="saving" class="text-xs text-zinc-400 flex items-center gap-1">
              <UIcon name="i-lucide-loader-2" class="w-3 h-3 animate-spin" />
              保存中...
            </span>
            <span v-else-if="hasUnsavedChanges" class="text-xs text-amber-500">
              未保存
            </span>
            <span v-else class="text-xs text-teal-500">
              已保存
            </span>
            <button
              :disabled="!hasUnsavedChanges || saving"
              class="px-3 py-1.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              @click="savePlan"
            >
              保存
            </button>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-teal-500" />
      </div>

      <!-- 编辑器区域 -->
      <div v-else class="h-full">
        <EditorLessonPlanEditor v-model="planContent" />
      </div>
    </template>
  </UDashboardPanel>
</template>
