export interface AuthRequest {
  id: number
  teacher_id: number
  teacher_uid: number
  school_id: number
  request_message: string
  status: number // 0=待审核, 1=已通过, 2=已拒绝, 3=已过期, 4=已删除
  admin_id: number | null
  created_at: string
  expires_at: string
  updated_at: string | null
  username?: string
}

export interface AuthRequestsResponse {
  code: number
  message: string
  data: {
    total: number
    pageIndex: number
    pageSize: number
    requests: AuthRequest[]
  }
}
