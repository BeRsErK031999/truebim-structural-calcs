import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts'

import { useCalculationStore } from '@/entities/calculation/model/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const utilizationPreview = [
  { step: 'N', value: 0 },
  { step: 'V', value: 0 },
  { step: 'M', value: 0 },
  { step: 'U', value: 0 },
]

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
          <Metric label="Контур" value={String(result?.perimeter.perimeterMm ?? '--')} unit="мм" />
        </div>

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
          </div>
        ) : null}

        <div className="h-52 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={utilizationPreview} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid stroke="#d8dee9" strokeDasharray="4 4" />
              <XAxis dataKey="step" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#94a3b8"
                fill="#e2e8f0"
                fillOpacity={0.75}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
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
