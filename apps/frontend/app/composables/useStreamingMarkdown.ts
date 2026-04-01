import { Marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

/**
 * 流式 Markdown 增量渲染 composable
 * 每收到 chunk 累积文本，通过 RAF 节流批量解析，未闭合标记自动容错闭合
 */
export function useStreamingMarkdown() {
  const buffer = ref('')
  const html = ref('')
  const isComplete = ref(false)

  const marked = new Marked({
    breaks: true,
    gfm: true,
    async: false,
  })

  let rafId: number | null = null
  let dirty = false

  /** 自动闭合未完成的 Markdown 标记 */
  function autoClose(text: string): string {
    let result = text

    // 闭合未完成的代码块 ```
    const fenceCount = (result.match(/^```/gm) || []).length
    if (fenceCount % 2 !== 0) {
      result += '\n```'
    }

    // 闭合未完成的行内代码 `
    const backtickCount = (result.match(/(?<!`)`(?!`)/g) || []).length
    if (backtickCount % 2 !== 0) {
      result += '`'
    }

    // 闭合未完成的加粗 **
    const boldCount = (result.match(/\*\*/g) || []).length
    if (boldCount % 2 !== 0) {
      result += '**'
    }

    // 闭合未完成的斜体 *（排除 ** 已处理的）
    const allStars = (result.match(/\*/g) || []).length
    const boldStars = (result.match(/\*\*/g) || []).length * 2
    const italicStars = allStars - boldStars
    if (italicStars % 2 !== 0) {
      result += '*'
    }

    // 闭合未完成的删除线 ~~
    const strikeCount = (result.match(/~~/g) || []).length
    if (strikeCount % 2 !== 0) {
      result += '~~'
    }

    return result
  }

  function render() {
    if (!dirty) return
    dirty = false
    rafId = null

    const closed = autoClose(buffer.value)
    const raw = marked.parse(closed)
    // marked v17 parse() 可能返回 Promise 或 string
    if (raw instanceof Promise) {
      raw.then((result) => {
        html.value = DOMPurify.sanitize(result)
      })
    } else {
      html.value = DOMPurify.sanitize(raw as string)
    }
  }

  function scheduleRender() {
    dirty = true
    if (rafId === null) {
      rafId = requestAnimationFrame(render)
    }
  }

  /** 喂入一个流式 chunk */
  function feed(chunk: string) {
    buffer.value += chunk
    scheduleRender()
  }

  /** 流式结束，做最终渲染 */
  function finish() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    dirty = true
    render()
    isComplete.value = true
  }

  /** 重置状态，准备下一次流式 */
  function reset() {
    buffer.value = ''
    html.value = ''
    isComplete.value = false
    dirty = false
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  onUnmounted(() => {
    if (rafId !== null) cancelAnimationFrame(rafId)
  })

  return {
    html: readonly(html),
    rawText: readonly(buffer),
    isComplete: readonly(isComplete),
    feed,
    finish,
    reset,
  }
}
