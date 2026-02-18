export function useMediaStream(cameraLayout: Ref<{ x: number; y: number; width: number; height: number }>) {
  const toast = useToast()

  const screenStreamRaw = ref<MediaStream | null>(null)
  const userStreamRaw = ref<MediaStream | null>(null)
  const previewStream = ref<MediaStream | null>(null)
  const previewVideo = ref<HTMLVideoElement | null>(null)
  const cameraOverlayVideo = ref<HTMLVideoElement | null>(null)
  const recordingSource = ref<'camera' | 'screen' | 'both'>('screen')

  let mixAnimationId: number | null = null

  // 摄像头叠加层 video srcObject 同步
  watch([cameraOverlayVideo, userStreamRaw], ([el, stream]) => {
    if (el) el.srcObject = stream || null
  })

  // Canvas 混合 (双路录制)
  function startCanvasMixing(screenStream: MediaStream, cameraStream: MediaStream): MediaStream {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const settings = screenStream.getVideoTracks()[0]?.getSettings()
    canvas.width = settings?.width || 1920
    canvas.height = settings?.height || 1080

    const screenVideo = document.createElement('video')
    screenVideo.srcObject = screenStream
    screenVideo.muted = true
    screenVideo.play()

    const cameraVideo = document.createElement('video')
    cameraVideo.srcObject = cameraStream
    cameraVideo.muted = true
    cameraVideo.play()

    function draw() {
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)
      if (cameraStream.active) {
        const cw = (cameraLayout.value.width / 100) * canvas.width
        const ch = (cameraLayout.value.height / 100) * canvas.height
        const cx = (cameraLayout.value.x / 100) * canvas.width
        const cy = (cameraLayout.value.y / 100) * canvas.height
        ctx.shadowBlur = 15
        ctx.shadowColor = 'rgba(0,0,0,0.5)'
        ctx.drawImage(cameraVideo, cx, cy, cw, ch)
        ctx.shadowBlur = 0
      }
      mixAnimationId = requestAnimationFrame(draw)
    }
    draw()
    return canvas.captureStream(30)
  }

  // 音频混合
  async function mixAudio(screenStream: MediaStream, micStream: MediaStream): Promise<MediaStreamTrack[]> {
    const hasScreenAudio = screenStream.getAudioTracks().length > 0
    const hasMicAudio = micStream.getAudioTracks().length > 0
    if (hasScreenAudio && hasMicAudio) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        const audioCtx = new AudioCtx()
        const dest = audioCtx.createMediaStreamDestination()
        audioCtx.createMediaStreamSource(screenStream).connect(dest)
        audioCtx.createMediaStreamSource(micStream).connect(dest)
        return dest.stream.getAudioTracks()
      } catch { /* fallback */ }
    }
    if (hasMicAudio) return micStream.getAudioTracks()
    if (hasScreenAudio) return screenStream.getAudioTracks()
    return []
  }

  // 获取媒体流
  async function getMediaStream(): Promise<MediaStream> {
    const micConstraints = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }

    switch (recordingSource.value) {
      case 'camera': {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
          ...micConstraints,
        })
        userStreamRaw.value = camStream
        return camStream
      }
      case 'screen': {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
          audio: true,
        })
        screenStreamRaw.value = screenStream
        try {
          const micStream = await navigator.mediaDevices.getUserMedia(micConstraints)
          userStreamRaw.value = micStream
          const mixed = await mixAudio(screenStream, micStream)
          return new MediaStream([...screenStream.getVideoTracks(), ...mixed])
        } catch {
          return screenStream
        }
      }
      case 'both': {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: true,
        })
        screenStreamRaw.value = displayStream
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          ...micConstraints,
        })
        userStreamRaw.value = cameraStream
        const mixedAudio = await mixAudio(displayStream, cameraStream)
        const mixedCanvas = startCanvasMixing(displayStream, cameraStream)
        return new MediaStream([...mixedCanvas.getVideoTracks(), ...mixedAudio])
      }
    }
  }

  // 预览
  async function preparePreview() {
    try {
      cleanupStreams()
      const stream = await getMediaStream()
      previewStream.value = stream
      if (previewVideo.value) {
        previewVideo.value.srcObject = stream
        previewVideo.value.muted = true
      }
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        toast.add({ title: '预览失败: ' + (err.message || '未知错误'), color: 'error' })
      }
    }
  }

  function cleanupStreams() {
    if (mixAnimationId) { cancelAnimationFrame(mixAnimationId); mixAnimationId = null }
    if (previewStream.value) { previewStream.value.getTracks().forEach(t => t.stop()); previewStream.value = null }
    if (screenStreamRaw.value) { screenStreamRaw.value.getTracks().forEach(t => t.stop()); screenStreamRaw.value = null }
    if (userStreamRaw.value) { userStreamRaw.value.getTracks().forEach(t => t.stop()); userStreamRaw.value = null }
    if (previewVideo.value) previewVideo.value.srcObject = null
  }

  return {
    screenStreamRaw,
    userStreamRaw,
    previewStream,
    previewVideo,
    cameraOverlayVideo,
    recordingSource,
    getMediaStream,
    preparePreview,
    cleanupStreams,
  }
}
