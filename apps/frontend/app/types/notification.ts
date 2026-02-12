export interface Notification {
  id: number
  title?: string
  content: string
  level: number
  sender_id?: number
  sender_username?: string
  receiver_id?: number
  status: 0 | 1 | 2
  create_time: string
}

export interface NotificationListResponse {
  code: number
  message: string
  data: {
    total: number
    pageIndex: number
    pageSize: number
    list: Notification[]
  }
}

export interface NotificationCountResponse {
  code: number
  message: string
  data: { count: number }
}

export interface SendNotificationPayload {
  title?: string
  content: string
  receiverId?: number
  receiverIds?: number[]
}
