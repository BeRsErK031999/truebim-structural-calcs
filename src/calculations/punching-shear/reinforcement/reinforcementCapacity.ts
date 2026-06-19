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

export type ShearReinforcementContributionPolicyInput = {
  rawContributionN: number
  concreteCapacityN: number
}

export type ShearReinforcementContributionPolicyResult = {
  effectiveContributionN: number
  lowerLimitN: number
  upperLimitN: number
  contributionAccepted: boolean
  ignoredReason: string | null
  warnings: string[]
}

export function applyShearReinforcementContributionPolicy({
  rawContributionN,
  concreteCapacityN,
}: ShearReinforcementContributionPolicyInput): ShearReinforcementContributionPolicyResult {
  const lowerLimitN = 0.25 * concreteCapacityN
  const upperLimitN = concreteCapacityN

  if (rawContributionN < lowerLimitN) {
    return {
      effectiveContributionN: 0,
      lowerLimitN,
      upperLimitN,
      contributionAccepted: false,
      ignoredReason:
        'Вклад поперечной арматуры не учтен: Fsw,raw меньше 0.25 * Fb,ult.',
      warnings: ['Fsw,raw меньше нижнего ограничения 0.25 * Fb,ult; вклад арматуры не учтен.'],
    }
  }

  if (rawContributionN > upperLimitN) {
    return {
      effectiveContributionN: upperLimitN,
      lowerLimitN,
      upperLimitN,
      contributionAccepted: true,
      ignoredReason: null,
      warnings: ['Fsw,raw больше Fb,ult; принят ограниченный вклад Fsw,used = Fb,ult.'],
    }
  }

  return {
    effectiveContributionN: rawContributionN,
    lowerLimitN,
    upperLimitN,
    contributionAccepted: true,
    ignoredReason: null,
    warnings: [],
  }
}

export function calculateShearReinforcementCapacity({
  reinforcement,
  concreteCapacityN,
  designDemandN,
  controlPerimeterMm,
}: ShearReinforcementCapacityInput): ShearReinforcementSummary {
  if (!reinforcement.enabled) {
    return {
      enabled: false,
      inputMode: null,
      steelClass: null,
      layoutType: null,
      barDiameterMm: null,
      barSpacingMm: null,
      rowCount: 0,
      legsPerRow: 0,
      totalLegs: 0,
      totalBarCount: null,
      effectiveBarCount: null,
      simpleBarCount: null,
      barAreaMm2: null,
      firstRowDistanceMm: null,
      rowSpacingMm: null,
      manualAswMm2: null,
      manualSwMm: null,
      swMm: null,
      reinforcementAreaMm2: null,
      qswNPerMm: null,
      rawContributionN: null,
      effectiveContributionN: null,
      lowerLimitN: null,
      upperLimitN: null,
      contributionAccepted: false,
      ignoredReason: null,
      reinforcementContributionN: null,
      draftCapacityWithReinforcementN: null,
      utilizationWithReinforcement: null,
      warnings: [],
    }
  }

  const totalLegs = reinforcement.rowCount * reinforcement.legsPerRow
  const barAreaMm2 = Math.PI * reinforcement.barDiameterMm ** 2 / 4
  const steel = draftSteelClassData[reinforcement.steelClass]
  const legacyWarnings = [
    ...draftShearReinforcementWarnings,
    'Legacy layout mode: rowCount/legsPerRow are kept for the diagram, but are not accepted as a verified Asw calculation.',
  ]

  if (reinforcement.inputMode === 'legacy-layout') {
    return {
      enabled: true,
      inputMode: reinforcement.inputMode,
      steelClass: reinforcement.steelClass,
      layoutType: reinforcement.layoutType,
      barDiameterMm: reinforcement.barDiameterMm,
      barSpacingMm: reinforcement.barSpacingMm,
      rowCount: reinforcement.rowCount,
      legsPerRow: reinforcement.legsPerRow,
      totalLegs,
      totalBarCount: totalLegs,
      effectiveBarCount: null,
      simpleBarCount: null,
      barAreaMm2,
      firstRowDistanceMm: reinforcement.firstRowDistanceMm,
      rowSpacingMm: reinforcement.rowSpacingMm,
      manualAswMm2: null,
      manualSwMm: null,
      swMm: null,
      reinforcementAreaMm2: null,
      qswNPerMm: null,
      rawContributionN: null,
      effectiveContributionN: null,
      lowerLimitN: concreteCapacityN === null ? null : 0.25 * concreteCapacityN,
      upperLimitN: concreteCapacityN,
      contributionAccepted: false,
      ignoredReason:
        'Вклад поперечной арматуры не учтен: для старой схемы нет ручного Asw/sw и нет реальных координат стержней.',
      reinforcementContributionN: null,
      draftCapacityWithReinforcementN: concreteCapacityN,
      utilizationWithReinforcement:
        concreteCapacityN === null || designDemandN === null ? null : designDemandN / concreteCapacityN,
      warnings: legacyWarnings,
    }
  }

  const reinforcementAreaMm2 = reinforcement.manualAswMm2
  const swMm = reinforcement.manualSwMm
  const qswNPerMm =
    reinforcementAreaMm2 === null || swMm === null
      ? null
      : steel.draftDesignStrengthMpa * reinforcementAreaMm2 / swMm
  const rawContributionN =
    qswNPerMm === null || controlPerimeterMm === null || controlPerimeterMm === undefined
      ? null
      : 0.8 * qswNPerMm * controlPerimeterMm
  const policy =
    rawContributionN === null || concreteCapacityN === null
      ? null
      : applyShearReinforcementContributionPolicy({
          rawContributionN,
          concreteCapacityN,
        })
  const reinforcementContributionN = policy?.effectiveContributionN ?? null
  const draftCapacityWithReinforcementN =
    concreteCapacityN === null || reinforcementContributionN === null
      ? concreteCapacityN
      : concreteCapacityN + reinforcementContributionN
  const utilizationWithReinforcement =
    draftCapacityWithReinforcementN === null || designDemandN === null
      ? null
      : designDemandN / draftCapacityWithReinforcementN

  return {
    enabled: true,
    inputMode: reinforcement.inputMode,
    steelClass: reinforcement.steelClass,
    layoutType: reinforcement.layoutType,
    barDiameterMm: reinforcement.barDiameterMm,
    barSpacingMm: reinforcement.barSpacingMm,
    rowCount: reinforcement.rowCount,
    legsPerRow: reinforcement.legsPerRow,
    totalLegs,
    totalBarCount: null,
    effectiveBarCount: null,
    simpleBarCount: null,
    barAreaMm2,
    firstRowDistanceMm: reinforcement.firstRowDistanceMm,
    rowSpacingMm: reinforcement.rowSpacingMm,
    manualAswMm2: reinforcement.manualAswMm2,
    manualSwMm: reinforcement.manualSwMm,
    swMm,
    reinforcementAreaMm2,
    qswNPerMm,
    rawContributionN,
    effectiveContributionN: reinforcementContributionN,
    lowerLimitN: policy?.lowerLimitN ?? null,
    upperLimitN: policy?.upperLimitN ?? concreteCapacityN,
    contributionAccepted: policy?.contributionAccepted ?? false,
    ignoredReason:
      policy === null
        ? 'Вклад поперечной арматуры не учтен: недостаточно данных Asw/sw/u/Fb,ult.'
        : policy.ignoredReason,
    reinforcementContributionN,
    draftCapacityWithReinforcementN,
    utilizationWithReinforcement,
    warnings: [...draftShearReinforcementWarnings, ...(policy?.warnings ?? [])],
  }
}
