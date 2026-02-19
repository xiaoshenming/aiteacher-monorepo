<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role-guard'],
})

const route = useRoute()
const whiteboard = useWhiteboard()
const toast = useToast()

const roomId = route.params.id as string
const room = ref<any>(null)
const roomKey = ref('')
const loading = ref(true)
const error = ref('')
const isFullscreen = ref(false)
const editingTitle = ref(false)
const editTitle = ref('')
const embedRef = ref<{ requestSave: () => Promise<void> } | null>(null)

onBeforeRouteLeave(async () => {
  await embedRef.value?.requestSave()
})

async function fetchRoom() {
  loading.value = true
  error.value = ''
  try {
    room.value = await whiteboard.getRoom(roomId)
    roomKey.value = room.value.roomKey
    editTitle.value = room.value.title
  }
  catch {
    error.value = '无法加载白板信息'
    toast.add({ title: '加载白板失败', color: 'error' })
  }
  finally {
    loading.value = false
  }
}

async function saveTitle() {
  if (!editTitle.value.trim() || editTitle.value.trim() === room.value?.title) {
    editingTitle.value = false
    return
  }
  try {
    await whiteboard.updateRoom(roomId, { title: editTitle.value.trim() })
    room.value.title = editTitle.value.trim()
  }
  catch {
    toast.add({ title: '更新标题失败', color: 'error' })
    editTitle.value = room.value?.title || ''
  }
  editingTitle.value = false
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

onMounted(fetchRoom)
</script>

<template>
  <!-- Fullscreen mode -->
  <div v-if="isFullscreen && room && roomKey" class="fixed inset-0 z-50 bg-white dark:bg-zinc-900">
    <div class="absolute top-2 right-2 z-10 flex gap-2">
      <UButton
        icon="i-lucide-minimize-2"
        size="xs"
        color="neutral"
        variant="soft"
        @click="toggleFullscreen"
      />
    </div>
    <WhiteboardExcalidrawEmbed
      ref="embedRef"
      :room-id="roomId"
      :room-key="roomKey"
      mode="fullscreen"
    />
  </div>

  <!-- Normal panel mode -->
  <UDashboardPanel v-show="!isFullscreen">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-arrow-left"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="navigateTo('/user/whiteboard')"
            />
            <template v-if="room">
              <div v-if="editingTitle" class="flex items-center gap-1">
                <UInput
                  v-model="editTitle"
                  size="sm"
                  autofocus
                  @keyup.enter="saveTitle"
                  @blur="saveTitle"
                />
              </div>
              <h2
                v-else
                class="font-medium cursor-pointer hover:text-primary transition-colors"
                @click="editingTitle = true"
              >
                {{ room.title }}
              </h2>
            </template>
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <span v-if="room" class="text-xs text-muted flex items-center gap-1">
              <UIcon name="i-lucide-users" class="size-3.5" />
            </span>
            <UButton
              icon="i-lucide-maximize-2"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="toggleFullscreen"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center h-64">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex flex-col items-center justify-center h-64 gap-4">
        <UIcon name="i-lucide-alert-circle" class="size-12 text-red-400" />
        <p class="text-sm text-muted">{{ error }}</p>
        <UButton label="重试" icon="i-lucide-refresh-cw" size="sm" @click="fetchRoom" />
      </div>

      <!-- Whiteboard embed -->
      <WhiteboardExcalidrawEmbed
        v-else-if="room && roomKey"
        ref="embedRef"
        :room-id="roomId"
        :room-key="roomKey"
        mode="panel"
      />
    </template>
  </UDashboardPanel>
</template>
