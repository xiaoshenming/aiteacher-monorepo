// Analytics API 响应类型

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 备课统计
export interface PrepareStats {
  total_sessions: number
  total_minutes: number
  total_generates: number
  avg_minutes_per_session?: number
  active_days?: number
}

// AI 使用统计
export interface AIUsageDetail {
  model_name: string
  function_name: string
  total_calls: number
  total_tokens: number
  date: string
}

export interface AIUsageSummary {
  total_calls: number
  total_tokens: number
  most_used_model: string
  most_used_function: string
}

export interface AIUsageStats {
  details: AIUsageDetail[]
  summary: AIUsageSummary
}

// 学习统计
export interface LearningStats {
  total_courses: number
  completed_courses: number
  total_study_hours: number
  avg_score: number
  weak_points?: string[]
}

// 综合看板
export interface DashboardData {
  prepare: PrepareStats
  ai: {
    total_calls: number
    total_tokens: number
  }
  learning?: LearningStats
}

// 智能推荐
export interface Recommendation {
  id: string
  title: string
  type: string
  match_score: number
  description?: string
}

// 热门功能
export interface PopularFunction {
  function_name: string
  display_name: string
  total_calls: number
  unique_users: number
}

// 日期范围
export interface DateRange {
  startDate: string
  endDate: string
}
