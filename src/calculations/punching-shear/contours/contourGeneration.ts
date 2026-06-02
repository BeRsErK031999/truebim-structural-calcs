import { calculateControlPerimeter } from '../geometry/perimeter'
import { knToN } from '../units'
import type { ConcreteClassName, PunchingShearInput } from '../types'
import { getConcreteClassData } from '../materials'

import {
  toControlContourKind,
  type ControlContour,
  type ControlContourGenerationOptions,
} from './controlContour'

export function generateControlContours(
  input: PunchingShearInput,
  options: ControlContourGenerationOptions,
): ControlContour[] {
  if (!options.enabled) {
    return []
  }

  const kind = toControlContourKind(input.caseType)

  if (!kind) {
    return []
  }

  const offsets = createDraftOffsets(input.slab.effectiveDepthMm, options)
  const resistance = getConcreteClassData(input.concrete.className as ConcreteClassName).draftConcreteResistanceMpa
  const designShearForceN = knToN(input.forces.axialForceKn)

  return offsets.map((offsetMm, index) => {
    const perimeter = calculateControlPerimeter(input, { draftOffsetMm: offsetMm })
    const draftStressMpa =
      perimeter.perimeterMm > 0 && perimeter.effectiveDepthMm > 0
        ? designShearForceN / (perimeter.perimeterMm * perimeter.effectiveDepthMm)
        : null
    const utilization = draftStressMpa === null ? null : draftStressMpa / resistance

    return {
      id: `draft-contour-${index + 1}`,
      index: index + 1,
      kind,
      offsetMm,
      perimeterMm: perimeter.perimeterMm,
      effectiveDepthMm: perimeter.effectiveDepthMm,
      vertices: perimeter.vertices,
      segments: perimeter.segments,
      boundingBox: perimeter.boundingBox,
      warnings: perimeter.warnings,
      status: 'draft',
      draftStressMpa,
      utilization,
    }
  })
}

export function createDraftOffsets(
  effectiveDepthMm: number,
  options: ControlContourGenerationOptions,
) {
  const count = Math.max(1, Math.min(12, Math.trunc(options.count)))
  const step =
    options.offsetStep === 'custom'
      ? options.customOffsetStepMm ?? effectiveDepthMm / 2
      : options.offsetStep === 'h0'
        ? effectiveDepthMm
        : effectiveDepthMm / 2

  return Array.from({ length: count }, (_, index) => step * (index + 1))
}
