import { Download, Trash2, Upload } from 'lucide-react'

import type { SavedCalculationSummary } from '@/entities/calculation/model/savedCalculation'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'

type SavedCalculationCardProps = {
  calculation: SavedCalculationSummary
  isActive: boolean
  onLoad: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
}

export function SavedCalculationCard({
  calculation,
  isActive,
  onLoad,
  onDelete,
  onExport,
}: SavedCalculationCardProps) {
  return (
    <Card
      className={`rounded-lg border bg-white shadow-sm ${
        isActive ? 'border-teal-300 ring-2 ring-teal-100' : 'border-slate-200'
      }`}
    >
      <CardContent className="grid gap-3 p-3">
        <div className="grid gap-1">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold leading-5 text-slate-950">{calculation.title}</p>
            <StatusPill status={calculation.result.status} />
          </div>
          <p className="text-xs text-slate-500">{formatDate(calculation.updatedAt)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <HistoryMetric label="Использование" value={formatUtilization(calculation.result.utilizationRatio)} />
          <HistoryMetric label="Тип" value="Продавливание" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            className="rounded-lg"
            size="sm"
            type="button"
            variant="outline"
            onClick={() => onLoad(calculation.id)}
          >
            <Upload className="size-3.5" />
            Загрузить
          </Button>
          <Button
            className="rounded-lg"
            size="sm"
            type="button"
            variant="outline"
            onClick={() => onExport(calculation.id)}
          >
            <Download className="size-3.5" />
            JSON
          </Button>
          <Button
            className="rounded-lg"
            size="sm"
            type="button"
            variant="destructive"
            onClick={() => onDelete(calculation.id)}
          >
            <Trash2 className="size-3.5" />
            Удалить
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusPill({ status }: { status: SavedCalculationSummary['result']['status'] }) {
  const classNameByStatus = {
    draft_ok: 'bg-emerald-50 text-emerald-700',
    draft_failed: 'bg-red-50 text-red-700',
    invalid_input: 'bg-red-50 text-red-700',
    not_implemented: 'bg-amber-50 text-amber-700',
  }
  const labelByStatus = {
    draft_ok: 'Черновик прошел',
    draft_failed: 'Черновик не прошел',
    invalid_input: 'Ошибка ввода',
    not_implemented: 'Не реализовано',
  }

  return (
    <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${classNameByStatus[status]}`}>
      {labelByStatus[status]}
    </span>
  )
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function formatUtilization(value: number | null) {
  return value === null || !Number.isFinite(value) ? '--' : value.toFixed(3)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}
