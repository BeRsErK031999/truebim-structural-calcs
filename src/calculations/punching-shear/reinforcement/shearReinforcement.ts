import type { ShearReinforcementInput } from '../types'

import { calculateShearReinforcementCapacity } from './reinforcementCapacity'
import { normalizeShearReinforcement } from './reinforcementLayout'

export function summarizeShearReinforcement(
  reinforcement: ShearReinforcementInput,
  concreteCapacityN: number | null = null,
  designDemandN: number | null = null,
  controlPerimeterMm: number | null = null,
) {
  return calculateShearReinforcementCapacity({
    reinforcement: normalizeShearReinforcement(reinforcement),
    concreteCapacityN,
    designDemandN,
    controlPerimeterMm,
  })
}
