<script setup lang="ts">
const route = useRoute()

const planId = computed(() => Number(route.params.id))
const editorComponent = ref<{ editor: import('@tiptap/vue-3').Editor | undefined }>()

const {
  loading,
  saving,
  planName,
  planContent,
  hasUnsavedChanges,
  loadPlan,
  savePlan,
  goBack,
  getExportItems,
  cleanup,
} = useLessonPlanEditor(planId)

const exportItems = getExportItems(editorComponent)

onMounted(() => loadPlan())
onBeforeUnmount(() => cleanup())
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-2">
            <UDashboardSidebarCollapse />
            <button
              class="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="返回列表"
              @click="goBack"
            >
              <UIcon name="i-lucide-arrow-left" class="w-4 h-4 text-zinc-500" />
            </button>
            <input
              v-model="planName"
              type="text"
              class="text-sm font-semibold bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 w-48 sm:w-64"
              placeholder="教案名称"
              @blur="savePlan"
            >
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <span v-if="saving" class="text-xs text-zinc-400 flex items-center gap-1">
              <UIcon name="i-lucide-loader-2" class="w-3 h-3 animate-spin" />
              保存中...
            </span>
            <span v-else-if="hasUnsavedChanges" class="text-xs text-amber-500">
              未保存
            </span>
            <span v-else class="text-xs text-teal-500">
              已保存
            </span>
            <UDropdownMenu :items="exportItems">
              <button
                class="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <UIcon name="i-lucide-download" class="w-4 h-4" />
                导出
              </button>
            </UDropdownMenu>
            <button
              :disabled="!hasUnsavedChanges || saving"
              class="px-3 py-1.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              @click="savePlan"
            >
              保存
            </button>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-teal-500" />
      </div>

      <!-- 编辑器区域 -->
      <div v-else class="h-full">
        <EditorLessonPlanEditorLazy ref="editorComponent" v-model="planContent" />
      </div>
    </template>
  </UDashboardPanel>
</template>
