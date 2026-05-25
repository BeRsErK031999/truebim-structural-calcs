import type { ConcreteClassName } from './types'

export type ConcreteMaterial = {
  className: ConcreteClassName
  rbtMpa: number
  rbMpa: number
}

export const concreteMaterials: Record<ConcreteClassName, ConcreteMaterial> = {
  // TODO: verify values against СП63.13330.
  B15: { className: 'B15', rbtMpa: 0.75, rbMpa: 8.5 },
  B20: { className: 'B20', rbtMpa: 0.9, rbMpa: 11.5 },
  B25: { className: 'B25', rbtMpa: 1.05, rbMpa: 14.5 },
  B30: { className: 'B30', rbtMpa: 1.15, rbMpa: 17 },
  B35: { className: 'B35', rbtMpa: 1.3, rbMpa: 19.5 },
  B40: { className: 'B40', rbtMpa: 1.4, rbMpa: 22 },
}

export function getConcreteMaterial(className: ConcreteClassName) {
  return concreteMaterials[className]
}
