import { useState } from 'react'
import type { ReactNode } from 'react'
import { Copy, Download, FileText, X } from 'lucide-react'

import {
  pointsToSvg,
  type PunchingShearCheckStatus,
  type PunchingShearInput,
  type PunchingShearReportModel,
  type PunchingShearResult,
  type PunchingSketchModel,
  type SvgSketchElement,
  viewBoxToString,
} from '@/calculations/punching-shear'
import {
  buildEngineeringReportListing,
  type EngineeringReportLine,
  type EngineeringReportListing,
  type EngineeringReportServiceBlock,
} from '@/calculations/punching-shear/trace/engineeringReportLines'
import { useCalculationStore } from '@/entities/calculation/model/store'
import {
  buildReportSummary,
  exportCurrentCalculationAsHtml,
  exportCurrentCalculationAsMarkdown,
} from '@/features/report-export'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const draftWarning =
  'Черновой расчет. Проверьте формулы и коэффициенты по СП 63.13330 перед проектным применением.'

export function ResultPanel() {
  const draft = useCalculationStore((state) => state.draft)
  const result = useCalculationStore((state) => state.punchingShearResult)
  const report = useCalculationStore((state) => state.punchingShearReport)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const canExport = Boolean(result && report)
  const listing = result && report ? buildEngineeringReportListing(draft, result, report) : null

  const handleExportHtml = () => {
    const exportResult = exportCurrentCalculationAsHtml()

    setExportMessage(
      exportResult.ok ? `Отчет скачан: ${exportResult.filename}` : exportResult.error,
    )
  }

  const handleExportMarkdown = () => {
    const exportResult = exportCurrentCalculationAsMarkdown()

    setExportMessage(
      exportResult.ok ? `Отчет скачан: ${exportResult.filename}` : exportResult.error,
    )
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
    <>
      <Card className="sticky top-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Результаты</span>
            <StatusBadge status={result?.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium leading-6 text-amber-900">
            {draftWarning}
          </div>

          {result && report && listing ? (
            <ResultSummary result={result} listing={listing} onOpenReport={() => setReportOpen(true)} />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Заполните исходные данные и запустите расчет, чтобы увидеть краткую сводку.
            </div>
          )}

          <EngineeringPreview svgModel={result?.svgModel} compact />

          <div className="grid gap-2">
            <Button
              type="button"
              className="justify-center"
              disabled={!result || !report}
              onClick={() => setReportOpen(true)}
            >
              <FileText />
              Показать инженерный отчет
            </Button>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="justify-center"
                disabled={!canExport}
                onClick={handleExportHtml}
              >
                <Download />
                HTML
              </Button>
              <Button
                type="button"
                variant="outline"
                className="justify-center"
                disabled={!canExport}
                onClick={handleExportMarkdown}
              >
                <Download />
                Markdown
              </Button>
            </div>
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

          {exportMessage ? <p className="text-sm font-medium text-slate-700">{exportMessage}</p> : null}
          {copyMessage ? <p className="text-sm font-medium text-slate-700">{copyMessage}</p> : null}
        </CardContent>
      </Card>

      {reportOpen && result && report && listing ? (
        <EngineeringReportModal
          input={draft}
          result={result}
          report={report}
          listing={listing}
          onClose={() => setReportOpen(false)}
          onExportHtml={handleExportHtml}
          onExportMarkdown={handleExportMarkdown}
        />
      ) : null}
    </>
  )
}

function ResultSummary({
  result,
  listing,
  onOpenReport,
}: {
  result: PunchingShearResult
  listing: EngineeringReportListing
  onOpenReport: () => void
}) {
  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">{listing.resultSummary.statusText}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">
          η = {listing.resultSummary.utilizationText}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Запас = {listing.resultSummary.reservePercentText}
        </p>
        <p className={`mt-3 text-sm font-semibold ${result.passed ? 'text-emerald-700' : 'text-red-700'}`}>
          {listing.resultSummary.conditionText}
        </p>
      </div>

      <ValueRows rows={listing.quickRows.map((row) => [row.label, row.value])} />

      <Button type="button" variant="outline" className="justify-center" onClick={onOpenReport}>
        <FileText />
        Открыть полный расчет
      </Button>
    </div>
  )
}

function EngineeringReportModal({
  input,
  result,
  report,
  listing,
  onClose,
  onExportHtml,
  onExportMarkdown,
}: {
  input: PunchingShearInput
  result: PunchingShearResult
  report: PunchingShearReportModel
  listing: EngineeringReportListing
  onClose: () => void
  onExportHtml: () => void
  onExportMarkdown: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-3 sm:p-6" role="dialog" aria-modal="true">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">TrueBIM</p>
            <h2 className="text-xl font-semibold text-slate-950">
              Инженерный отчет по продавливанию
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={onExportHtml}>
              <Download />
              Выгрузить HTML
            </Button>
            <Button type="button" variant="outline" onClick={onExportMarkdown}>
              <Download />
              Выгрузить Markdown
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Закрыть отчет" onClick={onClose}>
              <X />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <EngineeringCalculationReport input={input} result={result} report={report} listing={listing} />
        </div>
      </div>
    </div>
  )
}

function EngineeringCalculationReport({
  result,
  report,
  listing,
}: {
  input: PunchingShearInput
  result: PunchingShearResult
  report: PunchingShearReportModel
  listing: EngineeringReportListing
}) {
  return (
    <article className="mx-auto grid max-w-4xl gap-8 text-slate-900">
      <ReportSection title="1. Итог проверки">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <p className="text-lg font-semibold text-slate-950">{listing.resultSummary.statusText}</p>
          <p className="mt-3 text-base">η = {listing.resultSummary.utilizationText}</p>
          <p className="mt-1 text-base">Запас = {listing.resultSummary.reservePercentText}</p>
          <p className={`mt-3 font-semibold ${result.passed ? 'text-emerald-700' : 'text-red-700'}`}>
            {listing.resultSummary.conditionText}
          </p>
        </div>
      </ReportSection>

      <ReportSection title="2. Исходные данные">
        <ReportTable rows={listing.inputRows.map((row) => [row.label, row.value])} />
      </ReportSection>

      <ReportSection title="3. Ход расчета">
        <div className="grid gap-7">
          {listing.calculationSections.map((section) => (
            <CalculationListingSection key={section.id} title={section.title} lines={section.lines} />
          ))}
        </div>
      </ReportSection>

      <ReportSection title="4. Проверка условия">
        <CalculationLines lines={listing.conditionLines} />
      </ReportSection>

      <ReportSection title="5. Заключение">
        <CalculationLines lines={listing.conclusionLines} />
      </ReportSection>

      <ReportSection title="6. Служебная информация">
        <div className="grid gap-3">
          {listing.serviceBlocks.map((block) => (
            <ServiceDetails key={block.id} block={block} />
          ))}
          <ServiceDetails
            block={{
              id: 'report-metadata',
              title: 'Метаданные отчета',
              rows: [
                { label: 'Стандарт', value: report.standard },
                { label: 'Тип расчета', value: report.caseType },
              ],
            }}
          />
        </div>
      </ReportSection>
    </article>
  )
}

function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="border-b border-slate-200 pb-2 text-lg font-semibold text-slate-950">{title}</h3>
      {children}
    </section>
  )
}

function CalculationListingSection({ title, lines }: { title: string; lines: EngineeringReportLine[] }) {
  return (
    <section>
      <h4 className="text-base font-semibold text-slate-950">{title}</h4>
      <CalculationLines lines={lines} />
    </section>
  )
}

function CalculationLines({ lines }: { lines: EngineeringReportLine[] }) {
  return (
    <div className="mt-3 grid gap-2 font-mono text-sm leading-7 text-slate-900">
      {lines.map((line) => (
        <p
          key={line.id}
          className={
            line.tone === 'muted'
              ? 'text-slate-500'
              : line.tone === 'strong'
                ? 'font-semibold text-slate-950'
                : undefined
          }
        >
          {line.text}
        </p>
      ))}
    </div>
  )
}

function ReportTable({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-slate-100 last:border-0">
              <th className="w-52 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700">{label}</th>
              <td className="px-3 py-2 text-slate-950">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ValueRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid gap-2 text-sm">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0"
        >
          <dt className="font-semibold text-slate-600">{label}</dt>
          <dd className="text-right font-semibold text-slate-950">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ServiceDetails({ block }: { block: EngineeringReportServiceBlock }) {
  return (
    <details className="rounded-lg border border-slate-200 bg-white p-3">
      <summary className="cursor-pointer text-sm font-semibold text-slate-950">{block.title}</summary>
      {block.rows ? (
        <div className="mt-3">
          <ReportTable rows={block.rows.map((row) => [row.label, row.value])} />
        </div>
      ) : null}
      {block.items ? (
        <ul className="mt-3 grid gap-1 text-sm leading-6 text-slate-700">
          {block.items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      ) : null}
    </details>
  )
}

function StatusBadge({ status }: { status?: PunchingShearCheckStatus }) {
  const labelByStatus: Record<PunchingShearCheckStatus | 'draft', string> = {
    draft: 'Нет расчета',
    draft_ok: 'Расчет прошел',
    draft_failed: 'Расчет не прошел',
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

function EngineeringPreview({ svgModel, compact = false }: { svgModel?: PunchingSketchModel; compact?: boolean }) {
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
        className={`${compact ? 'max-h-56' : ''} aspect-[4/3] h-auto w-full rounded-md bg-white`}
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
      <div className="mt-3 text-xs text-slate-500">Схема геометрии: мм, вписано в область</div>
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
