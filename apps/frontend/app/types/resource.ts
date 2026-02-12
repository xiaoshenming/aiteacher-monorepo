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
  year: string
  type: string
  cover_url?: string
  file_url?: string
  created_at: string
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
