import type { UseFormRegisterReturn } from 'react-hook-form'
import type { ChangeEventHandler } from 'react'
import { HelpCircle } from 'lucide-react'

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
  value?: number | string
  onValueChange?: ChangeEventHandler<HTMLInputElement>
  readOnly?: boolean
}

export function NumberField({
  label,
  unit,
  registration,
  error,
  helperText,
  min = 0,
  step = 1,
  value,
  onValueChange,
  readOnly = false,
}: NumberFieldProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <Label className="truncate text-sm font-semibold text-slate-700">{label}</Label>
          {helperText ? (
            <span
              className="inline-flex text-slate-400"
              title={helperText}
              aria-label={helperText}
            >
              <HelpCircle className="size-3.5" />
            </span>
          ) : null}
        </div>
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
        readOnly={readOnly}
        value={value}
        onChange={onValueChange ?? registration.onChange}
      />
      {error ? <p className="text-sm leading-5 text-red-600">{error}</p> : null}
    </div>
  )
}
