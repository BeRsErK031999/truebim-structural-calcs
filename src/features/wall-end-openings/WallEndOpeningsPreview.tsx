import type { WallEndOpeningsResult } from '@/calculations/wall-end-openings'

type WallEndOpeningsPreviewProps = {
  result: WallEndOpeningsResult
}

export function WallEndOpeningsPreview({ result }: WallEndOpeningsPreviewProps) {
  const { plot } = result
  const width = plot.bounds.maxX - plot.bounds.minX
  const height = plot.bounds.maxY - plot.bounds.minY
  const viewBox = `${plot.bounds.minX} ${-plot.bounds.maxY} ${width} ${height}`
  const gridLines = buildGridLines(plot.bounds)

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Контур продавливания</h2>
          <p className="text-sm leading-5 text-slate-600">
            Активные участки считаются в формулах; красные пунктирные отрезки исключены вырезами.
          </p>
        </div>
        <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
          Черновой Excel-образец
        </span>
      </div>

      <div className="aspect-[4/3] min-h-[320px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <svg
          aria-label="Контур продавливания торца стены"
          className="h-full w-full"
          role="img"
          viewBox={viewBox}
        >
          <rect
            x={plot.bounds.minX}
            y={-plot.bounds.maxY}
            width={width}
            height={height}
            fill="#f8fafc"
          />

          {gridLines.map((line) => (
            <line
              key={line.key}
              x1={line.x1}
              x2={line.x2}
              y1={-line.y1}
              y2={-line.y2}
              stroke="#dbe3ee"
              strokeWidth="1"
            />
          ))}

          <line
            x1={plot.bounds.minX}
            x2={plot.bounds.maxX}
            y1="0"
            y2="0"
            stroke="#0f172a"
            strokeWidth="1"
          />
          <line
            x1="0"
            x2="0"
            y1={-plot.bounds.maxY}
            y2={-plot.bounds.minY}
            stroke="#0f172a"
            strokeWidth="1"
          />

          <polygon
            fill="#e2e8f0"
            points={plot.wallPoints.map((point) => toSvgPoint(point)).join(' ')}
            stroke="#334155"
            strokeWidth="2"
          />

          {plot.activeSegments.map((segment, index) => (
            <line
              key={`${segment.side}-active-${index}`}
              x1={segment.start.x}
              x2={segment.end.x}
              y1={-segment.start.y}
              y2={-segment.end.y}
              stroke="#0f172a"
              strokeLinecap="round"
              strokeWidth="5"
            />
          ))}

          {plot.removedSegments.map((segment, index) => (
            <line
              key={`${segment.side}-removed-${index}`}
              x1={segment.start.x}
              x2={segment.end.x}
              y1={-segment.start.y}
              y2={-segment.end.y}
              stroke="#ef4444"
              strokeDasharray="8 6"
              strokeLinecap="round"
              strokeWidth="3"
            />
          ))}

          <line
            x1={plot.wallCentroid.x}
            x2={plot.contourCentroid.x}
            y1={-plot.wallCentroid.y}
            y2={-plot.contourCentroid.y}
            stroke="#ef4444"
            strokeDasharray="4 6"
            strokeWidth="1.5"
          />

          <path
            d={diamondPath(plot.wallCentroid, 7)}
            fill="#10b981"
            stroke="#047857"
            strokeWidth="2"
          />
          <path
            d={crossPath(plot.contourCentroid, 8)}
            fill="none"
            stroke="#0284c7"
            strokeLinecap="round"
            strokeWidth="3"
          />

          <text x={plot.bounds.maxX - 22} y="18" fill="#0f172a" fontSize="18" fontWeight="700">
            X
          </text>
          <text x="8" y={-plot.bounds.maxY + 24} fill="#0f172a" fontSize="18" fontWeight="700">
            Y
          </text>
        </svg>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        <LegendSwatch className="bg-slate-950" label="Учитываемый контур" />
        <LegendSwatch className="border border-red-500 bg-red-100" label="Вырез" />
        <LegendSwatch className="bg-emerald-500" label="Центр стены" />
        <LegendSwatch className="bg-sky-500" label="Центр контура" />
      </div>
    </div>
  )
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2.5 rounded-sm ${className}`} />
      {label}
    </span>
  )
}

function buildGridLines(bounds: WallEndOpeningsResult['plot']['bounds']) {
  const lines: Array<{ key: string; x1: number; x2: number; y1: number; y2: number }> = []
  const startX = Math.floor(bounds.minX / 50) * 50
  const endX = Math.ceil(bounds.maxX / 50) * 50
  const startY = Math.floor(bounds.minY / 50) * 50
  const endY = Math.ceil(bounds.maxY / 50) * 50

  for (let x = startX; x <= endX; x += 50) {
    lines.push({ key: `x-${x}`, x1: x, x2: x, y1: bounds.minY, y2: bounds.maxY })
  }

  for (let y = startY; y <= endY; y += 50) {
    lines.push({ key: `y-${y}`, x1: bounds.minX, x2: bounds.maxX, y1: y, y2: y })
  }

  return lines
}

function toSvgPoint(point: { x: number; y: number }) {
  return `${point.x},${-point.y}`
}

function diamondPath(point: { x: number; y: number }, radius: number) {
  return [
    `M ${point.x} ${-point.y - radius}`,
    `L ${point.x + radius} ${-point.y}`,
    `L ${point.x} ${-point.y + radius}`,
    `L ${point.x - radius} ${-point.y}`,
    'Z',
  ].join(' ')
}

function crossPath(point: { x: number; y: number }, radius: number) {
  const y = -point.y

  return [
    `M ${point.x - radius} ${y - radius}`,
    `L ${point.x + radius} ${y + radius}`,
    `M ${point.x + radius} ${y - radius}`,
    `L ${point.x - radius} ${y + radius}`,
  ].join(' ')
}
