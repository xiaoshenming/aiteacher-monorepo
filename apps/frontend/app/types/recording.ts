export interface Recording {
  id: string
  title: string
  course_id?: number
  lesson_plan_id?: number
  start_time: string
  end_time?: string
  duration?: number
  video_mime_type?: string
  audio_mime_type?: string
  audio_path?: string
  file_size?: number
  sync_status: 'pending' | 'uploading' | 'synced' | 'failed'
  cloud_video_url?: string
  cloud_filename?: string
  created_at: string
  updated_at?: string
}

export interface TranscriptSegment {
  start: number
  end: number
  text: string
  speaker?: string
}
