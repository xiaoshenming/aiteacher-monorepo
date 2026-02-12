<script setup lang="ts">
import type { AdminUser } from '~/types/admin'

const { apiFetch } = useApi()

const teachers = ref<AdminUser[]>([])
const loading = ref(true)
const search = ref('')

async function load() {
  loading.value = true
  try {
    teachers.value = await apiFetch<AdminUser[]>('teachers')
  }
  catch {
    // silent
  }
  finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  if (!search.value) return teachers.value
  const q = search.value.toLowerCase()
  return teachers.value.filter(t =>
    (t.name || '').toLowerCase().includes(q)
    || (t.username || '').toLowerCase().includes(q)
    || (t.email || '').toLowerCase().includes(q)
    || (t.school || '').toLowerCase().includes(q),
  )
})

const columns = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '姓名' },
  { accessorKey: 'username', header: '用户名' },
  { accessorKey: 'email', header: '邮箱' },
  { accessorKey: 'school', header: '学校' },
  { accessorKey: 'created_at', header: '注册时间' },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(load)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="本校教师表">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <UInput v-model="search" icon="i-lucide-search" placeholder="搜索教师..." class="w-48" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div v-if="loading" class="flex items-center justify-center py-24">
          <UIcon name="i-lucide-loader-2" class="text-3xl animate-spin text-muted" />
        </div>

        <div v-else-if="filtered.length === 0" class="flex flex-col items-center justify-center py-24 text-muted">
          <UIcon name="i-lucide-users" class="text-4xl mb-3" />
          <p>暂无教师数据</p>
        </div>

        <UTable v-else :data="filtered" :columns="columns">
          <template #name-cell="{ row }">
            {{ row.original.name || '-' }}
          </template>
          <template #email-cell="{ row }">
            {{ row.original.email || '-' }}
          </template>
          <template #school-cell="{ row }">
            {{ row.original.school || '-' }}
          </template>
          <template #created_at-cell="{ row }">
            {{ formatDate(row.original.created_at) }}
          </template>
        </UTable>
      </div>
    </template>
  </UDashboardPanel>
</template>
