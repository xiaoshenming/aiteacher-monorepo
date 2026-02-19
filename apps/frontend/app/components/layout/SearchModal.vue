<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })
const { navItems } = useDashboardNav()

const query = ref('')
const inputRef = ref<HTMLInputElement>()

// 扁平化所有导航项用于搜索
const allItems = computed(() => {
  return navItems.value.flat().filter(item => item.to)
})

const filteredItems = computed(() => {
  if (!query.value.trim()) return allItems.value
  const q = query.value.toLowerCase()
  return allItems.value.filter(item =>
    item.label.toLowerCase().includes(q)
  )
})

// 最近访问（从 sessionStorage）
const recentPaths = ref<string[]>([])

onMounted(() => {
  try {
    const stored = sessionStorage.getItem('aiteacher-recent-pages')
    if (stored) recentPaths.value = JSON.parse(stored)
  } catch {}
})

const recentItems = computed(() => {
  return recentPaths.value
    .slice(0, 5)
    .map(path => allItems.value.find(item => item.to === path))
    .filter(Boolean)
})

function handleSelect(to: string) {
  // 记录最近访问
  const paths = [to, ...recentPaths.value.filter(p => p !== to)].slice(0, 10)
  recentPaths.value = paths
  try { sessionStorage.setItem('aiteacher-recent-pages', JSON.stringify(paths)) } catch {}

  open.value = false
  query.value = ''
  navigateTo(to)
}

watch(open, (v) => {
  if (v) {
    query.value = ''
    nextTick(() => inputRef.value?.focus())
  }
})
</script>

<template>
  <UModal v-model:open="open" :ui="{ width: 'sm:max-w-lg' }">
    <template #content>
      <div class="p-4">
        <!-- 搜索输入 -->
        <div class="flex items-center gap-2 pb-3 border-b border-default">
          <UIcon name="i-lucide-search" class="text-muted text-lg shrink-0" />
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            placeholder="搜索页面和功能..."
            class="flex-1 bg-transparent outline-none text-sm text-highlighted placeholder:text-muted"
            @keydown.esc="open = false"
          />
          <UKbd>ESC</UKbd>
        </div>

        <!-- 搜索结果 -->
        <div class="mt-3 max-h-80 overflow-y-auto">
          <!-- 最近访问 -->
          <div v-if="!query.trim() && recentItems.length > 0" class="mb-3">
            <p class="text-xs text-muted font-medium mb-1.5 px-1">最近访问</p>
            <button
              v-for="item in recentItems"
              :key="item!.to"
              class="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-default hover:bg-elevated transition-colors"
              @click="handleSelect(item!.to!)"
            >
              <UIcon :name="item!.icon || 'i-lucide-file'" class="text-muted" />
              <span>{{ item!.label }}</span>
              <UIcon name="i-lucide-clock" class="text-dimmed text-xs ml-auto" />
            </button>
          </div>

          <!-- 全部结果 -->
          <div>
            <p class="text-xs text-muted font-medium mb-1.5 px-1">
              {{ query.trim() ? '搜索结果' : '全部页面' }}
            </p>
            <div v-if="filteredItems.length === 0" class="py-8 text-center text-muted text-sm">
              <UIcon name="i-lucide-search-x" class="text-2xl mb-2" />
              <p>未找到匹配的页面</p>
            </div>
            <button
              v-for="item in filteredItems"
              :key="item.to"
              class="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-default hover:bg-elevated transition-colors"
              @click="handleSelect(item.to!)"
            >
              <UIcon :name="item.icon || 'i-lucide-file'" class="text-muted" />
              <span>{{ item.label }}</span>
              <UIcon name="i-lucide-arrow-right" class="text-dimmed text-xs ml-auto opacity-0 group-hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
