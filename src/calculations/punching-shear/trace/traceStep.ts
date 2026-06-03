export type TraceSourceType = 'verified' | 'partial' | 'draft' | 'manual' | 'placeholder'

export type TraceStep = {
  id: string
  title: string
  description: string
  formula: string
  substitutedFormula: string
  result: string
  units: string
  sourceType: TraceSourceType
  sourceReference: string
  warnings: string[]
}
