import type {
  ShearReinforcementInput,
  ShearReinforcementLayoutType,
  ShearReinforcementSteelClass,
} from '../types'

export type DraftSteelClassData = {
  className: ShearReinforcementSteelClass
  draftDesignStrengthMpa: number
  note: string
}

export type NormalizedShearReinforcement = {
  enabled: boolean
  inputMode: 'manual' | 'legacy-layout'
  steelClass: ShearReinforcementSteelClass
  layoutType: ShearReinforcementLayoutType
  barDiameterMm: number
  barSpacingMm: number
  rowCount: number
  legsPerRow: number
  firstRowDistanceMm: number
  rowSpacingMm: number
  manualAswMm2: number | null
  manualSwMm: number | null
}

export type ShearReinforcementCapacityInput = {
  reinforcement: NormalizedShearReinforcement
  concreteCapacityN: number | null
  designDemandN: number | null
  controlPerimeterMm?: number | null
}

export const defaultShearReinforcementInput: Required<
  Omit<ShearReinforcementInput, 'rows'>
> = {
  enabled: false,
  inputMode: 'manual',
  barDiameterMm: 10,
  barSpacingMm: 100,
  rowCount: 2,
  legsPerRow: 4,
  steelClass: 'A400',
  firstRowDistanceMm: 80,
  rowSpacingMm: 100,
  layoutType: 'closed-stirrups',
  manualAswMm2: 628.319,
  manualSwMm: 100,
}
