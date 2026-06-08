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

  const reinforcementClass = input.shearReinforcement.steelClass ?? 'A240'
  const shearBarDiameterMm = input.shearReinforcement.barDiameterMm ?? 6

  if (input.concrete.className !== 'B30' || reinforcementClass !== 'A240') {
    return null
  }

  return {
    concreteClass: input.concrete.className,
    reinforcementClass,
    shearBarDiameterMm,
    h: input.slab.thicknessMm,
    h0: input.slab.effectiveDepthMm,
    a1: input.rectColumn.widthYMm,
    b1: input.rectColumn.widthXMm,
    Finf: input.forces.axialForceKn,
    Fsup: 0,
    MxInf: input.forces.momentXKnM,
    MxSup: 0,
    MyInf: input.forces.momentYKnM,
    MySup: 0,
    shearReinforcementEnabled: input.shearReinforcement.enabled,
  }
}

