<script setup lang="ts">
import type { EditorCustomHandlers } from '@nuxt/ui'
import type { Editor } from '@tiptap/vue-3'
import { CellSelection } from '@tiptap/pm/tables'
import { mergeAttributes } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import CodeBlockShiki from 'tiptap-extension-code-block-shiki'
import { ImageUpload } from '~/components/editor/ImageUploadExtension'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'

const config = useRuntimeConfig()

// 自定义 Image 扩展：相对路径动态拼接 apiCloud 域名
const CustomImage = Image.extend({
  renderHTML({ HTMLAttributes }) {
    let { src } = HTMLAttributes
    if (src && !src.startsWith('http') && src.startsWith('/api/')) {
      const base = (config.public.apiCloud as string).replace(/\/$/, '')
      src = `${base}${src.replace(/^\/api/, '')}`
    }
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { src })]
  },
})

const modelValue = defineModel<string>({ default: '' })

const editorRef = ref()

const { extension: completionExtension, handlers: aiHandlers, isLoading: aiLoading } = useEditorCompletion(editorRef)

const customHandlers = {
  imageUpload: {
    canExecute: (editor: Editor) => editor.can().insertContent({ type: 'imageUpload' }),
    execute: (editor: Editor) => editor.chain().focus().insertContent({ type: 'imageUpload' }),
    isActive: (editor: Editor) => editor.isActive('imageUpload'),
    isDisabled: undefined
  },
  table: {
    canExecute: (editor: Editor) => editor.can().insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
    execute: (editor: Editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
    isActive: (editor: Editor) => editor.isActive('table'),
    isDisabled: undefined
  },
  ...aiHandlers
} satisfies EditorCustomHandlers

const { items: emojiItems } = useEditorEmojis()
const { items: suggestionItems } = useEditorSuggestions(customHandlers)
const { getItems: getDragHandleItems, onNodeChange } = useEditorDragHandle(customHandlers)
const { toolbarItems, bubbleToolbarItems, getImageToolbarItems, getTableToolbarItems } = useEditorToolbar(customHandlers, { aiLoading })

const extensions = computed(() => [
  CodeBlockShiki.configure({
    defaultTheme: 'material-theme',
    themes: {
      light: 'material-theme-lighter',
      dark: 'material-theme-palenight'
    }
  }),
  completionExtension,
  CustomImage,
  ImageUpload,
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
  TaskList,
  TaskItem
])

function onUpdate(value: string) {
  modelValue.value = value
}
</script>

<template>
  <UEditor
    ref="editorRef"
    v-slot="{ editor, handlers }"
    :model-value="modelValue"
    content-type="markdown"
    :image="false"
    :starter-kit="{ codeBlock: false }"
    :extensions="extensions"
    :handlers="customHandlers"
    autofocus
    placeholder="输入内容，按 '/' 打开命令菜单..."
    class="min-h-screen"
    :ui="{
      base: 'p-4 sm:p-14',
      content: 'max-w-4xl mx-auto'
    }"
    @update:model-value="onUpdate"
  >
    <!-- 固定工具栏 -->
    <UEditorToolbar :editor="editor" :items="toolbarItems" />

    <!-- 气泡工具栏（选中文本时） -->
    <UEditorToolbar
      :editor="editor"
      :items="bubbleToolbarItems"
      layout="bubble"
      :should-show="({ editor: e, view, state }: any) => {
        if (e.isActive('imageUpload') || e.isActive('image') || state.selection instanceof CellSelection) {
          return false
        }
        const { selection } = state
        return view.hasFocus() && !selection.empty
      }"
    >
      <template #link>
        <EditorLinkPopover :editor="editor" />
      </template>
    </UEditorToolbar>

    <!-- 图片工具栏 -->
    <UEditorToolbar
      :editor="editor"
      :items="getImageToolbarItems(editor)"
      layout="bubble"
      :should-show="({ editor: e, view }: any) => {
        return e.isActive('image') && view.hasFocus()
      }"
    />

    <!-- 表格工具栏 -->
    <UEditorToolbar
      :editor="editor"
      :items="getTableToolbarItems(editor)"
      layout="bubble"
      :should-show="({ editor: e, view }: any) => {
        return e.state.selection instanceof CellSelection && view.hasFocus()
      }"
    />

    <!-- 拖拽手柄 -->
    <UEditorDragHandle
      v-slot="{ ui, onClick }"
      :editor="editor"
      @node-change="onNodeChange"
    >
      <UButton
        icon="i-lucide-plus"
        :ui="ui"
        @click="(e: MouseEvent) => {
          e.stopPropagation()
          const node = onClick()
          handlers.suggestion?.execute(editor, { pos: node?.pos }).run()
        }"
      />
      <UDropdownMenu
        :items="getDragHandleItems(editor)"
        @update:open="editor.chain().setMeta('lockDragHandle', $event).run()"
      >
        <UButton icon="i-lucide-grip-vertical" :ui="ui" />
      </UDropdownMenu>
    </UEditorDragHandle>

    <!-- 菜单 -->
    <UEditorEmojiMenu :editor="editor" :items="emojiItems" />
    <UEditorSuggestionMenu :editor="editor" :items="suggestionItems" />
  </UEditor>
</template>
