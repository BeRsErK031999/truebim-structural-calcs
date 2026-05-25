import { create } from 'zustand'

import { defaultPunchingShearInput } from '@/calculations/punching-shear'
import type {
  PunchingShearInput,
  PunchingShearReportModel,
  PunchingShearResult,
} from '@/calculations/punching-shear'

type CalculationState = {
  draft: PunchingShearInput
  punchingShearResult: PunchingShearResult | null
  punchingShearReport: PunchingShearReportModel | null
  setDraft: (draft: PunchingShearInput) => void
  setPunchingShearResult: (
    result: PunchingShearResult,
    report: PunchingShearReportModel,
  ) => void
}

export const defaultCalculationDraft: PunchingShearInput = defaultPunchingShearInput

export const useCalculationStore = create<CalculationState>((set) => ({
  draft: defaultCalculationDraft,
  punchingShearResult: null,
  punchingShearReport: null,
  setDraft: (draft) => set({ draft }),
  setPunchingShearResult: (result, report) =>
    set({ punchingShearResult: result, punchingShearReport: report }),
}))
