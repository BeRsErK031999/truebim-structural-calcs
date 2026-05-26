import type { PunchingShearCheckStatus } from '@/calculations/punching-shear'
import { getVerifiedCapabilityMatrix } from '@/calculations/punching-shear/verified/verifiedCapabilities'
import { punchingShearVerificationCases } from '@/calculations/punching-shear/verification/verificationDataset'
import { runVerificationCases } from '@/calculations/punching-shear/verification/verificationRunner'
import type { VerificationSummary } from '@/calculations/punching-shear/verification/verificationSummary'
import type { AppMetadata } from '@/shared/config/appMetadata'

export type DiagnosticsModel = {
  appLoaded: 'yes'
  version: string
  commit: string
  buildTime: string
  environment: string
  localStorageAvailable: boolean
  savedCalculationsCount: number
  currentCalculationStatus: PunchingShearCheckStatus | 'none'
  verification: VerificationSummary
  stressDistributionSupport: 'draft'
  stressRegressionSupport: 'draft'
  stressChecksumSupport: 'draft'
  axisConventionValidationSupport: 'draft'
  driftDetectionSupport: 'draft'
  momentTransferStatus: 'draft'
  momentVerificationSupport: 'draft'
  stressComparisonSupport: 'draft'
  eccentricityComparisonSupport: 'draft'
  edgeSupport: 'draft'
  cornerSupport: 'draft'
  openingsSupport: 'draft-geometry'
  clippedPerimeterSupport: 'draft'
  geometryVerificationSupport: 'draft'
  clippingVerificationSupport: 'draft'
  openingVerificationSupport: 'draft'
  verifiedCapabilityMatrix: ReturnType<typeof getVerifiedCapabilityMatrix>
  verifiedArithmeticSupport: 'verified'
  partialVerificationSupport: 'partial'
  verifiedEvidenceCount: number
  openingDraftCasesCount: number
  verifiedEdgeCount: number
  verifiedOpeningCount: number
  verifiedMomentCasesCount: number
  draftMomentCasesCount: number
  verifiedMomentEvidenceCount: number
  warning: string
}

export function isLocalStorageAvailable(storage: Storage | undefined = globalThis.localStorage) {
  if (!storage) {
    return false
  }

  const testKey = 'truebim-structural-calcs:diagnostics-test'

  try {
    storage.setItem(testKey, '1')
    storage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export function buildDiagnosticsModel({
  metadata,
  localStorageAvailable,
  savedCalculationsCount,
  currentCalculationStatus,
}: {
  metadata: AppMetadata
  localStorageAvailable: boolean
  savedCalculationsCount: number
  currentCalculationStatus?: PunchingShearCheckStatus
}): DiagnosticsModel {
  const verification = runVerificationCases(punchingShearVerificationCases).summary
  const verifiedCapabilityMatrix = getVerifiedCapabilityMatrix()
  const momentCases = punchingShearVerificationCases.filter(
    (verificationCase) =>
      verificationCase.input.forces.momentXKnM > 0 ||
      verificationCase.input.forces.momentYKnM > 0,
  )
  const openingDraftCases = punchingShearVerificationCases.filter(
    (verificationCase) =>
      verificationCase.status === 'draft' &&
      (verificationCase.caseType === 'opening' || verificationCase.input.openings.length > 0),
  )
  const verifiedEdgeCases = punchingShearVerificationCases.filter(
    (verificationCase) =>
      verificationCase.status === 'verified' &&
      (verificationCase.caseType === 'edge' || verificationCase.input.slabEdges),
  )
  const verifiedOpeningCases = punchingShearVerificationCases.filter(
    (verificationCase) =>
      verificationCase.status === 'verified' &&
      (verificationCase.caseType === 'opening' || verificationCase.input.openings.length > 0),
  )

  return {
    appLoaded: 'yes',
    version: metadata.version,
    commit: metadata.commit,
    buildTime: metadata.buildTime,
    environment: metadata.environment,
    localStorageAvailable,
    savedCalculationsCount,
    currentCalculationStatus: currentCalculationStatus ?? 'none',
    verification,
    stressDistributionSupport: 'draft',
    stressRegressionSupport: 'draft',
    stressChecksumSupport: 'draft',
    axisConventionValidationSupport: 'draft',
    driftDetectionSupport: 'draft',
    momentTransferStatus: 'draft',
    momentVerificationSupport: 'draft',
    stressComparisonSupport: 'draft',
    eccentricityComparisonSupport: 'draft',
    edgeSupport: 'draft',
    cornerSupport: 'draft',
    openingsSupport: 'draft-geometry',
    clippedPerimeterSupport: 'draft',
    geometryVerificationSupport: 'draft',
    clippingVerificationSupport: 'draft',
    openingVerificationSupport: 'draft',
    verifiedCapabilityMatrix,
    verifiedArithmeticSupport: 'verified',
    partialVerificationSupport: 'partial',
    verifiedEvidenceCount: punchingShearVerificationCases.filter(
      (verificationCase) => verificationCase.status === 'verified',
    ).length,
    openingDraftCasesCount: openingDraftCases.length,
    verifiedEdgeCount: verifiedEdgeCases.length,
    verifiedOpeningCount: verifiedOpeningCases.length,
    verifiedMomentCasesCount: momentCases.filter((verificationCase) => verificationCase.status === 'verified').length,
    draftMomentCasesCount: momentCases.filter((verificationCase) => verificationCase.status === 'draft').length,
    verifiedMomentEvidenceCount: 5,
    warning: 'Client-side diagnostics only',
  }
}
