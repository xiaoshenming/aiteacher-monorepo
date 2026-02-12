<script setup lang="ts">
import type { FilterOptions, ResourceItem } from '~/types/resource'

const resources = useResources('testpaper')
const toast = useToast()

const loading = ref(true)
const list = ref<ResourceItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(12)

// 筛选
const filterOptions = ref<FilterOptions | null>(null)
const grade = ref('all')
const subject = ref('all')
const province = ref('all')
const city = ref('all')
const keyword = ref('')

// 详情弹窗
const detailItem = ref<ResourceItem | null>(null)

async function loadOptions() {
  try {
    filterOptions.value = await resources.fetchOptions()
  }
  catch (err) {
    console.error('加载筛选选项失败:', err)
  }
}

async function loadData() {
  loading.value = true
  try {
    let result
    if (keyword.value.trim()) {
      result = await resources.search(keyword.value.trim(), page.value, pageSize.value)
    }
    else {
      result = await resources.fetchList({
        page: page.value,
        pageSize: pageSize.value,
        grade: grade.value === 'all' ? undefined : grade.value,
        subject: subject.value === 'all' ? undefined : subject.value,
        province: province.value === 'all' ? undefined : province.value,
        city: city.value === 'all' ? undefined : city.value,
      })
    }
    list.value = result.list
    total.value = result.total
  }
  catch (err) {
    console.error('加载资源列表失败:', err)
    toast.add({ title: '加载资源列表失败', color: 'error' })
  }
  finally {
    loading.value = false
  }
}

function handleDownload(item: ResourceItem) {
  window.open(resources.downloadBodyUrl(item.id), '_blank')
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 筛选变化时重置页码并重新加载
watch([grade, subject, province, city], () => {
  page.value = 1
  loadData()
})

watch(page, () => loadData())

// 搜索防抖
let searchTimer: ReturnType<typeof setTimeout>
watch(keyword, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadData()
  }, 300)
})

onMounted(() => {
  loadOptions()
  loadData()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="试卷阅览">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <button
            class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="刷新"
            @click="loadData"
          >
            <UIcon
              name="i-lucide-refresh-cw"
              class="w-4 h-4 text-zinc-500"
              :class="{ 'animate-spin': loading }"
            />
          </button>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-4">
        <ResourceFilters
          v-model:grade="grade"
          v-model:subject="subject"
          v-model:province="province"
          v-model:city="city"
          v-model:keyword="keyword"
          :options="filterOptions"
          :loading="loading"
        />

        <ResourceGrid
          :items="list"
          :loading="loading"
          @detail="detailItem = $event"
          @download="handleDownload"
        />

        <ResourcePagination
          v-model:page="page"
          :total="total"
          :page-size="pageSize"
        />
      </div>

      <!-- 详情弹窗 -->
      <ClientOnly>
      <Teleport to="body">
        <div v-if="detailItem" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="detailItem = null" />
          <div class="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div class="flex items-start justify-between mb-4">
              <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 pr-4">
                {{ detailItem.title }}
              </h3>
              <button
                class="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                @click="detailItem = null"
              >
                <UIcon name="i-lucide-x" class="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <!-- 封面 -->
            <div v-if="detailItem.cover_url" class="mb-4 rounded-lg overflow-hidden">
              <img :src="detailItem.cover_url" :alt="detailItem.title" class="w-full object-cover max-h-60">
            </div>

            <!-- 信息列表 -->
            <div class="space-y-2 text-sm">
              <div class="flex">
                <span class="w-20 text-zinc-400 shrink-0">年级</span>
                <span class="text-zinc-900 dark:text-zinc-100">{{ detailItem.grade || '-' }}</span>
              </div>
              <div class="flex">
                <span class="w-20 text-zinc-400 shrink-0">科目</span>
                <span class="text-zinc-900 dark:text-zinc-100">{{ detailItem.subject || '-' }}</span>
              </div>
              <div class="flex">
                <span class="w-20 text-zinc-400 shrink-0">省份</span>
                <span class="text-zinc-900 dark:text-zinc-100">{{ detailItem.province || '-' }}</span>
              </div>
              <div class="flex">
                <span class="w-20 text-zinc-400 shrink-0">城市</span>
                <span class="text-zinc-900 dark:text-zinc-100">{{ detailItem.city || '-' }}</span>
              </div>
              <div class="flex">
                <span class="w-20 text-zinc-400 shrink-0">年份</span>
                <span class="text-zinc-900 dark:text-zinc-100">{{ detailItem.year || '-' }}</span>
              </div>
              <div class="flex">
                <span class="w-20 text-zinc-400 shrink-0">类型</span>
                <span class="text-zinc-900 dark:text-zinc-100">{{ detailItem.type || '-' }}</span>
              </div>
              <div class="flex">
                <span class="w-20 text-zinc-400 shrink-0">上传时间</span>
                <span class="text-zinc-900 dark:text-zinc-100">{{ formatDate(detailItem.created_at) }}</span>
              </div>
            </div>

            <!-- 下载按钮 -->
            <div class="mt-6 flex justify-end">
              <button
                class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors cursor-pointer"
                @click="handleDownload(detailItem!)"
              >
                <UIcon name="i-lucide-download" class="w-4 h-4" />
                下载 PDF
              </button>
            </div>
          </div>
        </div>
      </Teleport>
      </ClientOnly>
    </template>
  </UDashboardPanel>
</template>
