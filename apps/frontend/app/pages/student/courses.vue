<script setup lang="ts">
const { apiFetch } = useApi()

const courses = ref<any[]>([])
const loading = ref(false)

async function loadCourses() {
  loading.value = true
  try {
    const res = await apiFetch<{ code: number, data: any[] }>('/students/courses')
    courses.value = res.data || []
  }
  catch {
    courses.value = []
  }
  finally {
    loading.value = false
  }
}

onMounted(loadCourses)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="我的课程">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div v-if="loading" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="text-2xl text-muted animate-spin" />
        </div>
        <div v-else-if="courses.length === 0" class="flex flex-col items-center py-12 text-muted">
          <UIcon name="i-lucide-book-open" class="text-4xl mb-3" />
          <p>暂无课程</p>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <UCard v-for="course in courses" :key="course.id">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-book-open" class="text-primary" />
                <span class="font-semibold text-highlighted">{{ course.name }}</span>
              </div>
              <p v-if="course.description" class="text-sm text-muted line-clamp-2">
                {{ course.description }}
              </p>
              <p v-if="course.teacher_name" class="text-xs text-muted">
                教师：{{ course.teacher_name }}
              </p>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
