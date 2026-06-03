import type { ShearReinforcementSummary } from '../types'

import { draftShearReinforcementWarnings } from './reinforcementWarnings'
import type {
  DraftSteelClassData,
  ShearReinforcementCapacityInput,
} from './reinforcementTypes'

// TODO: verify draft strengths against SP63.13330 before any production design use.
export const draftSteelClassData: Record<string, DraftSteelClassData> = {
  A240: {
    className: 'A240',
    draftDesignStrengthMpa: 170,
    note: 'Draft placeholder value; verify against SP63.',
  },
  A400: {
    className: 'A400',
    draftDesignStrengthMpa: 280,
    note: 'Draft placeholder value; verify against SP63.',
  },
  A500: {
    className: 'A500',
    draftDesignStrengthMpa: 355,
    note: 'Draft placeholder value; verify against SP63.',
  },
  B500: {
    className: 'B500',
    draftDesignStrengthMpa: 355,
    note: 'Draft placeholder value; verify against SP63.',
  },
}

export function calculateShearReinforcementCapacity({
  reinforcement,
  concreteCapacityN,
  designDemandN,
}: ShearReinforcementCapacityInput): ShearReinforcementSummary {
  if (!reinforcement.enabled) {
    return {
      enabled: false,
      steelClass: null,
      layoutType: null,
      barDiameterMm: null,
      barSpacingMm: null,
      rowCount: 0,
      legsPerRow: 0,
      totalLegs: 0,
      firstRowDistanceMm: null,
      rowSpacingMm: null,
      reinforcementAreaMm2: null,
      reinforcementContributionN: null,
      draftCapacityWithReinforcementN: null,
      utilizationWithReinforcement: null,
      warnings: [],
    }
  }

  const totalLegs = reinforcement.rowCount * reinforcement.legsPerRow
  const reinforcementAreaMm2 =
    (Math.PI * reinforcement.barDiameterMm ** 2 / 4) * totalLegs
  const steel = draftSteelClassData[reinforcement.steelClass]
  const reinforcementContributionN = reinforcementAreaMm2 * steel.draftDesignStrengthMpa
  const draftCapacityWithReinforcementN =
    concreteCapacityN === null ? null : concreteCapacityN + reinforcementContributionN
  const utilizationWithReinforcement =
    draftCapacityWithReinforcementN === null || designDemandN === null
      ? null
      : designDemandN / draftCapacityWithReinforcementN

  return {
    enabled: true,
    steelClass: reinforcement.steelClass,
    layoutType: reinforcement.layoutType,
    barDiameterMm: reinforcement.barDiameterMm,
    barSpacingMm: reinforcement.barSpacingMm,
    rowCount: reinforcement.rowCount,
    legsPerRow: reinforcement.legsPerRow,
    totalLegs,
    firstRowDistanceMm: reinforcement.firstRowDistanceMm,
    rowSpacingMm: reinforcement.rowSpacingMm,
    reinforcementAreaMm2,
    reinforcementContributionN,
    draftCapacityWithReinforcementN,
    utilizationWithReinforcement,
    warnings: draftShearReinforcementWarnings,
  }
}
