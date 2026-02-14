<script setup lang="ts">
import type { Recording, TranscriptSegment, AINote } from '~/types/recording'

const toast = useToast()
const { fetchRecordings, deleteRecording, startTranscribe, createRecording, completeRecording, uploadAudio, getTranscript, getTranscriptStatus, getNotes, generateNotes } = useRecordings()

const search = ref('')
const statusFilter = ref('')
const recordings = ref<Recording[]>([])
const loading = ref(false)

// 录制状态
const isRecording = ref(false)
const isPaused = ref(false)
const recordingId = ref<string | null>(null)
const recordingTitle = ref('')
const recordingDuration = ref(0)
const showStartModal = ref(false)
const newTitle = ref('')
const starting = ref(false)
const recordingSource = ref<'camera' | 'screen' | 'both'>('screen')

let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []
let recordingStream: MediaStream | null = null
let durationTimer: ReturnType<typeof setInterval> | null = null

// 双路录制：原始流引用
const screenStreamRaw = ref<MediaStream | null>(null)
const userStreamRaw = ref<MediaStream | null>(null)
let mixAnimationId: number | null = null

// 摄像头布局状态 (百分比)
const cameraLayout = ref({ x: 75, y: 75, width: 20, height: 20 })
const previewContainer = ref<HTMLDivElement | null>(null)
const previewVideo = ref<HTMLVideoElement | null>(null)
const cameraOverlayVideo = ref<HTMLVideoElement | null>(null)
const previewStream = ref<MediaStream | null>(null)

// 拖拽控制
const isDragging = ref(false)
const isResizing = ref(false)
let dragStartX = 0
let dragStartY = 0
let startLayout = { x: 0, y: 0, width: 0, height: 0 }

// 摄像头叠加层 video srcObject 同步
watch([cameraOverlayVideo, userStreamRaw], ([el, stream]) => {
  if (el) el.srcObject = stream || null
})

const cameraStyle = computed(() => ({
  left: `${cameraLayout.value.x}%`,
  top: `${cameraLayout.value.y}%`,
  width: `${cameraLayout.value.width}%`,
  height: `${cameraLayout.value.height}%`,
  position: 'absolute' as const,
  border: '2px solid var(--ui-primary)',
  borderRadius: '6px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  cursor: isDragging.value ? 'grabbing' : 'grab',
  overflow: 'hidden',
  zIndex: 10,
  background: '#000',
}))

function startDragging(e: MouseEvent) {
  isDragging.value = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  startLayout = { ...cameraLayout.value }
  window.addEventListener('mousemove', handleDragging)
  window.addEventListener('mouseup', stopDragging)
}

function handleDragging(e: MouseEvent) {
  if (!isDragging.value || !previewContainer.value) return
  const rect = previewContainer.value.getBoundingClientRect()
  const dx = ((e.clientX - dragStartX) / rect.width) * 100
  const dy = ((e.clientY - dragStartY) / rect.height) * 100
  cameraLayout.value.x = Math.max(0, Math.min(100 - cameraLayout.value.width, startLayout.x + dx))
  cameraLayout.value.y = Math.max(0, Math.min(100 - cameraLayout.value.height, startLayout.y + dy))
}

function stopDragging() {
  isDragging.value = false
  window.removeEventListener('mousemove', handleDragging)
  window.removeEventListener('mouseup', stopDragging)
}

function startResizing(e: MouseEvent) {
  isResizing.value = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  startLayout = { ...cameraLayout.value }
  window.addEventListener('mousemove', handleResizing)
  window.addEventListener('mouseup', stopResizing)
}

function handleResizing(e: MouseEvent) {
  if (!isResizing.value || !previewContainer.value) return
  const rect = previewContainer.value.getBoundingClientRect()
  const dx = ((e.clientX - dragStartX) / rect.width) * 100
  cameraLayout.value.width = Math.max(10, Math.min(50, startLayout.width + dx))
  cameraLayout.value.height = Math.max(10, Math.min(50, startLayout.height + dx))
}

function stopResizing() {
  isResizing.value = false
  window.removeEventListener('mousemove', handleResizing)
  window.removeEventListener('mouseup', stopResizing)
}

// Canvas 混合 (双路录制)
function startCanvasMixing(screenStream: MediaStream, cameraStream: MediaStream): MediaStream {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const settings = screenStream.getVideoTracks()[0].getSettings()
  canvas.width = settings.width || 1920
  canvas.height = settings.height || 1080

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

// 预览（录制前配置画面）
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

// 查看转录
const showTranscriptModal = ref(false)
const transcriptSegments = ref<TranscriptSegment[]>([])
const transcriptFullText = ref('')
const transcriptLoading = ref(false)
const transcriptTitle = ref('')
const transcriptStatus = ref('')

// 视频播放
const showPlayerModal = ref(false)
const playerTitle = ref('')
const playerUrl = ref('')

// AI 笔记
const showNotesModal = ref(false)
const notesLoading = ref(false)
const notesTitle = ref('')
const notesData = ref<AINote | null>(null)
const notesPollingTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const showNotesRecordingId = ref('')

// AI 笔记解析 computed
const parsedKeywords = computed(() => {
  if (!notesData.value?.keywords) return []
  const kw = notesData.value.keywords
  if (Array.isArray(kw)) return kw
  if (typeof kw === 'string') {
    try { return JSON.parse(kw) } catch { return kw.split(',').map(s => s.trim()).filter(Boolean) }
  }
  return []
})

const parsedOutline = computed(() => {
  const content = notesData.value?.content
  if (!content?.outline) return ''
  if (Array.isArray(content.outline)) return content.outline.join('\n\n')
  return content.outline
})

const parsedKeyPoints = computed(() => {
  const content = notesData.value?.content
  if (!content) return []
  return content.keypoints || content.key_points || []
})

const parsedQuiz = computed(() => {
  const content = notesData.value?.content
  if (!content) return []
  return content.quizzes || content.quiz || []
})

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待上传', value: 'pending' },
  { label: '上传中', value: 'uploading' },
  { label: '已同步', value: 'synced' },
  { label: '上传失败', value: 'failed' },
]

const statusLabels: Record<string, string> = {
  pending: '待上传',
  uploading: '上传中',
  synced: '已同步',
  failed: '上传失败',
}

const statusColors: Record<string, string> = {
  pending: 'warning',
  uploading: 'info',
  synced: 'success',
  failed: 'error',
}

const columns = [
  { accessorKey: 'title', header: '标题' },
  { accessorKey: 'duration', header: '时长' },
  { accessorKey: 'file_size', header: '文件大小' },
  { accessorKey: 'sync_status', header: '状态' },
  { accessorKey: 'created_at', header: '创建时间' },
  { accessorKey: 'actions', header: '操作' },
]

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getMediaUrl(recording: Recording): string | null {
  if (recording.audio_path) {
    // audio_path 格式: storage/audio/{id}.webm
    const filename = recording.audio_path.split('/').pop()
    if (filename) {
      const config = useRuntimeConfig()
      const base = (config.public.apiCloud as string).replace(/\/$/, '')
      return `${base}/recording/file/${filename}`
    }
  }
  return recording.cloud_video_url || null
}

const filteredRecordings = computed(() => {
  let list = recordings.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(r => r.title.toLowerCase().includes(q))
  }
  if (statusFilter.value) {
    list = list.filter(r => r.sync_status === statusFilter.value)
  }
  return list
})

async function loadRecordings() {
  loading.value = true
  try {
    recordings.value = await fetchRecordings()
  }
  catch {
    recordings.value = []
  }
  finally {
    loading.value = false
  }
}

async function handleStartRecording() {
  if (!newTitle.value.trim()) return
  starting.value = true
  try {
    // 如果已有预览流，直接使用；否则获取新流
    let combinedStream: MediaStream
    if (previewStream.value) {
      combinedStream = previewStream.value
    } else {
      combinedStream = await getMediaStream()
    }

    // 创建后端记录
    const id = await createRecording({ title: newTitle.value.trim() })
    recordingId.value = id
    recordingTitle.value = newTitle.value.trim()
    recordingStream = combinedStream

    // 初始化 MediaRecorder
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
      handleRecordingStopped()
    }

    // 屏幕共享停止时自动结束录制
    const videoTrack = combinedStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.addEventListener('ended', () => {
        if (isRecording.value) stopRecording()
      })
    }

    mediaRecorder.start(1000)
    isRecording.value = true
    isPaused.value = false
    recordingDuration.value = 0
    durationTimer = setInterval(() => {
      if (!isPaused.value) recordingDuration.value++
    }, 1000)

    showStartModal.value = false
    newTitle.value = ''
    toast.add({ title: '录制已开始', color: 'success' })
  }
  catch (err: any) {
    if (err.name !== 'NotAllowedError') {
      toast.add({ title: '启动录制失败: ' + (err.message || '未知错误'), color: 'error' })
    }
  }
  finally {
    starting.value = false
  }
}

function togglePause() {
  if (!mediaRecorder) return
  if (isPaused.value) {
    mediaRecorder.resume()
    isPaused.value = false
  }
  else {
    mediaRecorder.pause()
    isPaused.value = true
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  if (durationTimer) {
    clearInterval(durationTimer)
    durationTimer = null
  }
  // 停止所有轨道
  if (recordingStream) {
    recordingStream.getTracks().forEach(t => t.stop())
    recordingStream = null
  }
  cleanupStreams()
  isRecording.value = false
  isPaused.value = false
}

async function handleRecordingStopped() {
  if (!recordingId.value || recordedChunks.length === 0) return

  const blob = new Blob(recordedChunks, { type: 'video/webm' })
  const duration = recordingDuration.value
  const id = recordingId.value

  toast.add({ title: '录制完成，正在上传...', color: 'info' })

  try {
    // 完成录制记录
    await completeRecording(id, {
      duration,
      file_size: blob.size,
      video_mime_type: 'video/webm',
    })

    // 上传文件
    await uploadAudio(id, blob, `${id}.webm`)
    toast.add({ title: '录制已保存并上传', color: 'success' })
  }
  catch {
    toast.add({ title: '上传失败，正在下载到本地...', color: 'warning' })
    // 回退：下载到本地
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
    loadRecordings()
  }
}

async function handleDelete(id: string) {
  if (!confirm('确定删除此录制？')) return
  try {
    await deleteRecording(id)
    toast.add({ title: '录制已删除', color: 'success' })
    loadRecordings()
  }
  catch {
    toast.add({ title: '删除失败', color: 'error' })
  }
}

async function handleTranscribe(id: string) {
  try {
    await startTranscribe(id)
    toast.add({ title: '转录任务已提交', color: 'success' })
    loadRecordings()
  }
  catch {
    toast.add({ title: '转录失败', color: 'error' })
  }
}

function handlePlay(recording: Recording) {
  const url = getMediaUrl(recording)
  if (url) {
    playerTitle.value = recording.title
    playerUrl.value = url
    showPlayerModal.value = true
  }
  else {
    toast.add({ title: '暂无可播放的媒体文件', color: 'warning' })
  }
}

async function handleViewTranscript(recording: Recording) {
  transcriptTitle.value = recording.title
  transcriptSegments.value = []
  transcriptFullText.value = ''
  transcriptStatus.value = ''
  showTranscriptModal.value = true
  transcriptLoading.value = true
  try {
    const data = await getTranscript(recording.id)
    transcriptStatus.value = data.status
    if (data.segments) {
      transcriptSegments.value = Array.isArray(data.segments) ? data.segments : []
    }
    transcriptFullText.value = data.text || ''
  }
  catch {
    toast.add({ title: '获取转录内容失败', color: 'error' })
    showTranscriptModal.value = false
  }
  finally {
    transcriptLoading.value = false
  }
}

async function handleViewNotes(recording: Recording) {
  notesTitle.value = recording.title
  notesData.value = null
  showNotesModal.value = true
  notesLoading.value = true
  showNotesRecordingId.value = recording.id
  if (notesPollingTimer.value) {
    clearTimeout(notesPollingTimer.value)
    notesPollingTimer.value = null
  }
  try {
    const res = await getNotes(recording.id)
    notesData.value = res.data
    // If still processing, poll
    if (res.data.status === 'pending' || res.data.status === 'processing' || res.data.status === 'waiting') {
      pollNotes(recording.id)
    }
  }
  catch {
    toast.add({ title: '获取AI笔记失败', color: 'error' })
    showNotesModal.value = false
  }
  finally {
    notesLoading.value = false
  }
}

function pollNotes(id: string) {
  notesPollingTimer.value = setTimeout(async () => {
    if (!showNotesModal.value) return
    try {
      const res = await getNotes(id)
      notesData.value = res.data
      if (res.data.status === 'pending' || res.data.status === 'processing' || res.data.status === 'waiting') {
        pollNotes(id)
      }
    }
    catch { /* ignore polling errors */ }
  }, 5000)
}

async function handleGenerateNotes(recording: Recording) {
  try {
    showNotesRecordingId.value = recording.id
    await generateNotes(recording.id)
    toast.add({ title: 'AI笔记生成任务已启动', color: 'success' })
    // Open notes modal to show progress
    handleViewNotes(recording)
  }
  catch {
    toast.add({ title: '启动笔记生成失败', color: 'error' })
  }
}

async function handleRegenerateNotes() {
  if (!showNotesRecordingId.value) return
  try {
    await generateNotes(showNotesRecordingId.value)
    toast.add({ title: 'AI笔记重新生成中', color: 'success' })
    notesData.value = { status: 'processing' }
    pollNotes(showNotesRecordingId.value)
  }
  catch {
    toast.add({ title: '重新生成失败', color: 'error' })
  }
}

onMounted(loadRecordings)

onBeforeUnmount(() => {
  if (isRecording.value) stopRecording()
  cleanupStreams()
  if (notesPollingTimer.value) {
    clearTimeout(notesPollingTimer.value)
    notesPollingTimer.value = null
  }
})
</script>

<template>
  <div>
    <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="课堂录制">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 p-5 h-full">
        <!-- 录制中状态条 -->
        <div v-if="isRecording" class="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 animate-pulse-subtle">
          <div class="flex items-center gap-3">
            <span class="relative flex size-3">
              <span class="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span class="relative inline-flex size-3 rounded-full bg-red-500" />
            </span>
            <span class="text-sm font-semibold text-red-600 dark:text-red-400">录制中</span>
            <span class="font-mono text-sm font-bold text-red-700 dark:text-red-300 tabular-nums">{{ formatDuration(recordingDuration) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UButton
              :icon="isPaused ? 'i-lucide-play' : 'i-lucide-pause'"
              variant="soft"
              size="sm"
              :label="isPaused ? '继续' : '暂停'"
              @click="togglePause"
            />
            <UButton
              icon="i-lucide-square"
              color="error"
              size="sm"
              label="停止录制"
              @click="stopRecording"
            />
          </div>
        </div>

        <!-- 顶部操作栏 -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-4 text-sm">
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-video" class="text-teal-500" />
              <span class="font-semibold">{{ recordings.length }}</span>
              <span class="text-[var(--ui-text-dimmed)]">录制</span>
            </div>
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-clock" class="text-amber-500" />
              <span class="font-semibold">{{ formatDuration(recordings.reduce((sum, r) => sum + (r.duration || 0), 0)) }}</span>
            </div>
          </div>
          <div class="flex-1" />
          <UInput v-model="search" placeholder="搜索录制..." icon="i-lucide-search" size="sm" class="w-48" />
          <USelectMenu v-model="statusFilter" :items="statusOptions" size="sm" class="w-32" />
          <UButton
            v-if="!isRecording"
            icon="i-lucide-circle"
            color="error"
            size="sm"
            label="开始录制"
            @click="showStartModal = true"
          />
        </div>

        <!-- 录制卡片网格 -->
        <div v-if="filteredRecordings.length" class="flex-1 overflow-y-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            <div
              v-for="rec in filteredRecordings"
              :key="rec.id"
              class="group flex flex-col rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] overflow-hidden hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700 transition-all duration-200"
            >
              <!-- 卡片顶部：缩略图/图标区域 -->
              <div class="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center cursor-pointer" @click="getMediaUrl(rec) ? handlePlay(rec) : undefined">
                <UIcon name="i-lucide-film" class="text-4xl text-slate-300 dark:text-slate-600" />
                <!-- 时长标签 -->
                <span v-if="rec.duration" class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-mono tabular-nums">
                  {{ formatDuration(rec.duration) }}
                </span>
                <!-- 播放按钮悬浮 -->
                <div v-if="getMediaUrl(rec)" class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                  <div class="size-10 rounded-full bg-white/90 dark:bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <UIcon name="i-lucide-play" class="text-lg text-slate-800 ml-0.5" />
                  </div>
                </div>
                <!-- 状态角标 -->
                <UBadge
                  :color="(statusColors[rec.sync_status] as any) || 'neutral'"
                  variant="subtle"
                  size="xs"
                  class="absolute top-2 left-2"
                >
                  {{ statusLabels[rec.sync_status] || rec.sync_status }}
                </UBadge>
              </div>

              <!-- 卡片内容 -->
              <div class="flex-1 flex flex-col p-3 gap-2">
                <h3 class="text-sm font-semibold leading-snug line-clamp-2" :title="rec.title">{{ rec.title }}</h3>
                <div class="flex items-center gap-3 text-xs text-[var(--ui-text-dimmed)] mt-auto">
                  <span>{{ formatDate(rec.created_at) }}</span>
                  <span v-if="rec.file_size">{{ formatFileSize(rec.file_size) }}</span>
                </div>
              </div>

              <!-- 卡片操作栏 -->
              <div class="flex items-center gap-0.5 px-2 py-1.5 border-t border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]/50">
                <UButton
                  v-if="getMediaUrl(rec)"
                  size="xs"
                  variant="ghost"
                  icon="i-lucide-play"
                  title="播放"
                  @click="handlePlay(rec)"
                />
                <UButton
                  v-if="rec.sync_status === 'synced'"
                  size="xs"
                  variant="ghost"
                  icon="i-lucide-file-text"
                  title="转录"
                  @click="handleTranscribe(rec.id)"
                />
                <UButton
                  v-if="rec.sync_status === 'synced'"
                  size="xs"
                  variant="ghost"
                  icon="i-lucide-captions"
                  title="查看转录"
                  @click="handleViewTranscript(rec)"
                />
                <UButton
                  v-if="rec.sync_status === 'synced'"
                  size="xs"
                  variant="ghost"
                  icon="i-lucide-sparkles"
                  title="AI笔记"
                  @click="handleViewNotes(rec)"
                />
                <div class="flex-1" />
                <UButton
                  size="xs"
                  variant="ghost"
                  color="error"
                  icon="i-lucide-trash-2"
                  title="删除"
                  @click="handleDelete(rec.id)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!loading" class="flex-1 flex flex-col items-center justify-center py-16 gap-4">
          <div class="flex items-center justify-center size-16 rounded-2xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
            <UIcon name="i-lucide-video" class="text-3xl text-[var(--ui-text-dimmed)]" />
          </div>
          <div class="text-center">
            <p class="text-base font-semibold mb-1">暂无录制记录</p>
            <p class="text-sm text-[var(--ui-text-dimmed)]">点击「开始录制」按钮录制您的课堂</p>
          </div>
          <UButton
            icon="i-lucide-circle"
            color="error"
            label="开始录制"
            size="sm"
            @click="showStartModal = true"
          />
        </div>

        <!-- 加载状态 -->
        <div v-else class="flex-1 flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-teal-500" />
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- 开始录制模态框 -->
  <UModal v-model:open="showStartModal" title="开始录制">
    <template #content>
      <div class="p-5 space-y-4">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-[var(--ui-text-muted)]">录制标题</label>
          <UInput v-model="newTitle" placeholder="例如：第三章 数据结构与算法" autofocus @keyup.enter="handleStartRecording" />
        </div>

        <!-- 录制源选择 -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-[var(--ui-text-muted)]">录制模式</label>
          <div class="grid grid-cols-3 gap-2">
            <label v-for="opt in [
              { value: 'camera', label: '摄像头', icon: 'i-lucide-camera' },
              { value: 'screen', label: '屏幕共享', icon: 'i-lucide-monitor' },
              { value: 'both', label: '双路录制', icon: 'i-lucide-picture-in-picture-2' },
            ]" :key="opt.value"
              class="flex flex-col items-center gap-1.5 p-3 rounded-lg border cursor-pointer transition-colors"
              :class="recordingSource === opt.value
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
                : 'border-[var(--ui-border)] hover:bg-[var(--ui-bg-elevated)]'"
            >
              <input type="radio" v-model="recordingSource" :value="opt.value" class="sr-only" />
              <UIcon :name="opt.icon" class="text-lg" :class="recordingSource === opt.value ? 'text-teal-600 dark:text-teal-400' : 'text-[var(--ui-text-dimmed)]'" />
              <span class="text-xs font-medium">{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-[var(--ui-text-muted)]">画面预览</label>
            <UButton size="xs" variant="soft" :label="previewStream ? '重新预览' : '开启预览'" icon="i-lucide-eye" @click="preparePreview" />
          </div>
          <div ref="previewContainer" class="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-[var(--ui-border)]">
            <video ref="previewVideo" autoplay muted playsinline class="w-full h-full object-contain" />
            <div
              v-if="recordingSource === 'both' && userStreamRaw"
              :style="cameraStyle"
              @mousedown="startDragging"
            >
              <video ref="cameraOverlayVideo" autoplay muted playsinline class="w-full h-full object-cover pointer-events-none" />
              <div class="absolute right-0 bottom-0 w-5 h-5 bg-teal-500 cursor-nwse-resize rounded-tl z-[11]" @mousedown.stop="startResizing" title="拖拽缩放" />
              <span class="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">摄像头</span>
            </div>
            <div v-if="!previewStream" class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-2">
              <UIcon name="i-lucide-monitor-play" class="text-2xl text-white/40" />
              <span class="text-xs text-white/60">点击「开启预览」配置画面</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-[var(--ui-border)]">
          <UButton variant="ghost" label="取消" @click="showStartModal = false; cleanupStreams()" />
          <UButton
            icon="i-lucide-circle"
            color="error"
            label="开始录制"
            :loading="starting"
            :disabled="!newTitle.trim()"
            @click="handleStartRecording"
          />
        </div>
      </div>
    </template>
  </UModal>

  <!-- 查看转录模态框 -->
  <UModal v-model:open="showTranscriptModal" :title="'转录内容 - ' + transcriptTitle">
    <template #content>
      <div class="p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon name="i-lucide-captions" class="text-indigo-500 shrink-0" />
            <h3 class="text-sm font-semibold truncate">{{ transcriptTitle }}</h3>
          </div>
          <UBadge v-if="transcriptStatus" :color="transcriptStatus === 'completed' ? 'success' : transcriptStatus === 'failed' ? 'error' : 'warning'" variant="subtle" size="sm">
            {{ transcriptStatus === 'completed' ? '已完成' : transcriptStatus === 'failed' ? '失败' : '处理中' }}
          </UBadge>
        </div>

        <div v-if="transcriptLoading" class="flex items-center justify-center py-10 gap-2">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-xl text-indigo-500" />
          <span class="text-sm text-[var(--ui-text-dimmed)]">加载中...</span>
        </div>
        <template v-else>
          <div v-if="transcriptSegments.length" class="max-h-96 overflow-y-auto space-y-0.5 rounded-lg border border-[var(--ui-border)] p-2">
            <div v-for="(seg, i) in transcriptSegments" :key="i"
              class="flex gap-3 text-sm px-2 py-1.5 rounded hover:bg-[var(--ui-bg-elevated)] transition-colors">
              <span class="text-teal-600 dark:text-teal-400 shrink-0 font-mono text-xs mt-0.5">{{ formatTimestamp(seg.start) }}</span>
              <span v-if="seg.speaker" class="text-indigo-600 dark:text-indigo-400 shrink-0 font-medium">{{ seg.speaker }}:</span>
              <span>{{ seg.text }}</span>
            </div>
          </div>
          <div v-else-if="transcriptFullText" class="max-h-96 overflow-y-auto rounded-lg border border-[var(--ui-border)] p-3">
            <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ transcriptFullText }}</p>
          </div>
          <div v-else class="flex flex-col items-center py-8 gap-2 text-[var(--ui-text-dimmed)]">
            <UIcon name="i-lucide-file-question" class="text-2xl" />
            <p class="text-sm">暂无转录内容</p>
          </div>
        </template>
        <div class="flex justify-end pt-2 border-t border-[var(--ui-border)]">
          <UButton variant="ghost" label="关闭" size="sm" @click="showTranscriptModal = false" />
        </div>
      </div>
    </template>
  </UModal>

  <!-- AI笔记模态框 -->
  <UModal v-model:open="showNotesModal" :title="'AI笔记 - ' + notesTitle">
    <template #content>
      <div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-sparkles" class="text-amber-500" />
          <h3 class="text-sm font-semibold truncate">{{ notesTitle }}</h3>
        </div>

        <div v-if="notesLoading" class="flex items-center justify-center py-10 gap-2">
          <UIcon name="i-lucide-sparkles" class="animate-pulse text-xl text-amber-500" />
          <span class="text-sm text-[var(--ui-text-dimmed)]">加载中...</span>
        </div>
        <template v-else-if="notesData">
          <!-- Processing -->
          <div v-if="notesData.status === 'pending' || notesData.status === 'processing' || notesData.status === 'waiting'" class="flex flex-col items-center py-10 gap-3">
            <UIcon name="i-lucide-sparkles" class="text-2xl text-amber-500 animate-pulse" />
            <p class="text-sm text-[var(--ui-text-dimmed)]">AI 正在归纳笔记...</p>
          </div>

          <!-- Failed -->
          <div v-else-if="notesData.status === 'failed'" class="flex flex-col items-center py-8 gap-2 text-[var(--ui-text-dimmed)]">
            <UIcon name="i-lucide-circle-x" class="text-2xl text-red-500" />
            <p class="text-sm">笔记生成失败</p>
            <p class="text-xs">{{ notesData.error_message || '未知错误' }}</p>
          </div>

          <!-- Completed -->
          <template v-else-if="notesData.status === 'completed'">
            <div v-if="parsedKeywords.length" class="space-y-2">
              <h4 class="text-xs font-semibold text-[var(--ui-text-dimmed)] uppercase tracking-wider">关键词</h4>
              <div class="flex flex-wrap gap-1.5">
                <UBadge v-for="(kw, i) in parsedKeywords" :key="i" color="primary" variant="subtle" size="sm">{{ kw }}</UBadge>
              </div>
            </div>

            <div v-if="notesData.summary" class="space-y-2">
              <h4 class="text-xs font-semibold text-[var(--ui-text-dimmed)] uppercase tracking-wider">摘要</h4>
              <div class="p-3 bg-[var(--ui-bg-elevated)] rounded-lg text-sm leading-relaxed">{{ notesData.summary }}</div>
            </div>

            <div v-if="parsedOutline" class="space-y-2">
              <h4 class="text-xs font-semibold text-[var(--ui-text-dimmed)] uppercase tracking-wider">大纲</h4>
              <div class="p-3 bg-[var(--ui-bg-elevated)] rounded-lg text-sm leading-relaxed whitespace-pre-wrap">{{ parsedOutline }}</div>
            </div>

            <div v-if="parsedKeyPoints.length" class="space-y-2">
              <h4 class="text-xs font-semibold text-[var(--ui-text-dimmed)] uppercase tracking-wider">知识点</h4>
              <ul class="space-y-1.5">
                <li v-for="(point, i) in parsedKeyPoints" :key="i" class="flex gap-2 text-sm p-2 bg-[var(--ui-bg-elevated)] rounded-lg">
                  <span class="text-teal-600 dark:text-teal-400 font-bold shrink-0">{{ i + 1 }}.</span>
                  <span>{{ point }}</span>
                </li>
              </ul>
            </div>

            <div v-if="parsedQuiz.length" class="space-y-2">
              <h4 class="text-xs font-semibold text-[var(--ui-text-dimmed)] uppercase tracking-wider">测验</h4>
              <div v-for="(q, i) in parsedQuiz" :key="i" class="p-3 bg-[var(--ui-bg-elevated)] rounded-lg space-y-2">
                <p class="text-sm font-medium">{{ i + 1 }}. {{ q.question }}</p>
                <div v-for="(opt, j) in q.options" :key="j" class="text-sm pl-4 text-[var(--ui-text-dimmed)]">
                  {{ String.fromCharCode(65 + j) }}. {{ opt }}
                </div>
                <details>
                  <summary class="text-xs text-teal-600 dark:text-teal-400 cursor-pointer">查看答案</summary>
                  <p class="text-sm mt-1 pl-4">参考答案: {{ q.answer }}</p>
                </details>
              </div>
            </div>
          </template>
        </template>

        <div v-else class="flex flex-col items-center py-8 gap-2 text-[var(--ui-text-dimmed)]">
          <UIcon name="i-lucide-notebook-pen" class="text-2xl" />
          <p class="text-sm">暂无 AI 笔记</p>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-[var(--ui-border)]">
          <UButton
            v-if="notesData && (notesData.status === 'completed' || notesData.status === 'failed')"
            variant="soft"
            icon="i-lucide-refresh-cw"
            label="重新生成"
            size="sm"
            @click="handleRegenerateNotes"
          />
          <UButton variant="ghost" label="关闭" size="sm" @click="showNotesModal = false" />
        </div>
      </div>
    </template>
  </UModal>

  <!-- 视频播放模态框 -->
  <UModal v-model:open="showPlayerModal" :title="playerTitle">
    <template #content>
      <div class="p-4 space-y-3">
        <div class="rounded-lg overflow-hidden border border-[var(--ui-border)] bg-black">
          <video
            v-if="showPlayerModal && playerUrl"
            :src="playerUrl"
            controls
            autoplay
            class="w-full bg-black"
            style="max-height: 65vh;"
          >
            您的浏览器不支持视频播放
          </video>
        </div>
        <div class="flex justify-end">
          <UButton variant="ghost" label="关闭" size="sm" @click="showPlayerModal = false; playerUrl = ''" />
        </div>
      </div>
    </template>
  </UModal>
  </div>
</template>
