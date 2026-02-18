<script setup lang="ts">
const {
  backups,
  loading,
  creating,
  deletingName,
  showDeleteConfirm,
  pendingDeleteName,
  columns,
  tableData,
  createBackup,
  downloadBackup,
  confirmDelete,
  doDelete,
} = useBackup()
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="数据备份">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="创建备份"
            :loading="creating"
            @click="createBackup"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UTable :data="tableData" :columns="columns" :loading="loading">
          <template #type-cell="{ row }">
            <UBadge :color="row.original.type === '手动' ? 'info' : 'neutral'" variant="subtle">
              {{ row.original.type }}
            </UBadge>
          </template>
          <template #actions-cell="{ row }">
            <div class="flex gap-2">
              <UButton
                size="xs"
                variant="ghost"
                icon="i-lucide-download"
                @click="downloadBackup(row.original.name)"
              />
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                icon="i-lucide-trash-2"
                :loading="deletingName === row.original.name"
                @click="confirmDelete(row.original.name)"
              />
            </div>
          </template>
        </UTable>

        <div v-if="!loading && backups.length === 0" class="text-center text-gray-500 py-12">
          暂无备份记录
        </div>
        <div v-if="!loading && backups.length === 0" class="text-center text-gray-500 py-12">
          暂无备份记录
        </div>

        <UModal v-model:open="showDeleteConfirm">
          <template #content>
            <div class="p-6">
              <h3 class="text-lg font-semibold mb-2">
                确认删除
              </h3>
              <p class="text-sm text-gray-500 mb-4">
                确定要删除备份文件 {{ pendingDeleteName }} 吗？此操作不可恢复。
              </p>
              <div class="flex justify-end gap-2">
                <UButton variant="ghost" label="取消" @click="showDeleteConfirm = false" />
                <UButton color="error" label="删除" @click="doDelete" />
              </div>
            </div>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>
