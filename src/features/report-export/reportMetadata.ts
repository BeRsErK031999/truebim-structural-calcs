import { getAppMetadata } from '@/shared/config/appMetadata'

export type ReportVerificationSource =
  | 'NOT VERIFIED'
  | 'WebCAD checked'
  | 'Manual engineer calculation'
  | 'Verified Excel'
  | 'Normative example'

export type ReportMetadata = {
  generatedAt: string
  calculationId: string
  verificationSource: ReportVerificationSource
}

export const reportAssumptions = [
  'Center, edge, corner, and opening geometry are draft-only where provided',
  'Openings use draft tangent subtraction geometry',
  'Slab edges use draft control perimeter clipping geometry',
  'Wall-end and wall-corner support geometry is draft-only where provided',
  'No shear reinforcement contribution',
  'Moments use draft redistribution where provided',
  'Draft concrete resistance values',
  'Draft perimeter geometry',
]

export const unsupportedDraftFeatures = [
  'verified openings formulas',
  'verified edge column formulas',
  'verified corner column formulas',
  'verified wall-corner formulas',
  'round columns',
  'shear reinforcement contribution',
  'verified moment transfer',
  'verified SP63 coefficients',
]

export const reportApplicabilityItems = [
  'Suitable for pilot review, comparison, and evidence collection.',
  'Verified features are limited to the features listed in this report.',
  'Partial features require trusted engineering review before use.',
  'Draft features are not final design capabilities.',
  'Not a final design document unless verified capability coverage matches the selected case.',
]

export function createReportMetadata(now = new Date()): ReportMetadata {
  return {
    generatedAt: now.toISOString(),
    calculationId: createCalculationId(now),
    verificationSource: 'NOT VERIFIED',
  }
}

export function createCalculationId(now = new Date()) {
  const appMetadata = getAppMetadata()
  const date = formatDateStamp(now)
  const time = formatTimeStamp(now)
  const commit = normalizeCommit(appMetadata.commit)

  return `ps-center-${date}-${time}-${commit}`
}

function formatDateStamp(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('')
}

function formatTimeStamp(date: Date) {
  return [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join('')
}

function normalizeCommit(commit: string) {
  const normalized = commit.trim()

  return normalized.length > 0 && normalized !== 'unknown' ? normalized.slice(0, 7) : 'unknown'
}
