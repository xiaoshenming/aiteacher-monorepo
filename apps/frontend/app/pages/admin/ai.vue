<template>
  <AIChatPanel
    nav-title="AI 助手"
    welcome-title="AI 管理助手"
    welcome-description="我可以帮你分析平台数据、生成报告、优化系统配置。试试下面的快捷问题。"
    no-session-title="AI 管理助手"
    no-session-description="平台数据分析、系统优化建议、智能报告生成，管理员专属 AI 助手。"
    :quick-questions="[
      { label: '分析本月平台使用数据', icon: 'i-lucide-bar-chart-3' },
      { label: '查看教师活跃度排名', icon: 'i-lucide-users' },
      { label: '生成系统安全报告', icon: 'i-lucide-shield' },
      { label: '优化平台配置建议', icon: 'i-lucide-settings' },
    ]"
  />
</template>
