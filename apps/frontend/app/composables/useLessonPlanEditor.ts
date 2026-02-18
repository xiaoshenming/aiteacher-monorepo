export function useLessonPlanEditor(planId: Ref<number>) {
  const router = useRouter()
  const lessonPlans = useLessonPlans()
  const toast = useToast()
  const { exportMarkdown, exportWord, exportPDF } = useEditorExport()

  const loading = ref(true)
  const saving = ref(false)
  const planName = ref('')
  const planContent = ref('')
  const lastSavedContent = ref('')

  const hasUnsavedChanges = computed(() => planContent.value !== lastSavedContent.value)

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

  function getExportItems(editorRef: Ref<{ editor: import('@tiptap/vue-3').Editor | undefined } | undefined>) {
    return computed(() => [
      [{
        label: '导出 Markdown',
        icon: 'i-lucide-file-text',
        onSelect: () => {
          const editor = editorRef.value?.editor
          if (editor) exportMarkdown(editor, planName.value || '教案')
        },
      },
      {
        label: '导出 Word',
        icon: 'i-lucide-file-type',
        onSelect: () => {
          const editor = editorRef.value?.editor
          if (editor) exportWord(editor, planName.value || '教案')
        },
      },
      {
        label: '导出 PDF',
        icon: 'i-lucide-printer',
        onSelect: () => {
          const editor = editorRef.value?.editor
          if (editor) exportPDF(editor, planName.value || '教案')
        },
      }],
    ])
  }

  function cleanup() {
    clearTimeout(autoSaveTimer)
    if (hasUnsavedChanges.value) {
      lessonPlans.update(planId.value, {
        name: planName.value,
        content: planContent.value,
      }).catch(() => {})
    }
  }

  return {
    loading,
    saving,
    planName,
    planContent,
    hasUnsavedChanges,
    loadPlan,
    savePlan,
    goBack,
    getExportItems,
    cleanup,
  }
}
