import type { PunchingShearCheckStatus } from '@/calculations/punching-shear'
import { traceBuilderRegistry } from '@/calculations/punching-shear/trace/traceBuilder'
import { getVerifiedCapabilityMatrix } from '@/calculations/punching-shear/verified/verifiedCapabilities'
import { punchingShearVerificationCases } from '@/calculations/punching-shear/verification/verificationDataset'
import { runVerificationCases } from '@/calculations/punching-shear/verification/verificationRunner'
import type { VerificationSummary } from '@/calculations/punching-shear/verification/verificationSummary'
import { getReviewDiagnostics } from '@/features/review-mode'
import { getValidationSessionDiagnostics } from '@/features/validation-session'
import { getKnowledgeDiagnostics } from '@/features/knowledge-base'
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
  traceSupport: 'available'
  traceBuildersCount: number
  traceCenterMomentsSupport: 'partial'
  traceWallSupport: 'draft'
  traceOpeningsSupport: 'draft'
  traceContoursSupport: 'draft'
  traceReinforcementSupport: 'draft'
  traceRoundSupport: 'draft-center-only'
  momentTransferStatus: 'draft'
  momentVerificationSupport: 'draft'
  stressComparisonSupport: 'draft'
  eccentricityComparisonSupport: 'draft'
  edgeSupport: 'draft'
  cornerSupport: 'draft'
  openingsSupport: 'draft-geometry'
  wallPunchingSupport: 'draft'
  wallCornerSupport: 'draft'
  roundColumnSupport: 'draft-center-only'
  roundEdgeSupport: 'not-implemented'
  roundCornerSupport: 'not-implemented'
  multipleContourSupport: 'draft'
  shearReinforcementInputSupport: 'draft'
  shearReinforcementCapacitySupport: 'draft'
  contourSelectionSupport: 'draft'
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
  reinforcementVerifiedCasesCount: number
  verifiedMomentCasesCount: number
  draftMomentCasesCount: number
  verifiedMomentEvidenceCount: number
  reviewModeSupport: 'local-only'
  verificationCandidateSupport: 'yes'
  candidateAutoPromotion: 'no'
  manualDatasetImportRequired: 'yes'
  validationSessionSupport: 'local-only'
  validationPackageExportSupport: 'manifest'
  checklistProgressSupport: 'yes'
  releaseEvidenceSupport: 'yes'
  releaseEvidenceExportFormats: 'html/md/json'
  knowledgeBaseSupport: 'local-only'
  knowledgeEntriesCount: number
  verifiedFindingsCount: number
  unresolvedFindingsCount: number
  calcengineGapAnalysis: 'available'
  pilotReadinessMatrix: 'available'
  productionDesignReadiness: 'not yet'
  currentProductionBlocker: 'trusted SP63 verification'
  engineerPackageReady: 'yes' | 'no'
  validationSessionsCount: number
  frozenReviewSnapshotsCount: number
  pendingReviewsCount: number
  acceptedReviewsCount: number
  rejectedReviewsCount: number
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
  const reviewDiagnostics = getReviewDiagnostics()
  const validationSessionDiagnostics = getValidationSessionDiagnostics()
  const knowledgeDiagnostics = getKnowledgeDiagnostics()
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
    traceSupport: 'available',
    traceBuildersCount: traceBuilderRegistry.length,
    traceCenterMomentsSupport: 'partial',
    traceWallSupport: 'draft',
    traceOpeningsSupport: 'draft',
    traceContoursSupport: 'draft',
    traceReinforcementSupport: 'draft',
    traceRoundSupport: 'draft-center-only',
    momentTransferStatus: 'draft',
    momentVerificationSupport: 'draft',
    stressComparisonSupport: 'draft',
    eccentricityComparisonSupport: 'draft',
    edgeSupport: 'draft',
    cornerSupport: 'draft',
    openingsSupport: 'draft-geometry',
    wallPunchingSupport: 'draft',
    wallCornerSupport: 'draft',
    roundColumnSupport: 'draft-center-only',
    roundEdgeSupport: 'not-implemented',
    roundCornerSupport: 'not-implemented',
    multipleContourSupport: 'draft',
    shearReinforcementInputSupport: 'draft',
    shearReinforcementCapacitySupport: 'draft',
    contourSelectionSupport: 'draft',
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
    reinforcementVerifiedCasesCount: 0,
    verifiedMomentCasesCount: momentCases.filter((verificationCase) => verificationCase.status === 'verified').length,
    draftMomentCasesCount: momentCases.filter((verificationCase) => verificationCase.status === 'draft').length,
    verifiedMomentEvidenceCount: momentCases.filter((verificationCase) => verificationCase.status === 'verified').length,
    verificationCandidateSupport: 'yes',
    candidateAutoPromotion: 'no',
    manualDatasetImportRequired: 'yes',
    releaseEvidenceSupport: 'yes',
    releaseEvidenceExportFormats: 'html/md/json',
    ...knowledgeDiagnostics,
    calcengineGapAnalysis: 'available',
    pilotReadinessMatrix: 'available',
    productionDesignReadiness: 'not yet',
    currentProductionBlocker: 'trusted SP63 verification',
    ...validationSessionDiagnostics,
    ...reviewDiagnostics,
    warning: 'Client-side diagnostics only',
  }
}
