<script setup lang="ts">
import type { GradientColorDot, ColorHarmony } from '~/types/layout'
import { DEFAULT_GRADIENT_DOT } from '~/types/layout'

const layoutStore = useLayoutStore()
const { calculateHarmonyPositions, hslToString } = useGradientBackground()

const wheelRef = ref<HTMLElement>()
const wheelSize = 220
const padding = 16
const radius = (wheelSize - padding * 2) / 2

// 当前拖拽的色点
const draggingDotId = ref<string | null>(null)

// 色点数据
const dots = computed(() => layoutStore.gradientBackground.dots)
const harmony = computed(() => layoutStore.gradientBackground.harmony)

// 从归一化坐标转换为像素坐标
function toPixel(nx: number, ny: number): { left: number; top: number } {
  return {
    left: nx * wheelSize,
    top: ny * wheelSize,
  }
}

// 从像素坐标转换为归一化坐标（限制在圆内）
function toNormalized(px: number, py: number): { x: number; y: number } {
  const cx = wheelSize / 2
  const cy = wheelSize / 2
  const dx = px - cx
  const dy = py - cy
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist > radius) {
    const scale = radius / dist
    return {
      x: (cx + dx * scale) / wheelSize,
      y: (cy + dy * scale) / wheelSize,
    }
  }
  return { x: px / wheelSize, y: py / wheelSize }
}

// 从位置计算 HSL 颜色
function positionToHSL(nx: number, ny: number): { hue: number; saturation: number } {
  const cx = 0.5, cy = 0.5
  const dx = nx - cx, dy = ny - cy
  const dist = Math.sqrt(dx * dx + dy * dy) / 0.5 // 归一化到 0-1
  let angle = Math.atan2(dy, dx) * (180 / Math.PI)
  if (angle < 0) angle += 360

  return {
    hue: angle,
    saturation: Math.min(100, dist * 100),
  }
}

// 添加色点
function addDot(e: MouseEvent) {
  if (dots.value.length >= 3) return
  if (!wheelRef.value) return

  const rect = wheelRef.value.getBoundingClientRect()
  const px = e.clientX - rect.left
  const py = e.clientY - rect.top
  const { x, y } = toNormalized(px, py)
  const { hue, saturation } = positionToHSL(x, y)

  const newDot = {
    ...DEFAULT_GRADIENT_DOT(),
    hue,
    saturation,
    lightness: 50,
    x,
    y,
    isPrimary: dots.value.length === 0,
  }

  layoutStore.addGradientDot(newDot)

  // 如果有和谐模式且是第一个点，自动添加辅助点
  if (dots.value.length === 1 && harmony.value !== 'free') {
    autoAddHarmonyDots(newDot)
  }
}

function autoAddHarmonyDots(primaryDot: GradientColorDot) {
  const positions = calculateHarmonyPositions(primaryDot, harmony.value, dots.value)
  for (const pos of positions) {
    if (dots.value.length >= 3) break
    layoutStore.addGradientDot({
      ...DEFAULT_GRADIENT_DOT(),
      ...pos,
      isPrimary: false,
    })
  }
}

// 拖拽处理
function onDotMouseDown(e: MouseEvent, dotId: string) {
  e.stopPropagation()
  e.preventDefault()
  draggingDotId.value = dotId

  const onMove = (me: MouseEvent) => {
    if (!wheelRef.value || !draggingDotId.value) return
    const rect = wheelRef.value.getBoundingClientRect()
    const px = me.clientX - rect.left
    const py = me.clientY - rect.top
    const { x, y } = toNormalized(px, py)
    const { hue, saturation } = positionToHSL(x, y)

    layoutStore.updateGradientDot(draggingDotId.value, { x, y, hue, saturation })

    // 如果拖拽的是主色点且不是自由模式，更新辅助色点
    const dot = dots.value.find(d => d.id === draggingDotId.value)
    if (dot?.isPrimary && harmony.value !== 'free') {
      updateHarmonyDots(dot)
    }
  }

  const onUp = () => {
    draggingDotId.value = null
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// 触摸拖拽
function onDotTouchStart(e: TouchEvent, dotId: string) {
  e.stopPropagation()
  e.preventDefault()
  draggingDotId.value = dotId

  const onMove = (te: TouchEvent) => {
    if (!wheelRef.value || !draggingDotId.value) return
    const touch = te.touches[0]
    if (!touch) return
    const rect = wheelRef.value.getBoundingClientRect()
    const px = touch.clientX - rect.left
    const py = touch.clientY - rect.top
    const { x, y } = toNormalized(px, py)
    const { hue, saturation } = positionToHSL(x, y)

    layoutStore.updateGradientDot(draggingDotId.value, { x, y, hue, saturation })

    const dot = dots.value.find(d => d.id === draggingDotId.value)
    if (dot?.isPrimary && harmony.value !== 'free') {
      updateHarmonyDots(dot)
    }
  }

  const onEnd = () => {
    draggingDotId.value = null
    window.removeEventListener('touchmove', onMove)
    window.removeEventListener('touchend', onEnd)
  }

  window.addEventListener('touchmove', onMove, { passive: false })
  window.addEventListener('touchend', onEnd)
}

function updateHarmonyDots(primaryDot: GradientColorDot) {
  const positions = calculateHarmonyPositions(primaryDot, harmony.value, dots.value)
  const secondaryDots = dots.value.filter(d => !d.isPrimary)
  positions.forEach((pos, i) => {
    if (secondaryDots[i]) {
      layoutStore.updateGradientDot(secondaryDots[i]!.id, pos)
    }
  })
}

// 删除色点（双击）
function onDotDblClick(e: MouseEvent, dotId: string) {
  e.stopPropagation()
  layoutStore.removeGradientDot(dotId)
}

// 色点样式
function dotStyle(dot: GradientColorDot) {
  const { left, top } = toPixel(dot.x, dot.y)
  const size = dot.isPrimary ? 28 : 20
  return {
    left: `${left - size / 2}px`,
    top: `${top - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: hslToString(dot.hue, dot.saturation, dot.lightness),
    border: dot.isPrimary ? '3px solid white' : '2px solid white',
    boxShadow: draggingDotId.value === dot.id
      ? '0 0 0 3px rgba(255,255,255,0.5), 0 4px 12px rgba(0,0,0,0.3)'
      : '0 2px 6px rgba(0,0,0,0.25)',
  }
}

// 色轮背景 — 使用 conic-gradient 模拟 HSL 色轮
const wheelBackground = computed(() => {
  return {
    background: `
      radial-gradient(circle, white 0%, transparent 70%),
      conic-gradient(
        hsl(0, 100%, 50%),
        hsl(30, 100%, 50%),
        hsl(60, 100%, 50%),
        hsl(90, 100%, 50%),
        hsl(120, 100%, 50%),
        hsl(150, 100%, 50%),
        hsl(180, 100%, 50%),
        hsl(210, 100%, 50%),
        hsl(240, 100%, 50%),
        hsl(270, 100%, 50%),
        hsl(300, 100%, 50%),
        hsl(330, 100%, 50%),
        hsl(360, 100%, 50%)
      )
    `.trim(),
    width: `${wheelSize}px`,
    height: `${wheelSize}px`,
  }
})
</script>

<template>
  <div class="zen-color-wheel-container">
    <!-- 色轮 -->
    <div
      ref="wheelRef"
      class="zen-color-wheel"
      :style="wheelBackground"
      @click="addDot"
    >
      <!-- 色点 -->
      <div
        v-for="dot in dots"
        :key="dot.id"
        class="zen-dot"
        :class="{ 'zen-dot-primary': dot.isPrimary, 'zen-dot-dragging': draggingDotId === dot.id }"
        :style="dotStyle(dot)"
        @mousedown="onDotMouseDown($event, dot.id)"
        @touchstart="onDotTouchStart($event, dot.id)"
        @dblclick="onDotDblClick($event, dot.id)"
      />

      <!-- 中心提示 -->
      <div
        v-if="dots.length === 0"
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <span class="text-xs text-white/80 font-medium drop-shadow-md">点击添加颜色</span>
      </div>
    </div>

    <!-- 色点数量提示 -->
    <div class="flex items-center justify-between mt-2 px-1">
      <span class="text-xs text-muted">{{ dots.length }}/3 个色点</span>
      <span v-if="dots.length > 0" class="text-xs text-muted">双击色点可删除</span>
    </div>
  </div>
</template>

<style scoped>
.zen-color-wheel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.zen-color-wheel {
  position: relative;
  border-radius: 50%;
  cursor: crosshair;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.15),
    inset 0 0 30px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  user-select: none;
  touch-action: none;
  flex-shrink: 0;
}

.zen-dot {
  position: absolute;
  border-radius: 50%;
  cursor: grab;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
  z-index: 2;
}

.zen-dot:hover {
  transform: scale(1.15);
  z-index: 3;
}

.zen-dot-dragging {
  cursor: grabbing;
  transform: scale(1.2);
  z-index: 4;
}

.zen-dot-primary {
  z-index: 3;
}
</style>
