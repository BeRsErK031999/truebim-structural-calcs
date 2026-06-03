export const knowledgeCategories = [
  'center',
  'moments',
  'edge',
  'corner',
  'wall-end',
  'wall-corner',
  'openings',
  'contours',
  'reinforcement',
  'round',
  'verification',
  'SP63',
  'review',
] as const

export type KnowledgeCategory = (typeof knowledgeCategories)[number]

export const knowledgeCategoryLabels: Record<KnowledgeCategory, string> = {
  center: 'Center',
  moments: 'Moments',
  edge: 'Edge',
  corner: 'Corner',
  'wall-end': 'Wall end',
  'wall-corner': 'Wall corner',
  openings: 'Openings',
  contours: 'Contours',
  reinforcement: 'Reinforcement',
  round: 'Round',
  verification: 'Verification',
  SP63: 'SP63',
  review: 'Review',
}

export function isKnowledgeCategory(value: string): value is KnowledgeCategory {
  return knowledgeCategories.includes(value as KnowledgeCategory)
}
