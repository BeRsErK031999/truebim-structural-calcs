import { calculateControlPerimeter } from './geometry/perimeter'
import { getConcreteMaterial } from './materials'
import { punchingShearInputSchema } from './schemas'
import { normalizePunchingShearInput } from './units'
import type { PunchingShearInput, PunchingShearResult } from './types'

const engineeringStubWarnings = [
  'Engineering formulas are not implemented yet',
  'Values must not be used for design',
]

export function calculatePunchingShear(input: PunchingShearInput): PunchingShearResult {
  const parsedInput = punchingShearInputSchema.parse(input)
  const normalizedInput = normalizePunchingShearInput(parsedInput)
  const material = getConcreteMaterial(normalizedInput.concrete.className)
  const perimeter = calculateControlPerimeter(normalizedInput)

  return {
    status: 'not_implemented',
    caseType: normalizedInput.caseType,
    utilization: null,
    material: {
      className: material.className,
      rbtMpa: material.rbtMpa,
    },
    perimeter,
    warnings: [...engineeringStubWarnings, ...perimeter.warnings],
    placeholders: [
      'perimeterMm',
      'utilization',
      'concrete capacity',
      'moment contribution',
      'shear reinforcement contribution',
    ],
  }
}
