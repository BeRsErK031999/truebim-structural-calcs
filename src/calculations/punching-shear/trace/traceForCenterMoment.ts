import type { PunchingShearInput, PunchingShearResult } from '../types'
import {
  buildForceOnlyStressStep,
  buildUtilizationStep,
  momentEvidenceWarning,
} from './traceCommon'
import { traceFoundationReference } from './traceMetadata'
import { formatNullable } from './traceFormat'
import type { TraceSection } from './traceSection'
import type { TraceStep } from './traceStep'

export function traceForCenterMoment(
  input: PunchingShearInput,
  result: PunchingShearResult,
): TraceSection | null {
  if (
    input.caseType !== 'center' ||
    (input.forces.momentXKnM === 0 && input.forces.momentYKnM === 0)
  ) {
    return null
  }

  const momentSource = result.verifiedFeatures.includes('center-moment-transfer') ? 'partial' : 'draft'
  const warnings = [...new Set([momentEvidenceWarning, ...result.momentTransfer.warnings])]

  const steps: TraceStep[] = [
    {
      ...buildForceOnlyStressStep(input, result, 'partial'),
      id: 'force-only-base-stress',
      title: 'Force-only base stress',
      warnings: [],
    },
    {
      id: 'moment-eccentricity',
      title: 'Moment eccentricity',
      description: 'Draft moment transfer stores eccentricities derived by the current moment workflow. Mx follows the smaller column dimension along X, My follows the larger column dimension along Y.',
      formula: 'ex, ey = draft eccentricity from Mx/My and N',
      substitutedFormula: `Mx = ${formatNullable(input.forces.momentXKnM)} kN*m, My = ${formatNullable(input.forces.momentYKnM)} kN*m, N = ${formatNullable(input.forces.axialForceKn)} kN`,
      result: `ex = ${formatNullable(result.eccentricityX)} mm, ey = ${formatNullable(result.eccentricityY)} mm`,
      units: 'mm',
      sourceType: momentSource,
      sourceReference: traceFoundationReference,
      warnings,
    },
    {
      id: 'draft-stress-redistribution',
      title: 'Draft stress redistribution',
      description: 'Stress distribution is the current draft linear perimeter redistribution, not verified SP63 evidence.',
      formula: 'v(point) = vbase * (1 + ex*x/rx^2 + ey*y/ry^2)',
      substitutedFormula: `points = ${result.stressDistribution?.points.length ?? 0}, segments = ${result.stressDistribution?.segmentStresses.length ?? 0}`,
      result: result.stressDistribution?.status ?? 'disabled',
      units: 'n/a',
      sourceType: 'draft',
      sourceReference: traceFoundationReference,
      warnings,
    },
    {
      id: 'max-min-stress',
      title: 'Max/min stress',
      description: 'Maximum and minimum stresses are read from the draft stress distribution output.',
      formula: 'vmax/vmin = extrema(v(point))',
      substitutedFormula: `vbase = ${formatNullable(result.shearStressMpa, 6)} MPa`,
      result: `vmax = ${formatNullable(result.maxShearStressMpa, 6)} MPa, vmin = ${formatNullable(result.minShearStressMpa, 6)} MPa`,
      units: 'MPa',
      sourceType: 'draft',
      sourceReference: traceFoundationReference,
      warnings,
    },
    {
      ...buildUtilizationStep(input, result, 'partial'),
      id: 'moment-utilization',
      title: 'Utilization with moment stress',
      warnings,
    },
  ]

  return {
    id: 'center-moment-trace',
    title: 'Center Moment Trace',
    steps,
  }
}
