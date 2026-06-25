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
  type ShearReinforcementLayoutType,
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
  { value: 'edge', label: 'Крайняя колонна - черновая геометрия' },
  { value: 'corner', label: 'Угловая колонна - черновая геометрия' },
  { value: 'opening', label: 'Отверстие рядом с колонной - черновая геометрия' },
  { value: 'round', label: 'Круглая колонна - черновой расчет только для центра' },
  { value: 'wall-end', label: 'Продавливание у конца стены - черновая геометрия' },
  { value: 'wall-corner', label: 'Продавливание в углу стены - черновая геометрия' },
]

const concreteClassOptions: ConcreteClassName[] = ['B15', 'B20', 'B25', 'B30', 'B35', 'B40']
const steelClassOptions: ShearReinforcementSteelClass[] = ['A240', 'A400', 'A500', 'B500']
const reinforcementLayoutOptions: Array<{
  value: ShearReinforcementLayoutType
  label: string
}> = [
  { value: 'closed-stirrups', label: 'замкнутые хомуты' },
  { value: 'studs', label: 'шпильки' },
  { value: 'links', label: 'связи' },
  { value: 'custom', label: 'своя схема' },
]

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
    getValues,
    register,
    reset,
    setValue,
    trigger,
  } = form
  const caseType = useWatch({ control, name: 'caseType' })
  const concreteClass = useWatch({ control, name: 'concrete.className' })
  const wallCornerOrientation = useWatch({ control, name: 'wallCorner.orientation' })
  const openings = useWatch({ control, name: 'openings' })
  const roundColumnPosition = useWatch({ control, name: 'roundColumn.position' })
  const multipleContoursEnabled = useWatch({ control, name: 'multipleContours.enabled' })
  const multipleContoursOffsetStep = useWatch({ control, name: 'multipleContours.offsetStep' })
  const shearReinforcementEnabled = useWatch({
    control,
    name: 'shearReinforcement.enabled',
  })
  const shearReinforcementSteelClass = useWatch({
    control,
    name: 'shearReinforcement.steelClass',
  })
  const shearReinforcementLayoutType = useWatch({
    control,
    name: 'shearReinforcement.layoutType',
  })
  const shearReinforcementInputMode = useWatch({
    control,
    name: 'shearReinforcement.inputMode',
  })
  const manualAswMm2 = useWatch({
    control,
    name: 'shearReinforcement.manualAswMm2',
  })

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
  const handleManualAswCm2Change = (event: ChangeEvent<HTMLInputElement>) => {
    const nextCm2 = event.currentTarget.valueAsNumber

    setValue('shearReinforcement.manualAswMm2', Number.isFinite(nextCm2) ? nextCm2 * 100 : undefined, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  useEffect(() => {
    if (shearReinforcementEnabled && shearReinforcementInputMode !== 'manual') {
      const reinforcement = getValues('shearReinforcement')
      const migratedAsw =
        typeof reinforcement.manualAswMm2 === 'number'
          ? reinforcement.manualAswMm2
          : typeof reinforcement.simpleBarCount === 'number' &&
              typeof reinforcement.barDiameterMm === 'number'
            ? reinforcement.simpleBarCount * Math.PI * reinforcement.barDiameterMm ** 2 / 4
            : undefined
      const migratedSw =
        typeof reinforcement.manualSwMm === 'number'
          ? reinforcement.manualSwMm
          : reinforcement.barSpacingMm

      if (typeof migratedAsw === 'number') {
        setValue('shearReinforcement.manualAswMm2', migratedAsw, {
          shouldDirty: true,
          shouldValidate: true,
        })
      }

      if (typeof migratedSw === 'number') {
        setValue('shearReinforcement.manualSwMm', migratedSw, {
          shouldDirty: true,
          shouldValidate: true,
        })
      }

      setValue('shearReinforcement.inputMode', 'manual', {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [getValues, setValue, shearReinforcementEnabled, shearReinforcementInputMode])

  return (
    <form
      className="grid gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_320px] lg:overflow-hidden"
      onSubmit={handleSubmit(runCalculation)}
    >
      <div className="grid auto-rows-max gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin]">
      <FormSection
        title="1. Расчетный случай"
        helperText="Выберите схему проверки. Draft-сценарии остаются draft."
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
            ТОЛЬКО ЧЕРНОВАЯ ГЕОМЕТРИЯ. НЕ ДЛЯ ПРОЕКТНОГО ПРИМЕНЕНИЯ. Требуется инженерная проверка и доверенные доказательства.
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
          onCheckedChange={(checked) =>
            setValue('shearReinforcement.enabled', checked, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
        {shearReinforcementEnabled ? (
          <>
            <NumberField
              label="Asw"
              min={0.01}
              step={0.001}
              unit="см²"
              helperText="Принятая расчетная площадь поперечной арматуры в см²."
              registration={register('shearReinforcement.manualAswMm2')}
              value={typeof manualAswMm2 === 'number' ? Number((manualAswMm2 / 100).toFixed(3)) : ''}
              onValueChange={handleManualAswCm2Change}
              error={errors.shearReinforcement?.manualAswMm2?.message}
            />
            <NumberField
              label="sw"
              min={1}
              step={1}
              unit="мм"
              helperText="Расчетный шаг поперечной арматуры."
              registration={register('shearReinforcement.manualSwMm', { valueAsNumber: true })}
              error={errors.shearReinforcement?.manualSwMm?.message}
            />
            <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs leading-5 text-sky-900 md:col-span-2">
              Asw задается в см², sw - в мм. Автоматический подбор рабочих стержней пока не выполняется.
            </p>
            <details className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:col-span-2">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                Нерасчетная схема армирования
              </summary>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                Эти параметры формируют только маркеры на схеме; в расчетную несущую способность попадают только Asw и sw выше.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Схема армирования"
                  placeholder="Выберите схему"
                  value={shearReinforcementLayoutType ?? 'closed-stirrups'}
                  options={reinforcementLayoutOptions}
                  error={errors.shearReinforcement?.layoutType?.message}
                  onValueChange={(value) =>
                    setValue('shearReinforcement.layoutType', value as ShearReinforcementLayoutType, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
                <NumberField
                  label="Диаметр"
                  min={1}
                  step={1}
                  unit="мм"
                  registration={register('shearReinforcement.barDiameterMm', { valueAsNumber: true })}
                  error={errors.shearReinforcement?.barDiameterMm?.message}
                />
                <NumberField
                  label="Маркеры"
                  min={1}
                  step={1}
                  unit="шт."
                  registration={register('shearReinforcement.simpleBarCount', { valueAsNumber: true })}
                  error={errors.shearReinforcement?.simpleBarCount?.message}
                />
                <NumberField
                  label="Шаг маркеров"
                  min={1}
                  step={1}
                  unit="мм"
                  registration={register('shearReinforcement.barSpacingMm', { valueAsNumber: true })}
                  error={errors.shearReinforcement?.barSpacingMm?.message}
                />
                <NumberField
                  label="Ряды"
                  min={1}
                  step={1}
                  unit="шт."
                  registration={register('shearReinforcement.rowCount', { valueAsNumber: true })}
                  error={errors.shearReinforcement?.rowCount?.message}
                />
                <NumberField
                  label="Ветвей"
                  min={1}
                  step={1}
                  unit="шт."
                  registration={register('shearReinforcement.legsPerRow', { valueAsNumber: true })}
                  error={errors.shearReinforcement?.legsPerRow?.message}
                />
                <NumberField
                  label="Первый ряд"
                  min={1}
                  step={1}
                  unit="мм"
                  registration={register('shearReinforcement.firstRowDistanceMm', { valueAsNumber: true })}
                  error={errors.shearReinforcement?.firstRowDistanceMm?.message}
                />
                <NumberField
                  label="Шаг рядов"
                  min={1}
                  step={1}
                  unit="мм"
                  registration={register('shearReinforcement.rowSpacingMm', { valueAsNumber: true })}
                  error={errors.shearReinforcement?.rowSpacingMm?.message}
                />
              </div>
            </details>
          </>
        ) : null}
      </FormSection>

      {caseType === 'round' ? (
        <FormSection
          title="Геометрия круглой колонны"
          helperText="Черновая геометрия круглой колонны. Положение по центру поддерживается только для подготовки пилотной геометрии и отчета."
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
          helperText="Черновой ввод геометрии конца стены. Проверенные формулы продавливания стен по СП 63 не заявляются."
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
          helperText="Черновая геометрия отверстия. Отверстие используется для вычитания по касательным и требует проверки/доказательств."
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
          helperText="Черновой ввод геометрии угла стены. Проверенные формулы продавливания стен по СП 63 не заявляются."
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

      <details className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer p-4 text-base font-semibold text-slate-950">
          6. Дополнительные настройки
        </summary>
        <div className="grid gap-4 px-4 pb-4 md:grid-cols-2">
        <ToggleField
          checked={multipleContoursEnabled ?? false}
          label="Включить несколько контуров"
          helperText="Draft-трассировка нескольких контрольных контуров."
          onCheckedChange={(checked) =>
            setValue('multipleContours.enabled', checked, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
        <NumberField
          label="Количество контуров"
          min={1}
          step={1}
          unit="шт."
          registration={register('multipleContours.count', { valueAsNumber: true })}
          error={errors.multipleContours?.count?.message}
        />
        <SelectField
          label="Шаг смещения"
          placeholder="Выберите шаг смещения"
          value={multipleContoursOffsetStep ?? 'h0/2'}
          options={[
            { value: 'h0/2', label: 'h0/2' },
            { value: 'h0', label: 'h0' },
            { value: 'custom', label: 'свой шаг, мм' },
          ]}
          error={errors.multipleContours?.offsetStep?.message}
          onValueChange={(value) =>
            setValue('multipleContours.offsetStep', value as NonNullable<PunchingShearInput['multipleContours']>['offsetStep'], {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
        {multipleContoursOffsetStep === 'custom' ? (
          <NumberField
            label="Свой шаг смещения"
            min={1}
            step={1}
            unit="мм"
            registration={register('multipleContours.customOffsetStepMm', { valueAsNumber: true })}
            error={errors.multipleContours?.customOffsetStepMm?.message}
          />
        ) : null}
        </div>
      </details>

      <CalculationHistoryPanel />

      </div>
      <aside className="grid content-start gap-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin]">
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
