export function useCameraLayout() {
  const cameraLayout = ref({ x: 75, y: 75, width: 20, height: 20 })
  const previewContainer = ref<HTMLDivElement | null>(null)
  const isDragging = ref(false)
  const isResizing = ref(false)

  let dragStartX = 0
  let dragStartY = 0
  let startLayout = { x: 0, y: 0, width: 0, height: 0 }

  const cameraStyle = computed(() => ({
    left: `${cameraLayout.value.x}%`,
    top: `${cameraLayout.value.y}%`,
    width: `${cameraLayout.value.width}%`,
    height: `${cameraLayout.value.height}%`,
    position: 'absolute' as const,
    border: '2px solid var(--ui-primary)',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    cursor: isDragging.value ? 'grabbing' : 'grab',
    overflow: 'hidden',
    zIndex: 10,
    background: '#000',
  }))

  function startDragging(e: MouseEvent) {
    isDragging.value = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    startLayout = { ...cameraLayout.value }
    window.addEventListener('mousemove', handleDragging)
    window.addEventListener('mouseup', stopDragging)
  }

  function handleDragging(e: MouseEvent) {
    if (!isDragging.value || !previewContainer.value) return
    const rect = previewContainer.value.getBoundingClientRect()
    const dx = ((e.clientX - dragStartX) / rect.width) * 100
    const dy = ((e.clientY - dragStartY) / rect.height) * 100
    cameraLayout.value.x = Math.max(0, Math.min(100 - cameraLayout.value.width, startLayout.x + dx))
    cameraLayout.value.y = Math.max(0, Math.min(100 - cameraLayout.value.height, startLayout.y + dy))
  }

  function stopDragging() {
    isDragging.value = false
    window.removeEventListener('mousemove', handleDragging)
    window.removeEventListener('mouseup', stopDragging)
  }

  function startResizing(e: MouseEvent) {
    isResizing.value = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    startLayout = { ...cameraLayout.value }
    window.addEventListener('mousemove', handleResizing)
    window.addEventListener('mouseup', stopResizing)
  }

  function handleResizing(e: MouseEvent) {
    if (!isResizing.value || !previewContainer.value) return
    const rect = previewContainer.value.getBoundingClientRect()
    const dx = ((e.clientX - dragStartX) / rect.width) * 100
    cameraLayout.value.width = Math.max(10, Math.min(50, startLayout.width + dx))
    cameraLayout.value.height = Math.max(10, Math.min(50, startLayout.height + dx))
  }

  function stopResizing() {
    isResizing.value = false
    window.removeEventListener('mousemove', handleResizing)
    window.removeEventListener('mouseup', stopResizing)
  }

  return {
    cameraLayout,
    previewContainer,
    isDragging,
    isResizing,
    cameraStyle,
    startDragging,
    startResizing,
  }
}
