interface SSECallbacks {
  onMessage: (chunk: string) => void
  onDone: () => void
  onError: (error: string) => void
}

interface SSEOptions {
  url: string
  body: Record<string, unknown>
  callbacks: SSECallbacks
  signal?: AbortSignal
}

/**
 * SSE 流式请求封装
 * 使用原生 fetch + ReadableStream 解析后端 SSE 事件流
 */
export function useSSE() {
  const config = useRuntimeConfig()
  const userStore = useUserStore()

  const isStreaming = ref(false)
  const error = ref<string | null>(null)
  let abortController: AbortController | null = null

  function buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'deviceType': 'pc',
    }
    if (userStore.token) {
      headers.Authorization = `Bearer ${userStore.token}`
    }
    return headers
  }

  function parseSSEEvents(raw: string): Array<{ event: string, data: string }> {
    const events: Array<{ event: string, data: string }> = []
    const blocks = raw.split('\n\n')

    for (const block of blocks) {
      if (!block.trim()) continue

      let eventType = 'message'
      let dataStr = ''

      const lines = block.split('\n')
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim()
        }
        else if (line.startsWith('data: ')) {
          dataStr = line.slice(6).trim()
        }
      }

      if (dataStr) {
        events.push({ event: eventType, data: dataStr })
      }
    }

    return events
  }

  async function stream(options: SSEOptions): Promise<void> {
    const { url, body, callbacks } = options

    abortController = new AbortController()
    const signal = options.signal
      ? AbortSignal.any([options.signal, abortController.signal])
      : abortController.signal

    isStreaming.value = true
    error.value = null

    try {
      const response = await fetch(`${config.public.apiBase}${url}`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(body),
        signal,
      })

      if (!response.ok) {
        if (response.status === 401) {
          userStore.logout()
          navigateTo('/login')
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('响应体不可读')
      }

      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // 按双换行分割完整的 SSE 事件块
        const lastDoubleNewline = buffer.lastIndexOf('\n\n')
        if (lastDoubleNewline === -1) continue

        const complete = buffer.slice(0, lastDoubleNewline + 2)
        buffer = buffer.slice(lastDoubleNewline + 2)

        const events = parseSSEEvents(complete)
        for (const evt of events) {
          try {
            const parsed = JSON.parse(evt.data)

            if (evt.event === 'message') {
              const chunk = parsed?.data?.chunk
              if (chunk) {
                callbacks.onMessage(chunk)
              }
            }
            else if (evt.event === 'done') {
              callbacks.onDone()
            }
            else if (evt.event === 'error') {
              const msg = parsed?.message || '未知错误'
              error.value = msg
              callbacks.onError(msg)
            }
          }
          catch {
            // JSON 解析失败，跳过该事件
          }
        }
      }

      // 处理缓冲区中剩余的数据
      if (buffer.trim()) {
        const events = parseSSEEvents(buffer)
        for (const evt of events) {
          try {
            const parsed = JSON.parse(evt.data)
            if (evt.event === 'done') {
              callbacks.onDone()
            }
            else if (evt.event === 'message') {
              const chunk = parsed?.data?.chunk
              if (chunk) {
                callbacks.onMessage(chunk)
              }
            }
          }
          catch {
            // 忽略解析错误
          }
        }
      }
    }
    catch (err) {
      if ((err as Error).name === 'AbortError') {
        // 用户主动取消，不视为错误
        return
      }
      const msg = (err as Error).message || '网络请求失败'
      error.value = msg
      callbacks.onError(msg)
    }
    finally {
      isStreaming.value = false
      abortController = null
    }
  }

  function abort(): void {
    abortController?.abort()
  }

  return {
    isStreaming: readonly(isStreaming),
    error: readonly(error),
    stream,
    abort,
  }
}
