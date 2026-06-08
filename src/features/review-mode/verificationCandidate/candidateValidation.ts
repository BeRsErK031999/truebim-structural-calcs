import type { ReviewSession } from '../reviewSession'

import type { VerificationCandidate, VerificationCandidateValidationResult } from './candidateTypes'

export const trustedVerificationCandidateSourceMarkers = [
  'manual',
  'webcad',
  'excel',
  'hand-calculation',
  'нормативный пример',
] as const

export const requiredVerificationCandidateExpectedFields = [
  'controlPerimeterMm',
  'effectiveDepthMm',
  'shearStressMpa',
  'maxShearStressMpa',
  'minShearStressMpa',
  'eccentricityX',
  'eccentricityY',
  'transferFactorX',
  'transferFactorY',
  'stressPointCount',
] as const

export function validateReviewForVerificationCandidate(
  reviewSession: ReviewSession,
): VerificationCandidateValidationResult {
  const errors: string[] = []
  const missingRequirements: string[] = []
  const { evidence } = reviewSession

  if (reviewSession.status !== 'accepted') {
    errors.push('Перед созданием кандидата проверки статус проверки должен быть принят.')
    missingRequirements.push('accepted status')
  }

  if (!hasTrustedVerificationCandidateSource(evidence.source)) {
    errors.push(
      `Источник должен содержать доверенную отметку: ${trustedVerificationCandidateSourceMarkers.join(', ')}.`,
    )
    missingRequirements.push('trusted source')
  }

  if (evidence.checkedBy.trim().length === 0) {
    errors.push('Поле проверяющего обязательно.')
    missingRequirements.push('checkedBy')
  }

  if (evidence.checkedAt.trim().length === 0) {
    errors.push('Дата проверки обязательна.')
    missingRequirements.push('checkedAt')
  }

  for (const field of requiredVerificationCandidateExpectedFields) {
    if (!Number.isFinite(evidence.expectedValues[field])) {
      errors.push(`expected.${field} должен быть числовым значением.`)
      missingRequirements.push(`expected.${field}`)
    }
  }

  if (evidence.axisConventionNotes.trim().length === 0) {
    errors.push('Заметки по осям обязательны.')
    missingRequirements.push('axis notes')
  }

  return {
    valid: errors.length === 0,
    errors,
    missingRequirements: [...new Set(missingRequirements)],
  }
}

export function validateVerificationCandidate(candidate: VerificationCandidate): VerificationCandidateValidationResult {
  const errors: string[] = []
  const missingRequirements: string[] = []

  if (!hasTrustedVerificationCandidateSource(candidate.source)) {
    errors.push(
      `Источник должен содержать доверенную отметку: ${trustedVerificationCandidateSourceMarkers.join(', ')}.`,
    )
    missingRequirements.push('trusted source')
  }

  if (candidate.checkedBy.trim().length === 0) {
    errors.push('Поле проверяющего обязательно.')
    missingRequirements.push('checkedBy')
  }

  if (candidate.checkedAt.trim().length === 0) {
    errors.push('Дата проверки обязательна.')
    missingRequirements.push('checkedAt')
  }

  for (const field of requiredVerificationCandidateExpectedFields) {
    if (!Number.isFinite(candidate.expected[field])) {
      errors.push(`expected.${field} должен быть числовым значением.`)
      missingRequirements.push(`expected.${field}`)
    }

    if (!candidate.tolerances[field]) {
      errors.push(`tolerances.${field} обязательно.`)
      missingRequirements.push(`tolerances.${field}`)
    }
  }

  if (candidate.axisConventionNotes.trim().length === 0) {
    errors.push('Заметки по осям обязательны.')
    missingRequirements.push('axis notes')
  }

  if (candidate.candidateStatus === 'rejected') {
    errors.push('candidateStatus не должен быть rejected для CLI-валидации.')
  }

  return {
    valid: errors.length === 0,
    errors,
    missingRequirements: [...new Set(missingRequirements)],
  }
}

export function hasTrustedVerificationCandidateSource(source: string) {
  const normalizedSource = source.toLowerCase()

  return trustedVerificationCandidateSourceMarkers.some((marker) =>
    normalizedSource.includes(marker.toLowerCase()),
  )
}
