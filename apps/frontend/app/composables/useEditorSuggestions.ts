import type { EditorSuggestionMenuItem, EditorCustomHandlers } from '@nuxt/ui'

export function useEditorSuggestions<T extends EditorCustomHandlers>(_customHandlers?: T) {
  const items = [[{
    type: 'label',
    label: 'AI'
  }, {
    kind: 'aiContinue',
    label: '续写',
    icon: 'i-lucide-sparkles'
  }], [{
    type: 'label',
    label: '样式'
  }, {
    kind: 'paragraph',
    label: '段落',
    icon: 'i-lucide-type'
  }, {
    kind: 'heading',
    level: 1,
    label: '标题 1',
    icon: 'i-lucide-heading-1'
  }, {
    kind: 'heading',
    level: 2,
    label: '标题 2',
    icon: 'i-lucide-heading-2'
  }, {
    kind: 'heading',
    level: 3,
    label: '标题 3',
    icon: 'i-lucide-heading-3'
  }, {
    kind: 'bulletList',
    label: '无序列表',
    icon: 'i-lucide-list'
  }, {
    kind: 'orderedList',
    label: '有序列表',
    icon: 'i-lucide-list-ordered'
  }, {
    kind: 'taskList',
    label: '任务列表',
    icon: 'i-lucide-list-check'
  }, {
    kind: 'blockquote',
    label: '引用',
    icon: 'i-lucide-text-quote'
  }, {
    kind: 'codeBlock',
    label: '代码块',
    icon: 'i-lucide-square-code'
  }], [{
    type: 'label',
    label: '插入'
  }, {
    kind: 'emoji',
    label: '表情',
    icon: 'i-lucide-smile-plus'
  }, {
    kind: 'imageUpload',
    label: '图片',
    icon: 'i-lucide-image'
  }, {
    kind: 'table',
    label: '表格',
    icon: 'i-lucide-table'
  }, {
    kind: 'horizontalRule',
    label: '分割线',
    icon: 'i-lucide-separator-horizontal'
  }]] satisfies EditorSuggestionMenuItem<T>[][]

  return {
    items
  }
}
