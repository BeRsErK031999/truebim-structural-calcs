import { z } from 'zod'

import { punchingShearInputSchema } from '@/calculations/punching-shear'
import type {
  PunchingShearInput,
  PunchingShearReportModel,
  PunchingShearResult,
} from '@/calculations/punching-shear'

export const calculationTypeSchema = z.literal('punching-shear')

export const savedCalculationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  input: punchingShearInputSchema,
  result: z.custom<PunchingShearResult>(
    (value) => typeof value === 'object' && value !== null && 'status' in value,
    'Некорректный результат расчета',
  ),
  report: z.custom<PunchingShearReportModel>(
    (value) => typeof value === 'object' && value !== null && 'title' in value,
    'Некорректный отчет расчета',
  ),
  appVersion: z.string().min(1),
  calculationType: calculationTypeSchema,
})

export const savedCalculationSummarySchema = savedCalculationSchema.pick({
  id: true,
  title: true,
  createdAt: true,
  updatedAt: true,
  result: true,
  appVersion: true,
  calculationType: true,
})

export type SavedCalculation = Omit<
  z.infer<typeof savedCalculationSchema>,
  'input' | 'result' | 'report'
> & {
  input: PunchingShearInput
  result: PunchingShearResult
  report: PunchingShearReportModel
}

export type SavedCalculationSummary = z.infer<typeof savedCalculationSummarySchema>
