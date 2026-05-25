import { create } from 'zustand'

import { defaultPunchingShearInput } from '@/calculations/punching-shear'
import type {
  PunchingShearInput,
  PunchingShearReportModel,
  PunchingShearResult,
} from '@/calculations/punching-shear'

import {
  exportCalculationToJson,
  getSavedCalculation,
  importCalculationFromJson,
  listSavedCalculations,
  saveCalculation,
  deleteSavedCalculation as removeSavedCalculation,
} from './calculationStorage'
import type { SavedCalculation, SavedCalculationSummary } from './savedCalculation'

const appVersion = '0.0.0'

type CalculationState = {
  draft: PunchingShearInput
  punchingShearResult: PunchingShearResult | null
  punchingShearReport: PunchingShearReportModel | null
  savedCalculations: SavedCalculationSummary[]
  activeSavedCalculationId: string | null
  setDraft: (draft: PunchingShearInput) => void
  setPunchingShearResult: (
    result: PunchingShearResult,
    report: PunchingShearReportModel,
  ) => void
  loadSavedCalculations: () => void
  saveCurrentCalculation: (title?: string) => SavedCalculation
  loadSavedCalculation: (id: string) => SavedCalculation | null
  deleteSavedCalculation: (id: string) => void
  importSavedCalculation: (json: string) => SavedCalculation
  exportActiveCalculation: () => string | null
}

export const defaultCalculationDraft: PunchingShearInput = defaultPunchingShearInput

export const useCalculationStore = create<CalculationState>((set, get) => ({
  draft: defaultCalculationDraft,
  punchingShearResult: null,
  punchingShearReport: null,
  savedCalculations: [],
  activeSavedCalculationId: null,
  setDraft: (draft) => set({ draft, activeSavedCalculationId: null }),
  setPunchingShearResult: (result, report) =>
    set({ punchingShearResult: result, punchingShearReport: report }),
  loadSavedCalculations: () =>
    set({
      savedCalculations: listSavedCalculations(),
    }),
  saveCurrentCalculation: (title) => {
    const state = get()

    if (!state.punchingShearResult || !state.punchingShearReport) {
      throw new Error('Сначала выполните расчет')
    }

    const existingCalculation = state.activeSavedCalculationId
      ? getSavedCalculation(state.activeSavedCalculationId)
      : null
    const now = new Date().toISOString()
    const savedCalculation = saveCalculation({
      id: existingCalculation?.id ?? createCalculationId(),
      title: title?.trim() || existingCalculation?.title || createDefaultTitle(),
      createdAt: existingCalculation?.createdAt ?? now,
      updatedAt: now,
      input: state.draft,
      result: state.punchingShearResult,
      report: state.punchingShearReport,
      appVersion,
      calculationType: 'punching-shear',
    })

    set({
      savedCalculations: listSavedCalculations(),
      activeSavedCalculationId: savedCalculation.id,
    })

    return savedCalculation
  },
  loadSavedCalculation: (id) => {
    const savedCalculation = getSavedCalculation(id)

    if (!savedCalculation) {
      return null
    }

    set({
      draft: savedCalculation.input,
      punchingShearResult: savedCalculation.result,
      punchingShearReport: savedCalculation.report,
      activeSavedCalculationId: savedCalculation.id,
    })

    return savedCalculation
  },
  deleteSavedCalculation: (id) => {
    removeSavedCalculation(id)

    set((state) => ({
      savedCalculations: listSavedCalculations(),
      activeSavedCalculationId:
        state.activeSavedCalculationId === id ? null : state.activeSavedCalculationId,
    }))
  },
  importSavedCalculation: (json) => {
    const importedCalculation = importCalculationFromJson(json)
    const savedCalculation = saveCalculation({
      ...importedCalculation,
      updatedAt: new Date().toISOString(),
    })

    set({
      draft: savedCalculation.input,
      punchingShearResult: savedCalculation.result,
      punchingShearReport: savedCalculation.report,
      savedCalculations: listSavedCalculations(),
      activeSavedCalculationId: savedCalculation.id,
    })

    return savedCalculation
  },
  exportActiveCalculation: () => {
    const state = get()
    const savedCalculation = state.activeSavedCalculationId
      ? getSavedCalculation(state.activeSavedCalculationId)
      : createUnsavedCurrentCalculation(state)

    return savedCalculation ? exportCalculationToJson(savedCalculation) : null
  },
}))

function createCalculationId() {
  return globalThis.crypto?.randomUUID?.() ?? `calc-${Date.now()}-${Math.random()}`
}

function createDefaultTitle() {
  return `Продавливание — ${new Date().toLocaleString('ru-RU')}`
}

function createUnsavedCurrentCalculation(
  state: Pick<
    CalculationState,
    'draft' | 'punchingShearResult' | 'punchingShearReport'
  >,
): SavedCalculation | null {
  if (!state.punchingShearResult || !state.punchingShearReport) {
    return null
  }

  const now = new Date().toISOString()

  return {
    id: createCalculationId(),
    title: createDefaultTitle(),
    createdAt: now,
    updatedAt: now,
    input: state.draft,
    result: state.punchingShearResult,
    report: state.punchingShearReport,
    appVersion,
    calculationType: 'punching-shear',
  }
}
