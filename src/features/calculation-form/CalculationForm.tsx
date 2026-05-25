import { zodResolver } from '@hookform/resolvers/zod'
import { Calculator, Save } from 'lucide-react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'

import {
  buildPunchingShearReport,
  calculatePunchingShear,
  defaultPunchingShearInput,
  type ConcreteClassName,
  type PunchingShearInput,
} from '@/calculations/punching-shear'
import {
  calculationInputSchema,
  type CalculationFormInput,
  type CalculationInput,
} from '@/entities/calculation/model/schema'
import { defaultCalculationDraft, useCalculationStore } from '@/entities/calculation/model/store'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

export function CalculationForm() {
  const setDraft = useCalculationStore((state) => state.setDraft)
  const setPunchingShearResult = useCalculationStore((state) => state.setPunchingShearResult)
  const form = useForm<CalculationFormInput, unknown, CalculationInput>({
    resolver: zodResolver(calculationInputSchema),
    defaultValues: defaultCalculationDraft,
    mode: 'onChange',
  })

  const handleSubmit = form.handleSubmit((values) => {
    setDraft(values)

    const input = mapDraftToPunchingShearInput(values)
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)

    setPunchingShearResult(result, report)
  })

  return (
    <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Исходные данные</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Элемент" error={form.formState.errors.elementName?.message}>
              <Input className="h-12 text-base" {...form.register('elementName')} />
            </Field>

            <Field label="Класс бетона">
              <Select
                defaultValue={defaultCalculationDraft.concreteClass}
                onValueChange={(value: string) => form.setValue('concreteClass', value)}
              >
                <SelectTrigger className="h-12 w-full text-base">
                  <SelectValue placeholder="Выберите класс" />
                </SelectTrigger>
                <SelectContent>
                  {['B20', 'B25', 'B30', 'B35', 'B40'].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Расчетная нагрузка, кН">
              <Input className="h-12 text-base" type="number" {...form.register('load')} />
            </Field>

            <Field label="Толщина плиты, мм">
              <Input className="h-12 text-base" type="number" {...form.register('thickness')} />
            </Field>

            <Field label="Армирование, %">
              <Input
                className="h-12 text-base"
                step="0.1"
                type="number"
                {...form.register('reinforcementRatio')}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" type="submit" className="h-11 rounded-lg">
              <Calculator className="size-4" />
              Запустить stub
            </Button>
            <Button size="lg" type="button" variant="outline" className="h-11 rounded-lg">
              <Save className="size-4" />
              Сохранить шаблон
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function mapDraftToPunchingShearInput(values: CalculationInput): PunchingShearInput {
  const effectiveDepthMm = Math.max(values.thickness - 30, 1)

  return {
    ...defaultPunchingShearInput,
    forces: {
      ...defaultPunchingShearInput.forces,
      axialForceKn: values.load,
    },
    slab: {
      thicknessMm: values.thickness,
      effectiveDepthMm,
    },
    concrete: {
      className: normalizeConcreteClass(values.concreteClass),
    },
    rectColumn: {
      widthXMm: 400,
      widthYMm: 400,
    },
  }
}

function normalizeConcreteClass(value: string): ConcreteClassName {
  const knownClasses: ConcreteClassName[] = ['B15', 'B20', 'B25', 'B30', 'B35', 'B40']

  return knownClasses.includes(value as ConcreteClassName) ? (value as ConcreteClassName) : 'B25'
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {children}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
