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

const colorMap: Record<string, { bg: string, icon: string, gradient: string }> = {
  primary: {
    bg: 'bg-primary-100/80 dark:bg-primary-500/15',
    icon: 'text-primary-600 dark:text-primary-400',
    gradient: 'from-primary-500/[0.07] via-transparent to-transparent dark:from-primary-500/[0.1]',
  },
  indigo: {
    bg: 'bg-indigo-100/80 dark:bg-indigo-500/15',
    icon: 'text-indigo-600 dark:text-indigo-400',
    gradient: 'from-indigo-500/[0.07] via-transparent to-transparent dark:from-indigo-500/[0.1]',
  },
  amber: {
    bg: 'bg-amber-100/80 dark:bg-amber-500/15',
    icon: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500/[0.07] via-transparent to-transparent dark:from-amber-500/[0.1]',
  },
  rose: {
    bg: 'bg-rose-100/80 dark:bg-rose-500/15',
    icon: 'text-rose-600 dark:text-rose-400',
    gradient: 'from-rose-500/[0.07] via-transparent to-transparent dark:from-rose-500/[0.1]',
  },
  sky: {
    bg: 'bg-sky-100/80 dark:bg-sky-500/15',
    icon: 'text-sky-600 dark:text-sky-400',
    gradient: 'from-sky-500/[0.07] via-transparent to-transparent dark:from-sky-500/[0.1]',
  },
  emerald: {
    bg: 'bg-emerald-100/80 dark:bg-emerald-500/15',
    icon: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500/[0.07] via-transparent to-transparent dark:from-emerald-500/[0.1]',
  },
  violet: {
    bg: 'bg-violet-100/80 dark:bg-violet-500/15',
    icon: 'text-violet-600 dark:text-violet-400',
    gradient: 'from-violet-500/[0.07] via-transparent to-transparent dark:from-violet-500/[0.1]',
  },
}

const colors = computed(() => colorMap[props.color] || colorMap.primary)

const animatedValue = ref(0)
const isNumeric = computed(() => typeof props.value === 'number')

watch(() => props.value, (val) => {
  if (typeof val === 'number') {
    gsap.to(animatedValue, { value: val, duration: 1, ease: 'power2.out', roundProps: 'value' })
  }
}, { immediate: true })

const displayValue = computed(() => isNumeric.value ? animatedValue.value : props.value)
</script>

<template>
  <component
    :is="to ? resolveComponent('NuxtLink') : 'div'"
    :to="to"
    class="dashboard-card rounded-xl border border-[var(--ui-border-accented)]/60 bg-gradient-to-br p-4
           hover:border-[var(--ui-border-accented)] transition-all duration-200 block
           dark:border-white/[0.06] dark:hover:border-white/[0.1]"
    :class="colors.gradient"
  >
    <template v-if="loading">
      <div class="space-y-2">
        <USkeleton class="w-10 h-10 rounded-xl" />
        <USkeleton class="h-8 w-16" />
        <USkeleton class="h-3.5 w-20" />
      </div>
    </template>
    <template v-else>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          :class="colors.bg"
        >
          <UIcon :name="icon" class="text-lg" :class="colors.icon" />
        </div>
        <div class="min-w-0">
          <div class="text-[13px] text-[var(--ui-text-muted)] font-medium leading-none">
            {{ label }}
          </div>
          <div class="text-2xl font-extrabold text-[var(--ui-text-highlighted)] leading-tight tracking-tight tabular-nums mt-0.5">
            {{ displayValue }}<span v-if="unit" class="text-sm font-medium text-[var(--ui-text-muted)] ml-0.5 tracking-normal">{{ unit }}</span>
          </div>
        </div>
      </div>
    </template>
  </component>
</template>
