import type { PunchingShearCaseType, PunchingShearInput } from '../types'

export type VerificationCaseStatus = 'draft' | 'verified' | 'rejected'

export type VerificationExpected = {
  controlPerimeterMm: number
  effectiveDepthMm: number
  shearStressMpa: number
  utilizationRatio: number
  passed: boolean
}

export type VerificationTolerance = {
  relativePercent: number
  absolute: number
}

export type VerificationCase = {
  id: string
  title: string
  source: string
  standard: string
  caseType: PunchingShearCaseType
  input: PunchingShearInput
  expected: VerificationExpected
  tolerance: VerificationTolerance
  notes: string
  status: VerificationCaseStatus
}

export const trustedVerificationSourceMarkers = [
  'trusted',
  'manual',
  'webcad',
  'excel',
  'engineer',
  'normative',
  'нормативный пример',
]

export function canUseVerificationStatus(
  status: VerificationCaseStatus,
  source: string,
): boolean {
  if (status !== 'verified') {
    return true
  }

  const normalizedSource = source.toLowerCase()

  return trustedVerificationSourceMarkers.some((marker) => normalizedSource.includes(marker))
}
