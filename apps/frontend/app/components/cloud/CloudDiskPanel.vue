<script setup lang="ts">
import type { CloudFile } from '~/types/cloud'

const { fetchFiles, uploadFile, deleteFile, getDownloadUrl, createFolder, moveFile, renameFile, fetchBreadcrumb } = useCloudDisk()
const { isPreviewable } = useFilePreview()

const files = ref<CloudFile[]>([])
const loading = ref(true)
const searchQuery = ref('')
const uploadProgress = ref(0)
const uploading = ref(false)
const showDeleteModal = ref(false)
const fileToDelete = ref<CloudFile | null>(null)
const showPreview = ref(false)
const previewFile = ref<CloudFile | null>(null)
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement>()

// 文件夹导航
const currentFolderId = ref<number | null>(null)
const breadcrumb = ref<{ id: number, name: string }[]>([])
const showNewFolderModal = ref(false)
const newFolderName = ref('')
const showMoveModal = ref(false)
const fileToMove = ref<CloudFile | null>(null)
const moveTargetId = ref<number | null>(null)
const showRenameModal = ref(false)
const fileToRename = ref<CloudFile | null>(null)
const renameValue = ref('')

const filteredFiles = computed(() => {
  const sorted = [...files.value].sort((a, b) => b.is_folder - a.is_folder)
  if (!searchQuery.value) return sorted
  const q = searchQuery.value.toLowerCase()
  return sorted.filter(f => f.name.toLowerCase().includes(q))
})

const folders = computed(() => files.value.filter(f => f.is_folder))

const columns = [
  { accessorKey: 'name', header: '文件名' },
  { accessorKey: 'size', header: '大小' },
  { accessorKey: 'type', header: '类型' },
  { accessorKey: 'uploaded_at', header: '上传时间' },
  { accessorKey: 'actions', header: '操作' },
]

function formatSize(bytes: number | string | null | undefined): string {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n < 0) return '未知'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB'
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

function formatTime(time: string | null | undefined): string {
  if (!time) return '未知'
  const d = new Date(time)
  if (isNaN(d.getTime())) return '未知'
  return d.toLocaleString('zh-CN')
}

const fileTypeIconMap: Record<string, string> = {
  image: 'i-lucide-image', video: 'i-lucide-video', audio: 'i-lucide-music',
  pdf: 'i-lucide-file-text', doc: 'i-lucide-file-text', xls: 'i-lucide-sheet',
  ppt: 'i-lucide-presentation', zip: 'i-lucide-archive',
}

function getFileIcon(file: CloudFile): string {
  if (file.is_folder) return 'i-lucide-folder'
  const mime = file.type?.toLowerCase() || ''
  if (mime.startsWith('image/')) return fileTypeIconMap.image
  if (mime.startsWith('video/')) return fileTypeIconMap.video
  if (mime.startsWith('audio/')) return fileTypeIconMap.audio
  if (mime.includes('pdf')) return fileTypeIconMap.pdf
  if (mime.includes('word') || mime.includes('doc')) return fileTypeIconMap.doc
  if (mime.includes('sheet') || mime.includes('xls')) return fileTypeIconMap.xls
  if (mime.includes('presentation') || mime.includes('ppt')) return fileTypeIconMap.ppt
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('archive')) return fileTypeIconMap.zip
  return 'i-lucide-file'
}

function formatFileType(file: CloudFile): string {
  if (file.is_folder) return '文件夹'
  const mime = file.type?.toLowerCase() || ''
  if (mime.startsWith('image/')) return '图片'
  if (mime.startsWith('video/')) return '视频'
  if (mime.startsWith('audio/')) return '音频'
  if (mime.includes('pdf')) return 'PDF'
  if (mime.includes('word') || mime.includes('docx')) return 'Word 文档'
  if (mime.includes('sheet') || mime.includes('xlsx')) return 'Excel 表格'
  if (mime.includes('presentation') || mime.includes('pptx')) return 'PPT 演示'
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('archive')) return '压缩包'
  const ext = file.name?.split('.').pop()?.toUpperCase()
  return ext ? `${ext} 文件` : '文件'
}

async function loadFiles() {
  loading.value = true
  try {
    files.value = await fetchFiles(currentFolderId.value)
    if (currentFolderId.value) {
      breadcrumb.value = await fetchBreadcrumb(currentFolderId.value)
    }
    else {
      breadcrumb.value = []
    }
  }
  catch { files.value = [] }
  finally { loading.value = false }
}

function enterFolder(file: CloudFile) {
  if (!file.is_folder) return
  currentFolderId.value = file.id
  loadFiles()
}

function goToRoot() {
  currentFolderId.value = null
  loadFiles()
}

function goToBreadcrumb(item: { id: number }) {
  currentFolderId.value = item.id
  loadFiles()
}

async function handleUpload(fileList: FileList | null) {
  if (!fileList?.length) return
  uploading.value = true
  uploadProgress.value = 0
  try {
    for (const file of Array.from(fileList)) {
      await uploadFile(file, (p) => { uploadProgress.value = p }, currentFolderId.value)
    }
    await loadFiles()
  }
  finally { uploading.value = false; uploadProgress.value = 0 }
}

function triggerUpload() { fileInput.value?.click() }

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  handleUpload(input.files)
  input.value = ''
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  handleUpload(e.dataTransfer?.files || null)
}

function confirmDelete(file: CloudFile) {
  fileToDelete.value = file
  showDeleteModal.value = true
}

async function doDelete() {
  if (!fileToDelete.value) return
  await deleteFile(fileToDelete.value.id)
  showDeleteModal.value = false
  fileToDelete.value = null
  await loadFiles()
}

function downloadFile(file: CloudFile) {
  const url = getDownloadUrl(file.id)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
}

function previewFileAction(file: CloudFile) {
  previewFile.value = file
  showPreview.value = true
}

async function handleCreateFolder() {
  if (!newFolderName.value.trim()) return
  await createFolder(newFolderName.value.trim(), currentFolderId.value)
  newFolderName.value = ''
  showNewFolderModal.value = false
  await loadFiles()
}

function openMoveModal(file: CloudFile) {
  fileToMove.value = file
  moveTargetId.value = null
  showMoveModal.value = true
}

async function handleMove() {
  if (!fileToMove.value) return
  await moveFile(fileToMove.value.id, moveTargetId.value)
  showMoveModal.value = false
  fileToMove.value = null
  await loadFiles()
}

function openRenameModal(file: CloudFile) {
  fileToRename.value = file
  renameValue.value = file.name
  showRenameModal.value = true
}

async function handleRename() {
  if (!fileToRename.value || !renameValue.value.trim()) return
  await renameFile(fileToRename.value.id, renameValue.value.trim())
  showRenameModal.value = false
  fileToRename.value = null
  await loadFiles()
}

function handleRowClick(file: CloudFile) {
  if (file.is_folder) enterFolder(file)
}

onMounted(loadFiles)
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1 text-sm">
      <button class="text-primary hover:underline" @click="goToRoot">全部文件</button>
      <template v-for="item in breadcrumb" :key="item.id">
        <UIcon name="i-lucide-chevron-right" class="text-muted" />
        <button class="text-primary hover:underline" @click="goToBreadcrumb(item)">{{ item.name }}</button>
      </template>
    </nav>

    <!-- Toolbar -->
    <div class="flex items-center gap-3 flex-wrap">
      <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="搜索文件..." class="w-64" />
      <UButton icon="i-lucide-upload" label="上传文件" @click="triggerUpload" />
      <UButton icon="i-lucide-folder-plus" label="新建文件夹" variant="soft" @click="showNewFolderModal = true" />
      <input ref="fileInput" type="file" multiple class="hidden" @change="onFileChange">
    </div>

    <!-- Upload progress -->
    <div v-if="uploading" class="flex items-center gap-3">
      <UProgress :value="uploadProgress" class="flex-1" />
      <span class="text-sm text-muted whitespace-nowrap">{{ uploadProgress }}%</span>
    </div>

    <!-- Drop zone -->
    <div
      class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
      :class="dragOver ? 'border-primary bg-primary/5' : 'border-zinc-300 dark:border-zinc-600'"
      @dragover.prevent="dragOver = true" @dragleave="dragOver = false" @drop.prevent="onDrop"
    >
      <UIcon name="i-lucide-cloud-upload" class="text-3xl text-muted mb-2" />
      <p class="text-muted">拖拽文件到此处上传</p>
    </div>

    <!-- File table -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="text-2xl animate-spin text-muted" />
    </div>

    <div v-else-if="filteredFiles.length === 0" class="flex flex-col items-center py-12 text-muted">
      <UIcon name="i-lucide-folder-open" class="text-4xl mb-2" />
      <p>{{ searchQuery ? '没有匹配的文件' : '暂无文件' }}</p>
    </div>

    <UTable v-else :columns="columns" :data="filteredFiles">
      <template #name-cell="{ row }">
        <div class="flex items-center gap-2 cursor-pointer" @click="handleRowClick(row.original)">
          <UIcon :name="getFileIcon(row.original)" class="text-lg shrink-0"
            :class="row.original.is_folder ? 'text-amber-500' : ''" />
          <span class="truncate max-w-xs" :class="row.original.is_folder ? 'font-medium text-primary hover:underline' : ''">
            {{ row.original.name }}
          </span>
        </div>
      </template>

      <template #size-cell="{ row }">
        {{ row.original.is_folder ? '-' : formatSize(row.original.size) }}
      </template>

      <template #type-cell="{ row }">
        {{ formatFileType(row.original) }}
      </template>

      <template #uploaded_at-cell="{ row }">
        {{ formatTime(row.original.uploaded_at) }}
      </template>

      <template #actions-cell="{ row }">
        <div class="flex items-center gap-1">
          <UButton v-if="!row.original.is_folder && isPreviewable(row.original.type)"
            icon="i-lucide-eye" variant="ghost" size="xs" @click="previewFileAction(row.original)" />
          <UButton v-if="!row.original.is_folder"
            icon="i-lucide-download" variant="ghost" size="xs" @click="downloadFile(row.original)" />
          <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click="openRenameModal(row.original)" />
          <UButton icon="i-lucide-folder-input" variant="ghost" size="xs" @click="openMoveModal(row.original)" />
          <UButton icon="i-lucide-trash-2" variant="ghost" color="error" size="xs" @click="confirmDelete(row.original)" />
        </div>
      </template>
    </UTable>

    <!-- Delete confirmation modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-highlighted mb-2">确认删除</h3>
          <p class="text-muted mb-4">
            确定要删除{{ fileToDelete?.is_folder ? '文件夹' : '文件' }}「{{ fileToDelete?.name }}」吗？此操作不可撤销。
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" label="取消" @click="showDeleteModal = false" />
            <UButton color="error" label="删除" @click="doDelete" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- New folder modal -->
    <UModal v-model:open="showNewFolderModal">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-highlighted mb-4">新建文件夹</h3>
          <UInput v-model="newFolderName" placeholder="文件夹名称" class="mb-4" @keyup.enter="handleCreateFolder" />
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" label="取消" @click="showNewFolderModal = false" />
            <UButton color="primary" label="创建" :disabled="!newFolderName.trim()" @click="handleCreateFolder" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Rename modal -->
    <UModal v-model:open="showRenameModal">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-highlighted mb-4">重命名</h3>
          <UInput v-model="renameValue" placeholder="新名称" class="mb-4" @keyup.enter="handleRename" />
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" label="取消" @click="showRenameModal = false" />
            <UButton color="primary" label="确定" :disabled="!renameValue.trim()" @click="handleRename" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Move modal -->
    <UModal v-model:open="showMoveModal">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-highlighted mb-4">移动到</h3>
          <div class="space-y-2 max-h-60 overflow-y-auto mb-4">
            <button
              class="w-full text-left px-3 py-2 rounded-lg transition-colors"
              :class="moveTargetId === null ? 'bg-primary/10 text-primary' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'"
              @click="moveTargetId = null"
            >
              <UIcon name="i-lucide-home" class="mr-2" />根目录
            </button>
            <button v-for="f in folders.filter(f => f.id !== fileToMove?.id)" :key="f.id"
              class="w-full text-left px-3 py-2 rounded-lg transition-colors"
              :class="moveTargetId === f.id ? 'bg-primary/10 text-primary' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'"
              @click="moveTargetId = f.id"
            >
              <UIcon name="i-lucide-folder" class="mr-2 text-amber-500" />{{ f.name }}
            </button>
          </div>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" label="取消" @click="showMoveModal = false" />
            <UButton color="primary" label="移动" @click="handleMove" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- File preview modal -->
    <CloudFilePreview v-model:open="showPreview" :file="previewFile" />
  </div>
</template>
