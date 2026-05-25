import type { ShearReinforcementInput } from '../types'

export function summarizeShearReinforcement(reinforcement: ShearReinforcementInput) {
  return {
    enabled: reinforcement.enabled,
    warnings: reinforcement.enabled ? ['Shear reinforcement contribution is not implemented yet'] : [],
  }
}
