interface Assignment {
  id: number
  title: string
  description: string
  course_id: number | null
  class_id: number | null
  course_name: string
  class_name: string
  type: 'homework' | 'quiz' | 'exam'
  deadline: string | null
  status: 'draft' | 'published' | 'closed'
  total_score: number
  createTime: string
}

interface StudentAssignment {
  id: number
  title: string
  description: string
  deadline: string | null
  total_score: number
  type: string
  course_name: string
  submission_status: 'pending' | 'submitted' | 'graded'
  score: number | null
  feedback: string | null
  submit_time: string | null
}

interface AssignmentForm {
  title: string
  description: string
  course_id: number | null
  class_id: number | null
  type: string
  deadline: string
  total_score: number
  status: string
}

export function useAssignments() {
  const { apiFetch } = useApi()
  const assignments = ref<Assignment[]>([])
  const loading = ref(false)
  const total = ref(0)

  async function fetchAssignments(page = 1, pageSize = 20, status?: string) {
    loading.value = true
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (status) params.append('status', status)
      const res = await apiFetch<{ code: number, data: { list: Assignment[], total: number } }>(
        `/assignments?${params}`,
      )
      if (res.code === 200) {
        assignments.value = res.data.list
        total.value = res.data.total
      }
    }
    finally {
      loading.value = false
    }
  }

  async function createAssignment(form: AssignmentForm) {
    const res = await apiFetch<{ code: number, data: { id: number }, message: string }>('/assignments', {
      method: 'POST',
      body: form,
    })
    return res
  }

  async function updateAssignment(id: number, form: AssignmentForm) {
    const res = await apiFetch<{ code: number, message: string }>(`/assignments/${id}`, {
      method: 'PUT',
      body: form,
    })
    return res
  }

  async function deleteAssignment(id: number) {
    const res = await apiFetch<{ code: number, message: string }>(`/assignments/${id}`, {
      method: 'DELETE',
    })
    return res
  }

  async function publishAssignment(id: number) {
    const res = await apiFetch<{ code: number, message: string }>(`/assignments/${id}/publish`, {
      method: 'POST',
    })
    return res
  }

  async function closeAssignment(id: number) {
    const res = await apiFetch<{ code: number, message: string }>(`/assignments/${id}/close`, {
      method: 'POST',
    })
    return res
  }

  async function fetchTeacherClasses() {
    const res = await apiFetch<{ code: number, data: { id: number, class_name: string }[] }>(
      '/assignments/teacher/classes',
    )
    return res.code === 200 ? res.data : []
  }

  async function fetchTeacherCourses() {
    const res = await apiFetch<{ code: number, data: { id: number, name: string }[] }>(
      '/assignments/teacher/courses',
    )
    return res.code === 200 ? res.data : []
  }

  return {
    assignments,
    loading,
    total,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    closeAssignment,
    fetchTeacherClasses,
    fetchTeacherCourses,
  }
}

export function useStudentAssignments() {
  const { apiFetch } = useApi()
  const assignments = ref<StudentAssignment[]>([])
  const loading = ref(false)
  const total = ref(0)

  async function fetchAssignments(page = 1, pageSize = 20) {
    loading.value = true
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      const res = await apiFetch<{ code: number, data: { list: StudentAssignment[], total: number } }>(
        `/assignments/student/list?${params}`,
      )
      if (res.code === 200) {
        assignments.value = res.data.list
        total.value = res.data.total
      }
    }
    finally {
      loading.value = false
    }
  }

  async function submitAssignment(id: number, answers: string) {
    const res = await apiFetch<{ code: number, message: string }>(`/assignments/${id}/submit`, {
      method: 'POST',
      body: { answers },
    })
    return res
  }

  return {
    assignments,
    loading,
    total,
    fetchAssignments,
    submitAssignment,
  }
}
