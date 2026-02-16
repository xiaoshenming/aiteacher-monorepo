import type { Editor } from '@tiptap/vue-3'
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType, BorderStyle, AlignmentType } from 'docx'

export function useEditorExport() {
  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportMarkdown(editor: Editor, filename = '教案') {
    const serializer = (editor.storage.markdown as { serializer?: { serialize: (content: unknown) => string } })?.serializer
    const md = serializer
      ? serializer.serialize(editor.state.doc.content)
      : editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n')
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    downloadBlob(blob, `${filename}.md`)
  }

  /** Parse editor HTML into docx elements */
  function htmlToDocxElements(html: string) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const elements: (Paragraph | Table)[] = []

    function processNode(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim()
        if (text) {
          elements.push(new Paragraph({ children: [new TextRun(text)] }))
        }
        return
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return
      const el = node as HTMLElement
      const tag = el.tagName.toLowerCase()

      if (tag === 'h1') {
        elements.push(new Paragraph({
          children: [new TextRun({ text: el.textContent || '', bold: true, size: 36 })],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }))
      } else if (tag === 'h2') {
        elements.push(new Paragraph({
          children: [new TextRun({ text: el.textContent || '', bold: true, size: 28 })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        }))
      } else if (tag === 'h3') {
        elements.push(new Paragraph({
          children: [new TextRun({ text: el.textContent || '', bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        }))
      } else if (tag === 'table') {
        const rows: TableRow[] = []
        el.querySelectorAll('tr').forEach((tr) => {
          const cells: TableCell[] = []
          tr.querySelectorAll('th, td').forEach((td) => {
            const isHeader = td.tagName.toLowerCase() === 'th'
            cells.push(new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: td.textContent || '', bold: isHeader, size: 21, font: 'SimSun' })],
              })],
              shading: isHeader ? { fill: 'F0F0F0' } : undefined,
            }))
          })
          if (cells.length > 0) {
            rows.push(new TableRow({ children: cells }))
          }
        })
        if (rows.length > 0) {
          elements.push(new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
          }))
        }
      } else if (tag === 'ul' || tag === 'ol') {
        el.querySelectorAll(':scope > li').forEach((li, i) => {
          const bullet = tag === 'ol' ? `${i + 1}. ` : '• '
          elements.push(new Paragraph({
            children: [new TextRun({ text: `${bullet}${li.textContent || ''}`, size: 21 })],
            indent: { left: 720 },
          }))
        })
      } else if (tag === 'p') {
        const runs: TextRun[] = []
        el.childNodes.forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            runs.push(new TextRun({ text: child.textContent || '', size: 21 }))
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childEl = child as HTMLElement
            const childTag = childEl.tagName.toLowerCase()
            runs.push(new TextRun({
              text: childEl.textContent || '',
              bold: childTag === 'strong' || childTag === 'b',
              italics: childTag === 'em' || childTag === 'i',
              size: 21,
            }))
          }
        })
        if (runs.length > 0) {
          elements.push(new Paragraph({ children: runs, spacing: { after: 100 } }))
        }
      } else if (tag === 'pre') {
        elements.push(new Paragraph({
          children: [new TextRun({ text: el.textContent || '', font: 'Courier New', size: 20 })],
          spacing: { before: 100, after: 100 },
        }))
      } else if (tag === 'blockquote') {
        elements.push(new Paragraph({
          children: [new TextRun({ text: el.textContent || '', italics: true, size: 21 })],
          indent: { left: 720 },
        }))
      } else {
        // Recurse into other container elements (div, etc.)
        el.childNodes.forEach(child => processNode(child))
      }
    }

    doc.body.childNodes.forEach(child => processNode(child))
    return elements
  }

  async function exportWord(editor: Editor, filename = '教案') {
    const editorHtml = editor.getHTML()
    const children = htmlToDocxElements(editorHtml)

    if (children.length === 0) {
      children.push(new Paragraph({ children: [new TextRun('')] }))
    }

    const doc = new Document({
      sections: [{ children }],
    })

    const blob = await Packer.toBlob(doc)
    downloadBlob(blob, `${filename}.docx`)
  }

  function exportPDF(editor: Editor, filename = '教案') {
    const editorHtml = editor.getHTML()
    const printStyles = `
      body { font-family: "SimSun", "宋体", serif; padding: 2cm; color: #000; }
      h1 { text-align: center; font-size: 22pt; margin-bottom: 1em; }
      h2 { font-size: 14pt; margin-top: 1.5em; border-bottom: 1px solid #333; padding-bottom: 4px; }
      table { border-collapse: collapse; width: 100%; margin: 1em 0; }
      th, td { border: 1px solid #333; padding: 6px 10px; text-align: left; vertical-align: top; font-size: 10.5pt; }
      th { background-color: #f0f0f0; font-weight: bold; }
      pre, code { font-family: "Courier New", monospace; background: #f5f5f5; padding: 8px; border: 1px solid #ddd; }
      ul, ol { padding-left: 2em; }
      @media print { body { padding: 0; } @page { margin: 2cm; } }
    `
    const blob = new Blob(
      [`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title><style>${printStyles}</style></head><body>${editorHtml}</body></html>`],
      { type: 'text/html;charset=utf-8' }
    )
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
        URL.revokeObjectURL(url)
      }
    } else {
      URL.revokeObjectURL(url)
    }
  }

  return { exportMarkdown, exportWord, exportPDF }
}
