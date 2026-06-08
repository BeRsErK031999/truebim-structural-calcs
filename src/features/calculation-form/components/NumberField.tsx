import type { UseFormRegisterReturn } from 'react-hook-form'

import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

type NumberFieldProps = {
  label: string
  unit: string
  registration: UseFormRegisterReturn
  error?: string
  helperText?: string
  min?: number
  step?: number
}

export function NumberField({
  label,
  unit,
  registration,
  error,
  helperText,
  min = 0,
  step = 1,
}: NumberFieldProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-semibold text-slate-700">{label}</Label>
        <span className="text-xs font-medium text-slate-500">{unit}</span>
      </div>
      <Input
        aria-invalid={Boolean(error)}
        className="h-10 text-base md:text-sm"
        inputMode="decimal"
        min={min}
        step={step}
        type="number"
        {...registration}
      />
      {helperText ? <p className="text-xs leading-5 text-slate-500">{helperText}</p> : null}
      {error ? <p className="text-sm leading-5 text-red-600">{error}</p> : null}
    </div>
  )
}
