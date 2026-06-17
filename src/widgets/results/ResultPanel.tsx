import { useState } from 'react'
import type { ReactNode } from 'react'
import { Copy, Download } from 'lucide-react'

import {
  pointsToSvg,
  type PunchingShearCheckStatus,
  type PunchingShearInput,
  type PunchingShearReportModel,
  type PunchingShearResult,
  type PunchingSketchModel,
  type SvgSketchElement,
  type TraceStep,
  viewBoxToString,
} from '@/calculations/punching-shear'
import {
  engineeringStepTitle,
  engineeringStepDescription,
  formatEngineeringFormulaResult,
  formatEngineeringFormulaText,
  groupEngineeringTraceSteps,
  sanitizeEngineeringText,
} from '@/calculations/punching-shear/trace/engineeringReportPresentation'
import { localizeTraceText } from '@/calculations/punching-shear/trace/traceLocalization'
import { useCalculationStore } from '@/entities/calculation/model/store'
import {
  buildReportSummary,
  exportCurrentCalculationAsHtml,
  exportCurrentCalculationAsMarkdown,
} from '@/features/report-export'
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

        {result && report ? (
          <EngineeringCalculationReport input={draft} result={result} report={report} />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Заполните исходные данные и запустите расчет, чтобы увидеть инженерный отчет.
          </div>
        )}

        <EngineeringPreview svgModel={result?.svgModel} />

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Экспорт и передача расчета</p>
          <p className="text-sm leading-6 text-slate-700">
            Скачайте отчет или скопируйте краткую сводку для проверки инженером.
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
      </CardContent>
    </Card>
  )
}

function EngineeringCalculationReport({
  input,
  result,
  report,
}: {
  input: PunchingShearInput
  result: PunchingShearResult
  report: PunchingShearReportModel
}) {
  const groupedSteps = groupTraceSteps(report)
  const reserve = result.utilizationRatio === null ? null : Math.max(0, 1 - result.utilizationRatio)

  return (
    <div className="grid gap-4">
      <ReportSection
        title="Расчет продавливания"
        description={`${report.standard}. Расчет оформлен как последовательность исходных данных, геометрии, вычислений и проверки условия прочности.`}
      >
        <div className="grid grid-cols-2 gap-3">
          <Metric label="N" value={formatKn(result.designShearForceN)} unit="кН" />
          <Metric label="u" value={formatNumber(result.controlPerimeterMm)} unit="мм" />
          <Metric label="h0" value={formatNumber(result.effectiveDepthMm)} unit="мм" />
          <Metric label="η" value={formatDecimal(result.utilizationRatio)} unit="" />
        </div>
      </ReportSection>

      <ReportSection
        title="Исходные данные"
        description="Данные, принятые для расчета продавливания плиты выбранным типом опоры."
      >
        <ValueRows
          rows={[
            ['Тип расчетного случая', formatCaseType(input.caseType)],
            ['Продольная сила N', `${formatKn(result.designShearForceN)} кН`],
            ['Бетон', input.concrete.className],
            ['Толщина плиты', `${formatNumber(input.slab.thicknessMm)} мм`],
            ['Рабочая высота сечения h0', `${formatNumber(result.effectiveDepthMm)} мм`],
            ['Размер опоры', formatSupportSize(input)],
            ['Момент Mx', `${formatDecimal(input.forces.momentXKnM)} кН·м`],
            ['Момент My', `${formatDecimal(input.forces.momentYKnM)} кН·м`],
          ]}
        />
      </ReportSection>

      <ReportSection
        title="Геометрия расчетного контура"
        description="Расчетный контур расположен относительно опоры с учетом рабочей высоты сечения, краев плиты и отверстий."
      >
        <p className="text-sm leading-6 text-slate-700">
          Основной контур принят на расстоянии h0/2 от грани опоры. Для краевых, угловых и
          специальных случаев используются доступные участки расчетного контура.
        </p>
        <ValueRows
          rows={[
            ['Расчетный контур u', `${formatNumber(result.controlPerimeterMm)} мм`],
            ['Количество участков контура', String(result.perimeter.segments.length)],
            ['Смещение контура', `${formatNumber(result.perimeter.draftOffsetMm)} мм`],
            ['Исключенная длина', `${formatNumber(result.perimeter.removedPerimeterMm)} мм`],
          ]}
        />
        <TraceFormulaList steps={groupedSteps.geometry} />
      </ReportSection>

      <ReportSection
        title="Промежуточные вычисления"
        description="Формулы показаны отдельно от численной подстановки и результата."
      >
        <TraceFormulaList steps={groupedSteps.calculation} />
      </ReportSection>

      <ReportSection
        title="Проверки условий"
        description="Сравнение расчетных напряжений с принятой несущей способностью и расчет коэффициента использования."
      >
        <ValueRows
          rows={[
            ['Расчетное напряжение v', `${formatDecimal(result.shearStressMpa)} МПа`],
            ['Максимальное напряжение', `${formatDecimal(result.maxShearStressMpa)} МПа`],
            ['Расчетное сопротивление R', `${formatDecimal(result.draftConcreteResistanceMpa)} МПа`],
            ['Коэффициент использования η', formatPercentWithRatio(result.utilizationRatio)],
          ]}
        />
        <TraceFormulaList steps={groupedSteps.checks} />
      </ReportSection>

      <ReportSection
        title="Итоговый вывод"
        description="Краткий результат проверки для инженерной оценки."
      >
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-base font-semibold text-slate-950">
            {result.passed ? 'Условие прочности выполняется.' : 'Условие прочности не выполняется.'}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Коэффициент использования: {formatPercent(result.utilizationRatio)}. Запас несущей
            способности: {formatPercent(reserve)}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <VerificationLevelBadge level={result.verificationLevel} />
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">
            {formatPassed(result.passed)}
          </span>
        </div>
      </ReportSection>

      <ReportSection
        title="Допущения и предупреждения"
        description="Инженерные ограничения, которые нужно учесть перед применением результата."
      >
        <FeatureList title="Проверенные возможности" features={result.verifiedFeatures} />
        <FeatureList title="Требуют инженерной проверки" features={result.draftFeatures} />
        <ul className="grid gap-1 text-sm text-slate-700">
          {result.warnings.length > 0 ? (
            result.warnings.map((warning) => (
              <li key={warning}>- {sanitizeEngineeringText(localizeTraceText(warning))}</li>
            ))
          ) : (
            <li>- Предупреждений нет</li>
          )}
        </ul>
      </ReportSection>
    </div>
  )
}

function ReportSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  )
}

function ValueRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid gap-2 text-sm">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0"
        >
          <dt className="text-slate-600">{label}</dt>
          <dd className="text-right font-semibold text-slate-950">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function TraceFormulaList({ steps }: { steps: TraceStep[] }) {
  if (steps.length === 0) {
    return <p className="text-sm text-slate-500">Для этого раздела дополнительных формул нет.</p>
  }

  return (
    <div className="grid gap-3">
      {steps.map((step) => (
        <div key={step.id} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">{engineeringStepTitle(step)}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {engineeringStepDescription(step)}
            </p>
          </div>
          <FormulaBlock label="Формула" value={formatFormulaText(step.formula)} />
          <FormulaBlock label="Подстановка" value={formatFormulaText(localizeTraceText(step.substitutedFormula))} />
          <FormulaBlock label="Результат" value={formatFormulaResult(step)} />
        </div>
      ))}
    </div>
  )
}

function FormulaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words rounded-md bg-white px-3 py-2 font-mono text-sm text-slate-900">
        {value}
      </p>
    </div>
  )
}

type EngineeringStepGroup = {
  geometry: TraceStep[]
  calculation: TraceStep[]
  checks: TraceStep[]
}

function groupTraceSteps(report: PunchingShearReportModel): EngineeringStepGroup {
  return groupEngineeringTraceSteps(report.calculationTrace)
}

function formatFormulaText(value: string) {
  return formatEngineeringFormulaText(value)
}

function formatFormulaResult(step: TraceStep) {
  return formatEngineeringFormulaResult(step)
}

function formatCaseType(caseType: PunchingShearInput['caseType']) {
  const labelByCaseType: Record<PunchingShearInput['caseType'], string> = {
    center: 'центральная колонна',
    edge: 'колонна у края плиты',
    corner: 'колонна в углу плиты',
    opening: 'колонна с учетом отверстия',
    round: 'круглая колонна',
    'wall-end': 'торец стены',
    'wall-corner': 'угол стены',
  }

  return labelByCaseType[caseType]
}

function formatSupportSize(input: PunchingShearInput) {
  if (input.rectColumn) {
    return `${formatNumber(input.rectColumn.widthXMm)} × ${formatNumber(input.rectColumn.widthYMm)} мм`
  }

  if (input.roundColumn) {
    return `диаметр ${formatNumber(input.roundColumn.diameterMm)} мм`
  }

  if (input.wall) {
    return `${formatNumber(input.wall.wallLength)} × ${formatNumber(input.wall.wallThickness)} мм`
  }

  if (input.wallCorner) {
    return `${formatNumber(input.wallCorner.wallLengthX)} × ${formatNumber(input.wallCorner.wallLengthY)} мм`
  }

  return 'не задано'
}

function formatPercent(value?: number | null) {
  return value === undefined || value === null || !Number.isFinite(value)
    ? 'не оценено'
    : `${(value * 100).toFixed(0)}%`
}

function formatPercentWithRatio(value?: number | null) {
  return value === undefined || value === null || !Number.isFinite(value)
    ? 'не оценено'
    : `${value.toFixed(3)} (${(value * 100).toFixed(0)}%)`
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
