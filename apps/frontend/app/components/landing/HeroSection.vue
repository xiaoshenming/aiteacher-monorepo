<script setup lang="ts">
defineProps<{
  heroImages: string[]
  showcaseImages: Array<{ src: string, alt: string }>
  heroReady: boolean
}>()
</script>

<template>
  <section class="relative min-h-[90vh] flex items-center overflow-hidden">
    <!-- Animated background -->
    <div class="absolute inset-0 -z-10">
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
      <div class="absolute inset-0 bg-gradient-to-b from-(--ui-bg)/40 via-transparent to-(--ui-bg)" />
      <div class="absolute inset-0 bg-gradient-to-r from-(--ui-bg)/60 via-transparent to-(--ui-bg)/60" />
      <div class="absolute inset-0 noise-bg opacity-[0.03] dark:opacity-[0.02] mix-blend-overlay" />
    </div>

    <UContainer class="relative">
      <div class="py-20 sm:py-28 lg:py-36">
        <div class="mx-auto max-w-3xl text-center">
          <!-- Badge -->
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

          <!-- Title -->
          <h1
            :class="[
              'text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl transition-all duration-700 delay-150 ease-out',
              heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
            ]"
          >
            让 <span class="text-primary">AI</span> 成为你的
            <br>
            <span class="bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
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

        <!-- Showcase carousel -->
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
</template>
