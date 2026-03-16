<template>
  <UModal v-model:open="open">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-medium text-highlighted">共享资源</h3>
            <UButton icon="i-lucide-x" variant="ghost" color="neutral" size="xs" @click="open = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm text-muted mb-1.5">共享范围</label>
            <div class="flex gap-2">
              <UButton
                v-for="s in scopes" :key="s.value"
                :variant="form.share_scope === s.value ? 'solid' : 'soft'"
                :color="form.share_scope === s.value ? 'primary' : 'neutral'"
                size="sm"
                @click="form.share_scope = s.value"
              >
                <UIcon :name="s.icon" class="w-4 h-4 mr-1" />
                {{ s.label }}
              </UButton>
            </div>
          </div>

          <div v-if="form.share_scope === 'specific'">
            <label class="block text-sm text-muted mb-1.5">目标用户 ID</label>
            <UInput v-model="form.target_user_id" type="number" placeholder="输入用户 ID" />
          </div>

          <div>
            <label class="block text-sm text-muted mb-1.5">权限</label>
            <div class="flex gap-2">
              <UButton
                :variant="form.permission === 'view' ? 'solid' : 'soft'"
                :color="form.permission === 'view' ? 'primary' : 'neutral'"
                size="sm" @click="form.permission = 'view'"
              >
                仅查看
              </UButton>
              <UButton
                :variant="form.permission === 'copy' ? 'solid' : 'soft'"
                :color="form.permission === 'copy' ? 'primary' : 'neutral'"
                size="sm" @click="form.permission = 'copy'"
              >
                可复制
              </UButton>
            </div>
          </div>

          <div>
            <label class="block text-sm text-muted mb-1.5">留言（可选）</label>
            <UTextarea v-model="form.message" placeholder="给对方留言..." :rows="2" />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <UButton variant="soft" color="neutral" @click="open = false">取消</UButton>
            <UButton type="submit" color="primary" :loading="submitting">确认共享</UButton>
          </div>
        </form>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  resourceType: string
  resourceId: number
}>()

const emit = defineEmits<{ shared: [] }>()
const open = defineModel<boolean>({ default: false })
const { createShare } = useResourceShare()
const toast = useToast()
const submitting = ref(false)

const scopes = [
  { value: 'public', label: '公开', icon: 'i-lucide-globe' },
  { value: 'school', label: '校内', icon: 'i-lucide-school' },
  { value: 'specific', label: '指定用户', icon: 'i-lucide-user-check' },
]

const form = reactive({
  share_scope: 'public',
  target_user_id: '',
  permission: 'view',
  message: '',
})

async function handleSubmit() {
  submitting.value = true
  try {
    await createShare({
      resource_type: props.resourceType,
      resource_id: props.resourceId,
      share_scope: form.share_scope,
      target_user_id: form.share_scope === 'specific' ? Number(form.target_user_id) : undefined,
      permission: form.permission,
      message: form.message || undefined,
    })
    toast.add({ title: '共享成功', color: 'success' })
    open.value = false
    emit('shared')
  }
  catch {
    toast.add({ title: '共享失败', color: 'error' })
  }
  finally {
    submitting.value = false
  }
}
</script>
