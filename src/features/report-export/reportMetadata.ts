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
  'Column located at slab center',
  'No openings considered',
  'No slab edge effects considered',
  'No shear reinforcement contribution',
  'Moments ignored',
  'Draft concrete resistance values',
  'Draft perimeter geometry',
]

export const unsupportedDraftFeatures = [
  'openings',
  'edge columns',
  'corner columns',
  'round columns',
  'shear reinforcement contribution',
  'moment transfer',
  'verified SP63 coefficients',
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
