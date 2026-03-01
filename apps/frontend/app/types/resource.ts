export interface FilterOption {
  label: string
  value: string
}

export interface FilterOptions {
  grades: string[] | FilterOption[]
  subjects: string[] | FilterOption[]
  provinces: string[] | FilterOption[]
  cities: string[] | FilterOption[]
}

export interface ResourceItem {
  id: number
  title: string
  grade: string
  subject: string
  province: string
  city: string
  label?: string
  // testpaper 字段
  uploadTime?: string
  // textbook 字段
  createTime?: string
  version?: string
  semester?: string
  publisher?: string
  publicationYear?: string | number
  edition?: string
  // 前端归一化虚拟字段
  year?: string
  created_at?: string
  cover?: string          // 后端原始字段
  cover_url?: string      // 前端计算字段
}

export interface ResourceListResponse {
  code: number
  message: string
  data: {
    list: ResourceItem[]
    total: number
  }
}

export interface FilterOptionsResponse {
  code: number
  message: string
  data: FilterOptions
}
