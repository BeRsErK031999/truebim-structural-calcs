export function formatNullable(value: number | null | undefined, digits = 3) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? 'n/a'
    : value.toFixed(digits)
}

export function formatNumber(value: number, digits = 3) {
  return Number.isFinite(value) ? value.toFixed(digits) : 'n/a'
}

export function formatList(values: string[]) {
  return values.length > 0 ? values.join(', ') : 'none'
}

export function formatEnabled(value: boolean) {
  return value ? 'enabled' : 'disabled'
}
