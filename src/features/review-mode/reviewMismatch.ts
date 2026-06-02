import { calculateVerificationTransferFactors, createStressDistributionChecksum } from '@/calculations/punching-shear'
import type { PunchingShearResult } from '@/calculations/punching-shear'

import type { ReviewEvidence, ReviewValueKey } from './reviewEvidence'

export type ReviewDiffSeverity = 'match' | 'warning' | 'mismatch' | 'missing'

export type ReviewTolerance = {
  absolute?: number
  relativePercent?: number
  warningRatio?: number
}

export type ReviewDiffItem = {
  section: 'geometry' | 'stress' | 'eccentricity' | 'transfer factors' | 'checksums' | 'verification level'
  key: ReviewValueKey
  label: string
  appValue: number | string | null
  expectedValue: number | string | null
  delta: number | null
  tolerance: number | null
  severity: ReviewDiffSeverity
}

export type ReviewComparison = {
  items: ReviewDiffItem[]
  mismatchCount: number
  warningCount: number
  matchCount: number
}

export const defaultReviewTolerances: Partial<Record<ReviewValueKey, ReviewTolerance>> = {
  controlPerimeterMm: { absolute: 1, warningRatio: 0.8 },
  effectiveDepthMm: { absolute: 0.5, warningRatio: 0.8 },
  shearStressMpa: { relativePercent: 1, warningRatio: 0.8 },
  maxShearStressMpa: { relativePercent: 1, warningRatio: 0.8 },
  minShearStressMpa: { relativePercent: 1, warningRatio: 0.8 },
  eccentricityX: { absolute: 1, warningRatio: 0.8 },
  eccentricityY: { absolute: 1, warningRatio: 0.8 },
  transferFactorX: { absolute: 0.001, warningRatio: 0.8 },
  transferFactorY: { absolute: 0.001, warningRatio: 0.8 },
  stressPointCount: { absolute: 0, warningRatio: 1 },
}

const reviewFields: Array<Omit<ReviewDiffItem, 'appValue' | 'expectedValue' | 'delta' | 'tolerance' | 'severity'>> = [
  { section: 'geometry', key: 'controlPerimeterMm', label: 'Контрольный периметр, мм' },
  { section: 'geometry', key: 'effectiveDepthMm', label: 'Рабочая высота, мм' },
  { section: 'stress', key: 'shearStressMpa', label: 'Базовое напряжение среза, МПа' },
  { section: 'stress', key: 'maxShearStressMpa', label: 'Максимальное напряжение среза, МПа' },
  { section: 'stress', key: 'minShearStressMpa', label: 'Минимальное напряжение среза, МПа' },
  { section: 'eccentricity', key: 'eccentricityX', label: 'Эксцентриситет X, мм' },
  { section: 'eccentricity', key: 'eccentricityY', label: 'Эксцентриситет Y, мм' },
  { section: 'transfer factors', key: 'transferFactorX', label: 'Коэффициент передачи X' },
  { section: 'transfer factors', key: 'transferFactorY', label: 'Коэффициент передачи Y' },
  { section: 'checksums', key: 'stressPointCount', label: 'Количество точек напряжений' },
  { section: 'checksums', key: 'stressChecksum', label: 'Checksum напряжений' },
  { section: 'verification level', key: 'verificationLevel', label: 'Уровень проверки' },
]

export function buildReviewComparison(
  result: PunchingShearResult,
  evidence: ReviewEvidence,
  tolerances: Partial<Record<ReviewValueKey, ReviewTolerance>> = defaultReviewTolerances,
): ReviewComparison {
  const appValues = getAppReviewValues(result)
  const items = reviewFields.map((field) =>
    compareReviewValue(
      field,
      appValues[field.key] ?? null,
      evidence.expectedValues[field.key] ?? null,
      tolerances[field.key],
    ),
  )

  return {
    items,
    mismatchCount: items.filter((item) => item.severity === 'mismatch').length,
    warningCount: items.filter((item) => item.severity === 'warning').length,
    matchCount: items.filter((item) => item.severity === 'match').length,
  }
}

export function getAppReviewValues(result: PunchingShearResult): Partial<Record<ReviewValueKey, number | string>> {
  const transferFactors = calculateVerificationTransferFactors(result.perimeter)

  return {
    controlPerimeterMm: result.controlPerimeterMm ?? undefined,
    effectiveDepthMm: result.effectiveDepthMm ?? undefined,
    shearStressMpa: result.shearStressMpa ?? undefined,
    maxShearStressMpa: result.maxShearStressMpa ?? undefined,
    minShearStressMpa: result.minShearStressMpa ?? undefined,
    eccentricityX: result.eccentricityX ?? undefined,
    eccentricityY: result.eccentricityY ?? undefined,
    transferFactorX: transferFactors.factorX,
    transferFactorY: transferFactors.factorY,
    stressPointCount: result.stressDistribution?.points.length ?? 0,
    stressChecksum: result.stressDistribution ? createStressDistributionChecksum(result.stressDistribution) : 'disabled',
    verificationLevel: result.verificationLevel,
  }
}

function compareReviewValue(
  field: Omit<ReviewDiffItem, 'appValue' | 'expectedValue' | 'delta' | 'tolerance' | 'severity'>,
  appValue: number | string | null,
  expectedValue: number | string | null,
  tolerance?: ReviewTolerance,
): ReviewDiffItem {
  if (expectedValue === null || expectedValue === '') {
    return { ...field, appValue, expectedValue: null, delta: null, tolerance: null, severity: 'missing' }
  }

  if (typeof appValue === 'number' && typeof expectedValue === 'number') {
    const delta = Math.abs(appValue - expectedValue)
    const resolvedTolerance = resolveTolerance(expectedValue, tolerance)
    const warningRatio = tolerance?.warningRatio ?? 0.8

    return {
      ...field,
      appValue,
      expectedValue,
      delta,
      tolerance: resolvedTolerance,
      severity:
        delta <= resolvedTolerance * warningRatio
          ? 'match'
          : delta <= resolvedTolerance
            ? 'warning'
            : 'mismatch',
    }
  }

  const severity = String(appValue) === String(expectedValue) ? 'match' : 'mismatch'

  return { ...field, appValue, expectedValue, delta: null, tolerance: null, severity }
}

function resolveTolerance(expectedValue: number, tolerance?: ReviewTolerance) {
  const absolute = tolerance?.absolute ?? 0
  const relative = Math.abs(expectedValue) * ((tolerance?.relativePercent ?? 0) / 100)

  return Math.max(absolute, relative)
}
