<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="flex items-center gap-2 ml-2">
            <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <UIcon name="i-lucide-share-2" class="w-4 h-4 text-primary" />
            </div>
            <h1 class="text-base font-semibold text-highlighted">共享中心</h1>
          </div>
        </template>
        <template #trailing>
          <ShareTagManager />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 space-y-4">
        <!-- Tabs -->
        <div class="flex gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 w-fit">
          <button
            v-for="tab in tabs" :key="tab.key"
            class="px-3 py-1.5 text-sm rounded-md transition-all duration-200"
            :class="activeTab === tab.key
              ? 'bg-white dark:bg-zinc-700 text-highlighted shadow-sm'
              : 'text-muted hover:text-highlighted'"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 公开广场筛选 -->
        <div v-if="activeTab === 'public'" class="flex gap-2">
          <UButton
            v-for="t in resourceTypes" :key="t.value"
            :variant="filterType === t.value ? 'solid' : 'soft'"
            :color="filterType === t.value ? 'primary' : 'neutral'"
            size="xs"
            @click="filterType = t.value; loadData()"
          >
            {{ t.label }}
          </UButton>
        </div>

        <!-- 列表 -->
        <div v-if="loading" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 6" :key="i" class="h-28 rounded-xl bg-accented animate-pulse" />
        </div>

        <div v-else-if="currentList.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ShareSharedResourceCard
            v-for="item in currentList" :key="item.id"
            :resource="item"
            :show-actions="activeTab !== 'my'"
            @toggle-favorite="handleToggleFavorite"
          />
        </div>

        <div v-else class="flex flex-col items-center justify-center py-16 text-muted">
          <UIcon name="i-lucide-inbox" class="w-12 h-12 mb-3 text-dimmed" />
          <p class="text-sm">暂无共享资源</p>
        </div>

        <!-- 分页 -->
        <div v-if="total > pageSize" class="flex justify-center pt-2">
          <UPagination v-model="page" :total="total" :items-per-page="pageSize" @update:model-value="loadData" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
const {
  myShares, sharedToMe, publicShares, schoolShares,
  loading, total,
  fetchMyShares, fetchSharedToMe, fetchPublicShares, fetchSchoolShares,
} = useResourceShare()

const { favorites, fetchFavorites, addFavorite, removeFavorite, isFavorited } = useFavorites()

const activeTab = ref('shared-to-me')
const page = ref(1)
const pageSize = 20
const filterType = ref('')

const tabs = [
  { key: 'shared-to-me', label: '分享给我的' },
  { key: 'my', label: '我分享的' },
  { key: 'public', label: '公开广场' },
  { key: 'school', label: '校内共享' },
]

const resourceTypes = [
  { value: '', label: '全部' },
  { value: 'lesson_plan', label: '教案' },
  { value: 'question', label: '题目' },
  { value: 'assignment', label: '作业' },
  { value: 'resource', label: '资源' },
]

const currentList = computed(() => {
  const map: Record<string, any[]> = {
    'shared-to-me': sharedToMe.value,
    'my': myShares.value,
    'public': publicShares.value,
    'school': schoolShares.value,
  }
  const list = map[activeTab.value] || []
  return list.map(item => ({
    ...item,
    _favorited: isFavorited(item.resource_type, item.resource_id),
  }))
})

function switchTab(key: string) {
  activeTab.value = key
  page.value = 1
  filterType.value = ''
  loadData()
}

async function loadData() {
  const p = page.value
  const loaders: Record<string, () => Promise<void>> = {
    'shared-to-me': () => fetchSharedToMe(p, pageSize),
    'my': () => fetchMyShares(p, pageSize),
    'public': () => fetchPublicShares(p, pageSize, filterType.value),
    'school': () => fetchSchoolShares(p, pageSize),
  }
  await loaders[activeTab.value]?.()
}

async function handleToggleFavorite(resource: any) {
  if (isFavorited(resource.resource_type, resource.resource_id)) {
    const fav = favorites.value.find(
      f => f.resource_type === resource.resource_type && f.resource_id === resource.resource_id,
    )
    if (fav) await removeFavorite(fav.id)
  }
  else {
    await addFavorite(resource.resource_type, resource.resource_id)
  }
  await fetchFavorites()
}

onMounted(async () => {
  await Promise.all([loadData(), fetchFavorites()])
})
</script>
