import { beforeEach, describe, expect, it } from 'vitest'

import { defaultPunchingShearInput } from '@/calculations/punching-shear/defaults'
import { calculatePunchingShear } from '@/calculations/punching-shear/engine'
import { buildPunchingShearReport } from '@/calculations/punching-shear/report'

import {
  deleteSavedCalculation,
  exportCalculationToJson,
  getSavedCalculation,
  getSavedCalculationCount,
  importCalculationFromJson,
  listSavedCalculations,
  saveCalculation,
  SAVED_CALCULATIONS_STORAGE_KEY,
} from '../calculationStorage'
import type { SavedCalculation } from '../savedCalculation'
import { useCalculationStore } from '../store'

describe('calculation local storage', () => {
  beforeEach(() => {
    installLocalStorageMock()
    localStorage.clear()
    useCalculationStore.setState({
      draft: defaultPunchingShearInput,
      punchingShearResult: null,
      punchingShearReport: null,
      savedCalculations: [],
      activeSavedCalculationId: null,
    })
  })

  it('saves, lists, gets and deletes saved calculations', () => {
    const savedCalculation = createSavedCalculation('calc-1')

    saveCalculation(savedCalculation)

    expect(listSavedCalculations()).toHaveLength(1)
    expect(getSavedCalculationCount()).toBe(1)
    expect(getSavedCalculation('calc-1')?.title).toBe('Test calculation')

    deleteSavedCalculation('calc-1')

    expect(listSavedCalculations()).toHaveLength(0)
    expect(getSavedCalculationCount()).toBe(0)
    expect(getSavedCalculation('calc-1')).toBeNull()
  })

  it('does not crash when localStorage is corrupted', () => {
    localStorage.setItem(SAVED_CALCULATIONS_STORAGE_KEY, '{bad json')

    expect(listSavedCalculations()).toEqual([])
    expect(getSavedCalculation('missing')).toBeNull()
  })

  it('rejects invalid JSON imports', () => {
    expect(() => importCalculationFromJson('{bad json')).toThrow('Не удалось прочитать JSON')
    expect(() => importCalculationFromJson('{"id":"missing-fields"}')).toThrow(
      'JSON не похож на сохраненный расчет TrueBIM',
    )
  })

  it('accepts valid saved calculation imports', () => {
    const savedCalculation = createSavedCalculation('calc-import')
    const json = exportCalculationToJson(savedCalculation)

    expect(importCalculationFromJson(json)).toMatchObject({
      id: 'calc-import',
      title: 'Test calculation',
      calculationType: 'punching-shear',
    })
  })

  it('stores and loads the current calculation through Zustand', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)

    useCalculationStore.setState({
      draft: defaultPunchingShearInput,
      punchingShearResult: result,
      punchingShearReport: report,
    })

    const savedCalculation = useCalculationStore
      .getState()
      .saveCurrentCalculation('Store flow')

    expect(useCalculationStore.getState().savedCalculations).toHaveLength(1)

    useCalculationStore.setState({
      draft: {
        ...defaultPunchingShearInput,
        forces: { ...defaultPunchingShearInput.forces, axialForceKn: 999 },
      },
      punchingShearResult: null,
      punchingShearReport: null,
    })

    useCalculationStore.getState().loadSavedCalculation(savedCalculation.id)

    expect(useCalculationStore.getState().draft.forces.axialForceKn).toBe(420)
    expect(useCalculationStore.getState().punchingShearResult?.status).toBe(result.status)
  })
})

function createSavedCalculation(id: string): SavedCalculation {
  const result = calculatePunchingShear(defaultPunchingShearInput)
  const report = buildPunchingShearReport(defaultPunchingShearInput, result)
  const now = new Date('2026-05-25T08:00:00.000Z').toISOString()

  return {
    id,
    title: 'Test calculation',
    createdAt: now,
    updatedAt: now,
    input: defaultPunchingShearInput,
    result,
    report,
    appVersion: '0.0.0',
    calculationType: 'punching-shear',
  }
}

function installLocalStorageMock() {
  const values = new Map<string, string>()
  const storage = {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key)
    },
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  } satisfies Storage

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  })
}
