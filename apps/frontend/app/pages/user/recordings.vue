<script setup lang="ts">
import type { Recording, TranscriptSegment } from '~/types/recording'

const toast = useToast()
const { fetchRecordings, deleteRecording, startTranscribe, createRecording, completeRecording, uploadAudio } = useRecordings()

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

let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []
let recordingStream: MediaStream | null = null
let durationTimer: ReturnType<typeof setInterval> | null = null

// 查看转录
const showTranscriptModal = ref(false)
const transcriptSegments = ref<TranscriptSegment[]>([])
const transcriptLoading = ref(false)
const transcriptTitle = ref('')

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
    // 请求屏幕共享 + 麦克风
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    })

    let combinedStream: MediaStream
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const tracks = [...displayStream.getTracks(), ...audioStream.getAudioTracks()]
      combinedStream = new MediaStream(tracks)
    }
    catch {
      // 麦克风不可用，仅用屏幕音频
      combinedStream = displayStream
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

    // 用户点击浏览器的"停止共享"时自动结束
    displayStream.getVideoTracks()[0].addEventListener('ended', () => {
      if (isRecording.value) {
        stopRecording()
      }
    })

    mediaRecorder.start(1000) // 每秒收集一次数据
    isRecording.value = true
    isPaused.value = false
    recordingDuration.value = 0
    durationTimer = setInterval(() => {
      if (!isPaused.value) {
        recordingDuration.value++
      }
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
  const url = recording.cloud_video_url
  if (url) {
    window.open(url, '_blank')
  }
  else {
    toast.add({ title: '暂无可播放的媒体文件', color: 'warning' })
  }
}

// async function handleViewTranscript(recording: Recording) {
//   transcriptTitle.value = recording.title
//   transcriptSegments.value = []
//   showTranscriptModal.value = true
//   transcriptLoading.value = true
//   try {
//     transcriptSegments.value = await getTranscript(recording.id)
//   }
//   catch {
//     toast.add({ title: '获取转录内容失败', color: 'error' })
//     showTranscriptModal.value = false
//   }
//   finally {
//     transcriptLoading.value = false
//   }
// }

onMounted(loadRecordings)

onBeforeUnmount(() => {
  if (isRecording.value) {
    stopRecording()
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
        <template #trailing>
          <UButton
            v-if="!isRecording"
            icon="i-lucide-circle"
            color="error"
            label="开始录制"
            @click="showStartModal = true"
          />
          <div v-else class="flex items-center gap-2">
            <span class="flex items-center gap-1.5 text-sm font-medium text-[var(--ui-error)]">
              <span class="relative flex size-2.5">
                <span class="absolute inline-flex size-full animate-ping rounded-full bg-[var(--ui-error)] opacity-75" />
                <span class="relative inline-flex size-2.5 rounded-full bg-[var(--ui-error)]" />
              </span>
              录制中 {{ formatDuration(recordingDuration) }}
            </span>
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
              label="停止"
              @click="stopRecording"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-4">
        <div class="flex gap-3 items-center">
          <UInput v-model="search" placeholder="搜索录制..." icon="i-lucide-search" class="w-64" />
          <USelectMenu v-model="statusFilter" :items="statusOptions" class="w-36" />
        </div>

        <UTable :data="filteredRecordings" :columns="columns" :loading="loading">
          <template #duration-cell="{ row }">
            {{ formatDuration(row.original.duration) }}
          </template>
          <template #sync_status-cell="{ row }">
            <UBadge :color="(statusColors[row.original.sync_status] as any) || 'neutral'" variant="subtle">
              {{ statusLabels[row.original.sync_status] || row.original.sync_status }}
            </UBadge>
          </template>
          <template #created_at-cell="{ row }">
            {{ formatDate(row.original.created_at) }}
          </template>
          <template #actions-cell="{ row }">
            <div class="flex gap-2">
              <UButton
                v-if="row.original.cloud_video_url"
                size="xs"
                variant="ghost"
                icon="i-lucide-play"
                title="播放"
                @click="handlePlay(row.original)"
              />
              <UButton
                v-if="row.original.sync_status === 'synced'"
                size="xs"
                variant="ghost"
                icon="i-lucide-file-text"
                title="转录"
                @click="handleTranscribe(row.original.id)"
              />
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                icon="i-lucide-trash-2"
                title="删除"
                @click="handleDelete(row.original.id)"
              />
            </div>
          </template>
        </UTable>

        <div v-if="!loading && filteredRecordings.length === 0" class="text-center py-12 text-[var(--ui-text-dimmed)]">
          <UIcon name="i-lucide-video" class="text-4xl mb-3" />
          <p class="text-lg mb-2">暂无录制记录</p>
          <p class="text-sm mb-4">点击右上角「开始录制」按钮来录制您的课堂</p>
          <UButton icon="i-lucide-circle" color="error" label="开始录制" @click="showStartModal = true" />
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- 开始录制模态框 -->
  <UModal v-model:open="showStartModal" title="开始录制">
    <template #content>
      <div class="p-6 space-y-4">
        <p class="text-sm text-[var(--ui-text-dimmed)]">
          将使用屏幕共享录制您的课堂内容，请在弹出的窗口中选择要共享的屏幕或窗口。
        </p>
        <UInput v-model="newTitle" placeholder="请输入录制标题" autofocus @keyup.enter="handleStartRecording" />
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" label="取消" @click="showStartModal = false" />
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
      <div class="p-6 space-y-4">
        <div v-if="transcriptLoading" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl" />
        </div>
        <div v-else-if="transcriptSegments.length" class="max-h-96 overflow-y-auto space-y-2">
          <div v-for="(seg, i) in transcriptSegments" :key="i" class="flex gap-3 text-sm">
            <span class="text-[var(--ui-text-dimmed)] shrink-0 font-mono">{{ formatTimestamp(seg.start) }}</span>
            <span v-if="seg.speaker" class="text-[var(--ui-primary)] shrink-0">{{ seg.speaker }}:</span>
            <span>{{ seg.text }}</span>
          </div>
        </div>
        <p v-else class="text-[var(--ui-text-dimmed)] text-center py-4">暂无转录内容</p>
        <div class="flex justify-end">
          <UButton variant="ghost" label="关闭" @click="showTranscriptModal = false" />
        </div>
      </div>
    </template>
  </UModal>
  </div>
</template>
