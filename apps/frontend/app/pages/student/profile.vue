<script setup lang="ts">
const { apiFetch } = useApi()
const userStore = useUserStore()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const profile = ref<any>(null)
const statsData = ref<any>(null)

const editForm = ref({ email: '', phoneNumber: '', address: '' })

const genderText = computed(() => {
  if (!profile.value) return '未设置'
  return profile.value.gender === 1 ? '男' : profile.value.gender === 0 ? '女' : '未设置'
})

const genderIcon = computed(() => {
  if (!profile.value) return 'i-lucide-user'
  return profile.value.gender === 1 ? 'i-lucide-user' : profile.value.gender === 0 ? 'i-lucide-user-round' : 'i-lucide-user'
})

function formatBirthday(d: string | null) {
  if (!d) return '未设置'
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const infoCards = computed(() => {
  if (!profile.value) return []
  return [
    { label: '性别', value: genderText.value, icon: genderIcon.value, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: '生日', value: formatBirthday(profile.value.birthday), icon: 'i-lucide-cake', color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: '入学年份', value: profile.value.entry_year || '未设置', icon: 'i-lucide-calendar', color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: '学校', value: profile.value.school_name || '未设置', icon: 'i-lucide-school', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: '邮箱', value: profile.value.email || '未设置', icon: 'i-lucide-mail', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: '手机号', value: profile.value.phoneNumber || '未设置', icon: 'i-lucide-phone', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: '地址', value: profile.value.address || '未设置', icon: 'i-lucide-map-pin', color: 'text-red-500', bg: 'bg-red-500/10' },
  ]
})

const achievementStats = computed(() => {
  if (!statsData.value) return []
  return [
    { label: '课程数', value: statsData.value.courseCount || 0, icon: 'i-lucide-book-open', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: '作业完成率', value: `${statsData.value.completionRate || 0}%`, icon: 'i-lucide-check-circle', color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: '平均分', value: statsData.value.avgScore || 0, icon: 'i-lucide-trophy', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: '已交作业', value: statsData.value.recentGrades?.length || 0, icon: 'i-lucide-file-check', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ]
})

function toggleEdit() {
  if (!editing.value && profile.value) {
    editForm.value = {
      email: profile.value.email || '',
      phoneNumber: profile.value.phoneNumber || '',
      address: profile.value.address || '',
    }
  }
  editing.value = !editing.value
}

async function loadProfile() {
  loading.value = true
  try {
    const [profileRes, statsRes] = await Promise.all([
      apiFetch<{ code: number, data: any }>('/students/profile'),
      apiFetch<{ code: number, data: any }>('/students/dashboard-stats', { showError: false }),
    ])
    if (profileRes.code === 200) {
      profile.value = profileRes.data
      editForm.value = {
        email: profileRes.data.email || '',
        phoneNumber: profileRes.data.phoneNumber || '',
        address: profileRes.data.address || '',
      }
    }
    if (statsRes.code === 200) statsData.value = statsRes.data
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
      editing.value = false
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
      <div v-if="loading" class="flex justify-center py-20">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-primary" />
      </div>

      <div v-else-if="profile" class="space-y-6 pb-8">
        <!-- Banner -->
        <div class="relative h-52 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        </div>

        <!-- Avatar + Name overlay -->
        <div class="relative px-6 -mt-20 flex flex-col sm:flex-row items-center sm:items-end gap-4">
          <div class="relative">
            <div class="w-28 h-28 rounded-full border-4 border-white dark:border-gray-900 shadow-lg overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center ring-4 ring-indigo-500/20">
              <img
                v-if="profile.avatar"
                :src="profile.avatar"
                :alt="profile.username"
                class="w-full h-full object-cover"
              >
              <UIcon v-else name="i-lucide-user" class="text-5xl text-white" />
            </div>
            <div class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 border-3 border-white dark:border-gray-900 flex items-center justify-center">
              <UIcon name="i-lucide-check" class="text-white text-xs" />
            </div>
          </div>
          <div class="text-center sm:text-left sm:pb-1">
            <h1 class="text-2xl font-bold text-highlighted">{{ profile.username }}</h1>
            <p class="text-sm text-muted mt-0.5">
              学号 {{ profile.student_number }}
              <span v-if="profile.school_name"> · {{ profile.school_name }}</span>
            </p>
          </div>
        </div>

        <div class="px-6 space-y-6">
          <!-- Info cards grid -->
          <div>
            <h2 class="text-sm font-medium text-muted mb-3">个人信息</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <div
                v-for="item in infoCards" :key="item.label"
                class="flex items-center gap-3 p-4 rounded-xl border border-default bg-default/50 hover:bg-elevated/80 transition-colors"
              >
                <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" :class="item.bg">
                  <UIcon :name="item.icon" class="text-lg" :class="item.color" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs text-muted">{{ item.label }}</p>
                  <p class="text-sm font-medium text-highlighted truncate">{{ item.value }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Editable section -->
          <div class="rounded-xl border border-default p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-medium text-muted">联系信息</h2>
              <UButton
                :icon="editing ? 'i-lucide-x' : 'i-lucide-pencil'"
                variant="ghost"
                size="sm"
                @click="toggleEdit"
              >
                {{ editing ? '取消' : '编辑' }}
              </UButton>
            </div>
            <div v-if="!editing" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="flex items-center gap-3 p-3 rounded-lg bg-default/50">
                <UIcon name="i-lucide-mail" class="text-orange-500" />
                <div>
                  <p class="text-xs text-muted">邮箱</p>
                  <p class="text-sm text-highlighted">{{ profile.email || '未设置' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 p-3 rounded-lg bg-default/50">
                <UIcon name="i-lucide-phone" class="text-cyan-500" />
                <div>
                  <p class="text-xs text-muted">手机号</p>
                  <p class="text-sm text-highlighted">{{ profile.phoneNumber || '未设置' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 p-3 rounded-lg bg-default/50">
                <UIcon name="i-lucide-map-pin" class="text-red-500" />
                <div>
                  <p class="text-xs text-muted">地址</p>
                  <p class="text-sm text-highlighted">{{ profile.address || '未设置' }}</p>
                </div>
              </div>
            </div>
            <div v-else class="space-y-4">
              <UFormField label="邮箱">
                <UInput v-model="editForm.email" icon="i-lucide-mail" placeholder="请输入邮箱" />
              </UFormField>
              <UFormField label="手机号">
                <UInput v-model="editForm.phoneNumber" icon="i-lucide-phone" placeholder="请输入手机号" />
              </UFormField>
              <UFormField label="地址">
                <UInput v-model="editForm.address" icon="i-lucide-map-pin" placeholder="请输入地址" />
              </UFormField>
              <div class="flex gap-2">
                <UButton :loading="saving" @click="saveProfile">保存修改</UButton>
                <UButton variant="ghost" @click="toggleEdit">取消</UButton>
              </div>
            </div>
          </div>

          <!-- Achievement stats -->
          <div v-if="statsData">
            <h2 class="text-sm font-medium text-muted mb-3">学习足迹</h2>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                v-for="item in achievementStats" :key="item.label"
                class="p-4 rounded-xl border border-default bg-default/50 text-center"
              >
                <div class="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" :class="item.bg">
                  <UIcon :name="item.icon" class="text-lg" :class="item.color" />
                </div>
                <p class="text-xl font-bold text-highlighted">{{ item.value }}</p>
                <p class="text-xs text-muted mt-1">{{ item.label }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
