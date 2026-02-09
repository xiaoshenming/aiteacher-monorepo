<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

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

// Staggered animation for feature cards
const visibleCards = ref<number[]>([])

onMounted(() => {
  features.forEach((_, i) => {
    setTimeout(() => {
      visibleCards.value.push(i)
    }, 150 * i)
  })
})
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <!-- Background hero image -->
      <div class="absolute inset-0 -z-10">
        <img
          src="https://images.pexels.com/photos/7130558/pexels-photo-7130558.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt=""
          class="h-full w-full object-cover opacity-20 dark:opacity-10"
        >
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-(--ui-bg)/80 to-(--ui-bg)" />
      </div>

      <UContainer>
        <div class="py-24 sm:py-32 lg:py-40">
          <div class="mx-auto max-w-2xl text-center">
            <UBadge
              label="AI 驱动的教学新体验"
              variant="subtle"
              color="primary"
              class="mb-6"
            />
            <h1 class="text-4xl font-bold tracking-tight sm:text-6xl">
              让 <span class="text-primary">AI</span> 成为你的
              <br>
              <span class="text-primary">教学助手</span>
            </h1>
            <p class="mt-6 text-lg leading-8 text-muted">
              集智能备课、自动出题、学情分析、云端资源于一体的 AI 教学平台，帮助教师提升教学效率，实现精准教学。
            </p>
            <div class="mt-10 flex items-center justify-center gap-4">
              <UButton
                label="免费开始使用"
                color="primary"
                size="xl"
                to="/login"
                trailing-icon="i-lucide-arrow-right"
              />
              <UButton
                label="了解更多"
                color="neutral"
                variant="outline"
                size="xl"
                to="#features"
              />
            </div>
          </div>

          <!-- Hero image showcase -->
          <div class="mt-16 mx-auto max-w-4xl">
            <div class="relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-default">
              <img
                src="https://images.pexels.com/photos/5621938/pexels-photo-5621938.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                alt="AI 教育技术"
                class="w-full h-auto"
              >
              <div class="absolute inset-0 bg-gradient-to-t from-(--ui-bg)/60 to-transparent" />
              <div class="absolute bottom-6 left-6 right-6">
                <p class="text-sm font-medium text-white drop-shadow-lg">
                  AI 赋能课堂，让每一位学生都能获得个性化的学习体验
                </p>
              </div>
            </div>
            <p class="mt-2 text-xs text-muted text-center">
              Photo by Gustavo Fring on Pexels
            </p>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Features Section -->
    <section id="features" class="border-t border-default">
      <UContainer>
        <div class="py-24">
          <div class="mx-auto max-w-2xl text-center mb-16">
            <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">
              核心功能
            </h2>
            <p class="mt-4 text-lg text-muted">
              全方位 AI 赋能，覆盖教学全流程
            </p>
          </div>

          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <UCard
              v-for="(feature, index) in features"
              :key="feature.title"
              :class="[
                'transition-all duration-500',
                visibleCards.includes(index)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4',
              ]"
            >
              <div class="flex flex-col gap-3">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <UIcon :name="feature.icon" class="h-5 w-5 text-primary" />
                  </div>
                  <h3 class="font-semibold">{{ feature.title }}</h3>
                </div>
                <p class="text-sm text-muted leading-relaxed">
                  {{ feature.description }}
                </p>
              </div>
            </UCard>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- About Section -->
    <section id="about" class="border-t border-default">
      <UContainer>
        <div class="py-24">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">
                为什么选择 AI教学助手？
              </h2>
              <p class="mt-6 text-lg text-muted leading-relaxed">
                我们深知教师的时间宝贵。AI教学助手将繁琐的备课、出题、批改工作交给人工智能，让教师专注于最重要的事——教学本身。
              </p>
              <ul class="mt-8 space-y-4">
                <li class="flex items-start gap-3">
                  <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span class="text-muted">节省 60% 以上的备课时间</span>
                </li>
                <li class="flex items-start gap-3">
                  <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span class="text-muted">AI 精准分析每位学生的学习状况</span>
                </li>
                <li class="flex items-start gap-3">
                  <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span class="text-muted">支持多学科、多年级的教学场景</span>
                </li>
                <li class="flex items-start gap-3">
                  <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span class="text-muted">数据安全，符合教育行业标准</span>
                </li>
              </ul>
            </div>
            <div class="relative rounded-xl overflow-hidden shadow-xl ring-1 ring-default">
              <img
                src="https://images.pexels.com/photos/33449528/pexels-photo-33449528.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                alt="数字化课堂"
                class="w-full h-auto"
              >
              <p class="absolute bottom-2 right-3 text-xs text-white/70 drop-shadow">
                Photo by Gu Ko on Pexels
              </p>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- CTA Section -->
    <section class="border-t border-default bg-primary/5">
      <UContainer>
        <div class="py-24">
          <div class="mx-auto max-w-2xl text-center">
            <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">
              准备好提升教学效率了吗？
            </h2>
            <p class="mt-4 text-lg text-muted">
              立即注册，免费体验 AI 教学助手的全部功能。
            </p>
            <div class="mt-8 flex items-center justify-center gap-4">
              <UButton
                label="立即注册"
                color="primary"
                size="xl"
                to="/login?tab=register"
              />
              <UButton
                label="联系我们"
                color="neutral"
                variant="ghost"
                size="xl"
                icon="i-lucide-mail"
              />
            </div>
          </div>
        </div>
      </UContainer>
    </section>
  </div>
</template>
