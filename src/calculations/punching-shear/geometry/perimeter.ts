import type { ControlPerimeterResult, PunchingShearInput } from '../types'

export function calculateControlPerimeter(input: PunchingShearInput): ControlPerimeterResult {
  const effectiveDepthMm = input.slab.effectiveDepthMm

  if (input.caseType === 'center' && input.rectColumn) {
    return {
      // TODO: replace placeholder with verified СП63.13330 control perimeter formula.
      perimeterMm: 0,
      effectiveDepthMm,
      segments: [
        {
          id: 'center-rectangular-placeholder',
          kind: 'placeholder',
          lengthMm: 0,
        },
      ],
      warnings: ['Control perimeter is a placeholder and is not suitable for design'],
    }
  }

  return {
    perimeterMm: 0,
    effectiveDepthMm,
    segments: [],
    warnings: ['Control perimeter is not implemented for this case type'],
  }
}
