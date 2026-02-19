<script setup lang="ts">
import type { ColorHarmony } from '~/types/layout'

const layoutStore = useLayoutStore()
const { gradientCSS, hslToString } = useGradientBackground()

const gb = computed(() => layoutStore.gradientBackground)

const harmonyOptions: { value: ColorHarmony; label: string }[] = [
  { value: 'free', label: '自由' },
  { value: 'complementary', label: '互补' },
  { value: 'analogous', label: '类似' },
  { value: 'triadic', label: '三色' },
  { value: 'splitComplementary', label: '分裂互补' },
]

// 预览渐变样式
const previewStyle = computed(() => {
  if (!gb.value.enabled || gradientCSS.value === 'none') {
    return { background: 'var(--ui-bg)' }
  }
  return {
    background: gradientCSS.value,
    opacity: gb.value.opacity,
  }
})

// 色点颜色预览
const dotColors = computed(() =>
  gb.value.dots.map(d => hslToString(d.hue, d.saturation, d.lightness)),
)

function toggleEnabled() {
  layoutStore.setGradientEnabled(!gb.value.enabled)
}

function clearAll() {
  layoutStore.resetGradient()
}
</script>

<template>
  <div class="space-y-3">
    <!-- 开关 -->
    <div class="flex items-center justify-between">
      <span class="text-sm text-muted">渐变背景</span>
      <USwitch :model-value="gb.enabled" @update:model-value="toggleEnabled" />
    </div>

    <template v-if="gb.enabled">
      <!-- 色轮 -->
      <LayoutZenColorWheel />

      <!-- 色点颜色条 -->
      <div v-if="gb.dots.length > 0" class="flex items-center gap-2 px-1">
        <div
          v-for="(color, i) in dotColors"
          :key="i"
          class="w-6 h-6 rounded-full border border-default shadow-sm"
          :style="{ backgroundColor: color }"
        />
        <div class="flex-1" />
        <UButton
          icon="i-lucide-trash-2"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="clearAll"
        />
      </div>

      <!-- 和谐模式 -->
      <div>
        <span class="text-xs text-muted mb-1.5 block">色彩和谐</span>
        <div class="flex flex-wrap gap-1">
          <UButton
            v-for="h in harmonyOptions"
            :key="h.value"
            :label="h.label"
            size="xs"
            :color="gb.harmony === h.value ? 'primary' : 'neutral'"
            :variant="gb.harmony === h.value ? 'solid' : 'outline'"
            @click="layoutStore.setGradientHarmony(h.value)"
          />
        </div>
      </div>

      <!-- 透明度 -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs text-muted">透明度</span>
          <span class="text-xs text-dimmed">{{ Math.round(gb.opacity * 100) }}%</span>
        </div>
        <input
          type="range"
          :value="gb.opacity"
          min="0"
          max="1"
          step="0.05"
          class="w-full accent-[var(--ui-primary)]"
          @input="layoutStore.setGradientOpacity(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <!-- 纹理 -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs text-muted">噪点纹理</span>
          <span class="text-xs text-dimmed">{{ Math.round(gb.texture * 100) }}%</span>
        </div>
        <input
          type="range"
          :value="gb.texture"
          min="0"
          max="1"
          step="0.05"
          class="w-full accent-[var(--ui-primary)]"
          @input="layoutStore.setGradientTexture(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <!-- 预览 -->
      <div>
        <span class="text-xs text-muted mb-1.5 block">预览</span>
        <div
          class="w-full h-16 rounded-lg border border-default overflow-hidden"
          :style="previewStyle"
        />
      </div>
    </template>
  </div>
</template>
