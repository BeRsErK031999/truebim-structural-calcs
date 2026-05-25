import { z } from 'zod'

export const calculationInputSchema = z.object({
  elementName: z.string().min(1, 'Введите название элемента'),
  concreteClass: z.string().min(1),
  load: z.coerce.number().min(0),
  thickness: z.coerce.number().min(0),
  reinforcementRatio: z.coerce.number().min(0).max(5),
})

export type CalculationFormInput = z.input<typeof calculationInputSchema>
export type CalculationInput = z.output<typeof calculationInputSchema>
