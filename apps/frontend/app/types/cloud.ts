export interface CloudFile {
  id: number
  name: string
  size: number
  type: string
  uploaded_at: string
  is_folder: number
}

export interface ChunkUploadState {
  fileHash: string
  fileName: string
  fileSize: number
  chunkSize: number
  totalChunks: number
  uploadedChunks: number[]
  status: 'pending' | 'uploading' | 'merging' | 'done' | 'error'
  progress: number
}

export interface ChunkCheckResponse {
  code: number
  message: string
  data: {
    uploaded: number[]
    total: number
  }
}

export interface FileListResponse {
  code: number
  message: string
  data: CloudFile[]
}

export type PreviewType = 'image' | 'pdf' | 'word' | 'excel' | 'ppt' | 'video' | 'audio' | 'unsupported'

export interface PreviewStrategy {
  type: PreviewType
  label: string
  icon: string
}
