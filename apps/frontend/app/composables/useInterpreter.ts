interface TranscriptItem {
  id: string
  text: string
  translation: string
  timestamp: number
}

export function useInterpreter() {
  const { apiFetch } = useApi()

  const isRecording = ref(false)
  const isConnected = ref(false)
  const transcripts = ref<TranscriptItem[]>([])
  const translations = ref<Map<string, string>>(new Map())

  let ws: WebSocket | null = null
  let audioContext: AudioContext | null = null
  let mediaStream: MediaStream | null = null
  let processor: ScriptProcessorNode | null = null

  function getWsUrl() {
    const host = window.location.hostname || 'localhost'
    return `ws://${host}:10005/stream/sensevoice/translation`
  }

  function connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      ws = new WebSocket(getWsUrl())

      ws.onopen = () => {
        isConnected.value = true
        resolve()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.text) {
            const item: TranscriptItem = {
              id: crypto.randomUUID(),
              text: data.text,
              translation: data.translation || '',
              timestamp: Date.now(),
            }
            transcripts.value.push(item)
            if (data.translation) {
              translations.value.set(item.id, data.translation)
            }
          }
        }
        catch {
          // WebSocket 错误处理
        }
      }

      ws.onclose = () => {
        isConnected.value = false
      }

      ws.onerror = () => {
        isConnected.value = false
        reject(new Error('WebSocket connection failed'))
      }
    })
  }

  async function startRecording() {
    try {
      await connectWebSocket()

      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContext = new AudioContext({ sampleRate: 16000 })
      const source = audioContext.createMediaStreamSource(mediaStream)
      processor = audioContext.createScriptProcessor(4096, 1, 1)

      source.connect(processor)
      processor.connect(audioContext.destination)

      processor.onaudioprocess = (e) => {
        if (ws?.readyState === WebSocket.OPEN) {
          const float32 = e.inputBuffer.getChannelData(0)
          const int16 = new Int16Array(float32.length)
          for (let i = 0; i < float32.length; i++) {
            int16[i] = Math.max(-32768, Math.min(32767, Math.round(float32[i] * 32767)))
          }
          ws.send(int16.buffer)
        }
      }

      isRecording.value = true
    }
    catch (err) {
      console.error('Failed to start recording:', err)
      stopRecording()
    }
  }

  function stopRecording() {
    processor?.disconnect()
    processor = null
    mediaStream?.getTracks().forEach(t => t.stop())
    mediaStream = null
    audioContext?.close()
    audioContext = null
    ws?.close()
    ws = null
    isRecording.value = false
    isConnected.value = false
  }

  async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const res = await apiFetch<{ code: number, data: { result: string } }>('ai/translate', {
      method: 'POST',
      body: { text, sourceLang, targetLang },
    })
    return res.data?.result || ''
  }

  async function generateSummary(): Promise<string> {
    const allText = transcripts.value.map(t => t.text).join('\n')
    const res = await apiFetch<{ code: number, data: { summary: string } }>('ai/meeting-summary', {
      method: 'POST',
      body: { content: allText },
    })
    return res.data?.summary || ''
  }

  function clearTranscripts() {
    transcripts.value = []
    translations.value = new Map()
  }

  function updateTranslation(id: string, text: string) {
    translations.value.set(id, text)
  }

  function getTranslation(id: string): string | undefined {
    return translations.value.get(id)
  }

  function cleanup() {
    stopRecording()
    clearTranscripts()
  }

  return {
    isRecording: readonly(isRecording),
    isConnected: readonly(isConnected),
    transcripts: readonly(transcripts),
    translations: readonly(translations),
    startRecording,
    stopRecording,
    translateText,
    generateSummary,
    updateTranslation,
    getTranslation,
    clearTranscripts,
    cleanup,
  }
}
