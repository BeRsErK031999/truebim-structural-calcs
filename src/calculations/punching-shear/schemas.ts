import { z } from 'zod'

import type { PunchingShearInput } from './types'

const positiveNumber = z
  .number({ error: 'Введите число' })
  .finite('Введите корректное число')
  .positive('Значение должно быть больше 0')
const nonNegativeNumber = z
  .number({ error: 'Введите число' })
  .finite('Введите корректное число')
  .nonnegative('Значение не может быть отрицательным')

export const punchingShearCaseTypeSchema = z.enum([
  'center',
  'edge',
  'corner',
  'opening',
  'round',
  'wall-end',
  'wall-corner',
])

export const forceInputSchema = z.object({
  axialForceKn: nonNegativeNumber,
  momentXKnM: nonNegativeNumber,
  momentYKnM: nonNegativeNumber,
})

export const slabGeometryInputSchema = z.object({
  thicknessMm: positiveNumber,
  effectiveDepthMm: positiveNumber,
  concreteCoverMm: positiveNumber,
})

export const rectColumnInputSchema = z.object({
  widthXMm: positiveNumber,
  widthYMm: positiveNumber,
})

export const roundColumnPositionSchema = z.enum(['center', 'edge', 'corner'])

export const roundColumnInputSchema = z.object({
  diameterMm: positiveNumber,
  slabThickness: positiveNumber,
  effectiveDepth: positiveNumber,
  cover: positiveNumber,
  position: roundColumnPositionSchema,
})

export const wallInputSchema = z.object({
  wallLength: positiveNumber,
  wallThickness: positiveNumber,
  slabThickness: positiveNumber,
  effectiveDepth: positiveNumber,
  cover: positiveNumber,
})

export const wallCornerOrientationSchema = z.enum([
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
])

export const wallCornerInputSchema = z.object({
  wallLengthX: positiveNumber,
  wallLengthY: positiveNumber,
  wallThicknessX: positiveNumber,
  wallThicknessY: positiveNumber,
  slabThickness: positiveNumber,
  effectiveDepth: positiveNumber,
  cover: positiveNumber,
  orientation: wallCornerOrientationSchema,
})

export const openingInputSchema = z.object({
  id: z.string().min(1),
  widthXMm: positiveNumber,
  widthYMm: positiveNumber,
  centerXMm: z.number(),
  centerYMm: z.number(),
})

export const slabEdgesInputSchema = z.object({
  leftMm: nonNegativeNumber.optional(),
  rightMm: nonNegativeNumber.optional(),
  topMm: nonNegativeNumber.optional(),
  bottomMm: nonNegativeNumber.optional(),
})

export const concreteInputSchema = z.object({
  className: z.enum(['B15', 'B20', 'B25', 'B30', 'B35', 'B40']),
})

export const shearReinforcementSteelClassSchema = z.enum(['A240', 'A400', 'A500', 'B500'])
export const shearReinforcementLayoutTypeSchema = z.enum([
  'closed-stirrups',
  'studs',
  'links',
  'custom',
])

export const shearReinforcementInputSchema = z.object({
  enabled: z.boolean(),
  inputMode: z.enum(['manual', 'legacy-layout']).optional(),
  barDiameterMm: positiveNumber.optional(),
  barSpacingMm: positiveNumber.optional(),
  rowCount: z.number().int().positive().optional(),
  legsPerRow: z.number().int().positive().optional(),
  steelClass: shearReinforcementSteelClassSchema.optional(),
  firstRowDistanceMm: positiveNumber.optional(),
  rowSpacingMm: positiveNumber.optional(),
  layoutType: shearReinforcementLayoutTypeSchema.optional(),
  rows: z.number().int().positive().optional(),
  manualAswMm2: positiveNumber.optional(),
  manualSwMm: positiveNumber.optional(),
})

export const multipleControlContoursInputSchema = z.object({
  enabled: z.boolean(),
  count: z.number().int().min(1).max(12),
  offsetStep: z.enum(['h0/2', 'h0', 'custom']),
  customOffsetStepMm: positiveNumber.optional(),
}).optional()

export const punchingShearInputSchema = z.object({
  caseType: punchingShearCaseTypeSchema,
  forces: forceInputSchema,
  slab: slabGeometryInputSchema,
  concrete: concreteInputSchema,
  rectColumn: rectColumnInputSchema.optional(),
  roundColumn: roundColumnInputSchema.optional(),
  wall: wallInputSchema.optional(),
  wallCorner: wallCornerInputSchema.optional(),
  slabEdges: slabEdgesInputSchema.optional(),
  openings: z.array(openingInputSchema),
  shearReinforcement: shearReinforcementInputSchema,
  multipleContours: multipleControlContoursInputSchema,
}) satisfies z.ZodType<PunchingShearInput>
