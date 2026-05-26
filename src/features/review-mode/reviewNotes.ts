export type ReviewNote = {
  id: string
  author: string
  createdAt: string
  text: string
}

export function createReviewNote({
  author,
  text,
  createdAt = new Date().toISOString(),
}: {
  author: string
  text: string
  createdAt?: string
}): ReviewNote {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `note-${Date.now()}-${Math.random()}`,
    author,
    createdAt,
    text,
  }
}
