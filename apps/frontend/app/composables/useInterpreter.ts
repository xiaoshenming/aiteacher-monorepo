interface TranscriptItem {
  id: string
  text: string
  corrected: string
  translation: string
  timestamp: number
  isFinal: boolean
  cutReason?: string
}

export function useInterpreter() {
  const { apiFetch } = useApi()

  const isRecording = ref(false)
  const isConnected = ref(false)
  const transcripts = ref<TranscriptItem[]>([])
  const translations = ref<Map<string, string>>(new Map())
  const currentText = ref('')

  let ws: WebSocket | null = null
  let audioContext: AudioContext | null = null
  let mediaStream: MediaStream | null = null
  let processor: ScriptProcessorNode | null = null

  // 配置
  const language = ref('zh')
  const translationMode = ref('zh2en')
  const enableCorrection = ref(true)

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
      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        isConnected.value = true

        // 发送配置消息（后端协议要求）
        ws!.send(JSON.stringify({
          type: 'config',
          language: language.value,
          mode: translationMode.value,
          enable_correction: enableCorrection.value,
        }))

        resolve()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'result') {
            // 后端返回格式: { type: "result", original, corrected, translation, is_final, cut_reason }
            const text = data.corrected || data.original || data.text || ''

            if (text && data.is_final) {
              const item: TranscriptItem = {
                id: crypto.randomUUID(),
                text: data.original || text,
                corrected: data.corrected || text,
                translation: data.translation || '',
                timestamp: Date.now(),
                isFinal: true,
                cutReason: data.cut_reason,
              }
              transcripts.value.push(item)
              if (data.translation) {
                translations.value.set(item.id, data.translation)
              }
              currentText.value = ''
            }
            else if (text) {
              // 中间结果，更新当前文本
              currentText.value = text
            }
          }
          else if (data.error) {
            console.error('ASR error:', data.error)
          }
        }
        catch {
          // 非 JSON 消息忽略
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

      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
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
            int16[i] = Math.max(-32768, Math.min(32767, Math.round(float32[i]! * 32767)))
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
    // 发送结束标记（后端协议要求）
    if (ws?.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'end' }))
      }
      catch { /* ignore */ }
    }

    processor?.disconnect()
    processor = null
    mediaStream?.getTracks().forEach(t => t.stop())
    mediaStream = null
    audioContext?.close()
    audioContext = null

    // 延迟关闭 WebSocket，让 end 消息有时间发送
    const wsRef = ws
    ws = null
    if (wsRef) {
      setTimeout(() => {
        try { wsRef.close() } catch { /* ignore */ }
      }, 500)
    }

    isRecording.value = false
    isConnected.value = false
    currentText.value = ''
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
    currentText: readonly(currentText),
    language,
    translationMode,
    enableCorrection,
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
