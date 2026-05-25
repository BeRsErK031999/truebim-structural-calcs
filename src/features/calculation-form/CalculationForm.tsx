import { zodResolver } from '@hookform/resolvers/zod'
import { Calculator, RotateCcw } from 'lucide-react'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import {
  buildPunchingShearReport,
  calculatePunchingShear,
  punchingShearInputSchema,
  type ConcreteClassName,
  type PunchingShearCaseType,
  type PunchingShearInput,
} from '@/calculations/punching-shear'
import { defaultCalculationDraft, useCalculationStore } from '@/entities/calculation/model/store'
import { Button } from '@/shared/ui/button'

import { FormSection } from './components/FormSection'
import { NumberField } from './components/NumberField'
import { SelectField } from './components/SelectField'
import { ToggleField } from './components/ToggleField'

const caseOptions: Array<{ value: PunchingShearCaseType; label: string; disabled?: boolean }> = [
  { value: 'center', label: 'Center rectangular column' },
  { value: 'edge', label: 'Edge column - coming soon', disabled: true },
  { value: 'corner', label: 'Corner column - coming soon', disabled: true },
  { value: 'opening', label: 'Opening near column - coming soon', disabled: true },
  { value: 'round', label: 'Round column - coming soon', disabled: true },
]

const concreteClassOptions: ConcreteClassName[] = ['B15', 'B20', 'B25', 'B30', 'B35', 'B40']

export function CalculationForm() {
  const setDraft = useCalculationStore((state) => state.setDraft)
  const setPunchingShearResult = useCalculationStore((state) => state.setPunchingShearResult)
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
  const shearReinforcementEnabled = useWatch({
    control,
    name: 'shearReinforcement.enabled',
  })

  useEffect(() => {
    void trigger()
  }, [trigger])

  const runCalculation = (input: PunchingShearInput) => {
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)

    setDraft(input)
    setPunchingShearResult(result, report)
  }

  const handleReset = () => {
    const defaults = getDefaultValues()

    reset(defaults)
    runCalculation(defaults)
    void trigger()
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(runCalculation)}>
      <FormSection
        title="Calculation case"
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
        title="Loads"
        helperText="Введите расчетную продавливающую силу и моменты. В текущем draft-чеке моменты сохраняются, но не участвуют в формулах."
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
        title="Slab geometry"
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
        title="Column geometry"
        helperText="Размеры прямоугольной колонны управляют контрольным периметром и SVG preview после ручного расчета."
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

      <FormSection
        title="Materials"
        helperText="Класс бетона берется из существующей таблицы draft-сопротивлений без изменения расчетных коэффициентов."
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
        title="Shear reinforcement"
        helperText="Переключатель сохраняет состояние в input. Расчет вклада поперечной арматуры пока возвращает not_implemented."
      >
        <ToggleField
          checked={shearReinforcementEnabled}
          label="Учитывать поперечную арматуру"
          helperText="Для текущего draft-чека оставьте выключенным, чтобы получить draft_ok или draft_failed."
          onCheckedChange={(checked) =>
            setValue('shearReinforcement.enabled', checked, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      </FormSection>

      <div className="flex flex-wrap gap-3">
        <Button
          className="h-11 rounded-lg"
          disabled={!isValid || isSubmitting}
          size="lg"
          type="submit"
        >
          <Calculator className="size-4" />
          Рассчитать draft
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
      </div>
    </form>
  )
}

function getDefaultValues(): PunchingShearInput {
  return structuredClone(defaultCalculationDraft)
}
