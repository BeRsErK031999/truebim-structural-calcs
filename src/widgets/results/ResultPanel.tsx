import { useState } from 'react'
import { Download } from 'lucide-react'

import {
  pointsToSvg,
  type PunchingShearCheckStatus,
  type PunchingSketchModel,
  type SvgSketchElement,
  viewBoxToString,
} from '@/calculations/punching-shear'
import { useCalculationStore } from '@/entities/calculation/model/store'
import {
  exportCurrentCalculationAsHtml,
  exportCurrentCalculationAsMarkdown,
} from '@/features/report-export'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const draftWarning =
  'Draft calculation. Verify formulas and coefficients against СП63.13330 before design use.'

export function ResultPanel() {
  const result = useCalculationStore((state) => state.punchingShearResult)
  const report = useCalculationStore((state) => state.punchingShearReport)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const canExport = Boolean(result && report)

  const handleExportHtml = () => {
    const exportResult = exportCurrentCalculationAsHtml()

    setExportMessage(
      exportResult.ok
        ? `Отчет скачан: ${exportResult.filename}`
        : exportResult.error,
    )
  }

  const handleExportMarkdown = () => {
    const exportResult = exportCurrentCalculationAsMarkdown()

    setExportMessage(
      exportResult.ok
        ? `Отчет скачан: ${exportResult.filename}`
        : exportResult.error,
    )
  }

  return (
    <Card className="sticky top-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Результаты</span>
          <StatusBadge status={result?.status} />
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-900">
          {draftWarning}
        </div>

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm leading-6 text-slate-700">
            Скачайте отчет и отправьте его инженеру/на проверку. После проверки значения можно
            использовать для verified case.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="justify-center"
              disabled={!canExport}
              onClick={handleExportHtml}
            >
              <Download />
              Выгрузить HTML
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-center"
              disabled={!canExport}
              onClick={handleExportMarkdown}
            >
              <Download />
              Выгрузить Markdown
            </Button>
          </div>
          {exportMessage ? (
            <p className="text-sm font-medium text-slate-700">{exportMessage}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric label="N" value={formatKn(result?.designShearForceN)} unit="кН" />
          <Metric label="Контур" value={formatNumber(result?.controlPerimeterMm)} unit="мм" />
          <Metric label="h0" value={formatNumber(result?.effectiveDepthMm)} unit="мм" />
          <Metric label="v" value={formatDecimal(result?.shearStressMpa)} unit="МПа" />
          <Metric label="R draft" value={formatDecimal(result?.draftConcreteResistanceMpa)} unit="МПа" />
          <Metric label="Utilization" value={formatDecimal(result?.utilizationRatio)} unit="η" />
          <Metric label="Pass/fail" value={formatPassed(result?.passed)} unit="" />
        </div>

        <EngineeringPreview svgModel={result?.svgModel} />

        {result ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Warnings</p>
            <ul className="mt-3 grid gap-1 text-sm text-slate-700">
              {result.warnings.length > 0 ? (
                result.warnings.map((warning) => <li key={warning}>- {warning}</li>)
              ) : (
                <li>- Нет предупреждений</li>
              )}
            </ul>
          </div>
        ) : null}

        {report ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">{report.title}</p>
            <p className="mt-1 text-sm text-slate-600">{report.standard}</p>
            <p className="mt-2 text-sm text-slate-600">
              Formula: {report.formulaSummary[1] ?? 'n/a'}. Segments:{' '}
              {report.geometrySummary.segmentCount ?? 'n/a'}.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status?: PunchingShearCheckStatus }) {
  const labelByStatus: Record<PunchingShearCheckStatus | 'draft', string> = {
    draft: 'Нет расчета',
    draft_ok: 'Draft pass',
    draft_failed: 'Draft fail',
    not_implemented: 'not_implemented',
    invalid_input: 'invalid_input',
  }
  const classByStatus: Record<PunchingShearCheckStatus | 'draft', string> = {
    draft: 'bg-slate-100 text-slate-700',
    draft_ok: 'bg-emerald-50 text-emerald-700',
    draft_failed: 'bg-red-50 text-red-700',
    not_implemented: 'bg-amber-50 text-amber-700',
    invalid_input: 'bg-red-50 text-red-700',
  }
  const statusKey = status ?? 'draft'

  return (
    <span className={`rounded-md px-2.5 py-1 text-sm font-semibold ${classByStatus[statusKey]}`}>
      {labelByStatus[statusKey]}
    </span>
  )
}

function EngineeringPreview({ svgModel }: { svgModel?: PunchingSketchModel }) {
  if (!svgModel) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500">
        Запустите draft check, чтобы построить geometry preview
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <svg
        className="aspect-[4/3] h-auto w-full rounded-md bg-white"
        role="img"
        viewBox={viewBoxToString(svgModel.viewBox)}
      >
        <defs>
          <pattern id="engineering-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </pattern>
        </defs>
        <rect
          x={svgModel.viewBox.minX}
          y={svgModel.viewBox.minY}
          width={svgModel.viewBox.width}
          height={svgModel.viewBox.height}
          fill="url(#engineering-grid)"
        />
        {svgModel.elements.map((element) => (
          <SketchElement key={element.id} element={element} />
        ))}
      </svg>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Geometry preview: mm, fit-to-view</span>
        <span>Draft force-only check</span>
      </div>
    </div>
  )
}

function SketchElement({ element }: { element: SvgSketchElement }) {
  if (element.type === 'polygon') {
    return (
      <polygon
        points={pointsToSvg(element.points)}
        className={getElementClassName(element.role)}
        vectorEffect="non-scaling-stroke"
      />
    )
  }

  if (element.type === 'rect') {
    return (
      <rect
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        className={getElementClassName(element.role)}
        vectorEffect="non-scaling-stroke"
      />
    )
  }

  if (element.type === 'line') {
    return (
      <g>
        <line
          x1={element.start.x}
          y1={element.start.y}
          x2={element.end.x}
          y2={element.end.y}
          className={getElementClassName(element.role)}
          vectorEffect="non-scaling-stroke"
        />
        {element.label ? (
          <text
            x={(element.start.x + element.end.x) / 2}
            y={(element.start.y + element.end.y) / 2 - 8}
            className="fill-slate-500 text-[18px]"
            textAnchor="middle"
          >
            {element.label}
          </text>
        ) : null}
      </g>
    )
  }

  return (
    <text
      x={element.position.x}
      y={element.position.y}
      className="fill-slate-600 text-[18px] font-medium"
    >
      {element.text}
    </text>
  )
}

function getElementClassName(role: SvgSketchElement['role']) {
  const classes: Record<SvgSketchElement['role'], string> = {
    slab: 'fill-slate-100 stroke-slate-300 stroke-2',
    column: 'fill-slate-800 stroke-slate-950 stroke-2',
    'control-perimeter': 'fill-teal-100/60 stroke-teal-700 stroke-3',
    opening: 'fill-amber-100 stroke-amber-600 stroke-2 stroke-dasharray-[8_6]',
    label: 'fill-slate-600',
    dimension: 'stroke-slate-500 stroke-2 stroke-dasharray-[6_6]',
  }

  return classes[role]
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-950">
        {value} {unit ? <span className="text-sm font-medium text-slate-500">{unit}</span> : null}
      </p>
    </div>
  )
}

function formatNumber(value?: number | null) {
  return value === undefined || value === null || !Number.isFinite(value) ? '--' : value.toFixed(0)
}

function formatDecimal(value?: number | null) {
  return value === undefined || value === null || !Number.isFinite(value) ? '--' : value.toFixed(3)
}

function formatKn(value?: number | null) {
  return value === undefined || value === null || !Number.isFinite(value)
    ? '--'
    : (value / 1000).toFixed(2)
}

function formatPassed(value?: boolean | null) {
  if (value === undefined || value === null) {
    return '--'
  }

  return value ? 'Pass' : 'Fail'
}
