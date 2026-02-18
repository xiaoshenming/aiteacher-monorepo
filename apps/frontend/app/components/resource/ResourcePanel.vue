<script setup lang="ts">
import type { ResourceType } from '~/composables/useResources'
import type { FilterOptions, ResourceItem } from '~/types/resource'

const props = defineProps<{
  type: ResourceType
}>()

const resources = useResources(props.type)
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

defineExpose({ refresh: loadData })
</script>

<template>
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

  <ResourceDetailModal
    :resource="detailItem"
    @close="detailItem = null"
    @download="handleDownload"
  />
</template>
