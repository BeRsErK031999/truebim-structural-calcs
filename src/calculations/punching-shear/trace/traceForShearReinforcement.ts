import type { PunchingShearInput, PunchingShearResult } from '../types'
import { buildVerificationLevelStep } from './traceCommon'
import { traceFoundationReference } from './traceMetadata'
import { formatEnabled, formatNullable } from './traceFormat'
import type { TraceSection } from './traceSection'

export function traceForShearReinforcement(
  input: PunchingShearInput,
  result: PunchingShearResult,
): TraceSection | null {
  if (!input.shearReinforcement.enabled && !result.shearReinforcement.enabled) {
    return null
  }

  const warnings = [
    'Shear reinforcement contribution is DRAFT-only.',
    ...result.reinforcementWarnings,
  ]

  return {
    id: 'shear-reinforcement-trace',
    title: 'Shear Reinforcement Trace',
    steps: [
      {
        id: 'reinforcement-input',
        title: 'Reinforcement input',
        description: 'Capacity calculation uses manual Asw and sw. Layout fields are only visual preview data.',
        formula: 'manual Asw/sw -> draft reinforcement capacity',
        substitutedFormula: `enabled = ${formatEnabled(input.shearReinforcement.enabled)}, inputMode = ${result.shearReinforcement.inputMode ?? 'n/a'}`,
        result: `Asw = ${formatNullable(result.reinforcementAreaMm2, 3)} mm2; sw = ${formatNullable(result.shearReinforcement.swMm)} mm`,
        units: 'n/a',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'steel-class-draft-data',
        title: 'Steel class draft data',
        description: 'Steel class is current draft data, not verified SP63 reinforcement evidence.',
        formula: 'Rsw,draft = draft steel class table value',
        substitutedFormula: `steel = ${result.shearReinforcement.steelClass ?? 'n/a'}`,
        result: result.shearReinforcement.steelClass ?? 'n/a',
        units: 'n/a',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'reinforcement-area',
        title: 'Reinforcement area',
        description: 'Total reinforcement area is accepted from the manual calculation input.',
        formula: 'Asw = user accepted value',
        substitutedFormula: `manualAswMm2 = ${formatNullable(result.shearReinforcement.manualAswMm2, 3)} mm2`,
        result: formatNullable(result.reinforcementAreaMm2, 3),
        units: 'mm2',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'draft-reinforcement-contribution',
        title: 'Draft reinforcement contribution',
        description: 'Reinforcement contribution is current draft capacity data.',
        formula: 'qsw = Rsw,draft * Asw / sw; Fsw,raw = 0.8 * qsw * u',
        substitutedFormula: `Asw = ${formatNullable(result.reinforcementAreaMm2, 3)} mm2; sw = ${formatNullable(result.shearReinforcement.swMm)} mm`,
        result: formatNullable(result.reinforcementContributionN, 3),
        units: 'N',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'draft-utilization-with-reinforcement',
        title: 'Draft utilization with reinforcement',
        description: 'Utilization with reinforcement is current draft review output.',
        formula: 'eta_reinf = demand / (concrete capacity + Vsw)',
        substitutedFormula: `capacity = ${formatNullable(result.draftCapacityWithReinforcementN, 3)} N`,
        result: formatNullable(result.utilizationWithReinforcement, 6),
        units: 'ratio',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      buildVerificationLevelStep(result, warnings),
    ],
  }
}
