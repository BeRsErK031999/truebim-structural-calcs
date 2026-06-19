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
  const isShearReinforcementAdvanced = shearReinforcementInputMode === 'manual'
  const toggleShearReinforcementAdvanced = () => {
    setValue('shearReinforcement.inputMode', isShearReinforcementAdvanced ? 'bar-count' : 'manual', {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(runCalculation)}>
      <FormSection
        title="Расчетный случай"
        helperText="Выберите расчетную схему. VERIFIED автоматически не присваивается: неподтвержденные сценарии остаются draft/pilot и требуют инженерной проверки."
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
        title="Материал плиты"
        helperText="Класс бетона задает справочные сопротивления для расчета. Значения Rbt/Rsw раскрываются в отчете без изменения расчетных формул."
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
        title="Плита"
        helperText="Геометрия плиты задается в миллиметрах. h0 вводится напрямую, поэтому защитный слой скрыт из интерфейса и остается только внутренним параметром модели."
      >
        <NumberField
          label="h - толщина плиты"
          unit="мм"
          helperText={engineeringHelp.h}
          registration={register('slab.thicknessMm', { valueAsNumber: true })}
          error={errors.slab?.thicknessMm?.message}
        />
        <NumberField
          label="h0 - рабочая высота"
          unit="мм"
          helperText={engineeringHelp.h0}
          registration={register('slab.effectiveDepthMm', { valueAsNumber: true })}
          error={errors.slab?.effectiveDepthMm?.message}
        />
      </FormSection>

      <FormSection
        title="Поперечная арматура"
        helperText="Черновой ввод усиления продавливания. Отключенное усиление сохраняет текущую проверенную область center force-only."
      >
        <ToggleField
          checked={shearReinforcementEnabled}
          label="Учитывать поперечную арматуру"
          helperText="Включает расчет Asw, qsw, Fsw.ult и Fult для инженерного просмотра."
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
            <NumberField
              label="Диаметр стержня"
              min={1}
              step={1}
              unit="мм"
              registration={register('shearReinforcement.barDiameterMm', { valueAsNumber: true })}
              error={errors.shearReinforcement?.barDiameterMm?.message}
            />
            <NumberField
              label="Количество стержней"
              min={1}
              step={1}
              unit="шт."
              registration={register('shearReinforcement.simpleBarCount', { valueAsNumber: true })}
              error={errors.shearReinforcement?.simpleBarCount?.message}
            />
            <Button
              className="h-10 w-fit rounded-lg"
              type="button"
              variant="outline"
              onClick={toggleShearReinforcementAdvanced}
            >
              {isShearReinforcementAdvanced ? 'Скрыть расширенные параметры' : 'Показать расширенные параметры'}
            </Button>
            {isShearReinforcementAdvanced ? (
              <>
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
                  label="Asw - принятая площадь поперечной арматуры"
                  min={1}
                  step={0.001}
                  unit="мм²"
                  registration={register('shearReinforcement.manualAswMm2', { valueAsNumber: true })}
                  error={errors.shearReinforcement?.manualAswMm2?.message}
                />
                <NumberField
                  label="sw - шаг для формулы qsw"
                  min={1}
                  step={1}
                  unit="мм"
                  registration={register('shearReinforcement.manualSwMm', { valueAsNumber: true })}
                  error={errors.shearReinforcement?.manualSwMm?.message}
                />
                <NumberField
                  label="Шаг стержней"
                  min={1}
                  step={1}
                  unit="мм"
                  registration={register('shearReinforcement.barSpacingMm', { valueAsNumber: true })}
                  error={errors.shearReinforcement?.barSpacingMm?.message}
                />
                <NumberField
                  label="Количество рядов"
                  min={1}
                  step={1}
                  unit="шт."
                  registration={register('shearReinforcement.rowCount', { valueAsNumber: true })}
                  error={errors.shearReinforcement?.rowCount?.message}
                />
                <NumberField
                  label="Ветвей в ряду"
                  min={1}
                  step={1}
                  unit="шт."
                  registration={register('shearReinforcement.legsPerRow', { valueAsNumber: true })}
                  error={errors.shearReinforcement?.legsPerRow?.message}
                />
                <NumberField
                  label="Расстояние до первого ряда"
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
              </>
            ) : null}
          </>
        ) : null}
      </FormSection>

      <FormSection
        title="Колонна"
        helperText="Размеры прямоугольной колонны задают контрольный периметр. X принят меньшим размером, Y - большим размером колонны."
      >
        <NumberField
          label="Ширина по X"
          unit="мм"
          helperText="Меньший размер колонны."
          registration={register('rectColumn.widthXMm', { valueAsNumber: true })}
          error={errors.rectColumn?.widthXMm?.message}
        />
        <NumberField
          label="Высота по Y"
          unit="мм"
          helperText="Больший размер колонны."
          registration={register('rectColumn.widthYMm', { valueAsNumber: true })}
          error={errors.rectColumn?.widthYMm?.message}
        />
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

      <FormSection
        title="Нагрузки"
        helperText="Введите расчетную силу продавливания и моменты. Моменты сохраняются для pilot/draft проверки и требуют отдельной инженерной валидации."
      >
        <NumberField
          label="N"
          unit="кН"
          registration={register('forces.axialForceKn', { valueAsNumber: true })}
          error={errors.forces?.axialForceKn?.message}
        />
        <NumberField
          label="Mx - момент в плоскости оси X"
          unit="кН·м"
          helperText="В направлении меньшего размера колонны."
          registration={register('forces.momentXKnM', { valueAsNumber: true })}
          error={errors.forces?.momentXKnM?.message}
        />
        <NumberField
          label="My - момент в плоскости оси Y"
          unit="кН·м"
          helperText="В направлении большего размера колонны."
          registration={register('forces.momentYKnM', { valueAsNumber: true })}
          error={errors.forces?.momentYKnM?.message}
        />
      </FormSection>

      <FormSection
        title="Несколько контрольных контуров"
        helperText="Черновая трассировка геометрии для нескольких контрольных контуров. По умолчанию выключена, чтобы сохранить текущее проверенное поведение для центральной колонны."
      >
        <ToggleField
          checked={multipleContoursEnabled ?? false}
          label="Включить несколько контуров"
          helperText="Создает черновые смещения контуров и выбирает критический черновой контур по максимальному коэффициенту использования."
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
          Вернуть значения по умолчанию
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
