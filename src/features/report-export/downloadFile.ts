export function downloadTextFile(filename: string, content: string, mimeType: string) {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new Error('Browser download API is unavailable')
  }

  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  try {
    anchor.href = url
    anchor.download = filename
    anchor.rel = 'noopener'
    anchor.style.display = 'none'
    document.body.append(anchor)
    anchor.click()
  } finally {
    anchor.remove()
    URL.revokeObjectURL(url)
  }
}
