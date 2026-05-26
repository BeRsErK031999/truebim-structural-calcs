import type { PunchingShearResult } from '@/calculations/punching-shear'

export function formatReportNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3)
}

export function formatValueWithUnit(
  value: number | null | undefined,
  unit: string,
  decimals?: number,
) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'not evaluated'
  }

  const formattedValue = decimals === undefined ? formatReportNumber(value) : value.toFixed(decimals)

  return `${formattedValue} ${unit}`
}

export function formatUtilization(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'not evaluated'
  }

  return `${value.toFixed(3)} (${(value * 100).toFixed(1)}%)`
}

export function buildReportSummary(result: PunchingShearResult) {
  return [
    `N=${formatCompactKn(result.designShearForceN)}`,
    `u=${formatCompactMm(result.controlPerimeterMm)}`,
    `h0=${formatCompactMm(result.effectiveDepthMm)}`,
    `v=${formatCompactMpa(result.shearStressMpa)}`,
    `util=${formatCompactRatio(result.utilizationRatio)}`,
  ].join(' | ')
}

function formatCompactKn(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? 'n/a'
    : `${formatReportNumber(value / 1000)}kN`
}

function formatCompactMm(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? 'n/a'
    : `${formatReportNumber(value)}mm`
}

function formatCompactMpa(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? 'n/a'
    : `${value.toFixed(3)}MPa`
}

function formatCompactRatio(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value) ? 'n/a' : value.toFixed(3)
}
