import { useMemo, useState } from 'react'
import { ChevronDown, Copy, Download, Eye, X } from 'lucide-react'

import {
  pointsToSvg,
  type PunchingShearCheckStatus,
  type PunchingShearReportModel,
  type PunchingSketchModel,
  type SvgSketchElement,
  viewBoxToString,
} from '@/calculations/punching-shear'
import { useCalculationStore } from '@/entities/calculation/model/store'
import {
  buildReportSummary,
  exportCurrentCalculationAsHtml,
  exportCurrentCalculationAsMarkdown,
} from '@/features/report-export'
import { buildPunchingShearHtmlReport } from '@/features/report-export/reportHtml'
import { createReportMetadata } from '@/features/report-export/reportMetadata'
import { formatFeatureLabel } from '@/shared/labels/featureLabels'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const draftWarning =
  'Черновой расчет. Проверьте формулы и коэффициенты по СП 63.13330 перед проектным применением.'

export function ResultPanel() {
  const draft = useCalculationStore((state) => state.draft)
  const result = useCalculationStore((state) => state.punchingShearResult)
  const report = useCalculationStore((state) => state.punchingShearReport)
  const calculationId = useCalculationStore((state) => state.activeCalculationId)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const [showTrace, setShowTrace] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const canExport = Boolean(result && report)
  const previewHtml = useMemo(() => {
    if (!result || !report || !calculationId) {
      return ''
    }

    return buildPunchingShearHtmlReport(draft, result, report, createReportMetadata(new Date(), calculationId))
  }, [calculationId, draft, report, result])

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

  const handleCopyCalculationId = () => {
    if (!calculationId) {
      return
    }

    void copyText(calculationId).then((ok) => {
      setCopyMessage(ok ? `ID расчета скопирован: ${calculationId}` : 'Не удалось скопировать ID расчета')
    })
  }

  const handleCopySummary = () => {
    if (!result) {
      return
    }

    const summary = buildReportSummary(result)

    void copyText(summary).then((ok) => {
      setCopyMessage(ok ? `Сводка скопирована: ${summary}` : 'Не удалось скопировать сводку')
    })
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

        {result ? (
          <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">Уровень проверки</p>
              <VerificationLevelBadge level={result.verificationLevel} />
            </div>
            <FeatureList title="Проверенные возможности" features={result.verifiedFeatures} />
            <FeatureList title="Черновые возможности" features={result.draftFeatures} />
          </div>
        ) : null}

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm leading-6 text-slate-700">
            Скачайте отчет и отправьте его инженеру на проверку. После проверки значения можно
            использовать для подготовки verified case.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="justify-center"
              disabled={!canExport}
              onClick={() => setIsPreviewOpen(true)}
            >
              <Eye />
              Preview HTML report
            </Button>
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
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="justify-center"
              disabled={!calculationId}
              onClick={handleCopyCalculationId}
            >
              <Copy />
              Скопировать ID
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-center"
              disabled={!result}
              onClick={handleCopySummary}
            >
              <Copy />
              Скопировать сводку
            </Button>
          </div>
          {exportMessage ? (
            <p className="text-sm font-medium text-slate-700">{exportMessage}</p>
          ) : null}
          {copyMessage ? <p className="text-sm font-medium text-slate-700">{copyMessage}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric label="N" value={formatKn(result?.designShearForceN)} unit="кН" />
          <Metric label="Контур" value={formatNumber(result?.controlPerimeterMm)} unit="мм" />
          <Metric label="h0" value={formatNumber(result?.effectiveDepthMm)} unit="мм" />
          <Metric label="v" value={formatDecimal(result?.shearStressMpa)} unit="МПа" />
          <Metric label="v max" value={formatDecimal(result?.maxShearStressMpa)} unit="МПа" />
          <Metric label="v min" value={formatDecimal(result?.minShearStressMpa)} unit="МПа" />
          <Metric label="R черн." value={formatDecimal(result?.draftConcreteResistanceMpa)} unit="МПа" />
          <Metric label="Использование" value={formatDecimal(result?.utilizationRatio)} unit="η" />
          <Metric label="Asw draft" value={formatNumber(result?.reinforcementAreaMm2)} unit="mm2" />
          <Metric label="η reinf." value={formatDecimal(result?.utilizationWithReinforcement)} unit="draft" />
          <Metric label="Результат" value={formatPassed(result?.passed)} unit="" />
        </div>

        <EngineeringPreview svgModel={result?.svgModel} />

        {result ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Предупреждения</p>
            <ul className="mt-3 grid gap-1 text-sm text-slate-700">
              {result.warnings.length > 0 ? (
                result.warnings.map((warning) => <li key={warning}>- {warning}</li>)
              ) : (
                <li>- Предупреждений нет</li>
              )}
            </ul>
          </div>
        ) : null}

        {report ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">{report.title}</p>
            <p className="mt-1 text-sm text-slate-600">{report.standard}</p>
            <p className="mt-2 text-sm text-slate-600">
              Формула: {report.formulaSummary[1] ?? 'н/д'}. Сегментов:{' '}
              {report.geometrySummary.segmentCount ?? 'н/д'}.
            </p>
          </div>
        ) : null}

        {report ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              onClick={() => setShowTrace((value) => !value)}
            >
              Show Trace
              <ChevronDown className={showTrace ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </Button>
            {showTrace ? <TraceSteps report={report} /> : null}
          </div>
        ) : null}

        {isPreviewOpen && previewHtml ? (
          <div className="fixed inset-4 z-50 grid overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xl md:inset-8">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">HTML report preview</p>
                <p className="text-xs text-slate-600">calculationId: {calculationId}</p>
              </div>
              <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(false)}>
                <X />
                Close
              </Button>
            </div>
            <iframe className="h-full w-full" srcDoc={previewHtml} title="Punching shear HTML report preview" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function TraceSteps({ report }: { report: PunchingShearReportModel }) {
  const steps = report.calculationTrace.flatMap((section) => section.steps)

  return (
    <div className="mt-4 grid gap-3">
      {steps.map((step, index) => (
        <div key={step.id} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {index + 1}. {step.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{step.description}</p>
            </div>
            <TraceSourceBadge sourceType={step.sourceType} />
          </div>
          <dl className="mt-3 grid gap-2 text-xs text-slate-700">
            <TraceLine label="Formula" value={step.formula} />
            <TraceLine label="Substitution" value={step.substitutedFormula} />
            <TraceLine label="Result" value={`${step.result} ${step.units}`} />
            <TraceLine label="Source" value={step.sourceReference} />
          </dl>
          {step.warnings.length > 0 ? (
            <ul className="mt-3 grid gap-1 text-xs font-medium text-amber-700">
              {step.warnings.map((warning) => (
                <li key={warning}>- {warning}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function TraceLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words font-mono text-slate-800">{value}</dd>
    </div>
  )
}

function TraceSourceBadge({ sourceType }: { sourceType: 'verified' | 'partial' | 'draft' | 'manual' | 'placeholder' }) {
  const classBySource = {
    verified: 'bg-emerald-50 text-emerald-700',
    partial: 'bg-sky-50 text-sky-700',
    draft: 'bg-amber-50 text-amber-700',
    manual: 'bg-slate-100 text-slate-700',
    placeholder: 'bg-orange-50 text-orange-700',
  }

  return (
    <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${classBySource[sourceType]}`}>
      {sourceType.toUpperCase()}
    </span>
  )
}

function VerificationLevelBadge({ level }: { level: 'verified' | 'partial' | 'draft' }) {
  const labelByLevel = {
    verified: 'ПРОВЕРЕНО',
    partial: 'ЧАСТИЧНО ПРОВЕРЕНО',
    draft: 'ТОЛЬКО ЧЕРНОВИК',
  }
  const classByLevel = {
    verified: 'bg-emerald-50 text-emerald-700',
    partial: 'bg-sky-50 text-sky-700',
    draft: 'bg-amber-50 text-amber-700',
  }

  return (
    <span className={`rounded-md px-2.5 py-1 text-sm font-semibold ${classByLevel[level]}`}>
      {labelByLevel[level]}
    </span>
  )
}

function FeatureList({ title, features }: { title: string; features: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <ul className="mt-2 grid gap-1 text-sm text-slate-700">
        {features.length > 0 ? (
          features.map((feature) => <li key={feature}>- {formatFeatureLabel(feature)}</li>)
        ) : (
          <li>- нет</li>
        )}
      </ul>
    </div>
  )
}

function StatusBadge({ status }: { status?: PunchingShearCheckStatus }) {
  const labelByStatus: Record<PunchingShearCheckStatus | 'draft', string> = {
    draft: 'Нет расчета',
    draft_ok: 'Черновик прошел',
    draft_failed: 'Черновик не прошел',
    not_implemented: 'Не реализовано',
    invalid_input: 'Ошибка ввода',
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
        Запустите расчет, чтобы построить схему геометрии
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
          <marker
            id="dimension-arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-slate-500" />
          </marker>
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
        <span>Схема геометрии: мм, вписано в область</span>
        <span>{svgModel.metadata.stressDiagram === 'draft' ? 'Черновая схема напряжений' : 'Черновая проверка'}</span>
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
    const stressColor =
      element.role === 'stress-segment' ? getStressColor(element.stressRatio ?? 0) : undefined

    return (
      <g>
        <line
          x1={element.start.x}
          y1={element.start.y}
          x2={element.end.x}
          y2={element.end.y}
          className={stressColor ? undefined : getElementClassName(element.role)}
          stroke={stressColor}
          strokeWidth={element.role === 'stress-segment' ? 7 : undefined}
          vectorEffect="non-scaling-stroke"
          markerStart={hasArrowMarker(element.role) ? 'url(#dimension-arrow)' : undefined}
          markerEnd={hasArrowMarker(element.role) ? 'url(#dimension-arrow)' : undefined}
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

  if (element.type === 'circle') {
    const stressColor =
      element.role === 'stress-marker' ? getStressColor(element.stressRatio ?? 0) : undefined

    return (
      <circle
        cx={element.center.x}
        cy={element.center.y}
        r={element.radius}
        className={stressColor ? undefined : getElementClassName(element.role)}
        fill={stressColor}
        vectorEffect="non-scaling-stroke"
      />
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
    'slab-boundary': 'fill-transparent stroke-slate-500 stroke-2 stroke-dasharray-[10_8]',
    column: 'fill-slate-800 stroke-slate-950 stroke-2',
    wall: 'fill-slate-700 stroke-slate-950 stroke-2',
    'control-perimeter': 'fill-none stroke-teal-700 stroke-4',
    'control-contour': 'fill-none stroke-teal-500 stroke-2 opacity-60',
    'selected-control-contour': 'fill-none stroke-teal-800 stroke-5',
    'removed-perimeter': 'fill-none stroke-red-600 stroke-3 stroke-dasharray-[10_7]',
    opening: 'fill-orange-100 stroke-red-500 stroke-2 stroke-dasharray-[8_6]',
    'opening-tangent': 'stroke-slate-400 stroke-2 stroke-dasharray-[8_8]',
    label: 'fill-slate-600',
    dimension: 'stroke-slate-500 stroke-2 stroke-dasharray-[6_6]',
    'stress-segment': 'stroke-red-600 stroke-[7]',
    'stress-marker': 'fill-red-600 stroke-white stroke-2',
    'moment-arrow': 'stroke-violet-600 stroke-2 stroke-dasharray-[8_6]',
    eccentricity: 'fill-cyan-100 stroke-cyan-600 stroke-2 stroke-dasharray-[5_5]',
    'reinforcement-marker': 'fill-emerald-500 stroke-emerald-900 stroke-2',
    'reinforcement-row': 'fill-transparent stroke-emerald-600 stroke-2 stroke-dasharray-[7_5]',
  }

  return classes[role]
}

function hasArrowMarker(role: SvgSketchElement['role']) {
  return role === 'dimension' || role === 'moment-arrow' || role === 'eccentricity'
}

function getStressColor(ratio: number) {
  const normalized = Math.max(0, Math.min(1, ratio))
  const hue = 200 - normalized * 200

  return `hsl(${hue.toFixed(0)} 82% 48%)`
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

  return value ? 'Проходит' : 'Не проходит'
}

async function copyText(value: string) {
  if (!navigator.clipboard) {
    return false
  }

  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}
