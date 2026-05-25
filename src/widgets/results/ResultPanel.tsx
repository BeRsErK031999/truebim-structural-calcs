import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const utilizationPreview = [
  { step: 'N', value: 42 },
  { step: 'V', value: 58 },
  { step: 'M', value: 64 },
  { step: 'U', value: 71 },
]

export function ResultPanel() {
  return (
    <Card className="sticky top-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Результаты</span>
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700">
            Черновик
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Нагрузка" value="0.00" unit="кН" />
          <Metric label="Несущая" value="0.00" unit="кН" />
          <Metric label="Коэф." value="0.00" unit="η" />
          <Metric label="Запас" value="--" unit="%" />
        </div>

        <div className="h-52 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={utilizationPreview} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid stroke="#d8dee9" strokeDasharray="4 4" />
              <XAxis dataKey="step" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0f766e"
                fill="#99f6e4"
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
      <p className="mt-2 text-2xl font-semibold text-slate-950">
        {value} <span className="text-sm font-medium text-slate-500">{unit}</span>
      </p>
    </div>
  )
}
