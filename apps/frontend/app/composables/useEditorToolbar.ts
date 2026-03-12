import type { EditorToolbarItem, EditorCustomHandlers } from '@nuxt/ui'
import type { Editor } from '@tiptap/vue-3'

interface UseEditorToolbarOptions {
  aiLoading?: Ref<boolean | undefined>
}

export function useEditorToolbar<T extends EditorCustomHandlers>(_customHandlers?: T, options: UseEditorToolbarOptions = {}) {
  const { aiLoading } = options

  const toolbarItems: EditorToolbarItem<T>[][] = [[{
    kind: 'undo',
    icon: 'i-lucide-undo',
    tooltip: { text: '撤销' }
  }, {
    kind: 'redo',
    icon: 'i-lucide-redo',
    tooltip: { text: '重做' }
  }], [{
    kind: 'imageUpload',
    label: '添加',
    icon: 'i-lucide-image',
    tooltip: { text: '添加图片' }
  }]]

  const bubbleToolbarItems = computed(() => [[{
    icon: 'i-lucide-sparkles',
    label: 'AI',
    activeColor: 'neutral',
    activeVariant: 'ghost',
    loading: aiLoading?.value,
    content: {
      align: 'start'
    },
    items: [{
      kind: 'aiGenerate',
      label: 'AI 智能生成',
      icon: 'i-lucide-wand-sparkles'
    }, {
      kind: 'aiFix',
      label: '修正拼写语法',
      icon: 'i-lucide-spell-check'
    }, {
      kind: 'aiExtend',
      label: '扩展文本',
      icon: 'i-lucide-unfold-vertical'
    }, {
      kind: 'aiReduce',
      label: '精简文本',
      icon: 'i-lucide-fold-vertical'
    }, {
      kind: 'aiSimplify',
      label: '简化文本',
      icon: 'i-lucide-lightbulb'
    }, {
      kind: 'aiContinue',
      label: '续写',
      icon: 'i-lucide-text'
    }, {
      kind: 'aiSummarize',
      label: '总结',
      icon: 'i-lucide-list'
    }, {
      label: '翻译',
      icon: 'i-lucide-languages',
      children: [{
        kind: 'aiTranslate',
        language: '英文',
        label: '英文'
      }, {
        kind: 'aiTranslate',
        language: '中文',
        label: '中文'
      }, {
        kind: 'aiTranslate',
        language: '日文',
        label: '日文'
      }]
    }]
  }], [{
    label: '转换为',
    trailingIcon: 'i-lucide-chevron-down',
    activeColor: 'neutral',
    activeVariant: 'ghost',
    tooltip: { text: '转换为' },
    content: {
      align: 'start'
    },
    ui: {
      label: 'text-xs'
    },
    items: [{
      type: 'label',
      label: '转换为'
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
      kind: 'heading',
      level: 4,
      label: '标题 4',
      icon: 'i-lucide-heading-4'
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
    }]
  }], [{
    kind: 'mark',
    mark: 'bold',
    icon: 'i-lucide-bold',
    tooltip: { text: '加粗' }
  }, {
    kind: 'mark',
    mark: 'italic',
    icon: 'i-lucide-italic',
    tooltip: { text: '斜体' }
  }, {
    kind: 'mark',
    mark: 'underline',
    icon: 'i-lucide-underline',
    tooltip: { text: '下划线' }
  }, {
    kind: 'mark',
    mark: 'strike',
    icon: 'i-lucide-strikethrough',
    tooltip: { text: '删除线' }
  }, {
    kind: 'mark',
    mark: 'code',
    icon: 'i-lucide-code',
    tooltip: { text: '行内代码' }
  }], [{
    slot: 'link' as const,
    icon: 'i-lucide-link'
  }, {
    kind: 'imageUpload',
    icon: 'i-lucide-image',
    tooltip: { text: '图片' }
  }]] satisfies EditorToolbarItem<T>[][])

  const getImageToolbarItems = (editor: Editor): EditorToolbarItem<T>[][] => {
    const node = editor.state.doc.nodeAt(editor.state.selection.from)

    return [[{
      icon: 'i-lucide-align-left',
      tooltip: { text: '左对齐' },
      onClick: () => editor.chain().focus().updateAttributes('image', { align: 'left' }).run()
    }, {
      icon: 'i-lucide-align-center',
      tooltip: { text: '居中' },
      onClick: () => editor.chain().focus().updateAttributes('image', { align: 'center' }).run()
    }, {
      icon: 'i-lucide-align-right',
      tooltip: { text: '右对齐' },
      onClick: () => editor.chain().focus().updateAttributes('image', { align: 'right' }).run()
    }], [{
      icon: 'i-lucide-circle',
      tooltip: { text: '圆角' },
      content: { align: 'start' },
      items: [{
        label: '无',
        onSelect: () => editor.chain().focus().updateAttributes('image', { borderRadius: 0 }).run()
      }, {
        label: '小 (4px)',
        onSelect: () => editor.chain().focus().updateAttributes('image', { borderRadius: 4 }).run()
      }, {
        label: '中 (8px)',
        onSelect: () => editor.chain().focus().updateAttributes('image', { borderRadius: 8 }).run()
      }, {
        label: '大 (16px)',
        onSelect: () => editor.chain().focus().updateAttributes('image', { borderRadius: 16 }).run()
      }]
    }, {
      icon: 'i-lucide-eclipse',
      tooltip: { text: '阴影' },
      content: { align: 'start' },
      items: [{
        label: '无',
        onSelect: () => editor.chain().focus().updateAttributes('image', { shadow: 'none' }).run()
      }, {
        label: '小',
        onSelect: () => editor.chain().focus().updateAttributes('image', { shadow: 'sm' }).run()
      }, {
        label: '中',
        onSelect: () => editor.chain().focus().updateAttributes('image', { shadow: 'md' }).run()
      }, {
        label: '大',
        onSelect: () => editor.chain().focus().updateAttributes('image', { shadow: 'lg' }).run()
      }]
    }, {
      icon: 'i-lucide-square',
      tooltip: { text: '边框' },
      content: { align: 'start' },
      items: [{
        label: '无',
        onSelect: () => editor.chain().focus().updateAttributes('image', { borderWidth: 0 }).run()
      }, {
        label: '细 (1px)',
        onSelect: () => editor.chain().focus().updateAttributes('image', { borderWidth: 1 }).run()
      }, {
        label: '中 (2px)',
        onSelect: () => editor.chain().focus().updateAttributes('image', { borderWidth: 2 }).run()
      }, {
        label: '粗 (4px)',
        onSelect: () => editor.chain().focus().updateAttributes('image', { borderWidth: 4 }).run()
      }]
    }], [{
      icon: 'i-lucide-download',
      to: node?.attrs?.src,
      download: true,
      tooltip: { text: '下载' }
    }, {
      icon: 'i-lucide-refresh-cw',
      tooltip: { text: '替换' },
      onClick: () => {
        const { state } = editor
        const { selection } = state
        const pos = selection.from
        const node = state.doc.nodeAt(pos)
        if (node && node.type.name === 'image') {
          editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).insertContentAt(pos, { type: 'imageUpload' }).run()
        }
      }
    }], [{
      icon: 'i-lucide-trash',
      tooltip: { text: '删除' },
      onClick: () => {
        const { state } = editor
        const { selection } = state
        const pos = selection.from
        const node = state.doc.nodeAt(pos)
        if (node && node.type.name === 'image') {
          editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run()
        }
      }
    }]]
  }

  const getTableToolbarItems = (editor: Editor): EditorToolbarItem<T>[][] => {
    return [[{
      icon: 'i-lucide-between-vertical-start',
      tooltip: { text: '上方插入行' },
      onClick: () => {
        editor.chain().focus().addRowBefore().run()
      }
    }, {
      icon: 'i-lucide-between-vertical-end',
      tooltip: { text: '下方插入行' },
      onClick: () => {
        editor.chain().focus().addRowAfter().run()
      }
    }, {
      icon: 'i-lucide-between-horizontal-start',
      tooltip: { text: '左侧插入列' },
      onClick: () => {
        editor.chain().focus().addColumnBefore().run()
      }
    }, {
      icon: 'i-lucide-between-horizontal-end',
      tooltip: { text: '右侧插入列' },
      onClick: () => {
        editor.chain().focus().addColumnAfter().run()
      }
    }], [{
      icon: 'i-lucide-rows-3',
      tooltip: { text: '删除行' },
      onClick: () => {
        editor.chain().focus().deleteRow().run()
      }
    }, {
      icon: 'i-lucide-columns-3',
      tooltip: { text: '删除列' },
      onClick: () => {
        editor.chain().focus().deleteColumn().run()
      }
    }], [{
      icon: 'i-lucide-trash',
      tooltip: { text: '删除表格' },
      onClick: () => {
        editor.chain().focus().deleteTable().run()
      }
    }]]
  }

  const getCoverBlockToolbarItems = (editor: Editor): EditorToolbarItem<T>[][] => {
    return [[{
      icon: 'i-lucide-image-plus',
      tooltip: { text: '更换背景图' },
      onClick: () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async () => {
          const file = input.files?.[0]
          if (!file) return
          const formData = new FormData()
          formData.append('file', file)
          try {
            const config = useRuntimeConfig()
            const userStore = useUserStore()
            const result = await $fetch<{ code: number, data: { url: string } }>('editor/upload', {
              baseURL: config.public.apiCloud as string,
              method: 'POST',
              body: formData,
              headers: {
                Authorization: userStore.token ? `Bearer ${userStore.token}` : '',
                deviceType: 'pc'
              }
            })
            editor.chain().focus().updateAttributes('coverBlock', { src: result.data.url }).run()
          } catch (e) {
            console.error('背景图上传失败', e)
          }
        }
        input.click()
      }
    }, {
      icon: 'i-lucide-maximize',
      tooltip: { text: '填充方式' },
      content: { align: 'start' },
      items: [{
        label: '铺满裁切 (Cover)',
        onSelect: () => editor.chain().focus().updateAttributes('coverBlock', { objectFit: 'cover' }).run()
      }, {
        label: '完整显示 (Contain)',
        onSelect: () => editor.chain().focus().updateAttributes('coverBlock', { objectFit: 'contain' }).run()
      }]
    }], [{
      icon: 'i-lucide-sun-dim',
      tooltip: { text: '遮罩透明度' },
      content: { align: 'start' },
      items: [{
        label: '无遮罩',
        onSelect: () => editor.chain().focus().updateAttributes('coverBlock', { overlayOpacity: 0 }).run()
      }, {
        label: '浅 (20%)',
        onSelect: () => editor.chain().focus().updateAttributes('coverBlock', { overlayOpacity: 20 }).run()
      }, {
        label: '中 (40%)',
        onSelect: () => editor.chain().focus().updateAttributes('coverBlock', { overlayOpacity: 40 }).run()
      }, {
        label: '深 (60%)',
        onSelect: () => editor.chain().focus().updateAttributes('coverBlock', { overlayOpacity: 60 }).run()
      }, {
        label: '很深 (80%)',
        onSelect: () => editor.chain().focus().updateAttributes('coverBlock', { overlayOpacity: 80 }).run()
      }]
    }], [{
      icon: 'i-lucide-trash',
      tooltip: { text: '删除区块' },
      onClick: () => {
        const { state } = editor
        const pos = state.selection.$from.before(1)
        const node = state.doc.nodeAt(pos)
        if (node && node.type.name === 'coverBlock') {
          editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run()
        }
      }
    }]]
  }

  return {
    toolbarItems,
    bubbleToolbarItems,
    getImageToolbarItems,
    getTableToolbarItems,
    getCoverBlockToolbarItems
  }
}
