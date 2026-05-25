import { calculateControlPerimeter } from './geometry/perimeter'
import { getConcreteMaterial } from './materials'
import { punchingShearInputSchema } from './schemas'
import { buildPunchingSketchModel } from './sketch/punchingSketch'
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
  const svgModel = buildPunchingSketchModel(normalizedInput, perimeter)

  return {
    status: 'not_implemented',
    caseType: normalizedInput.caseType,
    utilization: null,
    material: {
      className: material.className,
      rbtMpa: material.rbtMpa,
    },
    perimeter,
    svgModel,
    warnings: [...engineeringStubWarnings, ...perimeter.warnings],
    placeholders: [
      'utilization',
      'concrete capacity',
      'moment contribution',
      'shear reinforcement contribution',
    ],
  }
}
