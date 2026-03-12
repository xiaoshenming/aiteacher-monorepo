<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()
const config = useRuntimeConfig()

const resizing = ref(false)
const currentWidth = ref<number>(0)
const currentHeight = ref<number>(0)

let startX = 0
let startY = 0
let startW = 0
let startH = 0
let direction = ''
let aspectRatio = 1

const shadowMap: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.1)',
  lg: '0 10px 15px rgba(0,0,0,0.15)',
}

const resolvedSrc = computed(() => {
  let src = props.node.attrs.src
  if (src && !src.startsWith('http') && src.startsWith('/api/')) {
    const base = (config.public.apiCloud as string).replace(/\/$/, '')
    src = `${base}${src.replace(/^\/api/, '')}`
  }
  return src
})

const containerStyle = computed(() => ({
  textAlign: props.node.attrs.align as 'left' | 'center' | 'right',
}))

const wrapperStyle = computed(() => ({
  backgroundColor: props.node.attrs.backgroundColor,
  display: 'inline-block',
  position: 'relative' as const,
}))

const imgStyle = computed(() => ({
  width: currentWidth.value ? `${currentWidth.value}px` : undefined,
  height: currentHeight.value ? `${currentHeight.value}px` : undefined,
  borderRadius: `${props.node.attrs.borderRadius}px`,
  boxShadow: shadowMap[props.node.attrs.shadow] || 'none',
  border: props.node.attrs.borderWidth
    ? `${props.node.attrs.borderWidth}px solid ${props.node.attrs.borderColor}`
    : undefined,
  display: 'block',
}))

function getMaxWidth(): number {
  const el = props.editor.view.dom
  return el ? el.clientWidth - 40 : 800
}

function startResize(dir: string, event: PointerEvent) {
  event.preventDefault()
  direction = dir
  startX = event.clientX
  startY = event.clientY
  startW = currentWidth.value || 200
  startH = currentHeight.value || 200
  aspectRatio = startW / startH
  resizing.value = true
  document.addEventListener('pointermove', onResize)
  document.addEventListener('pointerup', stopResize)
}

function onResize(event: PointerEvent) {
  if (!resizing.value) return
  const dx = event.clientX - startX
  const dy = event.clientY - startY
  const maxW = getMaxWidth()
  let newW = startW
  let newH = startH

  if (direction.includes('e')) newW = startW + dx
  if (direction.includes('w')) newW = startW - dx
  if (direction.includes('s')) newH = startH + dy
  if (direction.includes('n')) newH = startH - dy

  // Corner handles maintain aspect ratio
  if (direction.length === 2) {
    newH = newW / aspectRatio
  }

  // Edge-only vertical
  if (direction === 'n' || direction === 's') {
    newW = newH * aspectRatio
  }

  newW = Math.max(50, Math.min(newW, maxW))
  newH = Math.max(50, newH)
  currentWidth.value = Math.round(newW)
  currentHeight.value = Math.round(newH)
}

function stopResize() {
  if (!resizing.value) return
  resizing.value = false
  document.removeEventListener('pointermove', onResize)
  document.removeEventListener('pointerup', stopResize)
  props.updateAttributes({
    width: currentWidth.value,
    height: currentHeight.value,
  })
}

onMounted(() => {
  if (props.node.attrs.width && props.node.attrs.height) {
    currentWidth.value = props.node.attrs.width
    currentHeight.value = props.node.attrs.height
    return
  }
  const img = new window.Image()
  img.onload = () => {
    const maxW = getMaxWidth()
    let w = img.naturalWidth
    let h = img.naturalHeight
    if (w > maxW) {
      const ratio = maxW / w
      w = maxW
      h = Math.round(h * ratio)
    }
    currentWidth.value = props.node.attrs.width || w
    currentHeight.value = props.node.attrs.height || h
  }
  img.src = resolvedSrc.value
})

onBeforeUnmount(() => {
  document.removeEventListener('pointermove', onResize)
  document.removeEventListener('pointerup', stopResize)
})
</script>

<template>
  <NodeViewWrapper>
    <div :style="containerStyle">
      <div class="resizable-image-wrapper" :style="wrapperStyle">
        <img
          :src="resolvedSrc"
          :alt="node.attrs.alt"
          :title="node.attrs.title"
          :style="imgStyle"
          draggable="false"
        />
        <template v-if="selected">
          <div class="resize-outline" />
          <div
            v-for="dir in ['nw','n','ne','e','se','s','sw','w']"
            :key="dir"
            :class="['resize-handle', `handle-${dir}`]"
            @pointerdown.stop.prevent="startResize(dir, $event)"
          />
        </template>
        <div v-if="resizing" class="size-tooltip">
          {{ currentWidth }} &times; {{ currentHeight }}
        </div>
      </div>
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
.resizable-image-wrapper {
  display: inline-block;
  position: relative;
  line-height: 0;
}

.resize-outline {
  position: absolute;
  inset: 0;
  border: 2px solid #3b82f6;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: white;
  border: 2px solid #3b82f6;
  border-radius: 50%;
  z-index: 10;
}

.handle-nw { top: -4px; left: -4px; cursor: nw-resize; }
.handle-ne { top: -4px; right: -4px; cursor: ne-resize; }
.handle-sw { bottom: -4px; left: -4px; cursor: sw-resize; }
.handle-se { bottom: -4px; right: -4px; cursor: se-resize; }

.handle-n { top: -4px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
.handle-s { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
.handle-w { top: 50%; left: -4px; transform: translateY(-50%); cursor: w-resize; }
.handle-e { top: 50%; right: -4px; transform: translateY(-50%); cursor: e-resize; }

.size-tooltip {
  position: absolute;
  bottom: -28px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 20;
}
</style>
