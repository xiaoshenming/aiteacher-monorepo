<script setup lang="ts">
const { apiFetch } = useApi()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const profile = ref<any>(null)

const editForm = ref({ email: '', phoneNumber: '', address: '' })

async function loadProfile() {
  loading.value = true
  try {
    const res = await apiFetch<{ code: number, data: any }>('/students/profile')
    if (res.code === 200) {
      profile.value = res.data
      editForm.value = {
        email: res.data.email || '',
        phoneNumber: res.data.phoneNumber || '',
        address: res.data.address || '',
      }
    }
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  saving.value = true
  try {
    const res = await apiFetch<{ code: number, message: string }>('/students/profile', {
      method: 'PUT',
      body: editForm.value,
    })
    if (res.code === 200) {
      toast.add({ title: '保存成功', color: 'success' })
      await loadProfile()
    }
  } finally {
    saving.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="个人中心">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 max-w-2xl">
        <div v-if="loading" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl" />
        </div>
        <template v-else-if="profile">
          <UCard>
            <template #header>
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UIcon name="i-lucide-user" class="text-3xl text-primary" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-highlighted">{{ profile.username }}</h2>
                  <p class="text-sm text-muted">学号：{{ profile.student_number }}</p>
                </div>
              </div>
            </template>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-muted">性别</p>
                  <p class="text-sm text-highlighted">{{ profile.gender === 1 ? '男' : profile.gender === 0 ? '女' : '未设置' }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted">生日</p>
                  <p class="text-sm text-highlighted">{{ profile.birthday || '未设置' }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted">入学年份</p>
                  <p class="text-sm text-highlighted">{{ profile.entry_year || '未设置' }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted">学校</p>
                  <p class="text-sm text-highlighted">{{ profile.school_name || '未设置' }}</p>
                </div>
              </div>

              <USeparator />

              <div class="space-y-3">
                <h3 class="text-sm font-medium text-highlighted">可编辑信息</h3>
                <UFormField label="邮箱">
                  <UInput v-model="editForm.email" placeholder="请输入邮箱" />
                </UFormField>
                <UFormField label="手机号">
                  <UInput v-model="editForm.phoneNumber" placeholder="请输入手机号" />
                </UFormField>
                <UFormField label="地址">
                  <UInput v-model="editForm.address" placeholder="请输入地址" />
                </UFormField>
                <UButton :loading="saving" @click="saveProfile">保存修改</UButton>
              </div>
            </div>
          </UCard>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
