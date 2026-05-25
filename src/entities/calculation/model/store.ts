import { create } from 'zustand'

import type { CalculationInput } from './schema'

type CalculationState = {
  draft: CalculationInput
  setDraft: (draft: CalculationInput) => void
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
  setDraft: (draft) => set({ draft }),
}))
