import { Label } from '@/shared/ui/label'

type ToggleFieldProps = {
  label: string
  helperText: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function ToggleField({
  label,
  helperText,
  checked,
  onCheckedChange,
}: ToggleFieldProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50">
      <input
        checked={checked}
        className="mt-1 size-4 accent-slate-900"
        type="checkbox"
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <span className="grid gap-1">
        <Label className="cursor-pointer text-sm font-semibold text-slate-800">{label}</Label>
        <span className="text-sm leading-5 text-slate-600">{helperText}</span>
      </span>
    </label>
  )
}
