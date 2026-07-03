import { HelpCircle, RotateCcw } from 'lucide-react'
import { type ChangeEvent, type ReactNode, useMemo, useState } from 'react'

import {
  calculateWallEndOpenings,
  defaultWallEndOpeningsInput,
  wallEndConcreteClasses,
  wallEndReinforcementClasses,
  type WallEndCutoutSide,
  type WallEndConcreteClass,
  type WallEndOpeningsInput,
  type WallEndOpeningsResult,
  type WallEndReinforcementClass,
  type WallEndScheme,
} from '@/calculations/wall-end-openings'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

import { WallEndOpeningsPreview } from './WallEndOpeningsPreview'

const schemeLabels: Record<WallEndScheme, string> = {
  'floor-columns-above-and-below': 'Плита перекрытия, колонны над и под плитой',
  'floor-column-above': 'Плита перекрытия, колонна над плитой',
  'roof-column-below': 'Плита покрытия, колонна под плитой',
  'foundation-column': 'Фундаментная плита с колонной',
}

const cutoutGroups: Array<{
  side: WallEndCutoutSide
  title: string
  subtitle: string
  offsetLabel: string
  lengthLabel: string
}> = [
  {
    side: 'lx1',
    title: 'Вырезы на участке lx1',
    subtitle: 'снизу',
    offsetLabel: '∆x1',
    lengthLabel: 'длина',
  },
  {
    side: 'lx2',
    title: 'Вырезы на участке lx2',
    subtitle: 'сверху',
    offsetLabel: '∆x2',
    lengthLabel: 'длина',
  },
  {
    side: 'ly',
    title: 'Вырезы на участке ly',
    subtitle: 'торец',
    offsetLabel: '∆y1',
    lengthLabel: 'длина',
  },
]

export function WallEndOpeningsCalculator() {
  const [input, setInput] = useState<WallEndOpeningsInput>(() => cloneInput(defaultWallEndOpeningsInput))
  const result = useMemo(() => calculateWallEndOpenings(input), [input])

  const updateRootNumber = (key: 'wallThicknessMm', value: number) => {
    setInput((current) => ({ ...current, [key]: value }))
  }

  const updateSlabNumber = (key: keyof WallEndOpeningsInput['slab'], value: number) => {
    setInput((current) => ({ ...current, slab: { ...current.slab, [key]: value } }))
  }

  const updateForceNumber = (key: keyof WallEndOpeningsInput['forces'], value: number) => {
    setInput((current) => ({ ...current, forces: { ...current.forces, [key]: value } }))
  }

  const updateConcreteNumber = (key: 'gammaB1' | 'gammaB234', value: number) => {
    setInput((current) => ({ ...current, concrete: { ...current.concrete, [key]: value } }))
  }

  const updateReinforcementNumber = (
    key: 'diameterMm' | 'barCount' | 'spacingMm',
    value: number,
  ) => {
    setInput((current) => ({
      ...current,
      reinforcement: { ...current.reinforcement, [key]: value },
    }))
  }

  const updateAlternateNumber = (key: keyof WallEndOpeningsInput['alternateContour'], value: number) => {
    setInput((current) => ({
      ...current,
      alternateContour: { ...current.alternateContour, [key]: value },
    }))
  }

  const updateCutout = (
    side: WallEndCutoutSide,
    index: number,
    key: 'offsetMm' | 'lengthMm',
    value: number,
  ) => {
    setInput((current) => {
      const nextCutouts = {
        lx1: current.cutouts.lx1.map((cutout) => ({ ...cutout })),
        lx2: current.cutouts.lx2.map((cutout) => ({ ...cutout })),
        ly: current.cutouts.ly.map((cutout) => ({ ...cutout })),
      }
      nextCutouts[side][index] = { ...nextCutouts[side][index], [key]: value }

      return { ...current, cutouts: nextCutouts }
    })
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.8fr)_minmax(420px,1.1fr)_minmax(420px,1fr)]">
      <ResultsPanel result={result} />

      <div className="grid gap-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Задаваемые характеристики</h2>
              <p className="text-sm leading-5 text-slate-600">
                Вырез задается парой: отступ от правого торца участка и длина вдоль этого участка.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setInput(cloneInput(defaultWallEndOpeningsInput))}
            >
              <RotateCcw className="size-4" />
              Сброс
            </Button>
          </div>

          <div className="mt-4 grid gap-4">
            <FieldGroup title="Схема и плита">
              <SelectField
                label="Расчетная схема"
                value={input.scheme}
                onChange={(event) =>
                  setInput((current) => ({ ...current, scheme: event.target.value as WallEndScheme }))
                }
                options={Object.entries(schemeLabels).map(([value, label]) => ({ value, label }))}
              />
              <CheckboxField
                checked={input.splitAdditionalMoment}
                label="Делить дополнительный момент от Fi пополам"
                onChange={(checked) =>
                  setInput((current) => ({ ...current, splitAdditionalMoment: checked }))
                }
              />
              <NumberInput
                helperText="Толщина стены или пилона t."
                label="t"
                unit="мм"
                value={input.wallThicknessMm}
                onChange={(value) => updateRootNumber('wallThicknessMm', value)}
              />
              <NumberInput
                helperText="Полная толщина плиты h."
                label="h"
                unit="мм"
                value={input.slab.heightMm}
                onChange={(value) => updateSlabNumber('heightMm', value)}
              />
              <NumberInput
                helperText="Защитный слой до рабочей арматуры по оси X."
                label="ax"
                unit="мм"
                value={input.slab.coverXMm}
                onChange={(value) => updateSlabNumber('coverXMm', value)}
              />
              <NumberInput
                helperText="Защитный слой до рабочей арматуры по оси Y."
                label="ay"
                unit="мм"
                value={input.slab.coverYMm}
                onChange={(value) => updateSlabNumber('coverYMm', value)}
              />
              <ReadOnlyMetric label="h0" unit="мм" value={result.geometry.h0Mm} />
            </FieldGroup>

            <FieldGroup title="Усилия и материалы">
              <NumberInput
                helperText="Расчетная сосредоточенная сила Fi, положительная по направлению схемы Excel."
                label="Fi"
                unit="т"
                value={input.forces.fiTon}
                onChange={(value) => updateForceNumber('fiTon', value)}
                step={0.1}
              />
              <NumberInput
                helperText="Исходный момент Myi. Знак влияет на выбранный W-by/W+by."
                label="Myi"
                unit="тм"
                value={input.forces.myiTonM}
                onChange={(value) => updateForceNumber('myiTonM', value)}
                step={0.01}
              />
              <NumberInput
                helperText="Распределенная нагрузка qi на расчетный контур."
                label="qi"
                unit="т/м2"
                value={input.forces.qiTonPerM2}
                onChange={(value) => updateForceNumber('qiTonPerM2', value)}
                step={0.01}
              />
              <SelectField
                label="Класс бетона"
                value={input.concrete.className}
                onChange={(event) =>
                  setInput((current) => ({
                    ...current,
                    concrete: { ...current.concrete, className: event.target.value as WallEndConcreteClass },
                  }))
                }
                options={wallEndConcreteClasses.map((className) => ({ value: className, label: className }))}
              />
              <NumberInput
                helperText="Коэффициент условий работы бетона γb1."
                label="γb1"
                unit=""
                value={input.concrete.gammaB1}
                onChange={(value) => updateConcreteNumber('gammaB1', value)}
                step={0.05}
              />
              <NumberInput
                helperText="Произведение коэффициентов γb2, γb3, γb4."
                label="γb2·γb3·γb4"
                unit=""
                value={input.concrete.gammaB234}
                onChange={(value) => updateConcreteNumber('gammaB234', value)}
                step={0.05}
              />
            </FieldGroup>

            <FieldGroup title="Поперечная арматура">
              <SelectField
                label="Класс"
                value={input.reinforcement.className}
                onChange={(event) =>
                  setInput((current) => ({
                    ...current,
                    reinforcement: {
                      ...current.reinforcement,
                      className: event.target.value as WallEndReinforcementClass,
                    },
                  }))
                }
                options={wallEndReinforcementClasses.map((className) => ({ value: className, label: className }))}
              />
              <NumberInput
                helperText="Диаметр одного стержня поперечной арматуры."
                label="∅"
                unit="мм"
                value={input.reinforcement.diameterMm}
                onChange={(value) => updateReinforcementNumber('diameterMm', value)}
              />
              <NumberInput
                helperText="Количество стержней, входящих в Asw."
                label="n"
                unit="шт"
                value={input.reinforcement.barCount}
                onChange={(value) => updateReinforcementNumber('barCount', value)}
              />
              <NumberInput
                helperText="Шаг поперечной арматуры sw."
                label="sw"
                unit="мм"
                value={input.reinforcement.spacingMm}
                onChange={(value) => updateReinforcementNumber('spacingMm', value)}
              />
              <ReadOnlyMetric label="Asw" unit="см2" value={result.reinforcement.aswCm2} />
              <ReadOnlyMetric label="qsw" unit="т/м" value={result.reinforcement.qswTonPerM} />
            </FieldGroup>

            <FieldGroup title="Альтернативный контур">
              <NumberInput
                helperText="Добавка к верхнему направлению контура Y+."
                label="Y+"
                unit="мм"
                value={input.alternateContour.yPlusMm}
                onChange={(value) => updateAlternateNumber('yPlusMm', value)}
              />
              <NumberInput
                helperText="Добавка к нижнему направлению контура Y-."
                label="Y-"
                unit="мм"
                value={input.alternateContour.yMinusMm}
                onChange={(value) => updateAlternateNumber('yMinusMm', value)}
              />
            </FieldGroup>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Вырезы</h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            Если отступ или сумма отступа и длины выходят за участок, расчет обрезает вырез по длине участка.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {cutoutGroups.map((group) => (
              <CutoutGroup
                key={group.side}
                group={group}
                input={input}
                result={result}
                onChange={updateCutout}
              />
            ))}
          </div>
        </section>
      </div>

      <WallEndOpeningsPreview result={result} />
    </div>
  )
}

function ResultsPanel({ result }: { result: WallEndOpeningsResult }) {
  return (
    <aside className="grid content-start gap-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Расчет</h2>
            <p className="text-sm leading-5 text-slate-600">Значения обновляются при каждом изменении.</p>
          </div>
          <Badge variant="outline" className="rounded-md border-amber-300 bg-amber-50 text-amber-800">
            reference draft
          </Badge>
        </div>
        <div className="mt-4 grid gap-2">
          {result.warnings.map((warning) => (
            <p key={warning} className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm leading-5 text-amber-900">
              {warning}
            </p>
          ))}
        </div>
      </section>

      <ResultSection title="Расчетный контур">
        <ResultRow label="lx1" unit="м" value={result.geometry.lx1M} />
        <ResultRow label="lx2" unit="м" value={result.geometry.lx2M} />
        <ResultRow label="ly" unit="м" value={result.geometry.lyM} />
        <ResultRow label="u" unit="м" value={result.geometry.uM} highlight />
        <ResultRow label="A" unit="м2" value={result.geometry.areaM2} />
        <ResultRow label="S" unit="м3" value={result.geometry.staticMomentM3} />
        <ResultRow label="yц.т.к." unit="м" value={result.geometry.contourCentroidYM} />
        <ResultRow label="e0y" unit="м" value={result.geometry.e0yM} />
      </ResultSection>

      <ResultSection title="Нагрузки">
        <ResultRow label="Fi" unit="т" value={result.loads.fiTon} />
        <ResultRow label="Fq1" unit="т" value={result.loads.fq1Ton} />
        <ResultRow label="F" unit="т" value={result.loads.fTon} highlight />
        <ResultRow label="My,loc" unit="тм" value={result.loads.myLocalTonM} />
        <ResultRow label="My,F" unit="тм" value={result.loads.myFromForceTonM} />
        <ResultRow label="My" unit="тм" value={result.loads.myTonM} highlight />
      </ResultSection>

      <ResultSection title="Без поперечной арматуры">
        <ResultRow label="Fb,ult" unit="т" value={result.concrete.fbUltTon} />
        <ResultRow label="F/Fb,ult" unit="" value={result.concrete.forceRatio} />
        <ResultRow label="Mby,ult" unit="тм" value={result.concrete.mbyUltTonM} />
        <ResultRow label="My/Mby,ult" unit="" value={result.concrete.momentRatio} />
        <ResultRow label="Σ" unit="" value={result.concrete.utilization} danger={!result.concrete.passed} highlight />
        <p className={result.concrete.passed ? 'text-sm text-emerald-700' : 'text-sm text-red-700'}>
          {result.concrete.message}
        </p>
      </ResultSection>

      <ResultSection title="С поперечной арматурой">
        <ResultRow label="Fsw,ult" unit="т" value={result.reinforcement.fswUltTon} />
        <ResultRow label="Fult" unit="т" value={result.reinforcement.fUltTon} />
        <ResultRow label="Mswy,ult" unit="тм" value={result.reinforcement.mswyUltTonM} />
        <ResultRow label="My,ult" unit="тм" value={result.reinforcement.myUltTonM} />
        <ResultRow
          label="Σ"
          unit=""
          value={result.reinforcement.utilization}
          danger={!result.reinforcement.passed}
          highlight
        />
        <p className={result.reinforcement.passed ? 'text-sm text-emerald-700' : 'text-sm text-red-700'}>
          {result.reinforcement.message}
        </p>
        {result.reinforcement.excessMessage ? (
          <p className="text-sm leading-5 text-amber-800">{result.reinforcement.excessMessage}</p>
        ) : null}
      </ResultSection>
    </aside>
  )
}

function ResultSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-normal text-slate-500">{title}</h3>
      <div className="mt-3 grid gap-2">{children}</div>
    </section>
  )
}

function ResultRow({
  label,
  value,
  unit,
  highlight = false,
  danger = false,
}: {
  label: string
  value: number
  unit: string
  highlight?: boolean
  danger?: boolean
}) {
  return (
    <div
      className={[
        'flex min-h-8 items-center justify-between gap-3 rounded-md px-2 py-1 text-sm',
        highlight ? 'bg-slate-50 font-semibold' : '',
        danger ? 'border border-red-200 bg-red-50 text-red-800' : '',
      ].join(' ')}
    >
      <span className="text-slate-600">{label}</span>
      <span className="text-right tabular-nums text-slate-950">
        {formatNumber(value)}
        {unit ? <span className="ml-1 text-xs text-slate-500">{unit}</span> : null}
      </span>
    </div>
  )
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  )
}

function NumberInput({
  label,
  value,
  unit,
  helperText,
  onChange,
  min,
  step = 1,
}: {
  label: string
  value: number
  unit: string
  helperText: string
  onChange: (value: number) => void
  min?: number
  step?: number
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <Label className="truncate text-sm font-semibold text-slate-700">{label}</Label>
          <span className="inline-flex text-slate-400" title={helperText} aria-label={helperText}>
            <HelpCircle className="size-3.5" />
          </span>
        </span>
        <span className="text-xs font-medium text-slate-500">{unit}</span>
      </div>
      <Input
        className="h-10 bg-white text-base md:text-sm"
        inputMode="decimal"
        min={min}
        step={step}
        type="number"
        value={value}
        onChange={(event) => onChange(toNumber(event.target.value))}
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        className="h-10 rounded-lg border border-input bg-white px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={value}
        onChange={onChange}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function CheckboxField({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
      <input
        checked={checked}
        className="size-4 accent-slate-950"
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  )
}

function ReadOnlyMetric({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-semibold text-slate-700">{label}</Label>
        <span className="text-xs font-medium text-slate-500">{unit}</span>
      </div>
      <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold tabular-nums text-slate-900">
        {formatNumber(value)}
      </div>
    </div>
  )
}

function CutoutGroup({
  group,
  input,
  result,
  onChange,
}: {
  group: (typeof cutoutGroups)[number]
  input: WallEndOpeningsInput
  result: WallEndOpeningsResult
  onChange: (
    side: WallEndCutoutSide,
    index: number,
    key: 'offsetMm' | 'lengthMm',
    value: number,
  ) => void
}) {
  const computedCutouts = result.cutouts.filter((cutout) => cutout.side === group.side)

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{group.title}</h3>
        <p className="text-xs font-semibold uppercase tracking-normal text-red-600">{group.subtitle}</p>
      </div>
      {input.cutouts[group.side].map((cutout, index) => (
        <div key={`${group.side}-${index}`} className="grid gap-2 rounded-md bg-white p-2 ring-1 ring-slate-200">
          <p className="text-xs font-semibold text-slate-500">Вырез №{index + 1}</p>
          <NumberInput
            helperText={`${group.offsetLabel}.${index * 2 + 1}: отступ до начала выреза от правого торца участка.`}
            label={`${group.offsetLabel}.${index * 2 + 1}`}
            unit="мм"
            value={cutout.offsetMm}
            onChange={(value) => onChange(group.side, index, 'offsetMm', value)}
          />
          <NumberInput
            helperText={`${group.offsetLabel}.${index * 2 + 2}: длина выреза вдоль участка.`}
            label={`${group.offsetLabel}.${index * 2 + 2}`}
            unit="мм"
            value={cutout.lengthMm}
            onChange={(value) => onChange(group.side, index, 'lengthMm', value)}
          />
          <p className="text-xs text-slate-500">
            В расчете: {formatNumber(computedCutouts[index]?.activeLengthMm ?? 0, 1)} мм
          </p>
        </div>
      ))}
    </div>
  )
}

function cloneInput(input: WallEndOpeningsInput): WallEndOpeningsInput {
  return {
    ...input,
    slab: { ...input.slab },
    forces: { ...input.forces },
    concrete: { ...input.concrete },
    reinforcement: { ...input.reinforcement },
    alternateContour: { ...input.alternateContour },
    cutouts: {
      lx1: input.cutouts.lx1.map((cutout) => ({ ...cutout })),
      lx2: input.cutouts.lx2.map((cutout) => ({ ...cutout })),
      ly: input.cutouts.ly.map((cutout) => ({ ...cutout })),
    },
  }
}

function toNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatNumber(value: number, maximumFractionDigits = 3) {
  return value.toLocaleString('ru-RU', {
    maximumFractionDigits,
  })
}
