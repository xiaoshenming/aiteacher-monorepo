<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { features, heroImages, showcaseImages, galleryRow1, galleryRow2, stats } = useLandingPageData()
const { heroReady, visibleCards, statsVisible, featuresRef, statsRef } = useLandingAnimation(features.length)
</script>

<template>
  <div>
    <LandingHeroSection :hero-images="heroImages" :showcase-images="showcaseImages" :hero-ready="heroReady" />
    <LandingStatsSection ref="statsRef" :stats="stats" :stats-visible="statsVisible" />
    <LandingFeaturesSection ref="featuresRef" :features="features" :visible-cards="visibleCards" />
    <LandingGallerySection :gallery-row1="galleryRow1" :gallery-row2="galleryRow2" />
    <LandingAboutSection />
    <LandingCTASection />
  </div>
</template>
