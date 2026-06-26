import type { PunchingShearInput } from '../types'

import { calculateSp63Interaction } from './sp63Interaction'
import type { Sp63InteractionInput } from './sp63Types'

export function calculateSp63MathcadBenchmark(input: PunchingShearInput) {
  const benchmarkInput = toSp63InteractionInput(input)

  return benchmarkInput ? calculateSp63Interaction(benchmarkInput) : null
}

export function toSp63InteractionInput(input: PunchingShearInput): Sp63InteractionInput | null {
  if (input.caseType !== 'center' || !input.rectColumn) {
    return null
  }

  const hasMomentDemand = input.forces.momentXKnM !== 0 || input.forces.momentYKnM !== 0

  if (!hasMomentDemand && !input.shearReinforcement.enabled) {
    return null
  }

  const reinforcementClass = input.shearReinforcement.steelClass ?? 'A240'
  const shearBarDiameterMm = input.shearReinforcement.barDiameterMm ?? 6

  return {
    concreteClass: input.concrete.className,
    reinforcementClass,
    shearBarDiameterMm,
    manualAswMm2: input.shearReinforcement.manualAswMm2,
    manualSwMm: input.shearReinforcement.manualSwMm,
    h: input.slab.thicknessMm,
    h0: input.slab.effectiveDepthMm,
    a1: input.rectColumn.widthYMm,
    b1: input.rectColumn.widthXMm,
    Finf: input.forces.axialForceKn,
    Fsup: 0,
    MxInf: input.forces.momentXKnM,
    MxSup: input.forces.momentXKnM,
    MyInf: input.forces.momentYKnM,
    MySup: input.forces.momentYKnM,
    shearReinforcementEnabled: input.shearReinforcement.enabled,
  }
}
