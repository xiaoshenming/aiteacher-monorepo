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

export interface AINote {
  status: string
  summary?: string
  keywords?: string | string[]
  content?: {
    outline?: string | string[]
    keypoints?: string[]
    key_points?: string[]
    quizzes?: Array<{ question: string; options: string[]; answer: string }>
    quiz?: Array<{ question: string; options: string[]; answer: string }>
    homework?: string[]
  }
  error_message?: string
  processing_duration?: number
}

export interface Transcript {
  id: string
  status: string
  text?: string
  segments?: TranscriptSegment[]
  error_message?: string
  processing_duration?: number
  created_at?: string
  completed_at?: string
}
