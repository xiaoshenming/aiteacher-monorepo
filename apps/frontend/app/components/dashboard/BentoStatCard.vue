<script setup lang="ts">
import gsap from 'gsap'

const props = withDefaults(defineProps<{
  icon: string
  label: string
  value: number | string
  unit?: string
  color?: 'primary' | 'indigo' | 'amber' | 'rose' | 'sky' | 'emerald' | 'violet'
  loading?: boolean
  to?: string
}>(), {
  color: 'primary',
})

const colorMap: Record<string, { bg: string, icon: string }> = {
  primary: { bg: 'bg-primary-50 dark:bg-primary-900/20', icon: 'text-primary-500' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: 'text-indigo-500' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-500' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', icon: 'text-rose-500' },
  sky: { bg: 'bg-sky-50 dark:bg-sky-900/20', icon: 'text-sky-500' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-500' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', icon: 'text-violet-500' },
}

const colors = computed(() => colorMap[props.color] || colorMap.primary)

const animatedValue = ref(0)
const isNumeric = computed(() => typeof props.value === 'number')

watch(() => props.value, (val) => {
  if (typeof val === 'number') {
    gsap.to(animatedValue, { value: val, duration: 1, ease: 'power2.out', roundProps: 'value' })
  }
}, { immediate: true })

const displayValue = computed(() => {
  if (isNumeric.value) return animatedValue.value
  return props.value
})
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 block"
  >
    <template v-if="loading">
      <div class="space-y-2">
        <USkeleton class="w-9 h-9 rounded-lg" />
        <USkeleton class="h-7 w-14" />
        <USkeleton class="h-3.5 w-20" />
      </div>
    </template>
    <template v-else>
      <div
        class="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
        :class="colors.bg"
      >
        <UIcon :name="icon" class="text-base" :class="colors.icon" />
      </div>
      <div class="text-xl font-bold text-highlighted leading-tight">
        {{ displayValue }}<span v-if="unit" class="text-xs font-normal text-muted ml-1">{{ unit }}</span>
      </div>
      <div class="text-xs text-muted mt-0.5">
        {{ label }}
      </div>
    </template>
  </NuxtLink>
  <div
    v-else
    class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 block"
  >
    <template v-if="loading">
      <div class="space-y-2">
        <USkeleton class="w-9 h-9 rounded-lg" />
        <USkeleton class="h-7 w-14" />
        <USkeleton class="h-3.5 w-20" />
      </div>
    </template>
    <template v-else>
      <div
        class="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
        :class="colors.bg"
      >
        <UIcon :name="icon" class="text-base" :class="colors.icon" />
      </div>
      <div class="text-xl font-bold text-highlighted leading-tight">
        {{ displayValue }}<span v-if="unit" class="text-xs font-normal text-muted ml-1">{{ unit }}</span>
      </div>
      <div class="text-xs text-muted mt-0.5">
        {{ label }}
      </div>
    </template>
  </div>
</template>
