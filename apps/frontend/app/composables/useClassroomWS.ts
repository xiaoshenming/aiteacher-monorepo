export function useClassroomWS() {
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)
  const messages = ref<any[]>([])
  const lastMessage = ref<any>(null)

  function connect(token: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname + ':10001'
    ws.value = new WebSocket(`${protocol}//${host}/api/classroom-ws?token=${token}`)

    ws.value.onopen = () => {
      connected.value = true
    }

    ws.value.onclose = () => {
      connected.value = false
    }

    ws.value.onerror = () => {
      connected.value = false
    }

    ws.value.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        lastMessage.value = data
        messages.value.push(data)
      }
      catch (e) {
        console.error('WS parse error:', e)
      }
    }
  }

  function send(type: string, data: Record<string, any> = {}) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type, ...data }))
    }
  }

  function disconnect() {
    ws.value?.close()
    ws.value = null
    connected.value = false
  }

  function clearMessages() {
    messages.value = []
    lastMessage.value = null
  }

  onUnmounted(() => disconnect())

  return {
    ws, connected, messages, lastMessage,
    connect, send, disconnect, clearMessages,
  }
}
