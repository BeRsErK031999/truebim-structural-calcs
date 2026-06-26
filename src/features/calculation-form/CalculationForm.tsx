import { zodResolver } from '@hookform/resolvers/zod'
import { Calculator, FileUp, RotateCcw, Save } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import {
  buildPunchingShearReport,
  calculatePunchingShear,
  punchingShearInputSchema,
  type ConcreteClassName,
  type PunchingShearCaseType,
  type PunchingShearInput,
  type ShearReinforcementSteelClass,
} from '@/calculations/punching-shear'
import { defaultCalculationDraft, useCalculationStore } from '@/entities/calculation/model/store'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { CalculationHistoryPanel } from '@/widgets/calculation-history/CalculationHistoryPanel'
import { ResultPanel } from '@/widgets/results/ResultPanel'

import { FormSection } from './components/FormSection'
import { NumberField } from './components/NumberField'
import { SelectField } from './components/SelectField'
import { ToggleField } from './components/ToggleField'
import { engineeringHelp } from './engineeringUx'

const caseOptions: Array<{ value: PunchingShearCaseType; label: string; disabled?: boolean }> = [
  { value: 'center', label: 'Центральная прямоугольная колонна' },
  { value: 'edge', label: 'Крайняя колонна' },
  { value: 'corner', label: 'Угловая колонна' },
  { value: 'opening', label: 'Отверстие рядом с колонной' },
  { value: 'round', label: 'Круглая колонна' },
  { value: 'wall-end', label: 'Продавливание у конца стены' },
  { value: 'wall-corner', label: 'Продавливание в углу стены' },
]

const concreteClassOptions: ConcreteClassName[] = ['B15', 'B20', 'B25', 'B30', 'B35', 'B40']
const steelClassOptions: ShearReinforcementSteelClass[] = ['A240', 'A400', 'A500', 'B500']

export function CalculationForm() {
  const draft = useCalculationStore((state) => state.draft)
  const result = useCalculationStore((state) => state.punchingShearResult)
  const setDraft = useCalculationStore((state) => state.setDraft)
  const setPunchingShearResult = useCalculationStore((state) => state.setPunchingShearResult)
  const saveCurrentCalculation = useCalculationStore((state) => state.saveCurrentCalculation)
  const importSavedCalculation = useCalculationStore((state) => state.importSavedCalculation)
  const [importText, setImportText] = useState('')
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<PunchingShearInput>({
    resolver: zodResolver(punchingShearInputSchema),
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  })
  const {
    formState: { errors, isSubmitting, isValid },
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    trigger,
  } = form
  const caseType = useWatch({ control, name: 'caseType' })
  const momentXKnM = useWatch({ control, name: 'forces.momentXKnM' })
  const momentYKnM = useWatch({ control, name: 'forces.momentYKnM' })
  const concreteClass = useWatch({ control, name: 'concrete.className' })
  const wallCornerOrientation = useWatch({ control, name: 'wallCorner.orientation' })
  const openings = useWatch({ control, name: 'openings' })
  const roundColumnPosition = useWatch({ control, name: 'roundColumn.position' })
  const shearReinforcementEnabled = useWatch({
    control,
    name: 'shearReinforcement.enabled',
  })
  const shearReinforcementSteelClass = useWatch({
    control,
    name: 'shearReinforcement.steelClass',
  })
  const reinforcementBarDiameterMm = useWatch({
    control,
    name: 'shearReinforcement.barDiameterMm',
  })
  const reinforcementBarCount = useWatch({
    control,
    name: 'shearReinforcement.simpleBarCount',
  })
  const calculatedAswMm2 = calculateBarCountAswMm2(reinforcementBarDiameterMm, reinforcementBarCount)
  const calculatedAswCm2 =
    typeof calculatedAswMm2 === 'number' ? Number((calculatedAswMm2 / 100).toFixed(3)) : ''

  useEffect(() => {
    void trigger()
  }, [trigger])

  useEffect(() => {
    if (caseType === 'opening' && (!openings || openings.length === 0)) {
      setValue(
        'openings',
        [{ id: 'opening-1', widthXMm: 250, widthYMm: 250, centerXMm: 650, centerYMm: 0 }],
        { shouldDirty: true, shouldValidate: true },
      )
    }
  }, [caseType, openings, setValue])

  useEffect(() => {
    reset(structuredClone(draft))
    void trigger()
  }, [draft, reset, trigger])

  const runCalculation = (input: PunchingShearInput) => {
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)

    setFormError(null)
    setFormMessage(null)
    setDraft(input)
    setPunchingShearResult(result, report)
  }

  const handleReset = () => {
    const defaults = getDefaultValues()

    reset(defaults)
    runCalculation(defaults)
    void trigger()
  }

  const handleSaveCurrentCalculation = () => {
    try {
      const savedCalculation = saveCurrentCalculation()

      setFormError(null)
      setFormMessage(`Расчет сохранен: ${savedCalculation.title}`)
    } catch (error) {
      setFormMessage(null)
      setFormError(error instanceof Error ? error.message : 'Не удалось сохранить расчет')
    }
  }

  const handleImportCalculation = () => {
    try {
      const savedCalculation = importSavedCalculation(importText)

      setImportText('')
      setIsImportOpen(false)
      setFormError(null)
      setFormMessage(`Расчет импортирован: ${savedCalculation.title}`)
    } catch (error) {
      setFormMessage(null)
      setFormError(error instanceof Error ? error.message : 'Не удалось импортировать JSON')
    }
  }
  const handleBarDiameterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.valueAsNumber

    setValue('shearReinforcement.barDiameterMm', Number.isFinite(value) ? value : undefined, {
      shouldDirty: true,
      shouldValidate: true,
    })
    setValue('shearReinforcement.inputMode', 'bar-count', { shouldDirty: true, shouldValidate: true })
  }

  const handleBarCountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.valueAsNumber

    setValue('shearReinforcement.simpleBarCount', Number.isFinite(value) ? value : undefined, {
      shouldDirty: true,
      shouldValidate: true,
    })
    setValue('shearReinforcement.inputMode', 'bar-count', { shouldDirty: true, shouldValidate: true })
  }

  const handleReinforcementStepChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.valueAsNumber
    const nextValue = Number.isFinite(value) ? value : undefined

    setValue('shearReinforcement.manualSwMm', nextValue, { shouldDirty: true, shouldValidate: true })
    setValue('shearReinforcement.barSpacingMm', nextValue, { shouldDirty: true, shouldValidate: true })
    setValue('shearReinforcement.inputMode', 'bar-count', { shouldDirty: true, shouldValidate: true })
  }

  useEffect(() => {
    if (!shearReinforcementEnabled) {
      return
    }

    setValue('shearReinforcement.inputMode', 'bar-count', { shouldDirty: true, shouldValidate: true })
    if (typeof calculatedAswMm2 === 'number') {
      setValue('shearReinforcement.manualAswMm2', calculatedAswMm2, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [calculatedAswMm2, setValue, shearReinforcementEnabled])

  return (
    <form
      className="grid gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_320px] lg:overflow-hidden"
      onSubmit={handleSubmit(runCalculation)}
    >
      <div className="grid auto-rows-max gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin]">
      <FormSection
        title="1. Расчетный случай"
        helperText="Выберите схему продавливания."
      >
        <SelectField
          label="Тип случая"
          placeholder="Выберите тип расчета"
          value={caseType}
          options={caseOptions}
          error={errors.caseType?.message}
          onValueChange={(value) =>
            setValue('caseType', value as PunchingShearCaseType, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
        {caseType === 'edge' || caseType === 'corner' || caseType === 'opening' ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            Для этого случая требуется инженерная проверка исходных данных и результата.
          </p>
        ) : null}
      </FormSection>

      <FormSection
        title="2. Геометрия"
        helperText="Плита и колонна."
        contentClassName="lg:grid-cols-4"
      >
        <div className="md:col-span-2">
          <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Плита</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="h"
              unit="мм"
              helperText={engineeringHelp.h}
              registration={register('slab.thicknessMm', { valueAsNumber: true })}
              error={errors.slab?.thicknessMm?.message}
            />
            <NumberField
              label="h0"
              unit="мм"
              helperText={engineeringHelp.h0}
              registration={register('slab.effectiveDepthMm', { valueAsNumber: true })}
              error={errors.slab?.effectiveDepthMm?.message}
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Колонна</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="X"
              unit="мм"
              helperText="Размер колонны по оси X."
              registration={register('rectColumn.widthXMm', { valueAsNumber: true })}
              error={errors.rectColumn?.widthXMm?.message}
            />
            <NumberField
              label="Y"
              unit="мм"
              helperText="Размер колонны по оси Y."
              registration={register('rectColumn.widthYMm', { valueAsNumber: true })}
              error={errors.rectColumn?.widthYMm?.message}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="3. Материалы"
        helperText="Бетон и сталь поперечной арматуры."
      >
        <SelectField
          label="Класс бетона"
          placeholder="Выберите класс бетона"
          value={concreteClass}
          options={concreteClassOptions.map((value) => ({ value, label: value }))}
          error={errors.concrete?.className?.message}
          onValueChange={(value) =>
            setValue('concrete.className', value as ConcreteClassName, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
        <SelectField
          label="Класс стали"
          placeholder="Выберите класс стали"
          value={shearReinforcementSteelClass ?? 'A400'}
          options={steelClassOptions.map((value) => ({ value, label: value }))}
          error={errors.shearReinforcement?.steelClass?.message}
          onValueChange={(value) =>
            setValue('shearReinforcement.steelClass', value as ShearReinforcementSteelClass, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      </FormSection>

      <FormSection title="4. Нагрузки" helperText="Расчетная сила и моменты." contentClassName="lg:grid-cols-3">
        <NumberField
          label="N"
          unit="кН"
          helperText="Расчетная продавливающая сила."
          registration={register('forces.axialForceKn', { valueAsNumber: true })}
          error={errors.forces?.axialForceKn?.message}
        />
        <NumberField
          label="Mx"
          unit="кН·м"
          helperText="Момент в плоскости оси X."
          registration={register('forces.momentXKnM', { valueAsNumber: true })}
          error={errors.forces?.momentXKnM?.message}
        />
        <NumberField
          label="My"
          unit="кН·м"
          helperText="Момент в плоскости оси Y."
          registration={register('forces.momentYKnM', { valueAsNumber: true })}
          error={errors.forces?.momentYKnM?.message}
        />
      </FormSection>

      <FormSection
        title="5. Поперечная арматура"
        helperText="Включайте только когда задано усиление продавливания."
      >
        <ToggleField
          checked={shearReinforcementEnabled}
          label="Учитывать поперечную арматуру"
          onCheckedChange={(checked) => {
            setValue('shearReinforcement.enabled', checked, {
              shouldDirty: true,
              shouldValidate: true,
            })
            if (checked) {
              setValue('shearReinforcement.inputMode', 'bar-count', {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          }}
        />
        {shearReinforcementEnabled ? (
          <>
            <NumberField
              label="Ø"
              min={1}
              step={1}
              unit="мм"
              helperText="Диаметр одного стержня поперечной арматуры."
              registration={register('shearReinforcement.barDiameterMm', { valueAsNumber: true })}
              onValueChange={handleBarDiameterChange}
              error={errors.shearReinforcement?.barDiameterMm?.message}
            />
            <NumberField
              label="n"
              min={1}
              step={1}
              unit="шт."
              helperText="Количество стержней, попадающих в расчетную площадь Asw на одном шаге."
              registration={register('shearReinforcement.simpleBarCount', { valueAsNumber: true })}
              onValueChange={handleBarCountChange}
              error={errors.shearReinforcement?.simpleBarCount?.message}
            />
            <NumberField
              label="sw"
              min={1}
              step={1}
              unit="мм"
              helperText="Шаг поперечной арматуры."
              registration={register('shearReinforcement.manualSwMm', { valueAsNumber: true })}
              onValueChange={handleReinforcementStepChange}
              error={errors.shearReinforcement?.manualSwMm?.message}
            />
            <NumberField
              label="Asw"
              min={0}
              step={0.001}
              unit="см²"
              helperText="Расчетная площадь: n · π · Ø² / 4."
              registration={register('shearReinforcement.manualAswMm2')}
              value={calculatedAswCm2}
              readOnly
              error={errors.shearReinforcement?.manualAswMm2?.message}
            />
            <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs leading-5 text-sky-900 md:col-span-2">
              Asw считается автоматически по диаметру и количеству стержней. Обычно ставят площадь двух ветвей на шаг sw, но при другой схеме укажите фактическое количество стержней в расчетной площади.
            </p>
          </>
        ) : null}
      </FormSection>

      {caseType === 'round' ? (
        <FormSection
          title="Геометрия круглой колонны"
          helperText="Параметры круглой колонны."
        >
          <NumberField
            label="Диаметр"
            unit="мм"
            registration={register('roundColumn.diameterMm', { valueAsNumber: true })}
            error={errors.roundColumn?.diameterMm?.message}
          />
          <SelectField
            label="Положение"
            placeholder="Выберите положение"
            value={roundColumnPosition ?? 'center'}
            options={[
              { value: 'center', label: 'центр' },
              { value: 'edge', label: 'край', disabled: true },
              { value: 'corner', label: 'угол', disabled: true },
            ]}
            error={errors.roundColumn?.position?.message}
            onValueChange={(value) =>
              setValue('roundColumn.position', value as NonNullable<PunchingShearInput['roundColumn']>['position'], {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </FormSection>
      ) : null}

      {caseType === 'wall-end' ? (
        <FormSection
          title="Геометрия стены"
          helperText="Параметры конца стены."
        >
          <NumberField
            label="Длина стены"
            unit="мм"
            registration={register('wall.wallLength', { valueAsNumber: true })}
            error={errors.wall?.wallLength?.message}
          />
          <NumberField
            label="Толщина стены"
            unit="мм"
            registration={register('wall.wallThickness', { valueAsNumber: true })}
            error={errors.wall?.wallThickness?.message}
          />
        </FormSection>
      ) : null}

      {caseType === 'opening' ? (
        <FormSection
          title="Геометрия отверстия"
          helperText="Отверстие учитывается рядом с колонной."
        >
          <NumberField
            label="Ширина отверстия по X"
            min={1}
            unit="мм"
            registration={register('openings.0.widthXMm', { valueAsNumber: true })}
            error={errors.openings?.[0]?.widthXMm?.message}
          />
          <NumberField
            label="Ширина отверстия по Y"
            min={1}
            unit="мм"
            registration={register('openings.0.widthYMm', { valueAsNumber: true })}
            error={errors.openings?.[0]?.widthYMm?.message}
          />
          <NumberField
            label="Центр отверстия по X"
            unit="мм"
            registration={register('openings.0.centerXMm', { valueAsNumber: true })}
            error={errors.openings?.[0]?.centerXMm?.message}
          />
          <NumberField
            label="Центр отверстия по Y"
            unit="мм"
            registration={register('openings.0.centerYMm', { valueAsNumber: true })}
            error={errors.openings?.[0]?.centerYMm?.message}
          />
        </FormSection>
      ) : null}

      {caseType === 'wall-corner' ? (
        <FormSection
          title="Геометрия угла стены"
          helperText="Параметры угла стены."
        >
          <NumberField
            label="Длина стены по X"
            unit="мм"
            registration={register('wallCorner.wallLengthX', { valueAsNumber: true })}
            error={errors.wallCorner?.wallLengthX?.message}
          />
          <NumberField
            label="Длина стены по Y"
            unit="мм"
            registration={register('wallCorner.wallLengthY', { valueAsNumber: true })}
            error={errors.wallCorner?.wallLengthY?.message}
          />
          <NumberField
            label="Толщина стены по X"
            unit="мм"
            registration={register('wallCorner.wallThicknessX', { valueAsNumber: true })}
            error={errors.wallCorner?.wallThicknessX?.message}
          />
          <NumberField
            label="Толщина стены по Y"
            unit="мм"
            registration={register('wallCorner.wallThicknessY', { valueAsNumber: true })}
            error={errors.wallCorner?.wallThicknessY?.message}
          />
          <SelectField
            label="Ориентация угла"
            placeholder="Выберите ориентацию"
            value={wallCornerOrientation ?? 'top-left'}
            options={[
              { value: 'top-left', label: 'верхний левый' },
              { value: 'top-right', label: 'верхний правый' },
              { value: 'bottom-left', label: 'нижний левый' },
              { value: 'bottom-right', label: 'нижний правый' },
            ]}
            error={errors.wallCorner?.orientation?.message}
            onValueChange={(value) =>
              setValue('wallCorner.orientation', value as NonNullable<PunchingShearInput['wallCorner']>['orientation'], {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </FormSection>
      ) : null}

      <CalculationHistoryPanel />

      </div>
      <aside className="grid content-start gap-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin]">
      <CasePreview caseType={caseType} momentXKnM={momentXKnM} momentYKnM={momentYKnM} />
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="col-span-2 h-10 rounded-lg"
          disabled={!isValid || isSubmitting}
          type="submit"
        >
          <Calculator className="size-4" />
          Рассчитать
        </Button>
        <Button
          className="h-9 rounded-lg"
          type="button"
          variant="outline"
          onClick={handleReset}
        >
          <RotateCcw className="size-4" />
          Сброс
        </Button>
        <Button
          className="h-9 rounded-lg"
          disabled={!result}
          type="button"
          variant="outline"
          onClick={handleSaveCurrentCalculation}
        >
          <Save className="size-4" />
          Сохранить расчет
        </Button>
        <Button
          className="col-span-2 h-9 rounded-lg"
          type="button"
          variant="outline"
          onClick={() => {
            setIsImportOpen((value) => !value)
            setFormError(null)
            setFormMessage(null)
          }}
        >
          <FileUp className="size-4" />
          Импорт JSON
        </Button>
      </div>

      <ResultPanel variant="inline" showPreview={false} showCopy={false} />

      {isImportOpen ? (
        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardContent className="grid gap-3 p-4">
            <textarea
              className="min-h-36 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus-visible:border-slate-500 focus-visible:ring-3 focus-visible:ring-slate-200"
              placeholder="Вставьте JSON сохраненного расчета"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
            />
            <div className="flex flex-wrap gap-3">
              <Button
                className="h-10 rounded-lg"
                disabled={importText.trim().length === 0}
                type="button"
                onClick={handleImportCalculation}
              >
                Импортировать
              </Button>
              <Button
                className="h-10 rounded-lg"
                type="button"
                variant="outline"
                onClick={() => setIsImportOpen(false)}
              >
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {formError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </p>
      ) : null}
      {formMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {formMessage}
        </p>
      ) : null}
      </aside>
    </form>
  )
}

function getDefaultValues(): PunchingShearInput {
  return structuredClone(defaultCalculationDraft)
}

function calculateBarCountAswMm2(diameterMm?: number, barCount?: number) {
  if (
    typeof diameterMm !== 'number' ||
    typeof barCount !== 'number' ||
    !Number.isFinite(diameterMm) ||
    !Number.isFinite(barCount)
  ) {
    return undefined
  }

  return barCount * Math.PI * diameterMm ** 2 / 4
}

function CasePreview({
  caseType,
  momentXKnM,
  momentYKnM,
}: {
  caseType: PunchingShearCaseType
  momentXKnM?: number
  momentYKnM?: number
}) {
  const titleByCase: Record<PunchingShearCaseType, string> = {
    center: 'Центральная колонна',
    edge: 'Колонна у края',
    corner: 'Колонна в углу',
    opening: 'Колонна с отверстием',
    round: 'Круглая колонна',
    'wall-end': 'Конец стены',
    'wall-corner': 'Угол стены',
  }
  const hasMx = typeof momentXKnM === 'number' && momentXKnM > 0
  const hasMy = typeof momentYKnM === 'number' && momentYKnM > 0

  return (
    <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <CardContent className="grid gap-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{titleByCase[caseType]}</p>
          <p className="text-xs font-medium text-slate-500">схема</p>
        </div>
        <svg
          className="h-auto w-full rounded border border-slate-200 bg-slate-50"
          role="img"
          viewBox="0 0 260 170"
          aria-label={`Схема: ${titleByCase[caseType]}`}
        >
          <defs>
            <marker id="preview-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>
          <rect x="20" y="18" width="220" height="128" fill="#fff" stroke="#cbd5e1" strokeWidth="2" />
          {caseType === 'edge' || caseType === 'corner' ? (
            <rect x="20" y="18" width={caseType === 'corner' ? 92 : 32} height={caseType === 'corner' ? 52 : 128} fill="#e2e8f0" />
          ) : null}
          {caseType === 'wall-end' ? (
            <rect x="68" y="58" width="112" height="26" fill="#1e293b" rx="2" />
          ) : caseType === 'wall-corner' ? (
            <path d="M 70 48 H 178 V 74 H 96 V 122 H 70 Z" fill="#1e293b" />
          ) : caseType === 'round' ? (
            <circle cx={caseType === 'round' ? 112 : 104} cy="82" r="23" fill="#1e293b" />
          ) : (
            <rect x="88" y="58" width="48" height="48" fill="#1e293b" rx="2" />
          )}
          {caseType === 'opening' ? (
            <rect x="166" y="64" width="34" height="34" fill="#fff" stroke="#dc2626" strokeWidth="3" />
          ) : null}
          <rect x="70" y="40" width="84" height="84" fill="none" stroke="#059669" strokeWidth="3" strokeDasharray="7 5" />
          <g color={hasMx ? '#7c3aed' : '#94a3b8'} stroke="currentColor" fill="currentColor">
            <path d="M 58 138 C 88 154, 136 154, 166 138" fill="none" strokeWidth="3" markerEnd="url(#preview-arrow)" />
            <text x="112" y="160" textAnchor="middle" fontSize="13" fontWeight="700">Mx</text>
          </g>
          <g color={hasMy ? '#7c3aed' : '#94a3b8'} stroke="currentColor" fill="currentColor">
            <path d="M 204 44 C 224 70, 224 104, 204 130" fill="none" strokeWidth="3" markerEnd="url(#preview-arrow)" />
            <text x="224" y="90" textAnchor="middle" fontSize="13" fontWeight="700">My</text>
          </g>
          <text x="84" y="36" fontSize="11" fill="#047857">контур</text>
          {caseType === 'edge' ? <text x="26" y="92" fontSize="11" fill="#475569" transform="rotate(-90 26 92)">край</text> : null}
          {caseType === 'corner' ? <text x="28" y="34" fontSize="11" fill="#475569">угол</text> : null}
        </svg>
      </CardContent>
    </Card>
  )
}
