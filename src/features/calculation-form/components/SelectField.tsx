import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type SelectFieldProps = {
  label: string
  value: string
  placeholder: string
  options: SelectOption[]
  error?: string
  onValueChange: (value: string) => void
}

export function SelectField({
  label,
  value,
  placeholder,
  options,
  error,
  onValueChange,
}: SelectFieldProps) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-invalid={Boolean(error)} className="h-10 w-full text-base md:text-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-sm leading-5 text-red-600">{error}</p> : null}
    </div>
  )
}
