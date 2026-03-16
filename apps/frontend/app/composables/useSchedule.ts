import type { CourseSchedule, ScheduleCell } from '~/types/course'

interface RawSchedule {
  id: number
  schedule_name: string
  schedule_data: string | ScheduleCell[][]
  status: number
  created_at: string
  updated_at?: string
}

interface ListResponse {
  code: number
  message: string
  data: RawSchedule[]
}

interface DetailResponse {
  code: number
  message: string
  data: { id: number } | null
}

interface MutationResponse {
  code: number
  message: string
  data: null
}

function mapSchedule(raw: RawSchedule): CourseSchedule {
  let parsed = typeof raw.schedule_data === 'string' ? JSON.parse(raw.schedule_data) : raw.schedule_data

  // 兼容旧数据：数据库格式是 [周一[8节], 周二[8节], ...周五[8节]]
  // 需要转置为 Grid 期望的 [时间段1[周一..周日], 时间段2[周一..周日], ...]
  // 并合并连堂课（两两一组）
  if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0]) && typeof parsed[0][0] === 'string') {
    const dayCount = parsed.length // 5天
    const slotsPerDay = (parsed[0] as string[]).length // 8节
    const timeSlotCount = Math.ceil(slotsPerDay / 2) // 4个时间段
    const grid: ScheduleCell[][] = []
    for (let t = 0; t < timeSlotCount; t++) {
      const row: ScheduleCell[] = []
      for (let d = 0; d < 7; d++) {
        const name = d < dayCount ? ((parsed[d] as string[])[t * 2] || '') : ''
        row.push({ course_name: name })
      }
      grid.push(row)
    }
    parsed = grid
  }

  return {
    id: raw.id,
    name: raw.schedule_name,
    schedule_data: parsed,
    is_active: raw.status === 1,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

export function useSchedule() {
  const { apiFetch } = useApi()

  async function fetchSchedules(): Promise<CourseSchedule[]> {
    const res = await apiFetch<ListResponse>('course-schedule')
    const list = Array.isArray(res.data) ? res.data : []
    return list.map(mapSchedule)
  }

  async function createSchedule(data: { name: string, schedule_data: ScheduleCell[][] }) {
    return apiFetch<DetailResponse>('course-schedule', {
      method: 'POST',
      body: { schedule_name: data.name, schedule_data: data.schedule_data },
    })
  }

  async function updateSchedule(id: number, data: { name?: string, schedule_data?: ScheduleCell[][], is_active?: boolean }) {
    const body: Record<string, unknown> = {}
    if (data.name !== undefined) body.schedule_name = data.name
    if (data.schedule_data !== undefined) body.schedule_data = data.schedule_data
    if (data.is_active !== undefined) body.status = data.is_active ? 1 : 0
    return apiFetch<MutationResponse>(`course-schedule/${id}`, {
      method: 'PUT',
      body,
    })
  }

  async function deleteSchedule(id: number) {
    return apiFetch<MutationResponse>(`course-schedule/${id}`, {
      method: 'DELETE',
    })
  }

  return {
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  }
}
