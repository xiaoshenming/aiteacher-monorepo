import type { NotificationListResponse, NotificationCountResponse, SendNotificationPayload } from '~/types/notification'

export function useNotifications() {
  const { apiFetch } = useApi()

  async function fetchNotifications(page = 1, pageSize = 50) {
    const res = await apiFetch<NotificationListResponse>('notifications', {
      params: { pageIndex: page, pageSize },
    })
    return res.data.list
  }

  async function markAsRead(id: number) {
    return await apiFetch(`notifications/${id}/read`, { method: 'PUT' })
  }

  async function deleteNotification(id: number) {
    return await apiFetch(`notifications/${id}`, { method: 'DELETE' })
  }

  async function fetchCount() {
    const res = await apiFetch<NotificationCountResponse>('notifications/count')
    return res.data
  }

  async function sendToOne(payload: SendNotificationPayload) {
    return await apiFetch('notifications/sendToOne', { method: 'POST', body: payload })
  }

  async function sendToMany(payload: SendNotificationPayload) {
    return await apiFetch('notifications/sendToMany', { method: 'POST', body: payload })
  }

  async function sendGlobal(payload: SendNotificationPayload) {
    return await apiFetch('notifications/sendGlobal', { method: 'POST', body: payload })
  }

  return {
    fetchNotifications,
    markAsRead,
    deleteNotification,
    fetchCount,
    sendToOne,
    sendToMany,
    sendGlobal,
  }
}
