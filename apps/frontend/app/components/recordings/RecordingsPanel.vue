<script setup lang="ts">
import type { Recording } from '~/types/recording'

const toast = useToast()
const { fetchRecordings, deleteRecording, startTranscribe } = useRecordings()
const { formatDuration } = useRecordingFormat()

// 列表状态
const search = ref('')
const statusFilter = ref('')
const recordings = ref<Recording[]>([])
const loading = ref(false)

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待上传', value: 'pending' },
  { label: '上传中', value: 'uploading' },
  { label: '已同步', value: 'synced' },
  { label: '上传失败', value: 'failed' },
]

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

// 录制
const { isRecording, isPaused, recordingDuration, startRecording, togglePause, stopRecording } = useMediaRecorder()
const showStartModal = ref(false)
const starting = ref(false)
const startModalRef = ref<InstanceType<any> | null>(null)

// 播放
const showPlayerModal = ref(false)
const playerTitle = ref('')
const playerUrl = ref('')
const { getMediaUrl } = useRecordingFormat()

// 转录
const { viewTranscript } = useTranscript()

// AI 笔记
const { viewNotes, handleGenerateNotes, cleanup: cleanupNotes } = useAINotes()

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

async function handleStartRecording(title: string) {
  starting.value = true
  try {
    const modal = startModalRef.value
    const previewStream = modal?.previewStream as MediaStream | null
    const getMediaStream = modal?.getMediaStream as (() => Promise<MediaStream>)
    const cleanupStreams = modal?.cleanupStreams as (() => void)

    const success = await startRecording(
      title,
      getMediaStream,
      previewStream,
      cleanupStreams,
      loadRecordings,
    )
    if (success) {
      showStartModal.value = false
    }
  }
  finally {
    starting.value = false
  }
}

function handleStopRecording() {
  const modal = startModalRef.value
  const cleanupStreams = modal?.cleanupStreams || (() => {})
  stopRecording(cleanupStreams)
}

function handleTogglePause() {
  togglePause()
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

onMounted(loadRecordings)

onBeforeUnmount(() => {
  if (isRecording.value) handleStopRecording()
  cleanupNotes()
})
</script>

<template>
  <div class="flex flex-col gap-4 p-5 h-full">
    <!-- 录制中状态条 -->
    <RecordingsRecordingStatusBar
      v-if="isRecording"
      :duration="recordingDuration"
      :is-paused="isPaused"
      @toggle-pause="handleTogglePause"
      @stop="handleStopRecording"
    />

    <!-- 顶部操作栏 -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-4 text-sm">
        <div class="flex items-center gap-1.5">
          <UIcon name="i-lucide-video" class="text-primary-500" />
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
      <USelectMenu v-model="statusFilter" :items="statusOptions" value-key="value" size="sm" class="w-32" />
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
        <RecordingsRecordingCard
          v-for="rec in filteredRecordings"
          :key="rec.id"
          :recording="rec"
          @play="handlePlay"
          @transcribe="handleTranscribe"
          @view-transcript="viewTranscript"
          @view-notes="viewNotes"
          @delete="handleDelete"
        />
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
      <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-primary-500" />
    </div>

    <!-- 模态框 -->
    <RecordingsRecordingStartModal
      ref="startModalRef"
      v-model:open="showStartModal"
      :starting="starting"
      @start="handleStartRecording"
    />

    <RecordingsTranscriptModal />
    <RecordingsNotesModal />

    <RecordingsPlayerModal
      v-model:open="showPlayerModal"
      :title="playerTitle"
      :url="playerUrl"
    />
  </div>
</template>
