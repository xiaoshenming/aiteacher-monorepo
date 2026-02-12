import type { Course, ClassInfo, Student, Assistant } from '~/types/course'

interface ListResponse<T> {
  code: number
  message: string
  data: Record<string, T[]>
}

interface DetailResponse<T> {
  code: number
  message: string
  data: T & {
    classes?: ClassInfo[]
    assistants?: Assistant[]
    students?: Student[]
  }
}

interface MutationResponse {
  code: number
  message: string
  data: null
}

export function useCourses() {
  const { apiFetch } = useApi()

  // ---- 课程 ----

  async function createCourse(data: { name: string, description?: string }) {
    return apiFetch<MutationResponse>('courses', {
      method: 'POST',
      body: data,
    })
  }

  async function fetchCourses() {
    const res = await apiFetch<ListResponse<Course>>('courses')
    return res.data.courses ?? []
  }

  async function fetchCourseDetail(id: number) {
    const res = await apiFetch<DetailResponse<Course>>(`courses/${id}`)
    const detail = res.data
    if (detail.classes) {
      detail.classes = detail.classes.map((c: any) => ({
        ...c,
        id: c.class_id ?? c.id,
        name: c.class_name ?? c.name,
      }))
    }
    return detail
  }

  async function addAssistant(courseId: number, assistantId: number) {
    return apiFetch<MutationResponse>(`courses/${courseId}/assistants`, {
      method: 'POST',
      body: { assistantId },
    })
  }

  async function removeAssistant(courseId: number, assistantId: number) {
    return apiFetch<MutationResponse>(`courses/${courseId}/assistants/${assistantId}`, {
      method: 'DELETE',
    })
  }

  async function addClassToCourse(courseId: number, classId: number) {
    return apiFetch<MutationResponse>(`courses/${courseId}/classes`, {
      method: 'POST',
      body: { classId },
    })
  }

  // ---- 班级 ----

  async function createClass(data: { name: string }) {
    return apiFetch<MutationResponse>('classes', {
      method: 'POST',
      body: data,
    })
  }

  async function fetchClasses() {
    const res = await apiFetch<ListResponse<ClassInfo>>('classes')
    return res.data.classes ?? []
  }

  async function fetchClassDetail(id: number) {
    const res = await apiFetch<DetailResponse<ClassInfo>>(`classes/${id}`)
    const raw = res.data as any
    const cls = raw.class ?? raw
    return {
      ...cls,
      name: cls.class_name ?? cls.name,
      students: raw.students ?? cls.students ?? [],
      courses: raw.courses ?? cls.courses ?? [],
    }
  }

  async function addStudent(classId: number, studentId: number) {
    return apiFetch<MutationResponse>(`classes/${classId}/students`, {
      method: 'POST',
      body: { studentId },
    })
  }

  async function removeStudent(classId: number, studentId: number) {
    return apiFetch<MutationResponse>(`classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    })
  }

  // ---- 搜索 ----

  async function searchStudents(keyword: string) {
    const res = await apiFetch<ListResponse<Student>>('students/search', {
      params: { keyword },
    })
    return res.data.students ?? []
  }

  async function fetchTeachers() {
    const res = await apiFetch<ListResponse<Assistant>>('teachers')
    return res.data.teachers ?? []
  }

  return {
    createCourse,
    fetchCourses,
    fetchCourseDetail,
    addAssistant,
    removeAssistant,
    addClassToCourse,
    createClass,
    fetchClasses,
    fetchClassDetail,
    addStudent,
    removeStudent,
    searchStudents,
    fetchTeachers,
  }
}
