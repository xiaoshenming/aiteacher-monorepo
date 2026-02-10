import type { Editor } from '@tiptap/vue-3'
import { Completion } from '~/components/editor/CompletionExtension'
import type { CompletionStorage } from '~/components/editor/CompletionExtension'

type CompletionMode = 'continue' | 'fix' | 'extend' | 'reduce' | 'simplify' | 'summarize' | 'translate'

/** Map our mode names to backend-cloud assistant-stream command names */
const MODE_TO_COMMAND: Record<CompletionMode, string> = {
  continue: '续写',
  fix: '校阅',
  extend: '扩写',
  reduce: '缩写',
  simplify: '润色',
  summarize: '总结',
  translate: '翻译'
}

export function useEditorCompletion(editorRef: Ref<{ editor: Editor | undefined } | null | undefined>) {
  const config = useRuntimeConfig()
  const userStore = useUserStore()

  const isLoading = ref(false)
  const mode = ref<CompletionMode>('continue')
  const language = ref<string>()
  const completionText = ref('')
  let abortController: AbortController | null = null

  // State for direct insertion/transform mode
  const insertState = ref<{
    pos: number
    deleteRange?: { from: number, to: number }
  }>()

  function getCompletionStorage() {
    const storage = editorRef.value?.editor?.storage as Record<string, CompletionStorage> | undefined
    return storage?.completion
  }

  /** Parse SSE stream from backend */
  async function streamCompletion(prompt: string) {
    abortController = new AbortController()
    isLoading.value = true
    completionText.value = ''

    const isContinueMode = mode.value === 'continue'

    // Choose endpoint based on mode
    const baseURL = isContinueMode
      ? (config.public.apiBase as string)
      : (config.public.apiCloud as string)

    const url = isContinueMode
      ? 'ai/editor-completion'
      : 'editor/assistant-stream'

    const body = isContinueMode
      ? { prompt, model: 'deepseek-chat' }
      : {
          command: mode.value === 'translate'
            ? `翻译成${language.value || '英文'}`
            : MODE_TO_COMMAND[mode.value],
          input: prompt,
          lang: 'zh-CN',
          model: 'deepseek-chat'
        }

    try {
      const response = await fetch(`${baseURL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': userStore.token ? `Bearer ${userStore.token}` : '',
          'deviceType': 'pc'
        },
        body: JSON.stringify(body),
        signal: abortController.signal
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim()
            if (!dataStr) continue

            try {
              const data = JSON.parse(dataStr)
              const chunk = data?.data?.chunk
              const isDone = data?.data?.done

              if (isDone) {
                onStreamFinish()
                return
              }

              if (chunk) {
                completionText.value += chunk
                onChunkReceived(chunk)
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      }

      // Stream ended without explicit done event
      onStreamFinish()
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('AI completion error:', e)
      }
      insertState.value = undefined
      getCompletionStorage()?.clearSuggestion()
    } finally {
      isLoading.value = false
      abortController = null
    }
  }

  function onChunkReceived(chunk: string) {
    const editor = editorRef.value?.editor
    if (!editor) return

    const storage = getCompletionStorage()

    if (mode.value === 'continue' && storage?.visible) {
      // Inline suggestion mode — update ghost text
      let suggestionText = completionText.value
      if (storage.position !== undefined) {
        const textBefore = editor.state.doc.textBetween(Math.max(0, storage.position - 1), storage.position)
        if (textBefore && !/\s/.test(textBefore) && !suggestionText.startsWith(' ')) {
          suggestionText = ' ' + suggestionText
        }
      }
      storage.setSuggestion(suggestionText)
      editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))
    } else if (insertState.value) {
      // Transform modes — wait for full completion (handled in onStreamFinish)
      const transformModes: CompletionMode[] = ['fix', 'extend', 'reduce', 'simplify', 'summarize', 'translate']
      if (transformModes.includes(mode.value)) {
        return
      }

      // Direct streaming insertion for continue mode without inline suggestion
      if (insertState.value.deleteRange) {
        editor.chain().focus().deleteRange(insertState.value.deleteRange).run()
        insertState.value.deleteRange = undefined
      }

      let delta = chunk
      // Add space before first chunk if needed
      if (completionText.value === chunk && mode.value === 'continue') {
        const textBefore = editor.state.doc.textBetween(Math.max(0, insertState.value.pos - 1), insertState.value.pos)
        if (textBefore && !/\s/.test(textBefore)) {
          delta = ' ' + delta
        }
      }

      editor.chain().focus().command(({ tr }) => {
        tr.insertText(delta, insertState.value!.pos)
        return true
      }).run()
      insertState.value.pos += delta.length
    }
  }

  function onStreamFinish() {
    const editor = editorRef.value?.editor
    if (!editor) return

    const storage = getCompletionStorage()

    // For inline suggestion mode, don't clear — let user accept with Tab
    if (mode.value === 'continue' && storage?.visible) {
      return
    }

    // For transform modes, insert the full completion with markdown parsing
    const transformModes: CompletionMode[] = ['fix', 'extend', 'reduce', 'simplify', 'summarize', 'translate']
    if (transformModes.includes(mode.value) && insertState.value && completionText.value) {
      if (insertState.value.deleteRange) {
        editor.chain().focus().deleteRange(insertState.value.deleteRange).run()
      }
      editor.chain()
        .focus()
        .insertContentAt(insertState.value.pos, completionText.value, { contentType: 'markdown' })
        .run()
    }

    insertState.value = undefined
  }

  function stop() {
    abortController?.abort()
    abortController = null
    isLoading.value = false
  }

  function triggerTransform(editor: Editor, transformMode: Exclude<CompletionMode, 'continue'>, lang?: string) {
    if (isLoading.value) return

    getCompletionStorage()?.clearSuggestion()

    const { state } = editor
    const { selection } = state

    if (selection.empty) return

    mode.value = transformMode
    language.value = lang
    const selectedText = state.doc.textBetween(selection.from, selection.to)

    insertState.value = { pos: selection.from, deleteRange: { from: selection.from, to: selection.to } }

    streamCompletion(selectedText)
  }

  function getMarkdownBefore(editor: Editor, pos: number): string {
    const { state } = editor
    const serializer = (editor.storage.markdown as { serializer?: { serialize: (content: unknown) => string } })?.serializer
    if (serializer) {
      const slice = state.doc.slice(0, pos)
      return serializer.serialize(slice.content)
    }
    return state.doc.textBetween(0, pos, '\n')
  }

  function triggerContinue(editor: Editor) {
    if (isLoading.value) return

    mode.value = 'continue'
    getCompletionStorage()?.clearSuggestion()
    const { state } = editor
    const { selection } = state

    if (selection.empty) {
      const textBefore = getMarkdownBefore(editor, selection.from)
      insertState.value = { pos: selection.from }
      streamCompletion(textBefore)
    } else {
      const textBefore = getMarkdownBefore(editor, selection.to)
      insertState.value = { pos: selection.to }
      streamCompletion(textBefore)
    }
  }

  // Configure Completion extension
  const extension = Completion.configure({
    onTrigger: (editor) => {
      if (isLoading.value) return
      mode.value = 'continue'
      const textBefore = getMarkdownBefore(editor, editor.state.selection.from)
      streamCompletion(textBefore)
    },
    onAccept: () => {
      completionText.value = ''
    },
    onDismiss: () => {
      stop()
      completionText.value = ''
    }
  })

  // Create handlers for toolbar
  const handlers = {
    aiContinue: {
      canExecute: () => !isLoading.value,
      execute: (editor: Editor) => {
        triggerContinue(editor)
        return editor.chain()
      },
      isActive: () => !!(isLoading.value && mode.value === 'continue'),
      isDisabled: () => !!isLoading.value
    },
    aiFix: {
      canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor: Editor) => {
        triggerTransform(editor, 'fix')
        return editor.chain()
      },
      isActive: () => !!(isLoading.value && mode.value === 'fix'),
      isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value
    },
    aiExtend: {
      canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor: Editor) => {
        triggerTransform(editor, 'extend')
        return editor.chain()
      },
      isActive: () => !!(isLoading.value && mode.value === 'extend'),
      isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value
    },
    aiReduce: {
      canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor: Editor) => {
        triggerTransform(editor, 'reduce')
        return editor.chain()
      },
      isActive: () => !!(isLoading.value && mode.value === 'reduce'),
      isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value
    },
    aiSimplify: {
      canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor: Editor) => {
        triggerTransform(editor, 'simplify')
        return editor.chain()
      },
      isActive: () => !!(isLoading.value && mode.value === 'simplify'),
      isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value
    },
    aiSummarize: {
      canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor: Editor) => {
        triggerTransform(editor, 'summarize')
        return editor.chain()
      },
      isActive: () => !!(isLoading.value && mode.value === 'summarize'),
      isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value
    },
    aiTranslate: {
      canExecute: (editor: Editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor: Editor, cmd: { language?: string } | undefined) => {
        triggerTransform(editor, 'translate', cmd?.language)
        return editor.chain()
      },
      isActive: (_editor: Editor, cmd: { language?: string } | undefined) => !!(isLoading.value && mode.value === 'translate' && language.value === cmd?.language),
      isDisabled: (editor: Editor) => editor.state.selection.empty || !!isLoading.value
    }
  }

  return {
    extension,
    handlers,
    isLoading,
    mode
  }
}
