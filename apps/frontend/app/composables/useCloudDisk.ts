import SparkMD5 from 'spark-md5'
import type { CloudFile, ChunkCheckResponse, FileListResponse } from '~/types/cloud'

const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB per chunk

export function useCloudDisk() {
  const { cloudFetch } = useApi()
  const config = useRuntimeConfig()
  const userStore = useUserStore()

  async function fetchFiles(): Promise<CloudFile[]> {
    const res = await cloudFetch<FileListResponse>('/pc/list')
    return res.data
  }

  async function checkChunk(fileMd5: string, totalChunks: number): Promise<ChunkCheckResponse> {
    return await cloudFetch<ChunkCheckResponse>('/pc/chunk/check', {
      method: 'POST',
      body: { fileMd5, totalChunks },
    })
  }

  async function uploadChunk(formData: FormData): Promise<void> {
    await cloudFetch('/pc/chunk/upload', {
      method: 'POST',
      body: formData,
    })
  }

  async function mergeChunks(fileMd5: string, fileName: string, fileType: string, fileSize: number): Promise<void> {
    await cloudFetch('/pc/chunk/merge', {
      method: 'POST',
      body: { fileMd5, fileName, fileType, fileSize },
    })
  }

  async function deleteFile(id: number): Promise<void> {
    await cloudFetch(`/pc/delete/${id}`, {
      method: 'DELETE',
    })
  }

  function getDownloadUrl(fileId: number): string {
    const base = (config.public.apiCloud as string).replace(/\/$/, '')
    return `${base}/pc/download/${fileId}?token=${userStore.token}`
  }

  function getPreviewUrl(fileId: number): string {
    const base = (config.public.apiCloud as string).replace(/\/$/, '')
    return `${base}/pc/preview/${fileId}?token=${userStore.token}`
  }

  function computeFileHash(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks = Math.ceil(file.size / CHUNK_SIZE)
      const spark = new SparkMD5.ArrayBuffer()
      const reader = new FileReader()
      let current = 0

      function loadNext() {
        const start = current * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        reader.readAsArrayBuffer(file.slice(start, end))
      }

      reader.onload = (e) => {
        spark.append(e.target!.result as ArrayBuffer)
        current++
        if (current < chunks) {
          loadNext()
        }
        else {
          resolve(spark.end())
        }
      }

      reader.onerror = () => reject(reader.error)
      loadNext()
    })
  }

  async function uploadFile(file: File, onProgress?: (progress: number) => void): Promise<void> {
    const fileMd5 = await computeFileHash(file)
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

    // Check which chunks are already uploaded
    const checkRes = await checkChunk(fileMd5, totalChunks)
    const uploadedIndices = checkRes.data.uploaded || []

    // If all chunks uploaded, just merge
    if (uploadedIndices.length >= totalChunks) {
      await mergeChunks(fileMd5, file.name, file.type || 'application/octet-stream', file.size)
      onProgress?.(100)
      return
    }

    const uploadedSet = new Set(uploadedIndices)
    let uploaded = uploadedSet.size

    // Upload missing chunks
    for (let i = 0; i < totalChunks; i++) {
      if (uploadedSet.has(i)) continue

      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)

      const formData = new FormData()
      formData.append('chunk', chunk)
      formData.append('fileMd5', fileMd5)
      formData.append('fileName', file.name)
      formData.append('fileType', file.type || 'application/octet-stream')
      formData.append('fileSize', String(file.size))
      formData.append('chunkIndex', String(i))
      formData.append('totalChunks', String(totalChunks))

      await uploadChunk(formData)
      uploaded++
      onProgress?.(Math.round((uploaded / totalChunks) * 95)) // Reserve 5% for merge
    }

    // Merge all chunks
    await mergeChunks(fileMd5, file.name, file.type || 'application/octet-stream', file.size)
    onProgress?.(100)
  }

  return {
    fetchFiles,
    checkChunk,
    uploadChunk,
    mergeChunks,
    deleteFile,
    getDownloadUrl,
    getPreviewUrl,
    uploadFile,
  }
}
