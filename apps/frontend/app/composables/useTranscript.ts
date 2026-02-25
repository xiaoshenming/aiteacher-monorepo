import type { Recording, TranscriptSegment } from '~/types/recording'

const showTranscriptModal = ref(false)
const transcriptSegments = ref<TranscriptSegment[]>([])
const transcriptFullText = ref('')
const transcriptLoading = ref(false)
const transcriptTitle = ref('')
const transcriptStatus = ref('')

export function useTranscript() {
  const { getTranscript } = useRecordings()
  const toast = useToast()

  async function viewTranscript(recording: Recording) {
    transcriptTitle.value = recording.title
    transcriptSegments.value = []
    transcriptFullText.value = ''
    transcriptStatus.value = ''
    showTranscriptModal.value = true
    transcriptLoading.value = true
    try {
      const data = await getTranscript(recording.id)
      transcriptStatus.value = data.status
      if (data.segments) {
        transcriptSegments.value = Array.isArray(data.segments) ? data.segments : []
      }
      transcriptFullText.value = data.text || ''
    }
    catch {
      toast.add({ title: '获取转录内容失败', color: 'error' })
      showTranscriptModal.value = false
    }
    finally {
      transcriptLoading.value = false
    }
  }

  return {
    showTranscriptModal,
    transcriptSegments,
    transcriptFullText,
    transcriptLoading,
    transcriptTitle,
    transcriptStatus,
    viewTranscript,
  }
}
