import { prepare, layout, prepareWithSegments, walkLineRanges } from '@chenglou/pretext'
import type { PreparedText, PreparedTextWithSegments } from '@chenglou/pretext'

/** 默认字体，与 CSS --font-sans 保持一致 */
const DEFAULT_FONT = '14px "Noto Sans SC", "Inter", sans-serif'
const DEFAULT_LINE_HEIGHT = 22 // 14px * 1.57 ≈ 22px (prose-sm leading-relaxed)

/** prepare() 结果缓存，避免重复计算 */
const prepareCache = new Map<string, PreparedText>()
const prepareWithSegmentsCache = new Map<string, PreparedTextWithSegments>()

function getCacheKey(text: string, font: string): string {
  return `${font}::${text}`
}

function getPrepared(text: string, font: string): PreparedText {
  const key = getCacheKey(text, font)
  let p = prepareCache.get(key)
  if (!p) {
    p = prepare(text, font)
    prepareCache.set(key, p)
  }
  return p
}

function getPreparedWithSegments(text: string, font: string): PreparedTextWithSegments {
  const key = getCacheKey(text, font)
  let p = prepareWithSegmentsCache.get(key)
  if (!p) {
    p = prepareWithSegments(text, font)
    prepareWithSegmentsCache.set(key, p)
  }
  return p
}

export function usePretext() {
  /**
   * 预测文本渲染高度（不触发 DOM reflow）
   */
  function measureHeight(
    text: string,
    maxWidth: number,
    font = DEFAULT_FONT,
    lineHeight = DEFAULT_LINE_HEIGHT,
  ): number {
    if (!text) return 0
    const p = getPrepared(text, font)
    return layout(p, maxWidth, lineHeight).height
  }

  /**
   * 计算文本的最紧凑宽度（shrinkwrap）
   * 二分搜索最小宽度使行数不变
   */
  function shrinkWrap(
    text: string,
    maxWidth: number,
    font = DEFAULT_FONT,
    lineHeight = DEFAULT_LINE_HEIGHT,
  ): number {
    if (!text) return 0
    const p = getPreparedWithSegments(text, font)

    const baseResult = layout(p as unknown as PreparedText, maxWidth, lineHeight)
    const targetLines = baseResult.lineCount

    let widestLine = 0
    walkLineRanges(p, maxWidth, (line) => {
      if (line.width > widestLine) widestLine = line.width
    })

    let lo = widestLine * 0.5
    let hi = widestLine + 1
    for (let i = 0; i < 10; i++) {
      const mid = (lo + hi) / 2
      const r = layout(p as unknown as PreparedText, mid, lineHeight)
      if (r.lineCount <= targetLines) {
        hi = mid
      } else {
        lo = mid
      }
    }

    return Math.ceil(hi)
  }

  function clearPretextCache() {
    prepareCache.clear()
    prepareWithSegmentsCache.clear()
  }

  return {
    measureHeight,
    shrinkWrap,
    clearCache: clearPretextCache,
  }
}
