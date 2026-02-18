<script setup lang="ts">
const links = [
  { label: '立即注册', color: 'primary' as const, size: 'xl' as const, to: '/login?tab=register', trailingIcon: 'i-lucide-arrow-right' },
  { label: '联系我们', color: 'neutral' as const, variant: 'outline' as const, size: 'xl' as const, icon: 'i-lucide-mail' },
]
</script>

<template>
  <section class="border-t border-default">
    <UPageCTA
      title="准备好提升教学效率了吗？"
      description="立即注册，免费体验 AI 教学助手的全部功能。"
      :links="links"
    />
  </section>
</template>
