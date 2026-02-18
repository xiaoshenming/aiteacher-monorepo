import type { Recording } from '~/types/recording'

export function useRecordingFormat() {
  function formatDuration(seconds?: number): string {
    if (!seconds) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function formatTimestamp(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function getMediaUrl(recording: Recording): string | null {
    if (recording.audio_path) {
      const filename = recording.audio_path.split('/').pop()
      if (filename) {
        const config = useRuntimeConfig()
        const base = (config.public.apiCloud as string).replace(/\/$/, '')
        return `${base}/recording/file/${filename}`
      }
    }
    return recording.cloud_video_url || null
  }

  return { formatDuration, formatDate, formatTimestamp, formatFileSize, getMediaUrl }
}
