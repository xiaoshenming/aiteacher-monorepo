export interface Course {
  id: number
  name: string
  description?: string
  teacher_id: number
  teacher_name?: string
  created_at: string
  updated_at?: string
  class_count?: number
  student_count?: number
}

export interface ClassInfo {
  id: number
  name: string
  course_id?: number
  course_name?: string
  student_count?: number
  created_at: string
}

export interface Student {
  id: number
  username: string
  name?: string
  email?: string
  avatar?: string
  phone?: string
}

export interface Assistant {
  id: number
  username: string
  name?: string
  email?: string
}

export interface CourseSchedule {
  id: number
  name: string
  schedule_data: ScheduleCell[][]
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface ScheduleCell {
  course_name: string
  teacher?: string
  room?: string
}
