import type { PunchingShearInput, PunchingShearResult } from '../types'
import { buildVerificationLevelStep } from './traceCommon'
import { traceFoundationReference } from './traceMetadata'
import { createTraceWarnings } from './traceWarnings'
import { formatNullable } from './traceFormat'
import type { TraceSection } from './traceSection'

export function traceForWallCorner(
  input: PunchingShearInput,
  result: PunchingShearResult,
): TraceSection | null {
  if (input.caseType !== 'wall-corner') {
    return null
  }

  const warnings = createTraceWarnings(input, result)

  return {
    id: 'wall-corner-trace',
    title: 'Wall-Corner Trace',
    steps: [
      {
        id: 'l-shaped-wall-geometry',
        title: 'L-shaped wall geometry',
        description: 'Wall-corner geometry is generated from the current L-shaped wall DTO.',
        formula: 'wallCorner DTO -> L-shaped wall geometry',
        substitutedFormula: `Lx = ${formatNullable(input.wallCorner?.wallLengthX)} mm, Ly = ${formatNullable(input.wallCorner?.wallLengthY)} mm`,
        result: `${result.perimeter.vertices.length} vertex/vertices`,
        units: 'n/a',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'orientation-transform',
        title: 'Orientation transform',
        description: 'Orientation is applied by the draft wall-corner geometry workflow.',
        formula: 'local L-shape -> oriented slab coordinates',
        substitutedFormula: `orientation = ${input.wallCorner?.orientation ?? 'n/a'}`,
        result: result.perimeter.clippingMetadata.boundaryCondition,
        units: 'n/a',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'wall-corner-control-perimeter',
        title: 'Wall corner control perimeter',
        description: 'Current wall-corner control perimeter is draft geometry only.',
        formula: 'u = draft wall-corner control perimeter',
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
        description: 'The wall-corner path still uses the current draft stress expression.',
        formula: 'v = N / (u * h0)',
        substitutedFormula: `N = ${formatNullable(result.designShearForceN)} N, u = ${formatNullable(result.controlPerimeterMm)} mm, h0 = ${formatNullable(result.effectiveDepthMm)} mm`,
        result: formatNullable(result.shearStressMpa, 6),
        units: 'MPa',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      buildVerificationLevelStep(result, warnings),
    ],
  }
}
