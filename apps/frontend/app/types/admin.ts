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

export interface AiTrendItem {
  date: string
  calls: number
  tokens: number
}

export interface AiByFunction {
  name: string
  value: number
}

export interface AiByModel {
  name: string
  calls: number
  tokens: number
}

export interface RecentUser {
  id: number
  username: string
  role: string
  schoolName?: string
  avatar?: string
}

export interface SchoolStat {
  schoolName: string
  userCount: number
}

export interface RoleStat {
  role: string
  count: number
}

export interface ExtendedStats {
  aiTrend: AiTrendItem[]
  recentUsers: RecentUser[]
  aiByFunction: AiByFunction[]
  aiByModel: AiByModel[]
  totalAiCalls: number
  totalTokens: number
  schoolStats: SchoolStat[]
  roleStats: RoleStat[]
}

export interface MonitorCpu {
  usage: number
  cores: number
  model: string
  loadAvg: number[]
}

export interface MonitorMemory {
  total: number
  used: number
  free: number
  usage: number
}

export interface MonitorDisk {
  total: string
  used: string
  available: string
  usage: number
}

export interface MonitorSystem {
  platform: string
  arch: string
  hostname: string
  uptime: number
  nodeVersion: string
  processUptime: number
  processMemory: { rss: number; heapUsed: number; heapTotal: number }
}

export interface MonitorSystemData {
  cpu: MonitorCpu
  memory: MonitorMemory
  disk: MonitorDisk
  system: MonitorSystem
}

export interface MonitorService {
  name: string
  status: 'online' | 'offline'
  message: string
}

export interface MonitorStats {
  totalUsers: number
  todayActive: number
  totalCourses: number
  aiCalls: number
}
