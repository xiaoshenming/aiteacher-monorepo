<script setup lang="ts">
import type { LessonPlan } from '~/composables/useLessonPlans'

const router = useRouter()
const lessonPlans = useLessonPlans()
const toast = useToast()

const loading = ref(true)
const list = ref<LessonPlan[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(12)
const keyword = ref('')
const showHistory = ref(false)

// 新建教案对话框
const showCreateModal = ref(false)
const creating = ref(false)

// 删除确认
const deleteTarget = ref<LessonPlan | null>(null)
const deleting = ref(false)

async function loadData() {
  loading.value = true
  try {
    let result
    if (keyword.value.trim()) {
      result = await lessonPlans.search(keyword.value.trim(), page.value, pageSize.value)
    }
    else if (showHistory.value) {
      result = await lessonPlans.fetchHistory(page.value, pageSize.value)
    }
    else {
      result = await lessonPlans.fetchList(page.value, pageSize.value)
    }
    list.value = result.list
    total.value = result.total
  }
  catch (err) {
    console.error('加载教案列表失败:', err)
    toast.add({ title: '加载教案列表失败', color: 'error' })
  }
  finally {
    loading.value = false
  }
}

async function handleCreate(name: string) {
  creating.value = true
  try {
    await lessonPlans.create(name)
    showCreateModal.value = false
    await loadData()
  }
  catch (err) {
    console.error('创建教案失败:', err)
    toast.add({ title: '创建教案失败', color: 'error' })
  }
  finally {
    creating.value = false
  }
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await lessonPlans.remove(deleteTarget.value.id)
    deleteTarget.value = null
    await loadData()
  }
  catch (err) {
    console.error('删除教案失败:', err)
    toast.add({ title: '删除教案失败', color: 'error' })
  }
  finally {
    deleting.value = false
  }
}

function openEditor(plan: LessonPlan) {
  router.push(`/user/lesson-plans/${plan.id}`)
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

watch([page, showHistory], () => loadData())

let searchTimer: ReturnType<typeof setTimeout>
watch(keyword, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadData()
  }, 300)
})

onMounted(() => loadData())
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="教案管理">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <!-- 搜索框 -->
            <div class="relative">
              <UIcon name="i-lucide-search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                v-model="keyword"
                type="text"
                placeholder="搜索教案..."
                class="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-48"
              >
            </div>

            <!-- 历史/当前切换 -->
            <div class="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <button
                class="px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                :class="!showHistory ? 'bg-teal-500 text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
                @click="showHistory = false; page = 1"
              >
                当前
              </button>
              <button
                class="px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                :class="showHistory ? 'bg-teal-500 text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
                @click="showHistory = true; page = 1"
              >
                历史
              </button>
            </div>

            <!-- 新建按钮 -->
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors cursor-pointer"
              @click="showCreateModal = true"
            >
              <UIcon name="i-lucide-plus" class="w-4 h-4" />
              新建教案
            </button>

            <!-- 刷新 -->
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
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <!-- 加载状态 -->
        <div v-if="loading && list.length === 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <SkeletonCard v-for="i in 8" :key="i" />
        </div>

        <!-- 空状态 -->
        <div v-else-if="!loading && list.length === 0" class="flex flex-col items-center justify-center py-24 text-muted">
          <UIcon name="i-lucide-file-text" class="text-4xl mb-3" />
          <p class="text-lg font-medium text-highlighted">
            {{ keyword ? '未找到匹配的教案' : (showHistory ? '暂无历史教案' : '暂无教案') }}
          </p>
          <p class="mt-1">
            {{ keyword ? '请尝试其他关键词' : '点击右上角「新建教案」开始创作' }}
          </p>
        </div>

        <!-- 教案卡片列表 -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <LessonPlansCard
            v-for="plan in list"
            :key="plan.id"
            :plan="plan"
            @open="openEditor"
            @delete="deleteTarget = $event"
          />
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
          <button
            :disabled="page <= 1"
            class="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            @click="page--"
          >
            上一页
          </button>
          <span class="text-sm text-zinc-500">{{ page }} / {{ totalPages }}</span>
          <button
            :disabled="page >= totalPages"
            class="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            @click="page++"
          >
            下一页
          </button>
        </div>
      </div>

      <!-- 新建教案对话框 -->
      <LessonPlansCreateModal
        :show="showCreateModal"
        :creating="creating"
        @update:show="showCreateModal = $event"
        @create="handleCreate"
      />

      <!-- 删除确认对话框 -->
      <Teleport to="body">
        <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="deleteTarget = null" />
          <div class="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">确认删除</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              确定要删除教案「{{ deleteTarget.name }}」吗？此操作不可撤销。
            </p>
            <div class="flex justify-end gap-2">
              <button
                class="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                @click="deleteTarget = null"
              >
                取消
              </button>
              <button
                :disabled="deleting"
                class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                @click="handleDelete"
              >
                {{ deleting ? '删除中...' : '删除' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </template>
  </UDashboardPanel>
</template>
