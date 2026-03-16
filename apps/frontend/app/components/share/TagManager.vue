<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2 flex-wrap">
      <UBadge
        v-for="tag in tags" :key="tag.id"
        variant="subtle" size="sm"
        :style="{ backgroundColor: tag.color + '1a', color: tag.color }"
        class="cursor-pointer"
      >
        {{ tag.name }}
        <UIcon
          name="i-lucide-x" class="w-3 h-3 ml-1 cursor-pointer"
          @click="handleDelete(tag.id)"
        />
      </UBadge>
      <UButton
        v-if="!showCreate"
        icon="i-lucide-plus" variant="soft" color="neutral" size="xs"
        @click="showCreate = true"
      />
    </div>

    <div v-if="showCreate" class="flex items-center gap-2">
      <UInput v-model="newName" placeholder="标签名称" size="sm" class="w-32" />
      <input v-model="newColor" type="color" class="w-8 h-8 rounded cursor-pointer border-0" />
      <UButton size="xs" color="primary" :loading="creating" @click="handleCreate">
        添加
      </UButton>
      <UButton size="xs" variant="ghost" color="neutral" @click="showCreate = false">
        取消
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const { tags, fetchTags, createTag, deleteTag } = useTags()
const toast = useToast()
const showCreate = ref(false)
const newName = ref('')
const newColor = ref('#14b8a6')
const creating = ref(false)

onMounted(() => fetchTags())

async function handleCreate() {
  if (!newName.value.trim()) return
  creating.value = true
  try {
    await createTag(newName.value.trim(), newColor.value)
    await fetchTags()
    newName.value = ''
    showCreate.value = false
    toast.add({ title: '标签已创建', color: 'success' })
  }
  catch {
    toast.add({ title: '创建失败', color: 'error' })
  }
  finally {
    creating.value = false
  }
}

async function handleDelete(id: number) {
  await deleteTag(id)
  await fetchTags()
}
</script>
