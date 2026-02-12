import type { Question } from '~/types/question'

interface QuestionBankResponse {
  code: number
  message: string
  data: {
    list: Array<{
      id: number
      title: string
      subject: string
      type: string
      difficulty: string
      content: string
      options: string[] | null
      tags: string | null
      answer: string
      explanation: string | null
      createTime: string
      updateTime: string | null
    }>
    total: number
  }
}

interface QuestionStatsResponse {
  code: number
  message: string
  data: {
    total: number
    single_choice: number
    fill_blank: number
    true_false: number
    short_answer: number
    calculation: number
  }
}

export function useQuestions() {
  const { apiFetch } = useApi()

  async function fetchQuestions(params: {
    page?: number
    pageSize?: number
    subject?: string
    type?: string
    difficulty?: string
    keyword?: string
  } = {}) {
    const query = new URLSearchParams()
    query.set('page', String(params.page || 1))
    query.set('pageSize', String(params.pageSize || 20))
    if (params.subject) query.set('subject', params.subject)
    if (params.type) query.set('type', params.type)
    if (params.difficulty) query.set('difficulty', params.difficulty)
    if (params.keyword) query.set('keyword', params.keyword)

    const res = await apiFetch<QuestionBankResponse>(`/question-bank?${query.toString()}`)
    return res.data
  }

  async function fetchStats() {
    const res = await apiFetch<QuestionStatsResponse>('/question-bank/stats')
    return res.data
  }

  async function addToBank(questions: Question[]) {
    const payload = questions.map(q => ({
      title: q.content?.substring(0, 100) || '',
      subject: q.subject || '',
      type: q.type || '选择题',
      difficulty: q.difficulty || '中等',
      content: q.content || '',
      options: q.options || null,
      answer: q.answer || '',
      explanation: q.explanation || '',
    }))
    const res = await apiFetch<{ code: number, message: string, data: { count: number } }>('/question-bank', {
      method: 'POST',
      body: { questions: payload },
    })
    return res.data
  }

  async function removeFromBank(id: number) {
    await apiFetch(`/question-bank/${id}`, { method: 'DELETE' })
  }

  async function updateQuestion(id: number, data: Partial<Question>) {
    await apiFetch(`/question-bank/${id}`, {
      method: 'PUT',
      body: {
        title: data.content?.substring(0, 100) || '',
        subject: data.subject,
        type: data.type,
        difficulty: data.difficulty,
        content: data.content,
        options: data.options,
        answer: data.answer,
        explanation: data.explanation,
      },
    })
  }

  function exportQuestions(questions: Array<Record<string, unknown>>, format: 'json' | 'text'): string {
    if (format === 'json') {
      return JSON.stringify(questions, null, 2)
    }
    return questions.map((q: Record<string, unknown>, i: number) => {
      let text = `${i + 1}. [${q.type}][${q.difficulty}] ${q.content}`
      if (Array.isArray(q.options) && q.options.length) {
        text += '\n' + q.options.map((opt: string, j: number) => `   ${String.fromCharCode(65 + j)}. ${opt}`).join('\n')
      }
      text += `\n   答案：${q.answer}`
      if (q.explanation) text += `\n   解析：${q.explanation}`
      return text
    }).join('\n\n')
  }

  return { fetchQuestions, fetchStats, addToBank, removeFromBank, updateQuestion, exportQuestions }
}
