export interface Question {
  id: string
  type: '选择题' | '填空题' | '判断题' | '简答题' | '计算题'
  difficulty: '简单' | '中等' | '困难'
  subject: string
  content: string
  options?: string[]
  answer: string
  explanation?: string
  createdAt: string
}

export interface QuestionConfig {
  subject: string
  topic: string
  count: number
  difficulty: '简单' | '中等' | '困难'
  types: string[]
}

export interface QuestionBank {
  questions: Question[]
  lastUpdated: string
}
