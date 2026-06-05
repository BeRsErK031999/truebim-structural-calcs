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
        description: 'Reinforcement inputs are normalized for the current draft capacity workflow.',
        formula: 'shearReinforcement DTO -> normalized reinforcement layout',
        substitutedFormula: `enabled = ${formatEnabled(input.shearReinforcement.enabled)}, layout = ${input.shearReinforcement.layoutType ?? 'n/a'}`,
        result: `${result.shearReinforcement.rowCount} row(s), ${result.shearReinforcement.totalLegs} leg(s)`,
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
        description: 'Total reinforcement area is read from the draft reinforcement summary.',
        formula: 'Asw,total = bar area * total legs',
        substitutedFormula: `diameter = ${formatNullable(result.shearReinforcement.barDiameterMm)} mm, legs = ${result.shearReinforcement.totalLegs}`,
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
        formula: 'Vsw = Asw,total * Rsw,draft',
        substitutedFormula: `Asw,total = ${formatNullable(result.reinforcementAreaMm2, 3)} mm2`,
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
