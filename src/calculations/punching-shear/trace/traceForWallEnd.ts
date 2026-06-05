import type { PunchingShearInput, PunchingShearResult } from '../types'
import { buildUtilizationStep, buildVerificationLevelStep } from './traceCommon'
import { traceFoundationReference } from './traceMetadata'
import { createTraceWarnings } from './traceWarnings'
import { formatNullable } from './traceFormat'
import type { TraceSection } from './traceSection'

export function traceForWallEnd(
  input: PunchingShearInput,
  result: PunchingShearResult,
): TraceSection | null {
  if (input.caseType !== 'wall-end') {
    return null
  }

  const warnings = createTraceWarnings(input, result)

  return {
    id: 'wall-end-trace',
    title: 'Wall-End Trace',
    steps: [
      {
        id: 'wall-geometry',
        title: 'Wall geometry',
        description: 'Wall-end geometry is generated from wall length, thickness, slab depth, and cover inputs.',
        formula: 'wall DTO -> wall end geometry',
        substitutedFormula: `length = ${formatNullable(input.wall?.wallLength)} mm, thickness = ${formatNullable(input.wall?.wallThickness)} mm`,
        result: `${result.perimeter.vertices.length} vertex/vertices`,
        units: 'n/a',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'wall-end-control-perimeter',
        title: 'Wall end control perimeter',
        description: 'Current wall-end control perimeter is draft geometry only.',
        formula: 'u = draft wall-end control perimeter',
        substitutedFormula: `offset = ${formatNullable(result.perimeter.draftOffsetMm)} mm`,
        result: formatNullable(result.controlPerimeterMm),
        units: 'mm',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'draft-perimeter-offset',
        title: 'Draft perimeter offset',
        description: 'Perimeter offset is the currently implemented draft offset.',
        formula: 'offset = h0 / 2',
        substitutedFormula: `h0 = ${formatNullable(result.effectiveDepthMm)} mm`,
        result: formatNullable(result.perimeter.draftOffsetMm),
        units: 'mm',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'draft-stress-formula',
        title: 'Draft stress formula',
        description: 'The wall-end path still uses the current draft stress expression.',
        formula: 'v = N / (u * h0)',
        substitutedFormula: `N = ${formatNullable(result.designShearForceN)} N, u = ${formatNullable(result.controlPerimeterMm)} mm, h0 = ${formatNullable(result.effectiveDepthMm)} mm`,
        result: formatNullable(result.shearStressMpa, 6),
        units: 'MPa',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        ...buildUtilizationStep(input, result, 'draft'),
        id: 'draft-wall-utilization',
        title: 'Draft utilization',
      },
      buildVerificationLevelStep(result, warnings),
    ],
  }
}
