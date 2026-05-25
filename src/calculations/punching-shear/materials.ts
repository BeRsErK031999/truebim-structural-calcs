import type { ConcreteClassName } from './types'

export type DraftConcreteClassData = {
  className: ConcreteClassName
  draftConcreteResistanceMpa: number
  draftCompressiveResistanceMpa: number
}

export const draftConcreteClassData: Record<ConcreteClassName, DraftConcreteClassData> = {
  // TODO: verify values and coefficients against СП63.13330.
  B15: { className: 'B15', draftConcreteResistanceMpa: 0.75, draftCompressiveResistanceMpa: 8.5 },
  B20: { className: 'B20', draftConcreteResistanceMpa: 0.9, draftCompressiveResistanceMpa: 11.5 },
  B25: { className: 'B25', draftConcreteResistanceMpa: 1.05, draftCompressiveResistanceMpa: 14.5 },
  B30: { className: 'B30', draftConcreteResistanceMpa: 1.15, draftCompressiveResistanceMpa: 17 },
  B35: { className: 'B35', draftConcreteResistanceMpa: 1.3, draftCompressiveResistanceMpa: 19.5 },
  B40: { className: 'B40', draftConcreteResistanceMpa: 1.4, draftCompressiveResistanceMpa: 22 },
}

export function getConcreteClassData(className: ConcreteClassName) {
  return draftConcreteClassData[className]
}
