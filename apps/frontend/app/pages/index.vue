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

// Hero carousel images
const heroImages = [
  '/images/gallery/ai-classroom-future.png',
  '/images/gallery/ai-brain-education.png',
  '/images/gallery/ai-tech-abstract.png',
  '/images/gallery/pexels-abstract-blue.jpeg',
  '/images/gallery/ai-knowledge-graph.png',
]

// Showcase carousel - education themed
const showcaseImages = [
  { src: '/images/gallery/ai-smart-classroom.png', alt: '智能课堂互动' },
  { src: '/images/gallery/ai-data-dashboard.png', alt: '学情数据分析' },
  { src: '/images/gallery/ai-online-learning.png', alt: '在线教育平台' },
  { src: '/images/gallery/ai-presentation.png', alt: 'AI 课件生成' },
  { src: '/images/gallery/ai-voice-recognition.png', alt: '语音识别技术' },
  { src: '/images/gallery/ai-auto-grading.png', alt: '智能批改系统' },
]

// Gallery images for marquee
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

// Stats
const stats = [
  { value: '10,000+', label: '活跃教师' },
  { value: '500万+', label: '生成题目' },
  { value: '98%', label: '满意度' },
  { value: '60%', label: '效率提升' },
]

// Staggered animation
const visibleCards = ref<number[]>([])
const featuresRef = ref<HTMLElement | null>(null)
const heroReady = ref(false)
const statsRef = ref<HTMLElement | null>(null)
const statsVisible = ref(false)

onMounted(() => {
  // Hero entrance animation
  setTimeout(() => { heroReady.value = true }, 100)

  // Features staggered reveal
  if (featuresRef.value) {
    const { stop } = useIntersectionObserver(featuresRef, ([entry]) => {
      if (entry?.isIntersecting) {
        features.forEach((_, i) => {
          setTimeout(() => { visibleCards.value.push(i) }, 150 * i)
        })
        stop()
      }
    }, { threshold: 0.1 })
  }

  // Stats counter animation
  if (statsRef.value) {
    const { stop } = useIntersectionObserver(statsRef, ([entry]) => {
      if (entry?.isIntersecting) {
        statsVisible.value = true
        stop()
      }
    }, { threshold: 0.3 })
  }
})
</script>

<template>
  <div>
    <!-- ==================== HERO SECTION ==================== -->
    <section class="relative min-h-[90vh] flex items-center overflow-hidden">
      <!-- Animated background -->
      <div class="absolute inset-0 -z-10">
        <!-- Background carousel with crossfade -->
        <UCarousel
          v-slot="{ item }"
          :items="heroImages"
          loop
          :autoplay="{ delay: 4000 }"
          class="absolute inset-0"
          :ui="{ root: 'h-full', viewport: 'h-full', item: 'min-w-full' }"
        >
          <img
            :src="item"
            alt=""
            class="h-full w-full object-cover opacity-25 dark:opacity-15 scale-105"
          >
        </UCarousel>
        <!-- Gradient overlays -->
        <div class="absolute inset-0 bg-gradient-to-b from-(--ui-bg)/40 via-transparent to-(--ui-bg)" />
        <div class="absolute inset-0 bg-gradient-to-r from-(--ui-bg)/60 via-transparent to-(--ui-bg)/60" />
        <!-- Noise texture -->
        <div class="absolute inset-0 noise-bg opacity-[0.03] dark:opacity-[0.02] mix-blend-overlay" />
      </div>

      <UContainer class="relative">
        <div class="py-20 sm:py-28 lg:py-36">
          <div class="mx-auto max-w-3xl text-center">
            <!-- Badge with entrance animation -->
            <div
              :class="[
                'transition-all duration-700 ease-out',
                heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4',
              ]"
            >
              <UBadge
                label="AI 驱动的教学新体验"
                variant="subtle"
                color="primary"
                size="lg"
                class="mb-8"
              />
            </div>

            <!-- Title with staggered entrance -->
            <h1
              :class="[
                'text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl transition-all duration-700 delay-150 ease-out',
                heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
              ]"
            >
              让 <span class="text-primary">AI</span> 成为你的
              <br>
              <span class="bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent">
                教学助手
              </span>
            </h1>

            <!-- Description -->
            <p
              :class="[
                'mt-8 text-lg sm:text-xl leading-relaxed text-muted max-w-2xl mx-auto transition-all duration-700 delay-300 ease-out',
                heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
              ]"
            >
              集智能备课、自动出题、学情分析、云端资源于一体的 AI 教学平台，帮助教师提升教学效率，实现精准教学。
            </p>

            <!-- CTA Buttons -->
            <div
              :class="[
                'mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-500 ease-out',
                heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
              ]"
            >
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

          <!-- Hero showcase image with blur-in effect -->
          <div
            :class="[
              'mt-20 mx-auto max-w-5xl transition-all duration-1000 delay-700 ease-out',
              heroReady ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-10 blur-md',
            ]"
          >
            <div class="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-default">
              <UCarousel
                v-slot="{ item }"
                :items="showcaseImages"
                loop
                arrows
                dots
                :autoplay="{ delay: 3000 }"
                :ui="{ item: 'basis-full' }"
              >
                <div class="relative aspect-video w-full">
                  <img
                    :src="item.src"
                    :alt="item.alt"
                    class="w-full h-full object-cover"
                  >
                  <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div class="absolute bottom-4 left-6 right-6">
                    <p class="text-sm font-medium text-white drop-shadow-lg">
                      {{ item.alt }}
                    </p>
                  </div>
                </div>
              </UCarousel>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- ==================== STATS SECTION ==================== -->
    <section class="border-t border-default bg-primary/5">
      <UContainer>
        <div ref="statsRef" class="py-16 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            v-for="(stat, index) in stats"
            :key="stat.label"
            :class="[
              'text-center transition-all duration-500 ease-out',
              statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            ]"
            :style="{ transitionDelay: `${index * 100}ms` }"
          >
            <div class="text-3xl sm:text-4xl font-bold text-primary">
              {{ stat.value }}
            </div>
            <div class="mt-2 text-sm text-muted">
              {{ stat.label }}
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- ==================== FEATURES SECTION ==================== -->
    <section id="features" class="border-t border-default">
      <UContainer>
        <div class="py-24 sm:py-32">
          <div class="mx-auto max-w-2xl text-center mb-16">
            <UBadge label="核心功能" variant="subtle" color="primary" class="mb-4" />
            <h2 class="text-3xl font-bold tracking-tight sm:text-5xl">
              全方位 AI 赋能
            </h2>
            <p class="mt-4 text-lg text-muted">
              覆盖教学全流程，让每一个环节都更智能
            </p>
          </div>

          <div ref="featuresRef" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <UCard
              v-for="(feature, index) in features"
              :key="feature.title"
              variant="subtle"
              :class="[
                'transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1',
                visibleCards.includes(index)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8',
              ]"
            >
              <div class="flex flex-col gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <UIcon :name="feature.icon" class="h-6 w-6 text-primary" />
                </div>
                <h3 class="text-lg font-semibold">{{ feature.title }}</h3>
                <p class="text-sm text-muted leading-relaxed">
                  {{ feature.description }}
                </p>
              </div>
            </UCard>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- ==================== SHOWCASE GALLERY ==================== -->
    <section class="border-t border-default">
      <UContainer>
        <div class="pt-24 sm:pt-32 pb-8 text-center">
          <UBadge label="教学场景" variant="subtle" color="primary" class="mb-4" />
          <h2 class="text-3xl font-bold tracking-tight sm:text-5xl">
            丰富的教学场景
          </h2>
          <p class="mt-4 text-lg text-muted">
            从课堂到云端，AI 助力每一个教学环节
          </p>
        </div>
      </UContainer>

      <!-- Scrolling Row 1 -->
      <div class="marquee-wrapper group py-6">
        <div class="marquee-track group-hover:[animation-play-state:paused]">
          <div
            v-for="(img, i) in [...galleryRow1, ...galleryRow1]"
            :key="`r1-${i}`"
            class="marquee-item"
          >
            <img :src="img" alt="" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500">
          </div>
        </div>
      </div>

      <!-- Scrolling Row 2 (reverse) -->
      <div class="marquee-wrapper group pt-4 pb-24 sm:pb-32">
        <div class="marquee-track marquee-reverse group-hover:[animation-play-state:paused]">
          <div
            v-for="(img, i) in [...galleryRow2, ...galleryRow2]"
            :key="`r2-${i}`"
            class="marquee-item"
          >
            <img :src="img" alt="" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500">
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== ABOUT SECTION ==================== -->
    <section id="about" class="border-t border-default">
      <UPageSection
        headline="关于我们"
        title="为什么选择 AI教学助手？"
        description="我们深知教师的时间宝贵。AI教学助手将繁琐的备课、出题、批改工作交给人工智能，让教师专注于最重要的事——教学本身。"
        orientation="horizontal"
        :links="[
          { label: '立即体验', color: 'primary' as const, to: '/login', trailingIcon: 'i-lucide-arrow-right', size: 'lg' as const },
        ]"
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

    <!-- ==================== CTA SECTION ==================== -->
    <section class="border-t border-default">
      <UPageCTA
        title="准备好提升教学效率了吗？"
        description="立即注册，免费体验 AI 教学助手的全部功能。"
        :links="[
          { label: '立即注册', color: 'primary' as const, size: 'xl' as const, to: '/login?tab=register', trailingIcon: 'i-lucide-arrow-right' },
          { label: '联系我们', color: 'neutral' as const, variant: 'outline' as const, size: 'xl' as const, icon: 'i-lucide-mail' },
        ]"
      />
    </section>
  </div>
</template>

<style scoped>
.marquee-wrapper {
  overflow: hidden;
  width: 100%;
  mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
}

.marquee-track {
  display: flex;
  gap: 1.5rem;
  width: max-content;
  animation: scroll-left 50s linear infinite;
}

.marquee-reverse {
  animation: scroll-right 55s linear infinite;
}

.marquee-item {
  position: relative;
  width: 18rem;
  height: 12rem;
  flex-shrink: 0;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 0 0 1px var(--ui-border);
  transition: box-shadow 0.3s;
}

.marquee-item:hover {
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

@keyframes scroll-left {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@keyframes scroll-right {
  0% {
    transform: translateX(-50%);
  }
  100% {
    transform: translateX(0);
  }
}
</style>
