import type { PunchingShearInput, PunchingShearResult } from '../types'
import { buildVerificationLevelStep } from './traceCommon'
import { traceFoundationReference } from './traceMetadata'
import { createTraceWarnings } from './traceWarnings'
import { formatNullable } from './traceFormat'
import type { TraceSection } from './traceSection'

export function traceForOpenings(
  input: PunchingShearInput,
  result: PunchingShearResult,
): TraceSection | null {
  if (input.openings.length === 0 && input.caseType !== 'opening') {
    return null
  }

  const warnings = createTraceWarnings(input, result)
  const openingRemovedSegments = result.perimeter.removedSegments.filter(
    (segment) => segment.removedBy === 'opening',
  )

  return {
    id: 'openings-trace',
    title: 'Openings Trace',
    steps: [
      {
        id: 'opening-classification',
        title: 'Opening classification',
        description: 'Openings are classified by the current draft opening geometry workflow.',
        formula: 'opening DTOs -> affected opening ids',
        substitutedFormula: `openings = ${input.openings.length}`,
        result: result.perimeter.clippingMetadata.affectedOpeningIds.join(', ') || 'none',
        units: 'n/a',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'tangent-construction',
        title: 'Tangent construction',
        description: 'Draft tangents from column/control geometry to openings are generated where applicable.',
        formula: 'opening tangents = draft tangent construction',
        substitutedFormula: `affected openings = ${result.perimeter.clippingMetadata.affectedOpeningIds.length}`,
        result: `${result.perimeter.openingTangents.length} tangent(s)`,
        units: 'n/a',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'removed-perimeter-segments',
        title: 'Removed perimeter segments',
        description: 'Segments removed by openings are reported from the current draft subtraction output.',
        formula: 'u_removed = sum(opening removed segment lengths)',
        substitutedFormula: `${openingRemovedSegments.length} opening segment(s) removed`,
        result: formatNullable(
          openingRemovedSegments.reduce((sum, segment) => sum + segment.lengthMm, 0),
        ),
        units: 'mm',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'active-perimeter',
        title: 'Active perimeter',
        description: 'Active perimeter is the selected control perimeter after draft opening subtraction.',
        formula: 'u_active = u_base - u_removed',
        substitutedFormula: `removed = ${formatNullable(result.perimeter.removedPerimeterMm)} mm`,
        result: formatNullable(result.controlPerimeterMm),
        units: 'mm',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'draft-stress-after-openings',
        title: 'Draft stress after openings',
        description: 'Stress after openings uses the current draft active perimeter.',
        formula: 'v = N / (u_active * h0)',
        substitutedFormula: `N = ${formatNullable(result.designShearForceN)} N, u_active = ${formatNullable(result.controlPerimeterMm)} mm`,
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
