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
  center: 'Центр',
  moments: 'Моменты',
  edge: 'Край',
  corner: 'Угол',
  'wall-end': 'Конец стены',
  'wall-corner': 'Угол стены',
  openings: 'Отверстия',
  contours: 'Контуры',
  reinforcement: 'Армирование',
  round: 'Круглая колонна',
  verification: 'Проверка',
  SP63: 'SP63',
  review: 'Ревью',
}

export function isKnowledgeCategory(value: string): value is KnowledgeCategory {
  return knowledgeCategories.includes(value as KnowledgeCategory)
}
