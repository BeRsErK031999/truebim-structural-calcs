import { create } from 'zustand'

import type {
  PunchingShearReportModel,
  PunchingShearResult,
} from '@/calculations/punching-shear'

import type { CalculationInput } from './schema'

type CalculationState = {
  draft: CalculationInput
  punchingShearResult: PunchingShearResult | null
  punchingShearReport: PunchingShearReportModel | null
  setDraft: (draft: CalculationInput) => void
  setPunchingShearResult: (
    result: PunchingShearResult,
    report: PunchingShearReportModel,
  ) => void
}

export const defaultCalculationDraft: CalculationInput = {
  elementName: 'Плита Пм-1',
  concreteClass: 'B25',
  load: 420,
  thickness: 220,
  reinforcementRatio: 0.8,
}

export const useCalculationStore = create<CalculationState>((set) => ({
  draft: defaultCalculationDraft,
  punchingShearResult: null,
  punchingShearReport: null,
  setDraft: (draft) => set({ draft }),
  setPunchingShearResult: (result, report) =>
    set({ punchingShearResult: result, punchingShearReport: report }),
}))
