import {
  pointsToSvg,
  type PunchingSketchModel,
  type SvgSketchElement,
  viewBoxToString,
} from '@/calculations/punching-shear'
import { useCalculationStore } from '@/entities/calculation/model/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

export function ResultPanel() {
  const result = useCalculationStore((state) => state.punchingShearResult)
  const report = useCalculationStore((state) => state.punchingShearReport)

  return (
    <Card className="sticky top-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Результаты</span>
          <span className="rounded-md bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">
            {result?.status ?? 'Черновик'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Нагрузка" value="placeholder" unit="кН" />
          <Metric label="Несущая" value="not ready" unit="кН" />
          <Metric label="Коэф." value={result?.utilization?.toString() ?? '--'} unit="η" />
          <Metric label="Контур" value={formatNumber(result?.perimeter.perimeterMm)} unit="мм" />
        </div>

        <EngineeringPreview svgModel={result?.svgModel} />

        {result ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Архитектурный stub</p>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              Инженерные формулы еще не реализованы. Значения нельзя использовать для
              проектирования.
            </p>
            <ul className="mt-3 grid gap-1 text-sm text-amber-800">
              {result.warnings.map((warning) => (
                <li key={warning}>- {warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {report ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">{report.title}</p>
            <p className="mt-1 text-sm text-slate-600">{report.standard}</p>
            <p className="mt-2 text-sm text-slate-600">
              Segments: {report.geometrySummary.segmentCount}, SVG elements:{' '}
              {report.svgMetadata.elementCount}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function EngineeringPreview({ svgModel }: { svgModel?: PunchingSketchModel }) {
  if (!svgModel) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        Запустите stub, чтобы построить draft geometry preview
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
        <span>Formulas disabled</span>
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
        {value} <span className="text-sm font-medium text-slate-500">{unit}</span>
      </p>
    </div>
  )
}

function formatNumber(value?: number) {
  return value === undefined ? '--' : value.toFixed(0)
}
