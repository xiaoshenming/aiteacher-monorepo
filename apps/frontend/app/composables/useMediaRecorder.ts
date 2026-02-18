export function useMediaRecorder() {
  const toast = useToast()
  const { createRecording, completeRecording, uploadAudio } = useRecordings()

  const isRecording = ref(false)
  const isPaused = ref(false)
  const recordingId = ref<string | null>(null)
  const recordingTitle = ref('')
  const recordingDuration = ref(0)

  let mediaRecorder: MediaRecorder | null = null
  let recordedChunks: Blob[] = []
  let recordingStream: MediaStream | null = null
  let durationTimer: ReturnType<typeof setInterval> | null = null

  async function handleRecordingStopped(onComplete: () => void) {
    if (!recordingId.value || recordedChunks.length === 0) return

    const blob = new Blob(recordedChunks, { type: 'video/webm' })
    const duration = recordingDuration.value
    const id = recordingId.value

    toast.add({ title: '录制完成，正在上传...', color: 'info' })

    try {
      await completeRecording(id, {
        duration,
        file_size: blob.size,
        video_mime_type: 'video/webm',
      })
      await uploadAudio(id, blob, `${id}.webm`)
      toast.add({ title: '录制已保存并上传', color: 'success' })
    }
    catch {
      toast.add({ title: '上传失败，正在下载到本地...', color: 'warning' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${recordingTitle.value || 'recording'}.webm`
      a.click()
      URL.revokeObjectURL(url)
    }
    finally {
      recordingId.value = null
      recordedChunks = []
      onComplete()
    }
  }

  async function startRecording(
    title: string,
    getStream: () => Promise<MediaStream>,
    existingStream: MediaStream | null,
    cleanupStreams: () => void,
    onComplete: () => void,
  ) {
    try {
      let combinedStream: MediaStream
      if (existingStream) {
        combinedStream = existingStream
      } else {
        combinedStream = await getStream()
      }

      const id = await createRecording({ title })
      recordingId.value = id
      recordingTitle.value = title
      recordingStream = combinedStream

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm'
      mediaRecorder = new MediaRecorder(combinedStream, { mimeType })
      recordedChunks = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        handleRecordingStopped(onComplete)
      }

      // 屏幕共享停止时自动结束录制
      const videoTrack = combinedStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          if (isRecording.value) stopRecording(cleanupStreams)
        })
      }

      mediaRecorder.start(1000)
      isRecording.value = true
      isPaused.value = false
      recordingDuration.value = 0
      durationTimer = setInterval(() => {
        if (!isPaused.value) recordingDuration.value++
      }, 1000)

      toast.add({ title: '录制已开始', color: 'success' })
      return true
    }
    catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        toast.add({ title: '启动录制失败: ' + (err.message || '未知错误'), color: 'error' })
      }
      return false
    }
  }

  function togglePause() {
    if (!mediaRecorder) return
    if (isPaused.value) {
      mediaRecorder.resume()
      isPaused.value = false
    } else {
      mediaRecorder.pause()
      isPaused.value = true
    }
  }

  function stopRecording(cleanupStreams: () => void) {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    if (durationTimer) {
      clearInterval(durationTimer)
      durationTimer = null
    }
    if (recordingStream) {
      recordingStream.getTracks().forEach(t => t.stop())
      recordingStream = null
    }
    cleanupStreams()
    isRecording.value = false
    isPaused.value = false
  }

  return {
    isRecording,
    isPaused,
    recordingId,
    recordingTitle,
    recordingDuration,
    startRecording,
    togglePause,
    stopRecording,
  }
}
