import type { Notification, SendNotificationPayload } from '~/types/notification'

export function useNotificationSend() {
  const { fetchNotifications, markAsRead, deleteNotification, sendToOne, sendToMany, sendGlobal } = useNotifications()

  const activeTab = ref('list')
  const notifications = ref<Notification[]>([])
  const loading = ref(true)

  // Send form state
  const sendType = ref<'one' | 'many' | 'global'>('one')
  const title = ref('')
  const content = ref('')
  const receiverId = ref<number | undefined>()
  const receiverIdsText = ref('')
  const sending = ref(false)
  const sendSuccess = ref(false)

  const sendTypeOptions = [
    { label: '单发', value: 'one' },
    { label: '群发', value: 'many' },
    { label: '广播', value: 'global' },
  ]

  async function load() {
    loading.value = true
    try {
      notifications.value = await fetchNotifications()
    }
    catch {
      // silent
    }
    finally {
      loading.value = false
    }
  }

  async function handleMarkRead(id: number) {
    await markAsRead(id)
    const item = notifications.value.find(n => n.id === id)
    if (item) item.status = 1
  }

  async function handleDelete(id: number) {
    await deleteNotification(id)
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  async function handleSend() {
    if (!content.value.trim()) return
    sending.value = true
    sendSuccess.value = false
    try {
      const payload: SendNotificationPayload = { title: title.value || undefined, content: content.value }
      if (sendType.value === 'one') {
        payload.receiverId = receiverId.value
        await sendToOne(payload)
      }
      else if (sendType.value === 'many') {
        payload.receiverIds = receiverIdsText.value.split(',').map(s => Number(s.trim())).filter(Boolean)
        await sendToMany(payload)
      }
      else {
        await sendGlobal(payload)
      }
      sendSuccess.value = true
      title.value = ''
      content.value = ''
      receiverId.value = undefined
      receiverIdsText.value = ''
    }
    catch {
      // silent
    }
    finally {
      sending.value = false
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  onMounted(load)

  return {
    activeTab,
    notifications,
    loading,
    sendType,
    title,
    content,
    receiverId,
    receiverIdsText,
    sending,
    sendSuccess,
    sendTypeOptions,
    load,
    handleMarkRead,
    handleDelete,
    handleSend,
    formatTime,
  }
}
