import type { GradientColorDot } from '~/types/layout'

/**
 * HSL → CSS hsl() 字符串
 */
function hslToString(h: number, s: number, l: number, a = 1): string {
  return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`
}

/**
 * 根据色点数组和旋转角度生成 CSS 渐变背景值
 * 模仿 Zen Browser 的渐变叠加策略：
 * - 1 色：纯色
 * - 2 色：两个反向 linear-gradient 叠加
 * - 3 色：一个 linear-gradient + 两个 radial-gradient 叠加
 */
function generateGradientCSS(dots: GradientColorDot[], rotation: number): string {
  if (dots.length === 0) return 'none'

  const colors = dots.map(d => hslToString(d.hue, d.saturation, d.lightness))

  if (dots.length === 1) {
    return colors[0]!
  }

  if (dots.length === 2) {
    return [
      `linear-gradient(${rotation}deg, ${colors[1]} 0%, transparent 100%)`,
      `linear-gradient(${rotation + 180}deg, ${colors[0]} 0%, transparent 100%)`,
    ].join(', ')
  }

  // 3 色：Zen 风格 — linear + 2x radial
  return [
    `linear-gradient(-5deg, ${colors[0]} 10%, transparent 80%)`,
    `radial-gradient(circle at 95% 0%, ${colors[2]} 0%, transparent 75%)`,
    `radial-gradient(circle at 0% 0%, ${colors[1]} 10%, transparent 70%)`,
  ].join(', ')
}

/**
 * 根据色彩和谐类型计算辅助色点的位置
 */
function calculateHarmonyPositions(
  primaryDot: GradientColorDot,
  harmony: string,
  existingDots: GradientColorDot[],
): Partial<GradientColorDot>[] {
  const harmonyAngles: Record<string, number[]> = {
    complementary: [180],
    analogous: [50, 310],
    triadic: [120, 240],
    splitComplementary: [150, 210],
    free: [],
  }

  const angles = harmonyAngles[harmony] ?? []
  const secondaryDots = existingDots.filter(d => !d.isPrimary)

  return angles.map((angleDelta, i) => {
    const newHue = (primaryDot.hue + angleDelta) % 360
    // 保持在色轮上的相对位置
    const cx = 0.5, cy = 0.5
    const px = primaryDot.x - cx, py = primaryDot.y - cy
    const dist = Math.sqrt(px * px + py * py)
    const baseAngle = Math.atan2(py, px)
    const newAngle = baseAngle + (angleDelta * Math.PI) / 180
    const nx = cx + dist * Math.cos(newAngle)
    const ny = cy + dist * Math.sin(newAngle)

    return {
      ...(secondaryDots[i] ? { id: secondaryDots[i]!.id } : {}),
      hue: newHue,
      saturation: primaryDot.saturation,
      lightness: primaryDot.lightness,
      x: Math.max(0, Math.min(1, nx)),
      y: Math.max(0, Math.min(1, ny)),
      isPrimary: false,
    }
  })
}

/**
 * 将渐变背景配置实时注入为 CSS 变量。
 * 在 useLayoutCustomization 中调用。
 */
export function useGradientBackground() {
  const layoutStore = useLayoutStore()

  const gradientCSS = computed(() => {
    const gb = layoutStore.gradientBackground
    if (!gb.enabled || gb.dots.length === 0) return 'none'
    return generateGradientCSS(gb.dots, gb.rotation)
  })

  // 注入 CSS 变量到 <html>
  watch(
    () => ({
      css: gradientCSS.value,
      enabled: layoutStore.gradientBackground.enabled,
      opacity: layoutStore.gradientBackground.opacity,
      texture: layoutStore.gradientBackground.texture,
    }),
    (val) => {
      if (!import.meta.client) return
      const root = document.documentElement

      if (val.enabled && val.css !== 'none') {
        root.style.setProperty('--zen-gradient-bg', val.css)
        root.style.setProperty('--zen-gradient-opacity', String(val.opacity))
        root.style.setProperty('--zen-gradient-texture', String(val.texture))
        root.classList.add('zen-gradient-active')
      } else {
        root.style.removeProperty('--zen-gradient-bg')
        root.style.removeProperty('--zen-gradient-opacity')
        root.style.removeProperty('--zen-gradient-texture')
        root.classList.remove('zen-gradient-active')
      }
    },
    { immediate: true, deep: true },
  )

  return {
    gradientCSS,
    generateGradientCSS,
    calculateHarmonyPositions,
    hslToString,
  }
}
