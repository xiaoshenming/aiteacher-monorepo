<script setup lang="ts">
const links = [
  { label: '立即体验', color: 'primary' as const, to: '/login', trailingIcon: 'i-lucide-arrow-right', size: 'lg' as const },
]
</script>

<template>
  <section id="about" class="border-t border-default">
    <UPageSection
      headline="关于我们"
      title="为什么选择 AI教学助手？"
      description="我们深知教师的时间宝贵。AI教学助手将繁琐的备课、出题、批改工作交给人工智能，让教师专注于最重要的事——教学本身。"
      orientation="horizontal"
      :links="links"
      :features="[
        { icon: 'i-lucide-clock', title: '节省 60% 备课时间', description: 'AI 自动生成教学计划和课件大纲' },
        { icon: 'i-lucide-target', title: '精准学情分析', description: 'AI 精准分析每位学生的学习状况' },
        { icon: 'i-lucide-layers', title: '多学科支持', description: '支持多学科、多年级的教学场景' },
        { icon: 'i-lucide-shield-check', title: '数据安全', description: '符合教育行业标准的数据安全保障' },
      ]"
    >
      <div class="relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-default">
        <img
          src="/images/gallery/ai-digital-library.png"
          alt="数字化教学"
          class="w-full h-auto"
        >
      </div>
    </UPageSection>
  </section>
</template>
