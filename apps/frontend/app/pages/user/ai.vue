<template>
  <AIChatPanel
    nav-title="AI 问答"
    welcome-title="AI 教学助手"
    welcome-description="我可以帮你设计教案、生成试卷、解答教学问题。试试下面的快捷问题，或直接输入你的问题。"
    no-session-title="AI 教学助手"
    no-session-description="智能备课、教案生成、试卷设计、教学问答，一站式 AI 教学辅助平台。"
    :quick-questions="[
      { label: '帮我设计一份小学数学教案', icon: 'i-lucide-book-open' },
      { label: '如何提高课堂互动效果？', icon: 'i-lucide-lightbulb' },
      { label: '帮我生成一份期末考试试卷', icon: 'i-lucide-file-text' },
      { label: '推荐一些创新教学方法', icon: 'i-lucide-graduation-cap' },
    ]"
  />
</template>
