import type { Question } from '~/types/question'

export interface TopicGeneratorState {
  subject: Ref<string>
  topicInput: Ref<string>
  count: Ref<number>
  difficulty: Ref<'简单' | '中等' | '困难'>
  selectedTypes: Ref<string[]>
  rawContent: Ref<string>
  parsedQuestions: Ref<Question[]>
  expandedIds: Ref<Set<string>>
  isGenerated: Ref<boolean>
  saving: Ref<boolean>
  isStreaming: Readonly<Ref<boolean>>
}

export const difficultyOptions = [
  { label: '简单', value: '简单' },
  { label: '中等', value: '中等' },
  { label: '困难', value: '困难' },
] as const

export const typeOptions = ['选择题', '填空题', '判断题', '简答题', '计算题'] as const

export const difficultyColor: Record<string, string> = {
  '简单': 'success',
  '中等': 'warning',
  '困难': 'error',
}

export const typeIcons: Record<string, string> = {
  '选择题': 'i-lucide-list-checks',
  '填空题': 'i-lucide-text-cursor-input',
  '判断题': 'i-lucide-check-circle',
  '简答题': 'i-lucide-message-square-text',
  '计算题': 'i-lucide-calculator',
}

export function useTopicGenerator() {
  const sse = useSSE()
  const { addToBank, exportQuestions } = useQuestions()
  const toast = useToast()

  const subject = ref('')
  const topicInput = ref('')
  const count = ref(5)
  const difficulty = ref<'简单' | '中等' | '困难'>('中等')
  const selectedTypes = ref<string[]>(['选择题'])
  const rawContent = ref('')
  const parsedQuestions = ref<Question[]>([])
  const expandedIds = ref<Set<string>>(new Set())
  const isGenerated = ref(false)
  const saving = ref(false)

  function toggleType(type: string) {
    const idx = selectedTypes.value.indexOf(type)
    if (idx >= 0) {
      if (selectedTypes.value.length > 1) selectedTypes.value.splice(idx, 1)
    }
    else {
      selectedTypes.value.push(type)
    }
  }

  function parseQuestions() {
    try {
      let jsonStr = rawContent.value.trim()
      const match = jsonStr.match(/\[[\s\S]*\]/)
      if (match) jsonStr = match[0]

      const arr = JSON.parse(jsonStr)
      parsedQuestions.value = arr.map((item: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        type: item.type || '选择题',
        difficulty: item.difficulty || difficulty.value,
        subject: item.subject || subject.value,
        content: item.content || '',
        options: item.options || undefined,
        answer: item.answer || '',
        explanation: item.explanation || '',
        createdAt: new Date().toISOString(),
      })) as Question[]
    }
    catch {
      toast.add({ title: '题目解析失败，请查看原始内容', color: 'warning' })
    }
  }

  async function generate() {
    if (!subject.value.trim() || !topicInput.value.trim()) {
      toast.add({ title: '请填写科目和知识点', color: 'warning' })
      return
    }

    rawContent.value = ''
    parsedQuestions.value = []
    isGenerated.value = false
    expandedIds.value = new Set()

    const prompt = `你是一位专业的出题老师。请根据以下要求生成题目：
科目：${subject.value}
知识点：${topicInput.value}
数量：${count.value}题
难度：${difficulty.value}
题型：${selectedTypes.value.join('、')}

请严格按照以下JSON数组格式输出，不要包含其他内容：
[
  {
    "type": "选择题",
    "difficulty": "${difficulty.value}",
    "subject": "${subject.value}",
    "content": "题目内容",
    "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
    "answer": "正确答案",
    "explanation": "解析说明"
  }
]
注意：options字段仅选择题需要，其他题型不需要。请直接输出JSON数组。`

    await sse.stream({
      url: 'ai/chat-stream',
      body: { prompt, model: 'deepseek-chat' },
      callbacks: {
        onMessage(chunk: string) {
          rawContent.value += chunk
        },
        onDone() {
          parseQuestions()
          isGenerated.value = true
        },
        onError(err: string) {
          toast.add({ title: '生成失败', description: err, color: 'error' })
        },
      },
    })
  }

  function stopGenerate() {
    sse.abort()
    parseQuestions()
    isGenerated.value = true
  }

  function toggleExpand(id: string) {
    if (expandedIds.value.has(id)) {
      expandedIds.value.delete(id)
    }
    else {
      expandedIds.value.add(id)
    }
  }

  async function addAllToBank() {
    if (!parsedQuestions.value.length || saving.value) return
    saving.value = true
    try {
      const result = await addToBank(parsedQuestions.value)
      toast.add({ title: `已添加 ${result.count} 道题到题库`, color: 'success' })
    }
    catch {
      toast.add({ title: '添加失败，请重试', color: 'error' })
    }
    finally {
      saving.value = false
    }
  }

  async function addOneToBank(q: Question) {
    if (saving.value) return
    saving.value = true
    try {
      await addToBank([q])
      toast.add({ title: '已添加到题库', color: 'success' })
    }
    catch {
      toast.add({ title: '添加失败，请重试', color: 'error' })
    }
    finally {
      saving.value = false
    }
  }

  function handleExport(format: 'json' | 'text') {
    const content = exportQuestions(parsedQuestions.value as unknown as Array<Record<string, unknown>>, format)
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `题库导出.${format === 'json' ? 'json' : 'txt'}`
    a.click()
    URL.revokeObjectURL(url)
    toast.add({ title: '导出成功', color: 'success' })
  }

  const state: TopicGeneratorState = {
    subject,
    topicInput,
    count,
    difficulty,
    selectedTypes,
    rawContent,
    parsedQuestions,
    expandedIds,
    isGenerated,
    saving,
    isStreaming: sse.isStreaming,
  }

  return {
    ...state,
    toggleType,
    generate,
    stopGenerate,
    toggleExpand,
    addAllToBank,
    addOneToBank,
    handleExport,
  }
}
