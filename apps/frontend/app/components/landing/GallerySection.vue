<script setup lang="ts">
defineProps<{
  galleryRow1: string[]
  galleryRow2: string[]
}>()
</script>

<template>
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
          <NuxtImg :src="img" alt="" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
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
          <NuxtImg :src="img" alt="" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        </div>
      </div>
    </div>
  </section>
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
