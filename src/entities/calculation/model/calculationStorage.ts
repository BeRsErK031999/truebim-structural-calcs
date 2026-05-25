import { z } from 'zod'

import type { SavedCalculation } from './savedCalculation'
import { savedCalculationSchema } from './savedCalculation'

export const SAVED_CALCULATIONS_STORAGE_KEY =
  'truebim-structural-calcs:saved-calculations:v1'

const savedCalculationArraySchema = z.array(savedCalculationSchema)

function getLocalStorage(): Storage | null {
  if (typeof globalThis.localStorage === 'undefined') {
    return null
  }

  return globalThis.localStorage
}

function readSavedCalculations(): SavedCalculation[] {
  const storage = getLocalStorage()

  if (!storage) {
    return []
  }

  try {
    const rawValue = storage.getItem(SAVED_CALCULATIONS_STORAGE_KEY)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue)
    const validation = savedCalculationArraySchema.safeParse(parsedValue)

    return validation.success ? validation.data : []
  } catch {
    return []
  }
}

function writeSavedCalculations(calculations: SavedCalculation[]) {
  const storage = getLocalStorage()

  if (!storage) {
    return
  }

  storage.setItem(SAVED_CALCULATIONS_STORAGE_KEY, JSON.stringify(calculations))
}

export function listSavedCalculations() {
  return readSavedCalculations()
    .map((calculation) => ({
      id: calculation.id,
      title: calculation.title,
      createdAt: calculation.createdAt,
      updatedAt: calculation.updatedAt,
      result: calculation.result,
      appVersion: calculation.appVersion,
      calculationType: calculation.calculationType,
    }))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export function getSavedCalculation(id: string) {
  return readSavedCalculations().find((calculation) => calculation.id === id) ?? null
}

export function saveCalculation(data: SavedCalculation) {
  const validation = savedCalculationSchema.safeParse(data)

  if (!validation.success) {
    throw new Error('Некорректные данные сохраненного расчета')
  }

  const calculations = readSavedCalculations()
  const existingIndex = calculations.findIndex((calculation) => calculation.id === data.id)

  if (existingIndex >= 0) {
    calculations[existingIndex] = validation.data
  } else {
    calculations.push(validation.data)
  }

  writeSavedCalculations(calculations)

  return validation.data
}

export function deleteSavedCalculation(id: string) {
  const nextCalculations = readSavedCalculations().filter(
    (calculation) => calculation.id !== id,
  )

  writeSavedCalculations(nextCalculations)
}

export function exportCalculationToJson(savedCalculation: SavedCalculation) {
  const validation = savedCalculationSchema.safeParse(savedCalculation)

  if (!validation.success) {
    throw new Error('Некорректные данные для экспорта')
  }

  return JSON.stringify(validation.data, null, 2)
}

export function importCalculationFromJson(json: string) {
  let parsedValue: unknown

  try {
    parsedValue = JSON.parse(json)
  } catch {
    throw new Error('Не удалось прочитать JSON')
  }

  const validation = savedCalculationSchema.safeParse(parsedValue)

  if (!validation.success) {
    throw new Error('JSON не похож на сохраненный расчет TrueBIM')
  }

  return validation.data
}
