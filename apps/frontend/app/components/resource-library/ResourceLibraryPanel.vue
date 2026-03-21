<script setup lang="ts">
const { selectedNode, nodeResources, resourceLoading, fetchNodeResources, detachResource } = useKnowledgeTree()
const showAttachModal = ref(false)

// 共享
const showShareModal = ref(false)
const shareTarget = ref<{ type: string, id: number } | null>(null)

function handleSelectNode(node: Record<string, any>) {
  selectedNode.value = node
  fetchNodeResources(node.id)
}

async function handleDetach(mapId: number) {
  if (!selectedNode.value) return
  await detachResource(selectedNode.value.id, mapId)
}

function handleAttached() {
  showAttachModal.value = false
  if (selectedNode.value) fetchNodeResources(selectedNode.value.id)
}

function handleShare(resource: any) {
  shareTarget.value = {
    type: resource.resource_type,
    id: resource.resource_id || resource.id
  }
  showShareModal.value = true
}

function handleShared() {
  showShareModal.value = false
  shareTarget.value = null
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="教学资源库">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex h-full">
        <!-- 左侧知识树 -->
        <div class="w-2/5 border-r border-zinc-200 dark:border-zinc-700 flex flex-col">
          <ResourceLibraryKnowledgeTree @select="handleSelectNode" />
        </div>

        <!-- 右侧资源列表 -->
        <div class="w-3/5 flex flex-col">
          <ResourceLibraryResourceList
            :node-id="selectedNode?.id"
            :resources="nodeResources"
            :loading="resourceLoading"
            @attach="showAttachModal = true"
            @detach="handleDetach"
            @share="handleShare"
          />
        </div>
      </div>

      <ResourceLibraryResourceAttachModal
        v-if="selectedNode"
        v-model:open="showAttachModal"
        :node-id="selectedNode.id"
        @attached="handleAttached"
      />

      <!-- 共享对话框 -->
      <ShareShareModal
        v-if="shareTarget"
        v-model="showShareModal"
        :resource-type="shareTarget.type"
        :resource-id="shareTarget.id"
        @shared="handleShared"
      />
    </template>
  </UDashboardPanel>
</template>
