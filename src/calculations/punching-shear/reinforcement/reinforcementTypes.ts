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
  steelClass: ShearReinforcementSteelClass
  layoutType: ShearReinforcementLayoutType
  barDiameterMm: number
  barSpacingMm: number
  rowCount: number
  legsPerRow: number
  firstRowDistanceMm: number
  rowSpacingMm: number
}

export type ShearReinforcementCapacityInput = {
  reinforcement: NormalizedShearReinforcement
  concreteCapacityN: number | null
  designDemandN: number | null
}

export const defaultShearReinforcementInput: Required<
  Omit<ShearReinforcementInput, 'rows'>
> = {
  enabled: false,
  barDiameterMm: 10,
  barSpacingMm: 100,
  rowCount: 2,
  legsPerRow: 4,
  steelClass: 'A400',
  firstRowDistanceMm: 80,
  rowSpacingMm: 100,
  layoutType: 'closed-stirrups',
}
