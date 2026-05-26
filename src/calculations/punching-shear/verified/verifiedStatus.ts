import type { PunchingShearInput, PunchingShearResult } from '../types'

import { detectInputFeatures } from './verifiedCapabilities'
import { verifiedCenterMomentTransfer } from './verifiedCenterMomentTransfer'
import type { VerifiedStatus } from './verifiedMode'
import { createVerifiedWarnings } from './verifiedWarnings'

export function buildVerifiedStatus(
  input: PunchingShearInput,
  result: PunchingShearResult,
): VerifiedStatus {
  const inputFeatures = detectInputFeatures(input)
  const centerEvaluation = verifiedCenterMomentTransfer(input, result)
  const verifiedFeatures = unique(centerEvaluation.verifiedFeatures)
  const centerDraftFeatures = centerEvaluation.draftFeatures
  const draftFeatures = unique([
    ...inputFeatures.filter((feature) => !verifiedFeatures.includes(feature)),
    ...centerDraftFeatures,
  ])
  const verificationLevel = determineVerificationLevel(verifiedFeatures, draftFeatures)
  const evidence = uniqueEvidence(centerEvaluation.evidence)

  return {
    verifiedMode: verificationLevel,
    verificationLevel,
    verifiedFeatures,
    draftFeatures,
    verificationEvidenceIds: evidence.map((item) => item.id),
    verificationEvidence: evidence,
  }
}

export function applyVerifiedStatus(
  result: PunchingShearResult,
  status: VerifiedStatus,
): PunchingShearResult {
  return {
    ...result,
    ...status,
    warnings: [...result.warnings, ...createVerifiedWarnings(status)],
  }
}

function determineVerificationLevel(
  verifiedFeatures: string[],
  draftFeatures: string[],
) {
  if (verifiedFeatures.length > 0 && draftFeatures.length === 0) {
    return 'verified'
  }

  if (verifiedFeatures.length > 0) {
    return 'partial'
  }

  return 'draft'
}

function unique<T extends string>(values: T[]) {
  return Array.from(new Set(values))
}

function uniqueEvidence(values: VerifiedStatus['verificationEvidence']) {
  return Array.from(new Map(values.map((value) => [value.id, value])).values())
}
