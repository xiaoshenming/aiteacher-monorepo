export function useKnowledgeTree() {
  const { apiFetch } = useApi()

  const tree = ref<any[]>([])
  const loading = ref(false)
  const selectedNode = ref<any>(null)
  const nodeResources = ref<any[]>([])
  const resourceLoading = ref(false)

  async function fetchTree(filters: Record<string, string> = {}) {
    loading.value = true
    try {
      const params = new URLSearchParams()
      if (filters.subject) params.append('subject', filters.subject)
      if (filters.grade) params.append('grade', filters.grade)
      const { data } = await apiFetch<any>(`/knowledge-tree?${params}`)
      tree.value = data || []
    } finally {
      loading.value = false
    }
  }

  async function createNode(nodeData: Record<string, any>) {
    const { data } = await apiFetch<any>('/knowledge-tree', { method: 'POST', body: nodeData })
    await fetchTree()
    return data
  }

  async function updateNode(id: number, nodeData: Record<string, any>) {
    await apiFetch(`/knowledge-tree/${id}`, { method: 'PUT', body: nodeData })
    await fetchTree()
  }

  async function deleteNode(id: number) {
    await apiFetch(`/knowledge-tree/${id}`, { method: 'DELETE' })
    await fetchTree()
  }

  async function fetchNodeResources(nodeId: number, page = 1, pageSize = 20) {
    resourceLoading.value = true
    try {
      const { data } = await apiFetch<any>(`/knowledge-tree/${nodeId}/resources?page=${page}&pageSize=${pageSize}`)
      nodeResources.value = data?.list || data || []
    } finally {
      resourceLoading.value = false
    }
  }

  async function attachResource(nodeId: number, resourceType: string, resourceId: number) {
    await apiFetch(`/knowledge-tree/${nodeId}/resources`, {
      method: 'POST',
      body: { resource_type: resourceType, resource_id: resourceId },
    })
    await fetchNodeResources(nodeId)
  }

  async function detachResource(nodeId: number, mapId: number) {
    await apiFetch(`/knowledge-tree/${nodeId}/resources/${mapId}`, { method: 'DELETE' })
    if (selectedNode.value) await fetchNodeResources(selectedNode.value.id)
  }

  function buildTree(nodes: any[], parentId: number | null = null): any[] {
    return nodes
      .filter(n => n.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(n => ({ ...n, children: buildTree(nodes, n.id) }))
  }

  const treeData = computed(() => buildTree(tree.value))

  return {
    tree, treeData, loading, selectedNode, nodeResources, resourceLoading,
    fetchTree, createNode, updateNode, deleteNode,
    fetchNodeResources, attachResource, detachResource,
  }
}
