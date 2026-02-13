import type { Recording, TranscriptSegment, Transcript, AINote } from '~/types/recording'

interface PaginatedData<T> {
  total: number
  page: number
  limit: number
  list: T[]
}

interface ListResponse<T> {
  code: number
  message: string
  data: PaginatedData<T>
}

interface DetailResponse<T> {
  code: number
  message: string
  data: T
}

interface CreateResponse {
  code: number
  message: string
  data: { recording_id: string }
}

interface MutationResponse {
  code: number
  message: string
  data: null
}

export function useRecordings() {
  const { cloudFetch } = useApi()

  async function fetchRecordings() {
    const res = await cloudFetch<ListResponse<Recording>>('/recording/list')
    return res.data.list
  }

  async function createRecording(data: { title: string }) {
    const res = await cloudFetch<CreateResponse>('/recording/create', {
      method: 'POST',
      body: data,
    })
    return res.data.recording_id
  }

  async function completeRecording(id: string, data: { duration: number; file_size?: number; video_mime_type?: string; audio_mime_type?: string }) {
    return cloudFetch<MutationResponse>(`/recording/${id}/complete`, {
      method: 'PUT',
      body: data,
    })
  }

  async function uploadAudio(id: string, file: Blob, filename: string) {
    const formData = new FormData()
    formData.append('audio', file, filename)
    return cloudFetch<DetailResponse<{ audio_path: string; filename: string; size: number }>>(`/recording/${id}/upload-audio`, {
      method: 'POST',
      body: formData,
    })
  }

  async function deleteRecording(id: string) {
    return cloudFetch<MutationResponse>(`/recording/${id}`, {
      method: 'DELETE',
    })
  }

  async function startTranscribe(id: string) {
    return cloudFetch<MutationResponse>(`/recording/${id}/transcribe`, {
      method: 'POST',
    })
  }

  async function getTranscript(id: string) {
    const res = await cloudFetch<DetailResponse<Transcript>>(`/recording/${id}/transcript`)
    return res.data
  }

  async function getTranscriptStatus(id: string) {
    const res = await cloudFetch<DetailResponse<{ status: string }>>(`/recording/${id}/transcript/status`)
    return res.data
  }

  async function getNotes(id: string) {
    const res = await cloudFetch<{ code: number; message: string; data: AINote }>(`/recording/${id}/notes`)
    return { code: res.code, message: res.message, data: res.data }
  }

  async function generateNotes(id: string) {
    return cloudFetch<DetailResponse<{ note_id: string; status: string }>>(`/recording/${id}/generate-notes`, {
      method: 'POST',
    })
  }

  return {
    fetchRecordings,
    createRecording,
    completeRecording,
    uploadAudio,
    deleteRecording,
    startTranscribe,
    getTranscript,
    getTranscriptStatus,
    getNotes,
    generateNotes,
  }
}
