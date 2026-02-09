<script setup lang="ts">
const columns = [{
  label: '产品',
  children: [{
    label: 'AI 备课',
  }, {
    label: 'AI 出题',
  }, {
    label: '语音识别',
  }, {
    label: '智能批改',
  }],
}, {
  label: '资源',
  children: [{
    label: '帮助中心',
  }, {
    label: '使用文档',
  }, {
    label: '更新日志',
  }, {
    label: 'API 接口',
  }],
}, {
  label: '关于',
  children: [{
    label: '关于我们',
  }, {
    label: '联系我们',
  }, {
    label: '隐私政策',
  }, {
    label: '服务条款',
  }],
}]
</script>

<template>
  <USeparator icon="i-lucide-graduation-cap" class="h-px" />

  <UFooter :ui="{ top: 'border-b border-default' }">
    <template #top>
      <UContainer>
        <UFooterColumns :columns="columns" />
      </UContainer>
    </template>

    <template #left>
      <p class="text-muted text-sm">
        AI教学助手 &middot; {{ new Date().getFullYear() }} All rights reserved.
      </p>
    </template>

    <template #right>
      <UButton
        icon="i-simple-icons-github"
        aria-label="GitHub"
        color="neutral"
        variant="ghost"
      />
      <UButton
        icon="i-simple-icons-wechat"
        aria-label="微信"
        color="neutral"
        variant="ghost"
      />
      <UButton
        icon="i-lucide-mail"
        aria-label="邮箱"
        color="neutral"
        variant="ghost"
      />
    </template>
  </UFooter>
</template>
