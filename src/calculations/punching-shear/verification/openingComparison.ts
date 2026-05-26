import type { OpeningTangent } from '../types'
import type { VerificationCase } from './verificationCase'

export type OpeningComparisonResult = {
  passed: boolean
  expectedOpeningAffected: boolean | null
  actualOpeningAffected: boolean
  expectedTangentCount: number | null
  actualTangentCount: number
  diffSummary: string[]
}

export function compareOpeningVerification({
  expectedOpeningAffected,
  expectedTangentCount,
  actualOpeningAffected,
  actualTangents,
  status,
}: {
  expectedOpeningAffected: boolean | null | undefined
  expectedTangentCount: number | null | undefined
  actualOpeningAffected: boolean
  actualTangents: OpeningTangent[]
  status: VerificationCase['status']
}): OpeningComparisonResult {
  const actualTangentCount = actualTangents.length
  const openingPassed =
    expectedOpeningAffected === null ||
    expectedOpeningAffected === undefined ||
    expectedOpeningAffected === actualOpeningAffected
  const tangentPassed =
    expectedTangentCount === null ||
    expectedTangentCount === undefined ||
    expectedTangentCount === actualTangentCount
  const draftPlaceholderPassed =
    status === 'draft' &&
    (expectedOpeningAffected === null || expectedOpeningAffected === undefined) &&
    (expectedTangentCount === null || expectedTangentCount === undefined)
  const diffSummary = [
    openingPassed
      ? null
      : `openingAffected: expected ${String(expectedOpeningAffected)}, actual ${String(actualOpeningAffected)}`,
    tangentPassed
      ? null
      : `tangentCount: expected ${String(expectedTangentCount)}, actual ${actualTangentCount}`,
  ].filter((item): item is string => item !== null)

  return {
    passed: draftPlaceholderPassed || (openingPassed && tangentPassed),
    expectedOpeningAffected: expectedOpeningAffected ?? null,
    actualOpeningAffected,
    expectedTangentCount: expectedTangentCount ?? null,
    actualTangentCount,
    diffSummary: diffSummary.length > 0 ? diffSummary : ['Opening tangent comparison passed.'],
  }
}
