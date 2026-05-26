export function sanitizeFileName(filename: string) {
  const withoutControlCharacters = Array.from(filename)
    .filter((character) => character.charCodeAt(0) >= 32)
    .join('')
  const sanitized = withoutControlCharacters
    .trim()
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/-\./g, '.')
    .replace(/^[.-]+/, '')
    .replace(/[.-]+$/, '')

  return sanitized || 'truebim-report'
}
