export function useLandingPageData() {
  const features = [
    {
      icon: 'i-lucide-bot',
      title: '智能备课助手',
      description: '利用 AI 自动生成教学计划、课件大纲，大幅提升备课效率。',
    },
    {
      icon: 'i-lucide-file-text',
      title: '智能出题与评分',
      description: '根据知识点自动生成试题，AI 辅助批改作业，精准高效。',
    },
    {
      icon: 'i-lucide-bar-chart-3',
      title: '学情数据分析',
      description: '实时追踪学生学习进度，可视化数据报表，精准教学决策。',
    },
    {
      icon: 'i-lucide-cloud',
      title: '云端资源管理',
      description: '个人云盘、试卷库、课本资源库，教学资料随时随地访问。',
    },
    {
      icon: 'i-lucide-presentation',
      title: 'AI PPT 生成',
      description: '输入主题即可自动生成精美课件，支持多种模板风格。',
    },
    {
      icon: 'i-lucide-mic',
      title: 'AI 同传助手',
      description: '课堂实时语音转文字，支持多语言翻译，无障碍教学。',
    },
  ]

  const heroImages = [
    '/images/gallery/ai-classroom-future.png',
    '/images/gallery/ai-brain-education.png',
    '/images/gallery/ai-tech-abstract.png',
    '/images/gallery/pexels-abstract-blue.jpeg',
    '/images/gallery/ai-knowledge-graph.png',
  ]

  const showcaseImages = [
    { src: '/images/gallery/ai-smart-classroom.png', alt: '智能课堂互动' },
    { src: '/images/gallery/ai-data-dashboard.png', alt: '学情数据分析' },
    { src: '/images/gallery/ai-online-learning.png', alt: '在线教育平台' },
    { src: '/images/gallery/ai-presentation.png', alt: 'AI 课件生成' },
    { src: '/images/gallery/ai-voice-recognition.png', alt: '语音识别技术' },
    { src: '/images/gallery/ai-auto-grading.png', alt: '智能批改系统' },
  ]

  const galleryRow1 = [
    '/images/gallery/pexels-classroom-tech.jpeg',
    '/images/gallery/ai-creative-education.png',
    '/images/gallery/pexels-library-shelves.jpeg',
    '/images/gallery/ai-digital-library.png',
    '/images/gallery/pexels-mountain-lake.jpeg',
    '/images/gallery/ai-graduation.png',
    '/images/gallery/pexels-coastal-view.jpeg',
    '/images/gallery/ai-cloud-storage.png',
  ]

  const galleryRow2 = [
    '/images/gallery/pexels-golden-sunset.jpeg',
    '/images/gallery/ai-team-collaboration.png',
    '/images/gallery/pexels-students-computer.jpeg',
    '/images/gallery/pexels-tablet-books.jpeg',
    '/images/gallery/pexels-office-desk.jpeg',
    '/images/gallery/pexels-workspace-minimal.jpeg',
    '/images/gallery/pexels-people-library.jpeg',
    '/images/gallery/pexels-teacher-helping.jpeg',
  ]

  const stats = [
    { value: '10,000+', label: '活跃教师' },
    { value: '500万+', label: '生成题目' },
    { value: '98%', label: '满意度' },
    { value: '60%', label: '效率提升' },
  ]

  return { features, heroImages, showcaseImages, galleryRow1, galleryRow2, stats }
}
