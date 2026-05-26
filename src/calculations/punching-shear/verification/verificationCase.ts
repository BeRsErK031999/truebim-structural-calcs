import type { PunchingShearCaseType, PunchingShearInput } from '../types'

export type VerificationCaseStatus = 'draft' | 'verified' | 'rejected'

export type VerificationExpected = {
  controlPerimeterMm: number | null
  effectiveDepthMm: number | null
  shearStressMpa: number | null
  utilizationRatio: number | null
  clippedPerimeterMm?: number | null
  removedPerimeterMm?: number | null
  removedSegmentCount?: number | null
  tangentCount?: number | null
  openingAffected?: boolean | null
  edgeAffected?: boolean | null
  cornerAffected?: boolean | null
  passed: boolean | null
}

export type VerificationTolerance = {
  relativePercent: number
  absolute: number
  geometryToleranceMm?: number
  stressTolerancePercent?: number
}

export type GeometryVerificationMetadata = {
  geometryToleranceMm?: number
  stressTolerancePercent?: number
  boundaryClassification?: string
  checkedGeometryItems?: string[]
  requiredTrustedValues?: string[]
}

export type VerificationCase = {
  id: string
  title: string
  source: string
  verificationSource?: string
  checkedBy?: string | null
  checkedAt?: string | null
  comparisonNotes?: string
  standard: string
  caseType: PunchingShearCaseType
  input: PunchingShearInput
  expected: VerificationExpected
  tolerance: VerificationTolerance
  geometryVerification?: GeometryVerificationMetadata
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
