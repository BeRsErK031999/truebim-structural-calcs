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

export const roundColumnInputSchema = z.object({
  diameterMm: positiveNumber,
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

export const shearReinforcementInputSchema = z.object({
  enabled: z.boolean(),
  barDiameterMm: positiveNumber.optional(),
  barSpacingMm: positiveNumber.optional(),
  rows: z.number().int().positive().optional(),
})

export const punchingShearInputSchema = z.object({
  caseType: punchingShearCaseTypeSchema,
  forces: forceInputSchema,
  slab: slabGeometryInputSchema,
  concrete: concreteInputSchema,
  rectColumn: rectColumnInputSchema.optional(),
  roundColumn: roundColumnInputSchema.optional(),
  slabEdges: slabEdgesInputSchema.optional(),
  openings: z.array(openingInputSchema),
  shearReinforcement: shearReinforcementInputSchema,
}) satisfies z.ZodType<PunchingShearInput>
