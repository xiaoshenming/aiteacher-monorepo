import { Node, mergeAttributes } from '@tiptap/core'
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import CoverBlockNodeComponent from './CoverBlockNode.vue'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    coverBlock: {
      insertCoverBlock: () => ReturnType
    }
  }
}

export const CoverBlock = Node.create({
  name: 'coverBlock',
  group: 'block',
  content: 'block+',
  draggable: true,
  defining: true,

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: el => el.getAttribute('data-src') || '',
        renderHTML: attrs => ({ 'data-src': attrs.src }),
      },
      minHeight: {
        default: 200,
        parseHTML: el => Number(el.getAttribute('data-min-height')) || 200,
        renderHTML: attrs => ({ 'data-min-height': attrs.minHeight }),
      },
      objectFit: {
        default: 'cover',
        parseHTML: el => el.getAttribute('data-object-fit') || 'cover',
        renderHTML: attrs => ({ 'data-object-fit': attrs.objectFit }),
      },
      overlayOpacity: {
        default: 40,
        parseHTML: el => Number(el.getAttribute('data-overlay-opacity')) ?? 40,
        renderHTML: attrs => ({ 'data-overlay-opacity': attrs.overlayOpacity }),
      },
      overlayColor: {
        default: '#000000',
        parseHTML: el => el.getAttribute('data-overlay-color') || '#000000',
        renderHTML: attrs => ({ 'data-overlay-color': attrs.overlayColor }),
      },
      textColor: {
        default: '#ffffff',
        parseHTML: el => el.getAttribute('data-text-color') || '#ffffff',
        renderHTML: attrs => ({ 'data-text-color': attrs.textColor }),
      },
      padding: {
        default: 32,
        parseHTML: el => Number(el.getAttribute('data-padding')) || 32,
        renderHTML: attrs => ({ 'data-padding': attrs.padding }),
      },
      borderRadius: {
        default: 0,
        parseHTML: el => Number(el.getAttribute('data-border-radius')) || 0,
        renderHTML: attrs => ({ 'data-border-radius': attrs.borderRadius }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="cover-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'cover-block' }), 0]
  },

  addNodeView(): NodeViewRenderer {
    return VueNodeViewRenderer(CoverBlockNodeComponent)
  },

  addCommands() {
    return {
      insertCoverBlock: () => ({ commands }) => {
        return commands.insertContent({
          type: 'coverBlock',
          content: [{ type: 'paragraph' }],
        })
      },
    }
  },
})

export default CoverBlock
