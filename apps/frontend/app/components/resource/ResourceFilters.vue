<script setup lang="ts">
import type { FilterOptions } from '~/types/resource'

const props = defineProps<{
  options: FilterOptions | null
  loading: boolean
}>()

const grade = defineModel<string>('grade', { default: 'all' })
const subject = defineModel<string>('subject', { default: 'all' })
const province = defineModel<string>('province', { default: 'all' })
const city = defineModel<string>('city', { default: 'all' })
const keyword = defineModel<string>('keyword', { default: '' })

// 省份变化时重置城市选择
watch(province, () => {
  city.value = 'all'
})

function toOptions(items: unknown[]): { label: string, value: string }[] {
  return items.map(item =>
    typeof item === 'string' ? { label: item, value: item } : item as { label: string, value: string },
  )
}

const gradeItems = computed(() => [
  { label: '全部年级', value: 'all' },
  ...toOptions(props.options?.grades ?? []),
])
const subjectItems = computed(() => [
  { label: '全部科目', value: 'all' },
  ...toOptions(props.options?.subjects ?? []),
])
const provinceItems = computed(() => [
  { label: '全部省份', value: 'all' },
  ...toOptions(props.options?.provinces ?? []),
])
const cityItems = computed(() => [
  { label: '全部城市', value: 'all' },
  ...toOptions(props.options?.cities ?? []),
])
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <USelectMenu
      v-model="grade"
      :items="gradeItems"
      value-key="value"
      label-key="label"
      placeholder="全部年级"
      class="w-36"
      :disabled="loading"
    />
    <USelectMenu
      v-model="subject"
      :items="subjectItems"
      value-key="value"
      label-key="label"
      placeholder="全部科目"
      class="w-36"
      :disabled="loading"
    />
    <USelectMenu
      v-model="province"
      :items="provinceItems"
      value-key="value"
      label-key="label"
      placeholder="全部省份"
      class="w-36"
      :disabled="loading"
    />
    <USelectMenu
      :key="province"
      v-model="city"
      :items="cityItems"
      value-key="value"
      label-key="label"
      placeholder="全部城市"
      class="w-36"
      :disabled="loading"
    />
    <div class="relative ml-auto">
      <UIcon name="i-lucide-search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <input
        v-model="keyword"
        type="text"
        placeholder="搜索资源..."
        class="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-52"
      >
    </div>
  </div>
</template>
