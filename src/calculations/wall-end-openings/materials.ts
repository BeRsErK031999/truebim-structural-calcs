import type { WallEndConcreteClass, WallEndReinforcementClass } from './types'

type ConcreteMaterial = {
  className: WallEndConcreteClass
  rbKgPerCm2: number
  rbtKgPerCm2: number
}

type ReinforcementMaterial = {
  className: WallEndReinforcementClass
  rsKgPerCm2: number
  rswKgPerCm2: number
}

const concreteMaterials: Record<WallEndConcreteClass, ConcreteMaterial> = {
  B10: { className: 'B10', rbKgPerCm2: 61.2, rbtKgPerCm2: 5.7 },
  B15: { className: 'B15', rbKgPerCm2: 86.6, rbtKgPerCm2: 7.6 },
  B20: { className: 'B20', rbKgPerCm2: 117, rbtKgPerCm2: 9.2 },
  B25: { className: 'B25', rbKgPerCm2: 148, rbtKgPerCm2: 10.7 },
  B30: { className: 'B30', rbKgPerCm2: 173, rbtKgPerCm2: 11.7 },
  B35: { className: 'B35', rbKgPerCm2: 199, rbtKgPerCm2: 13.3 },
  B40: { className: 'B40', rbKgPerCm2: 224, rbtKgPerCm2: 14.3 },
  B45: { className: 'B45', rbKgPerCm2: 255, rbtKgPerCm2: 15.3 },
  B50: { className: 'B50', rbKgPerCm2: 280, rbtKgPerCm2: 16.3 },
  B55: { className: 'B55', rbKgPerCm2: 306, rbtKgPerCm2: 17.3 },
  B60: { className: 'B60', rbKgPerCm2: 336, rbtKgPerCm2: 18.3 },
}

const reinforcementMaterials: Record<WallEndReinforcementClass, ReinforcementMaterial> = {
  A240: { className: 'A240', rsKgPerCm2: 2190, rswKgPerCm2: 1730 },
  A300: { className: 'A300', rsKgPerCm2: 2750, rswKgPerCm2: 2190 },
  A400: { className: 'A400', rsKgPerCm2: 3620, rswKgPerCm2: 2900 },
  A500: { className: 'A500', rsKgPerCm2: 4430, rswKgPerCm2: 3060 },
  B500: { className: 'B500', rsKgPerCm2: 4230, rswKgPerCm2: 3060 },
}

export const wallEndConcreteClasses = Object.keys(concreteMaterials) as WallEndConcreteClass[]
export const wallEndReinforcementClasses = Object.keys(
  reinforcementMaterials,
) as WallEndReinforcementClass[]

export function getWallEndConcreteMaterial(className: WallEndConcreteClass) {
  return concreteMaterials[className]
}

export function getWallEndReinforcementMaterial(className: WallEndReinforcementClass) {
  return reinforcementMaterials[className]
}

export function kgPerCm2ToTonPerM2(value: number) {
  return value * 10
}
