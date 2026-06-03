import { zodResolver } from '@hookform/resolvers/zod'
import { Calculator, FileUp, RotateCcw, Save } from 'lucide-react'
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

import { FormSection } from './components/FormSection'
import { NumberField } from './components/NumberField'
import { SelectField } from './components/SelectField'
import { ToggleField } from './components/ToggleField'

const caseOptions: Array<{ value: PunchingShearCaseType; label: string; disabled?: boolean }> = [
  { value: 'center', label: 'Центральная прямоугольная колонна' },
  { value: 'edge', label: 'Крайняя колонна - скоро', disabled: true },
  { value: 'corner', label: 'Угловая колонна - скоро', disabled: true },
  { value: 'opening', label: 'Отверстие рядом с колонной - скоро', disabled: true },
  { value: 'round', label: 'Круглая колонна - скоро', disabled: true },
  { value: 'wall-end', label: 'Wall end punching - draft geometry' },
  { value: 'wall-corner', label: 'Wall corner punching - draft geometry' },
]

const concreteClassOptions: ConcreteClassName[] = ['B15', 'B20', 'B25', 'B30', 'B35', 'B40']
const steelClassOptions: ShearReinforcementSteelClass[] = ['A240', 'A400', 'A500', 'B500']
const reinforcementLayoutOptions: Array<{
  value: ShearReinforcementLayoutType
  label: string
}> = [
  { value: 'closed-stirrups', label: 'closed stirrups' },
  { value: 'studs', label: 'studs' },
  { value: 'links', label: 'links' },
  { value: 'custom', label: 'custom' },
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
    register,
    reset,
    setValue,
    trigger,
  } = form
  const caseType = useWatch({ control, name: 'caseType' })
  const concreteClass = useWatch({ control, name: 'concrete.className' })
  const wallCornerOrientation = useWatch({ control, name: 'wallCorner.orientation' })
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

  useEffect(() => {
    void trigger()
  }, [trigger])

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

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(runCalculation)}>
      <FormSection
        title="Расчетный случай"
        helperText="Сейчас расчетный движок поддерживает только центральную прямоугольную колонну без отверстий и краев плиты."
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
      </FormSection>

      <FormSection
        title="Нагрузки"
        helperText="Введите расчетную продавливающую силу и моменты. Моменты сохраняются для пилотной проверки и требуют отдельной инженерной валидации."
      >
        <NumberField
          label="N"
          unit="кН"
          registration={register('forces.axialForceKn', { valueAsNumber: true })}
          error={errors.forces?.axialForceKn?.message}
        />
        <NumberField
          label="Mx"
          unit="кН·м"
          registration={register('forces.momentXKnM', { valueAsNumber: true })}
          error={errors.forces?.momentXKnM?.message}
        />
        <NumberField
          label="My"
          unit="кН·м"
          registration={register('forces.momentYKnM', { valueAsNumber: true })}
          error={errors.forces?.momentYKnM?.message}
        />
      </FormSection>

      <FormSection
        title="Геометрия плиты"
        helperText="Геометрия плиты задается в миллиметрах. Пустые и отрицательные значения блокируют запуск расчета."
      >
        <NumberField
          label="Толщина плиты"
          unit="мм"
          registration={register('slab.thicknessMm', { valueAsNumber: true })}
          error={errors.slab?.thicknessMm?.message}
        />
        <NumberField
          label="Рабочая высота h0"
          unit="мм"
          registration={register('slab.effectiveDepthMm', { valueAsNumber: true })}
          error={errors.slab?.effectiveDepthMm?.message}
        />
        <NumberField
          label="Защитный слой"
          unit="мм"
          registration={register('slab.concreteCoverMm', { valueAsNumber: true })}
          error={errors.slab?.concreteCoverMm?.message}
        />
      </FormSection>

      <FormSection
        title="Геометрия колонны"
        helperText="Размеры прямоугольной колонны задают контрольный периметр и схему после расчета."
      >
        <NumberField
          label="Ширина по X"
          unit="мм"
          registration={register('rectColumn.widthXMm', { valueAsNumber: true })}
          error={errors.rectColumn?.widthXMm?.message}
        />
        <NumberField
          label="Высота по Y"
          unit="мм"
          registration={register('rectColumn.widthYMm', { valueAsNumber: true })}
          error={errors.rectColumn?.widthYMm?.message}
        />
      </FormSection>

      {caseType === 'wall-end' ? (
        <FormSection
          title="Wall Geometry"
          helperText="Draft-only wall-end geometry input. No verified SP63 wall punching formulas are claimed."
        >
          <NumberField
            label="Wall length"
            unit="mm"
            registration={register('wall.wallLength', { valueAsNumber: true })}
            error={errors.wall?.wallLength?.message}
          />
          <NumberField
            label="Wall thickness"
            unit="mm"
            registration={register('wall.wallThickness', { valueAsNumber: true })}
            error={errors.wall?.wallThickness?.message}
          />
        </FormSection>
      ) : null}

      {caseType === 'wall-corner' ? (
        <FormSection
          title="Wall Corner Geometry"
          helperText="Draft-only wall-corner geometry input. No verified SP63 wall punching formulas are claimed."
        >
          <NumberField
            label="Wall length X"
            unit="mm"
            registration={register('wallCorner.wallLengthX', { valueAsNumber: true })}
            error={errors.wallCorner?.wallLengthX?.message}
          />
          <NumberField
            label="Wall length Y"
            unit="mm"
            registration={register('wallCorner.wallLengthY', { valueAsNumber: true })}
            error={errors.wallCorner?.wallLengthY?.message}
          />
          <NumberField
            label="Wall thickness X"
            unit="mm"
            registration={register('wallCorner.wallThicknessX', { valueAsNumber: true })}
            error={errors.wallCorner?.wallThicknessX?.message}
          />
          <NumberField
            label="Wall thickness Y"
            unit="mm"
            registration={register('wallCorner.wallThicknessY', { valueAsNumber: true })}
            error={errors.wallCorner?.wallThicknessY?.message}
          />
          <SelectField
            label="Corner orientation"
            placeholder="Select orientation"
            value={wallCornerOrientation ?? 'top-left'}
            options={[
              { value: 'top-left', label: 'top-left' },
              { value: 'top-right', label: 'top-right' },
              { value: 'bottom-left', label: 'bottom-left' },
              { value: 'bottom-right', label: 'bottom-right' },
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

      <FormSection
        title="Материалы"
        helperText="Класс бетона берется из текущей таблицы черновых сопротивлений без изменения расчетных коэффициентов."
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
      </FormSection>

      <FormSection
        title="Multiple Control Perimeters"
        helperText="Draft-only geometry trace for several control contours. Disabled by default to preserve the current verified center behavior."
      >
        <ToggleField
          checked={multipleContoursEnabled ?? false}
          label="Enable multiple contours"
          helperText="Generates draft contour offsets and selects a draftCriticalContour by maximum draft utilization."
          onCheckedChange={(checked) =>
            setValue('multipleContours.enabled', checked, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
        <NumberField
          label="Number of contours"
          min={1}
          step={1}
          unit="count"
          registration={register('multipleContours.count', { valueAsNumber: true })}
          error={errors.multipleContours?.count?.message}
        />
        <SelectField
          label="Offset step"
          placeholder="Select offset step"
          value={multipleContoursOffsetStep ?? 'h0/2'}
          options={[
            { value: 'h0/2', label: 'h0/2' },
            { value: 'h0', label: 'h0' },
            { value: 'custom', label: 'custom mm' },
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
            label="Custom offset step"
            min={1}
            step={1}
            unit="mm"
            registration={register('multipleContours.customOffsetStepMm', { valueAsNumber: true })}
            error={errors.multipleContours?.customOffsetStepMm?.message}
          />
        ) : null}
      </FormSection>

      <FormSection
        title="Shear Reinforcement"
        helperText="Draft-only punching shear reinforcement input. Contribution, steel data, and layout assumptions require engineer review."
      >
        <ToggleField
          checked={shearReinforcementEnabled}
          label="Enable shear reinforcement"
          helperText="Disabled preserves the current center force-only verified behavior."
          onCheckedChange={(checked) =>
            setValue('shearReinforcement.enabled', checked, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
        {shearReinforcementEnabled ? (
          <>
            <SelectField
              label="Steel class"
              placeholder="Select steel class"
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
            <SelectField
              label="Layout type"
              placeholder="Select layout type"
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
              label="Bar diameter"
              min={1}
              step={1}
              unit="mm"
              registration={register('shearReinforcement.barDiameterMm', { valueAsNumber: true })}
              error={errors.shearReinforcement?.barDiameterMm?.message}
            />
            <NumberField
              label="Bar spacing"
              min={1}
              step={1}
              unit="mm"
              registration={register('shearReinforcement.barSpacingMm', { valueAsNumber: true })}
              error={errors.shearReinforcement?.barSpacingMm?.message}
            />
            <NumberField
              label="Row count"
              min={1}
              step={1}
              unit="rows"
              registration={register('shearReinforcement.rowCount', { valueAsNumber: true })}
              error={errors.shearReinforcement?.rowCount?.message}
            />
            <NumberField
              label="Legs per row"
              min={1}
              step={1}
              unit="legs"
              registration={register('shearReinforcement.legsPerRow', { valueAsNumber: true })}
              error={errors.shearReinforcement?.legsPerRow?.message}
            />
            <NumberField
              label="First row distance"
              min={1}
              step={1}
              unit="mm"
              registration={register('shearReinforcement.firstRowDistanceMm', { valueAsNumber: true })}
              error={errors.shearReinforcement?.firstRowDistanceMm?.message}
            />
            <NumberField
              label="Row spacing"
              min={1}
              step={1}
              unit="mm"
              registration={register('shearReinforcement.rowSpacingMm', { valueAsNumber: true })}
              error={errors.shearReinforcement?.rowSpacingMm?.message}
            />
          </>
        ) : null}
      </FormSection>

      <div className="flex flex-wrap gap-3">
        <Button
          className="h-11 rounded-lg"
          disabled={!isValid || isSubmitting}
          size="lg"
          type="submit"
        >
          <Calculator className="size-4" />
          Рассчитать
        </Button>
        <Button
          className="h-11 rounded-lg"
          size="lg"
          type="button"
          variant="outline"
          onClick={handleReset}
        >
          <RotateCcw className="size-4" />
          Сбросить к значениям по умолчанию
        </Button>
        <Button
          className="h-11 rounded-lg"
          disabled={!result}
          size="lg"
          type="button"
          variant="outline"
          onClick={handleSaveCurrentCalculation}
        >
          <Save className="size-4" />
          Сохранить расчет
        </Button>
        <Button
          className="h-11 rounded-lg"
          size="lg"
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
    </form>
  )
}

function getDefaultValues(): PunchingShearInput {
  return structuredClone(defaultCalculationDraft)
}
