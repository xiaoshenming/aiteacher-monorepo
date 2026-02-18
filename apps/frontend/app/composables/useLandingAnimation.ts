import type { ComponentPublicInstance } from 'vue'

type MaybeElement = HTMLElement | ComponentPublicInstance | null | undefined

export function useLandingAnimation(featuresCount: number) {
  const heroReady = ref(false)
  const visibleCards = ref<number[]>([])
  const statsVisible = ref(false)
  const featuresRef = ref<MaybeElement>(null)
  const statsRef = ref<MaybeElement>(null)

  onMounted(() => {
    setTimeout(() => { heroReady.value = true }, 100)
  })

  // Features staggered reveal
  useIntersectionObserver(featuresRef, ([entry]) => {
    if (entry?.isIntersecting) {
      Array.from({ length: featuresCount }).forEach((_, i) => {
        setTimeout(() => { visibleCards.value.push(i) }, 150 * i)
      })
    }
  }, { threshold: 0.1 })

  // Stats counter animation
  useIntersectionObserver(statsRef, ([entry]) => {
    if (entry?.isIntersecting) {
      statsVisible.value = true
    }
  }, { threshold: 0.3 })

  return {
    heroReady,
    visibleCards,
    statsVisible,
    featuresRef,
    statsRef,
  }
}
