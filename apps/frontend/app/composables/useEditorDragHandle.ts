import { upperFirst } from 'scule'
import type { DropdownMenuItem, EditorCustomHandlers } from '@nuxt/ui'
import type { Editor, JSONContent } from '@tiptap/vue-3'
import { mapEditorItems } from '@nuxt/ui/utils/editor'

const CONVERTIBLE_TYPES = ['paragraph', 'heading', 'bulletList', 'orderedList', 'taskList', 'blockquote', 'codeBlock', 'listItem', 'taskItem']

const TYPE_LABELS: Record<string, string> = {
  paragraph: '段落',
  heading: '标题',
  bulletList: '无序列表',
  orderedList: '有序列表',
  taskList: '任务列表',
  blockquote: '引用',
  codeBlock: '代码块',
  listItem: '列表项',
  taskItem: '任务项',
  image: '图片',
  table: '表格',
  horizontalRule: '分割线'
}

export function useEditorDragHandle<T extends EditorCustomHandlers>(customHandlers?: T) {
  const selectedNode = ref<{ node: JSONContent | null, pos: number }>()

  const getTypeSpecificItems = (editor: Editor, nodeType: string): DropdownMenuItem[] => {
    const pos = selectedNode.value?.pos

    if (CONVERTIBLE_TYPES.includes(nodeType)) {
      return [{
        label: '转换为',
        icon: 'i-lucide-repeat-2',
        children: [
          { kind: 'paragraph', label: '段落', icon: 'i-lucide-type' },
          { kind: 'heading', level: 1, label: '标题 1', icon: 'i-lucide-heading-1' },
          { kind: 'heading', level: 2, label: '标题 2', icon: 'i-lucide-heading-2' },
          { kind: 'heading', level: 3, label: '标题 3', icon: 'i-lucide-heading-3' },
          { kind: 'heading', level: 4, label: '标题 4', icon: 'i-lucide-heading-4' },
          { kind: 'bulletList', label: '无序列表', icon: 'i-lucide-list' },
          { kind: 'orderedList', label: '有序列表', icon: 'i-lucide-list-ordered' },
          { kind: 'taskList', label: '任务列表', icon: 'i-lucide-list-check' },
          { kind: 'blockquote', label: '引用', icon: 'i-lucide-text-quote' },
          { kind: 'codeBlock', label: '代码块', icon: 'i-lucide-square-code' }
        ]
      }, {
        kind: 'clearFormatting',
        pos,
        label: '清除格式',
        icon: 'i-lucide-rotate-ccw'
      }]
    }

    if (nodeType === 'image') {
      const node = pos !== undefined ? editor.state.doc.nodeAt(pos) : null
      return [{
        label: '下载图片',
        icon: 'i-lucide-download',
        to: node?.attrs?.src,
        download: true
      }]
    }

    if (nodeType === 'table') {
      return [{
        label: '清空表格内容',
        icon: 'i-lucide-square-x',
        onSelect: () => {
          if (pos === undefined) return
          const tableNode = editor.state.doc.nodeAt(pos)
          if (!tableNode) return

          const cellRanges: { from: number, to: number }[] = []

          tableNode.descendants((node, nodePos) => {
            if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
              const cellStart = pos + 1 + nodePos + 1
              const cellEnd = cellStart + node.content.size
              if (node.content.size > 0) {
                cellRanges.push({ from: cellStart, to: cellEnd })
              }
            }
            return true
          })

          const { tr } = editor.state
          cellRanges.reverse().forEach(({ from, to }) => {
            tr.delete(from, to)
          })

          editor.view.dispatch(tr)
        }
      }]
    }

    return []
  }

  const getItems = (editor: Editor): DropdownMenuItem[][] => {
    if (!selectedNode.value?.node?.type) {
      return []
    }

    const nodeType = selectedNode.value.node.type
    const typeSpecificItems = getTypeSpecificItems(editor, nodeType)

    return mapEditorItems(editor, [[
      {
        type: 'label',
        label: TYPE_LABELS[nodeType] || upperFirst(nodeType)
      },
      ...typeSpecificItems
    ], [
      {
        kind: 'duplicate',
        pos: selectedNode.value?.pos,
        label: '复制',
        icon: 'i-lucide-copy'
      },
      {
        label: '复制到剪贴板',
        icon: 'i-lucide-clipboard',
        onSelect: async () => {
          if (!selectedNode.value) return

          const pos = selectedNode.value.pos
          const node = editor.state.doc.nodeAt(pos)
          if (node) {
            await navigator.clipboard.writeText(node.textContent)
          }
        }
      }
    ], [
      {
        kind: 'moveUp',
        pos: selectedNode.value?.pos,
        label: '上移',
        icon: 'i-lucide-arrow-up'
      },
      {
        kind: 'moveDown',
        pos: selectedNode.value?.pos,
        label: '下移',
        icon: 'i-lucide-arrow-down'
      }
    ], [
      {
        kind: 'delete',
        pos: selectedNode.value?.pos,
        label: '删除',
        icon: 'i-lucide-trash'
      }
    ]], customHandlers) as DropdownMenuItem[][]
  }

  const onNodeChange = (event: { node: JSONContent | null, pos: number }) => {
    selectedNode.value = event
  }

  return {
    selectedNode,
    getItems,
    onNodeChange
  }
}
