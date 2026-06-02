import { useEffect, useState } from 'react'

import {
  exportCalculationToJson,
  getSavedCalculation,
} from '@/entities/calculation/model/calculationStorage'
import { useCalculationStore } from '@/entities/calculation/model/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

import { SavedCalculationCard } from './SavedCalculationCard'

export function CalculationHistoryPanel() {
  const savedCalculations = useCalculationStore((state) => state.savedCalculations)
  const activeSavedCalculationId = useCalculationStore((state) => state.activeSavedCalculationId)
  const loadSavedCalculations = useCalculationStore((state) => state.loadSavedCalculations)
  const loadSavedCalculation = useCalculationStore((state) => state.loadSavedCalculation)
  const deleteSavedCalculation = useCalculationStore((state) => state.deleteSavedCalculation)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSavedCalculations()
  }, [loadSavedCalculations])

  const handleExport = (id: string) => {
    try {
      const savedCalculation = getSavedCalculation(id)

      if (!savedCalculation) {
        throw new Error('Сохраненный расчет не найден')
      }

      downloadJson(
        exportCalculationToJson(savedCalculation),
        `${createSafeFilename(savedCalculation.title)}.json`,
      )
      setError(null)
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Не удалось экспортировать JSON')
    }
  }

  return (
    <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>История расчетов</CardTitle>
        <p className="text-sm leading-6 text-slate-600">
          Локальные сохранения из браузера. Список обновляется после сохранения, импорта или удаления.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3">
        {savedCalculations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Сохраненных расчетов пока нет
          </div>
        ) : (
          savedCalculations.map((calculation) => (
            <SavedCalculationCard
              key={calculation.id}
              calculation={calculation}
              isActive={activeSavedCalculationId === calculation.id}
              onDelete={deleteSavedCalculation}
              onExport={handleExport}
              onLoad={loadSavedCalculation}
            />
          ))
        )}

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function createSafeFilename(value: string) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80)
}
