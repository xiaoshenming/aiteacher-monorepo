export function useGrading(assignmentId: Ref<number> | number) {
  const { apiFetch } = useApi()
  const id = computed(() => unref(assignmentId))

  const submissions = ref<any[]>([])
  const currentSubmission = ref<any>(null)
  const summary = ref<any>(null)
  const loading = ref(false)
  const grading = ref(false)

  async function fetchSubmissions(page = 1, pageSize = 20) {
    loading.value = true
    try {
      const res = await apiFetch<{ code: number, data: any }>(`/assignments/${id.value}/submissions?page=${page}&pageSize=${pageSize}`)
      if (res.code === 200) {
        submissions.value = res.data?.list || res.data || []
      }
    }
    finally { loading.value = false }
  }

  async function fetchSubmissionDetail(sid: number) {
    const res = await apiFetch<{ code: number, data: any }>(`/assignments/${id.value}/submissions/${sid}`)
    if (res.code === 200) {
      currentSubmission.value = res.data
    }
    return res.data
  }

  async function autoGrade() {
    grading.value = true
    try {
      const res = await apiFetch<{ code: number, data: any }>(`/assignments/${id.value}/auto-grade`, { method: 'POST' })
      await fetchSubmissions()
      return res.data
    }
    finally { grading.value = false }
  }

  async function aiGrade() {
    grading.value = true
    try {
      await apiFetch(`/assignments/${id.value}/ai-grade`, { method: 'POST' })
      await fetchSubmissions()
    }
    finally { grading.value = false }
  }

  async function manualGrade(sid: number, score: number, feedback: string, detailScores?: any[]) {
    await apiFetch(`/assignments/${id.value}/submissions/${sid}/grade`, {
      method: 'PUT',
      body: { score, feedback, detail_scores: detailScores },
    })
    await fetchSubmissions()
  }

  async function batchGrade(submissionIds: number[]) {
    await apiFetch(`/assignments/${id.value}/batch-grade`, {
      method: 'POST',
      body: { submission_ids: submissionIds },
    })
    await fetchSubmissions()
  }

  async function fetchSummary() {
    const res = await apiFetch<{ code: number, data: any }>(`/assignments/${id.value}/grade-summary`)
    if (res.code === 200) {
      summary.value = res.data
    }
    return res.data
  }

  return {
    submissions, currentSubmission, summary, loading, grading,
    fetchSubmissions, fetchSubmissionDetail, autoGrade, aiGrade,
    manualGrade, batchGrade, fetchSummary,
  }
}
