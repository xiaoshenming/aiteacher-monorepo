/**
 * 通用虚拟滚动引擎
 * 接收一个高度预测函数，只渲染可视区域 ± 缓冲区的条目
 */
export interface VirtualScrollOptions {
  /** 总条目数 */
  itemCount: Ref<number>
  /** 预测第 i 个条目的高度 (px) */
  estimateHeight: (index: number) => number
  /** 滚动容器 ref */
  containerRef: Ref<HTMLElement | null>
  /** 上下缓冲区条目数，默认 5 */
  overscan?: number
}

export interface VirtualItem {
  index: number
  offsetTop: number
  height: number
}

export function useVirtualScroll(options: VirtualScrollOptions) {
  const { itemCount, estimateHeight, containerRef, overscan = 5 } = options

  const scrollTop = ref(0)
  const containerHeight = ref(0)

  // 缓存每个条目的实际高度（首次渲染后校准）
  const heightCache = new Map<number, number>()

  function getHeight(index: number): number {
    return heightCache.get(index) ?? estimateHeight(index)
  }

  /** 计算所有条目的累积偏移 */
  function getOffsets(): number[] {
    const offsets: number[] = [0]
    for (let i = 0; i < itemCount.value; i++) {
      offsets.push(offsets[i]! + getHeight(i))
    }
    return offsets
  }

  const totalHeight = computed(() => {
    let h = 0
    for (let i = 0; i < itemCount.value; i++) h += getHeight(i)
    return h
  })

  const visibleItems = computed<VirtualItem[]>(() => {
    if (!containerHeight.value || itemCount.value === 0) return []

    const offsets = getOffsets()
    const top = scrollTop.value
    const bottom = top + containerHeight.value

    // 二分搜索找到第一个可见条目
    let lo = 0
    let hi = itemCount.value - 1
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1
      if (offsets[mid + 1]! <= top) {
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    const startIdx = Math.max(0, lo - overscan)

    // 找到最后一个可见条目
    let endIdx = lo
    while (endIdx < itemCount.value && offsets[endIdx]! < bottom) {
      endIdx++
    }
    endIdx = Math.min(itemCount.value - 1, endIdx + overscan)

    const items: VirtualItem[] = []
    for (let i = startIdx; i <= endIdx; i++) {
      items.push({
        index: i,
        offsetTop: offsets[i]!,
        height: getHeight(i),
      })
    }
    return items
  })

  /** 校准实际 DOM 高度 */
  function calibrate(index: number, actualHeight: number) {
    if (Math.abs(getHeight(index) - actualHeight) > 1) {
      heightCache.set(index, actualHeight)
    }
  }

  /** 滚动到底部 */
  function scrollToBottom() {
    const el = containerRef.value
    if (el) el.scrollTop = el.scrollHeight
  }

  // 监听滚动
  function onScroll() {
    const el = containerRef.value
    if (el) {
      scrollTop.value = el.scrollTop
      containerHeight.value = el.clientHeight
    }
  }

  // 初始化容器尺寸
  watch(containerRef, (el) => {
    if (el) {
      containerHeight.value = el.clientHeight
      el.addEventListener('scroll', onScroll, { passive: true })
    }
  }, { immediate: true })

  onUnmounted(() => {
    containerRef.value?.removeEventListener('scroll', onScroll)
  })

  return {
    visibleItems,
    totalHeight,
    calibrate,
    scrollToBottom,
    clearHeightCache: () => heightCache.clear(),
  }
}
