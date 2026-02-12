export interface ServiceHealth {
  name: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  latency?: number
  message?: string
}

export interface SystemHealth {
  services: ServiceHealth[]
  timestamp: string
}

export interface SystemStats {
  totalUsers: number
  totalTeachers: number
  totalStudents: number
  totalCourses: number
  totalLessonPlans: number
  totalFiles: number
  totalRecordings: number
  todayActiveUsers: number
}

export interface AdminUser {
  id: number
  username: string
  name?: string
  email?: string
  role: number
  school?: string
  status: number
  created_at: string
}

export interface AuthRequest {
  id: number
  user_id: number
  username: string
  name?: string
  school?: string
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
