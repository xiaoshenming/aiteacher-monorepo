import type { Recording, AINote } from '~/types/recording'

export function useAINotes() {
  const { getNotes, generateNotes } = useRecordings()
  const toast = useToast()

  const showNotesModal = ref(false)
  const notesLoading = ref(false)
  const notesTitle = ref('')
  const notesData = ref<AINote | null>(null)
  const notesPollingTimer = ref<ReturnType<typeof setTimeout> | null>(null)
  const showNotesRecordingId = ref('')

  const parsedKeywords = computed(() => {
    if (!notesData.value?.keywords) return []
    const kw = notesData.value.keywords
    if (Array.isArray(kw)) return kw
    if (typeof kw === 'string') {
      try { return JSON.parse(kw) } catch { return kw.split(',').map(s => s.trim()).filter(Boolean) }
    }
    return []
  })

  const parsedOutline = computed(() => {
    const content = notesData.value?.content
    if (!content?.outline) return ''
    if (Array.isArray(content.outline)) return content.outline.join('\n\n')
    return content.outline
  })

  const parsedKeyPoints = computed(() => {
    const content = notesData.value?.content
    if (!content) return []
    return content.keypoints || content.key_points || []
  })

  const parsedQuiz = computed(() => {
    const content = notesData.value?.content
    if (!content) return []
    return content.quizzes || content.quiz || []
  })

  function pollNotes(id: string) {
    notesPollingTimer.value = setTimeout(async () => {
      if (!showNotesModal.value) return
      try {
        const res = await getNotes(id)
        notesData.value = res.data
        if (res.data.status === 'pending' || res.data.status === 'processing' || res.data.status === 'waiting') {
          pollNotes(id)
        }
      }
      catch { /* ignore polling errors */ }
    }, 5000)
  }

  async function viewNotes(recording: Recording) {
    notesTitle.value = recording.title
    notesData.value = null
    showNotesModal.value = true
    notesLoading.value = true
    showNotesRecordingId.value = recording.id
    if (notesPollingTimer.value) {
      clearTimeout(notesPollingTimer.value)
      notesPollingTimer.value = null
    }
    try {
      const res = await getNotes(recording.id)
      notesData.value = res.data
      if (res.data.status === 'pending' || res.data.status === 'processing' || res.data.status === 'waiting') {
        pollNotes(recording.id)
      }
    }
    catch {
      toast.add({ title: '获取AI笔记失败', color: 'error' })
      showNotesModal.value = false
    }
    finally {
      notesLoading.value = false
    }
  }

  async function handleGenerateNotes(recording: Recording) {
    try {
      showNotesRecordingId.value = recording.id
      await generateNotes(recording.id)
      toast.add({ title: 'AI笔记生成任务已启动', color: 'success' })
      viewNotes(recording)
    }
    catch {
      toast.add({ title: '启动笔记生成失败', color: 'error' })
    }
  }

  async function handleRegenerateNotes() {
    if (!showNotesRecordingId.value) return
    try {
      await generateNotes(showNotesRecordingId.value)
      toast.add({ title: 'AI笔记重新生成中', color: 'success' })
      notesData.value = { status: 'processing' }
      pollNotes(showNotesRecordingId.value)
    }
    catch {
      toast.add({ title: '重新生成失败', color: 'error' })
    }
  }

  function cleanup() {
    if (notesPollingTimer.value) {
      clearTimeout(notesPollingTimer.value)
      notesPollingTimer.value = null
    }
  }

  return {
    showNotesModal,
    notesLoading,
    notesTitle,
    notesData,
    showNotesRecordingId,
    parsedKeywords,
    parsedOutline,
    parsedKeyPoints,
    parsedQuiz,
    viewNotes,
    handleGenerateNotes,
    handleRegenerateNotes,
    cleanup,
  }
}
