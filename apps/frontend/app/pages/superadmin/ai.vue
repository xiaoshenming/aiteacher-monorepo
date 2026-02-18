<template>
  <AIChatPanel
    nav-title="AI 超管助手"
    welcome-title="AI 超管助手"
    welcome-description="全平台运维监控、用户增长分析、安全审计、性能优化，超级管理员专属 AI 助手。"
    no-session-title="AI 超管助手"
    no-session-description="全平台运维监控、用户增长分析、安全审计、性能优化，超级管理员专属 AI 助手。"
    :quick-questions="[
      { label: '查看全平台运行状态', icon: 'i-lucide-activity' },
      { label: '分析用户增长趋势', icon: 'i-lucide-trending-up' },
      { label: '生成安全审计报告', icon: 'i-lucide-shield' },
      { label: '优化系统性能建议', icon: 'i-lucide-zap' },
    ]"
  />
</template>
