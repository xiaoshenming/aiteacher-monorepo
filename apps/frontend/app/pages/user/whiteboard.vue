<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role-guard'],
})

const whiteboard = useWhiteboard()
const toast = useToast()

const rooms = ref<any[]>([])
const loading = ref(true)
const showCreateModal = ref(false)
const newRoomTitle = ref('')
const creating = ref(false)

async function fetchRooms() {
  loading.value = true
  try {
    rooms.value = await whiteboard.listMyRooms()
  }
  catch {
    toast.add({ title: '获取白板列表失败', color: 'error' })
  }
  finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!newRoomTitle.value.trim()) return
  creating.value = true
  try {
    const room = await whiteboard.createRoom({ title: newRoomTitle.value.trim() })
    rooms.value.unshift(room)
    showCreateModal.value = false
    newRoomTitle.value = ''
  }
  catch {
    toast.add({ title: '创建白板失败', color: 'error' })
  }
  finally {
    creating.value = false
  }
}

async function handleDelete(roomId: string) {
  try {
    await whiteboard.deleteRoom(roomId)
    rooms.value = rooms.value.filter(r => r.id !== roomId)
    toast.add({ title: '白板已删除', color: 'success' })
  }
  catch {
    toast.add({ title: '删除失败', color: 'error' })
  }
}

function formatTime(ts: number) {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN')
}

onMounted(fetchRooms)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="协作白板">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            label="新建白板"
            icon="i-lucide-plus"
            size="sm"
            @click="showCreateModal = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center h-64">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <!-- Empty state -->
      <div v-else-if="rooms.length === 0" class="flex flex-col items-center justify-center h-64 gap-4">
        <UIcon name="i-lucide-pen-tool" class="size-12 text-zinc-300 dark:text-zinc-600" />
        <p class="text-sm text-muted">还没有白板，点击上方按钮创建一个</p>
      </div>

      <!-- Room list -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        <UCard
          v-for="room in rooms"
          :key="room.id"
          class="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          @click="navigateTo(`/user/whiteboard/${room.id}`)"
        >
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <h3 class="font-medium truncate">{{ room.title }}</h3>
              <UButton
                icon="i-lucide-trash-2"
                size="xs"
                color="neutral"
                variant="ghost"
                @click.stop="handleDelete(room.id)"
              />
            </div>
            <div class="flex items-center gap-3 text-xs text-muted">
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-user" class="size-3" />
                {{ room.creatorName || '我' }}
              </span>
            </div>
            <p class="text-xs text-dimmed">
              {{ formatTime(room.lastActiveAt || room.createdAt) }}
            </p>
          </div>
        </UCard>
      </div>

      <!-- Create modal -->
      <UModal v-model:open="showCreateModal">
        <template #content>
          <div class="p-6 space-y-4">
            <h3 class="text-lg font-semibold">新建白板</h3>
            <UInput
              v-model="newRoomTitle"
              placeholder="输入白板名称"
              autofocus
              @keyup.enter="handleCreate"
            />
            <div class="flex justify-end gap-2">
              <UButton
                label="取消"
                color="neutral"
                variant="ghost"
                @click="showCreateModal = false"
              />
              <UButton
                label="创建"
                :loading="creating"
                :disabled="!newRoomTitle.trim()"
                @click="handleCreate"
              />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
