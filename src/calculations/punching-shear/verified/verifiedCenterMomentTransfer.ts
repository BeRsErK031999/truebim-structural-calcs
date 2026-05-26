import type { PunchingShearInput, PunchingShearResult } from '../types'
import { punchingShearVerificationCases } from '../verification/verificationDataset'
import type { VerificationCase, VerificationExpected } from '../verification/verificationCase'
import { canUseVerificationStatus } from '../verification/verificationCase'

import type { VerificationEvidence, VerifiedFeatureId } from './verifiedMode'

type VerifiedCenterEvaluation = {
  verifiedFeatures: VerifiedFeatureId[]
  draftFeatures: VerifiedFeatureId[]
  evidence: VerificationEvidence[]
}

export function verifiedCenterMomentTransfer(
  input: PunchingShearInput,
  result: PunchingShearResult,
): VerifiedCenterEvaluation {
  if (input.caseType !== 'center' || !input.rectColumn || input.openings.length > 0) {
    return {
      verifiedFeatures: [],
      draftFeatures: [],
      evidence: [],
    }
  }

  const hasMoments = input.forces.momentXKnM !== 0 || input.forces.momentYKnM !== 0
  const verifiedForceCase = findPassingVerifiedForceOnlyCase(input, result)

  if (!hasMoments) {
    return verifiedForceCase
      ? {
          verifiedFeatures: ['center-force-only'],
          draftFeatures: [],
          evidence: [toEvidence(verifiedForceCase, 'verified')],
        }
      : {
          verifiedFeatures: [],
          draftFeatures: ['center-force-only'],
          evidence: [],
        }
  }

  const draftMomentCase = findPassingDraftMomentCase(input, result)

  return {
    verifiedFeatures: verifiedForceCase ? ['center-force-only'] : [],
    draftFeatures: ['center-moment-transfer'],
    evidence: [
      ...(verifiedForceCase ? [toEvidence(verifiedForceCase, 'verified')] : []),
      ...(draftMomentCase ? [toEvidence(draftMomentCase, 'partial')] : []),
    ],
  }
}

function findPassingVerifiedForceOnlyCase(input: PunchingShearInput, result: PunchingShearResult) {
  return punchingShearVerificationCases.find(
    (verificationCase) =>
      verificationCase.status === 'verified' &&
      verificationCase.caseType === 'center' &&
      verificationCase.input.forces.momentXKnM === 0 &&
      verificationCase.input.forces.momentYKnM === 0 &&
      canUseVerificationStatus(verificationCase.status, verificationCase.source) &&
      sameCenterRectangularBase(input, verificationCase.input) &&
      forceOnlyExpectedMatchesResult(verificationCase, result),
  )
}

function findPassingDraftMomentCase(input: PunchingShearInput, result: PunchingShearResult) {
  return punchingShearVerificationCases.find(
    (verificationCase) =>
      verificationCase.status === 'draft' &&
      verificationCase.caseType === 'center' &&
      (verificationCase.input.forces.momentXKnM !== 0 ||
        verificationCase.input.forces.momentYKnM !== 0) &&
      sameCenterRectangularInput(input, verificationCase.input) &&
      expectedMatchesResult(verificationCase, result),
  )
}

function sameCenterRectangularBase(input: PunchingShearInput, candidate: PunchingShearInput) {
  return (
    input.caseType === candidate.caseType &&
    input.forces.axialForceKn === candidate.forces.axialForceKn &&
    input.slab.thicknessMm === candidate.slab.thicknessMm &&
    input.slab.effectiveDepthMm === candidate.slab.effectiveDepthMm &&
    input.slab.concreteCoverMm === candidate.slab.concreteCoverMm &&
    input.concrete.className === candidate.concrete.className &&
    input.rectColumn?.widthXMm === candidate.rectColumn?.widthXMm &&
    input.rectColumn?.widthYMm === candidate.rectColumn?.widthYMm &&
    input.openings.length === 0 &&
    candidate.openings.length === 0 &&
    input.shearReinforcement.enabled === false &&
    candidate.shearReinforcement.enabled === false
  )
}

function sameCenterRectangularInput(input: PunchingShearInput, candidate: PunchingShearInput) {
  return (
    sameCenterRectangularBase(input, candidate) &&
    input.forces.momentXKnM === candidate.forces.momentXKnM &&
    input.forces.momentYKnM === candidate.forces.momentYKnM
  )
}

function expectedMatchesResult(verificationCase: VerificationCase, result: PunchingShearResult) {
  const actual: VerificationExpected = {
    controlPerimeterMm: result.controlPerimeterMm,
    effectiveDepthMm: result.effectiveDepthMm,
    shearStressMpa: result.shearStressMpa,
    utilizationRatio: result.utilizationRatio,
    passed: result.passed,
  }

  return (
    numericMatches(actual.controlPerimeterMm, verificationCase.expected.controlPerimeterMm, verificationCase) &&
    numericMatches(actual.effectiveDepthMm, verificationCase.expected.effectiveDepthMm, verificationCase) &&
    numericMatches(actual.shearStressMpa, verificationCase.expected.shearStressMpa, verificationCase) &&
    numericMatches(actual.utilizationRatio, verificationCase.expected.utilizationRatio, verificationCase) &&
    actual.passed === verificationCase.expected.passed
  )
}

function forceOnlyExpectedMatchesResult(
  verificationCase: VerificationCase,
  result: PunchingShearResult,
) {
  return (
    numericMatches(result.controlPerimeterMm, verificationCase.expected.controlPerimeterMm, verificationCase) &&
    numericMatches(result.effectiveDepthMm, verificationCase.expected.effectiveDepthMm, verificationCase) &&
    numericMatches(result.shearStressMpa, verificationCase.expected.shearStressMpa, verificationCase)
  )
}

function numericMatches(
  actual: number | null,
  expected: number | null,
  verificationCase: VerificationCase,
) {
  if (actual === null || expected === null) {
    return actual === expected
  }

  const tolerancePercent =
    verificationCase.tolerance.stressTolerancePercent ?? verificationCase.tolerance.relativePercent
  const tolerance = Math.max(
    Math.abs(expected) * (tolerancePercent / 100),
    verificationCase.tolerance.absolute,
  )

  return Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance
}

function toEvidence(
  verificationCase: VerificationCase,
  status: VerificationEvidence['status'],
): VerificationEvidence {
  return {
    id: verificationCase.id,
    title: verificationCase.title,
    source: verificationCase.source,
    verificationSource: verificationCase.verificationSource ?? verificationCase.source,
    checkedBy: verificationCase.checkedBy ?? null,
    checkedAt: verificationCase.checkedAt ?? null,
    status,
  }
}
