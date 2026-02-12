import type { PreviewType, PreviewStrategy } from '~/types/cloud'

const mimeRules: Array<{ test: (mime: string) => boolean, type: PreviewType, label: string, icon: string }> = [
  { test: m => m.startsWith('image/'), type: 'image', label: '图片', icon: 'i-lucide-image' },
  { test: m => m.includes('pdf'), type: 'pdf', label: 'PDF', icon: 'i-lucide-file-text' },
  {
    test: m => m.includes('word') || m.includes('document') || m.includes('wps-office.doc') || m.endsWith('.docx') || m.endsWith('.doc'),
    type: 'word',
    label: 'Word',
    icon: 'i-lucide-file-text'
  },
  {
    test: m => m.includes('sheet') || m.includes('excel') || m.includes('wps-office.xls') || m.endsWith('.xlsx') || m.endsWith('.xls'),
    type: 'excel',
    label: 'Excel',
    icon: 'i-lucide-sheet'
  },
  {
    test: m => m.includes('presentation') || m.includes('powerpoint') || m.includes('wps-office.ppt') || m.endsWith('.pptx') || m.endsWith('.ppt'),
    type: 'ppt',
    label: 'PPT',
    icon: 'i-lucide-presentation'
  },
  { test: m => m.startsWith('video/'), type: 'video', label: '视频', icon: 'i-lucide-video' },
  { test: m => m.startsWith('audio/'), type: 'audio', label: '音频', icon: 'i-lucide-music' },
]

export function useFilePreview() {
  function resolveStrategy(mime: string | undefined | null): PreviewStrategy {
    const m = (mime || '').toLowerCase()
    for (const rule of mimeRules) {
      if (rule.test(m)) {
        return { type: rule.type, label: rule.label, icon: rule.icon }
      }
    }
    return { type: 'unsupported', label: '不支持预览', icon: 'i-lucide-file' }
  }

  function isPreviewable(mime: string | undefined | null): boolean {
    return resolveStrategy(mime).type !== 'unsupported'
  }

  return { resolveStrategy, isPreviewable }
}
