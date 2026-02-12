<script setup lang="ts">
const permissions = [
  { name: '查看课程', student: true, regular: true, teacher: true, admin: true, superadmin: true },
  { name: '创建课程', student: false, regular: false, teacher: true, admin: true, superadmin: true },
  { name: '管理班级', student: false, regular: false, teacher: true, admin: true, superadmin: true },
  { name: '发布作业', student: false, regular: false, teacher: true, admin: true, superadmin: true },
  { name: '使用AI工具', student: false, regular: true, teacher: true, admin: true, superadmin: true },
  { name: '云盘上传', student: false, regular: true, teacher: true, admin: true, superadmin: true },
  { name: '管理用户', student: false, regular: false, teacher: false, admin: true, superadmin: true },
  { name: '系统配置', student: false, regular: false, teacher: false, admin: false, superadmin: true },
  { name: '查看日志', student: false, regular: false, teacher: false, admin: true, superadmin: true },
  { name: '数据备份', student: false, regular: false, teacher: false, admin: false, superadmin: true },
]

const columns = [
  { accessorKey: 'name', header: '权限项' },
  { accessorKey: 'student', header: '学生' },
  { accessorKey: 'regular', header: '普通用户' },
  { accessorKey: 'teacher', header: '教师' },
  { accessorKey: 'admin', header: '管理员' },
  { accessorKey: 'superadmin', header: '超级管理员' },
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="权限配置">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-4">
        <p class="text-sm text-muted">角色权限矩阵（只读展示）</p>
        <UTable :data="permissions" :columns="columns">
          <template #student-cell="{ row }">
            <UIcon :name="row.original.student ? 'i-lucide-check' : 'i-lucide-x'" :class="row.original.student ? 'text-green-500' : 'text-red-400'" />
          </template>
          <template #regular-cell="{ row }">
            <UIcon :name="row.original.regular ? 'i-lucide-check' : 'i-lucide-x'" :class="row.original.regular ? 'text-green-500' : 'text-red-400'" />
          </template>
          <template #teacher-cell="{ row }">
            <UIcon :name="row.original.teacher ? 'i-lucide-check' : 'i-lucide-x'" :class="row.original.teacher ? 'text-green-500' : 'text-red-400'" />
          </template>
          <template #admin-cell="{ row }">
            <UIcon :name="row.original.admin ? 'i-lucide-check' : 'i-lucide-x'" :class="row.original.admin ? 'text-green-500' : 'text-red-400'" />
          </template>
          <template #superadmin-cell="{ row }">
            <UIcon :name="row.original.superadmin ? 'i-lucide-check' : 'i-lucide-x'" :class="row.original.superadmin ? 'text-green-500' : 'text-red-400'" />
          </template>
        </UTable>
      </div>
    </template>
  </UDashboardPanel>
</template>
