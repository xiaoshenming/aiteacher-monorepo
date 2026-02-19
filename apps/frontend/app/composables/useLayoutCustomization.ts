/**
 * 将 layout store 的配置实时注入为 CSS 变量到 <html> 元素。
 * 在 dashboard.vue layout 中调用一次即可。
 */
export function useLayoutCustomization() {
  const layoutStore = useLayoutStore()
  const appConfig = useAppConfig()

  // 主题色切换 — 通过 Nuxt UI 的 appConfig 动态修改
  watch(() => layoutStore.themeColor, (color) => {
    appConfig.ui.colors.primary = color
  }, { immediate: true })

  // CSS 变量注入
  watch(
    () => ({
      fontSize: layoutStore.fontSize,
      sidebarWidth: layoutStore.sidebarWidth,
      density: layoutStore.layoutDensity,
      radius: layoutStore.borderRadius,
      animations: layoutStore.animationsEnabled,
      contentMaxWidth: layoutStore.contentMaxWidth,
      scrollbarStyle: layoutStore.scrollbarStyle,
    }),
    (val) => {
      if (!import.meta.client) return
      const root = document.documentElement

      // 字号
      root.style.setProperty('--layout-font-size', `${val.fontSize}px`)

      // 侧边栏宽度
      root.style.setProperty('--layout-sidebar-width', `${val.sidebarWidth}px`)

      // 密度间距
      const densityMap = {
        compact: { gap: '0.25rem', padding: '0.375rem 0.5rem', lineHeight: '1.25' },
        comfortable: { gap: '0.5rem', padding: '0.5rem 0.75rem', lineHeight: '1.5' },
        spacious: { gap: '0.75rem', padding: '0.75rem 1rem', lineHeight: '1.75' },
      }
      const d = densityMap[val.density]
      root.style.setProperty('--layout-density-gap', d.gap)
      root.style.setProperty('--layout-density-padding', d.padding)
      root.style.setProperty('--layout-density-line-height', d.lineHeight)

      // 圆角
      const radiusMap = { none: '0px', small: '0.5rem', large: '1rem' }
      root.style.setProperty('--layout-border-radius', radiusMap[val.radius])

      // 动画开关
      root.style.setProperty('--layout-transition-duration', val.animations ? '0.3s' : '0s')
      root.style.setProperty('--layout-animation-duration', val.animations ? '0.4s' : '0s')

      // 内容区最大宽度
      const maxWidthMap = { full: '100%', '7xl': '80rem', '6xl': '72rem', '5xl': '64rem' }
      root.style.setProperty('--layout-content-max-width', maxWidthMap[val.contentMaxWidth])

      // 滚动条样式 class
      root.classList.remove('scrollbar-thin', 'scrollbar-auto', 'scrollbar-hidden')
      root.classList.add(`scrollbar-${val.scrollbarStyle}`)
    },
    { immediate: true },
  )

  // body class 管理
  watch(
    () => [layoutStore.densityClass, layoutStore.radiusClass],
    ([density, radius], old) => {
      if (!import.meta.client) return
      if (old) {
        document.body.classList.remove(...old.filter((v): v is string => !!v))
      }
      if (density) document.body.classList.add(density)
      if (radius) document.body.classList.add(radius)
    },
    { immediate: true },
  )
}
