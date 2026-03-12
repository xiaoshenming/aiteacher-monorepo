import Image from '@tiptap/extension-image'
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ResizableImageNodeComponent from './ResizableImageNode.vue'

export const ResizableImage = Image.extend({
  name: 'image',
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-width') ? Number(el.getAttribute('data-width')) : null,
        renderHTML: (attrs: Record<string, unknown>) => attrs.width ? { 'data-width': attrs.width } : {},
      },
      height: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-height') ? Number(el.getAttribute('data-height')) : null,
        renderHTML: (attrs: Record<string, unknown>) => attrs.height ? { 'data-height': attrs.height } : {},
      },
      align: {
        default: 'center',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-align') || 'center',
        renderHTML: (attrs: Record<string, unknown>) => ({ 'data-align': attrs.align }),
      },
      borderRadius: {
        default: 0,
        parseHTML: (el: HTMLElement) => Number(el.getAttribute('data-border-radius')) || 0,
        renderHTML: (attrs: Record<string, unknown>) => ({ 'data-border-radius': attrs.borderRadius }),
      },
      shadow: {
        default: 'none',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-shadow') || 'none',
        renderHTML: (attrs: Record<string, unknown>) => ({ 'data-shadow': attrs.shadow }),
      },
      borderWidth: {
        default: 0,
        parseHTML: (el: HTMLElement) => Number(el.getAttribute('data-border-width')) || 0,
        renderHTML: (attrs: Record<string, unknown>) => ({ 'data-border-width': attrs.borderWidth }),
      },
      borderColor: {
        default: '#e5e7eb',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-border-color') || '#e5e7eb',
        renderHTML: (attrs: Record<string, unknown>) => ({ 'data-border-color': attrs.borderColor }),
      },
      backgroundColor: {
        default: 'transparent',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-background-color') || 'transparent',
        renderHTML: (attrs: Record<string, unknown>) => ({ 'data-background-color': attrs.backgroundColor }),
      },
    }
  },

  addNodeView(): NodeViewRenderer {
    return VueNodeViewRenderer(ResizableImageNodeComponent)
  },
})

export default ResizableImage
