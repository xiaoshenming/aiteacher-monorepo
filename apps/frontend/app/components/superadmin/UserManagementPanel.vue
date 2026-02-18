<script setup lang="ts">
const {
  search,
  roleFilter,
  loading,
  roleOptions,
  roleMap,
  columns,
  filteredUsers,
  showAddModal,
  showEditModal,
  form,
  openAdd,
  openEdit,
  submitAdd,
  submitEdit,
  deleteUser,
} = useUserManagement()
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="用户管理">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" label="新增用户" @click="openAdd" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-4">
        <div class="flex gap-3 items-center">
          <UInput v-model="search" placeholder="搜索姓名或邮箱..." icon="i-lucide-search" class="w-64" />
          <USelectMenu v-model="roleFilter" :items="roleOptions" value-key="value" class="w-40" />
        </div>

        <UTable :data="filteredUsers" :columns="columns" :loading="loading">
          <template #role-cell="{ row }">
            <UBadge variant="subtle">{{ roleMap[String(row.original.role)] || '未知' }}</UBadge>
          </template>
          <template #actions-cell="{ row }">
            <div class="flex gap-2">
              <UButton size="xs" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row.original)" />
              <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="deleteUser(row.original)" />
            </div>
          </template>
        </UTable>
      </div>

      <!-- 新增用户弹窗 -->
      <UModal v-model:open="showAddModal">
        <template #content>
          <div class="p-6 space-y-4">
            <h3 class="text-lg font-semibold text-highlighted">新增用户</h3>
            <UInput v-model="form.name" placeholder="姓名" />
            <UInput v-model="form.email" placeholder="邮箱" type="email" />
            <UInput v-model="form.password" placeholder="密码" type="password" />
            <USelectMenu v-model="form.role" :items="roleOptions.slice(1)" value-key="value" />
            <div class="flex justify-end gap-2">
              <UButton variant="ghost" label="取消" @click="showAddModal = false" />
              <UButton label="确认" @click="submitAdd" />
            </div>
          </div>
        </template>
      </UModal>

      <!-- 编辑用户弹窗 -->
      <UModal v-model:open="showEditModal">
        <template #content>
          <div class="p-6 space-y-4">
            <h3 class="text-lg font-semibold text-highlighted">编辑用户</h3>
            <UInput v-model="form.name" placeholder="姓名" />
            <UInput v-model="form.email" placeholder="邮箱" type="email" />
            <UInput v-model="form.password" placeholder="新密码（留空不修改）" type="password" />
            <USelectMenu v-model="form.role" :items="roleOptions.slice(1)" value-key="value" />
            <div class="flex justify-end gap-2">
              <UButton variant="ghost" label="取消" @click="showEditModal = false" />
              <UButton label="保存" @click="submitEdit" />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
