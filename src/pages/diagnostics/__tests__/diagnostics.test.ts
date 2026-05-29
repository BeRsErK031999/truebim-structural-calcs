import { describe, expect, it } from 'vitest'

import { buildDiagnosticsModel, isLocalStorageAvailable } from '../diagnostics'

describe('diagnostics helpers', () => {
  it('builds a client-side diagnostics model', () => {
    const model = buildDiagnosticsModel({
      metadata: {
        version: '1.0.0',
        commit: 'abc1234',
        buildTime: '2026-05-25T09:00:00.000Z',
        environment: 'production',
      },
      localStorageAvailable: true,
      savedCalculationsCount: 3,
      currentCalculationStatus: 'draft_ok',
    })

    expect(model).toMatchObject({
      appLoaded: 'yes',
      version: '1.0.0',
      localStorageAvailable: true,
      savedCalculationsCount: 3,
      currentCalculationStatus: 'draft_ok',
      warning: 'Client-side diagnostics only',
      verification: {
        totalCases: 11,
        draftCases: 10,
        verifiedCases: 1,
        failedCases: 0,
        warning: null,
      },
      stressDistributionSupport: 'draft',
      stressRegressionSupport: 'draft',
      stressChecksumSupport: 'draft',
      axisConventionValidationSupport: 'draft',
      driftDetectionSupport: 'draft',
      momentTransferStatus: 'draft',
      momentVerificationSupport: 'draft',
      stressComparisonSupport: 'draft',
      eccentricityComparisonSupport: 'draft',
      verifiedMomentCasesCount: 0,
      draftMomentCasesCount: 4,
      verifiedMomentEvidenceCount: 0,
      edgeSupport: 'draft',
      cornerSupport: 'draft',
      openingsSupport: 'draft-geometry',
      clippedPerimeterSupport: 'draft',
      geometryVerificationSupport: 'draft',
      clippingVerificationSupport: 'draft',
      openingVerificationSupport: 'draft',
      verifiedArithmeticSupport: 'verified',
      partialVerificationSupport: 'partial',
      verificationCandidateSupport: 'yes',
      candidateAutoPromotion: 'no',
      manualDatasetImportRequired: 'yes',
      validationSessionSupport: 'local-only',
      validationPackageExportSupport: 'manifest',
      checklistProgressSupport: 'yes',
      releaseEvidenceSupport: 'yes',
      releaseEvidenceExportFormats: 'html/md/json',
      engineerPackageReady: 'no',
      validationSessionsCount: 0,
      verifiedEvidenceCount: 1,
      openingDraftCasesCount: 2,
      verifiedEdgeCount: 0,
      verifiedOpeningCount: 0,
    })
    expect(model.verifiedCapabilityMatrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'center-force-only', status: 'verified' }),
        expect.objectContaining({ id: 'center-moment-transfer', status: 'partial' }),
        expect.objectContaining({ id: 'openings', status: 'draft' }),
      ]),
    )
  })

  it('reports the verified case count from the verification dataset', () => {
    const model = buildDiagnosticsModel({
      metadata: {
        version: '1.0.0',
        commit: 'abc1234',
        buildTime: '2026-05-25T09:00:00.000Z',
        environment: 'production',
      },
      localStorageAvailable: true,
      savedCalculationsCount: 0,
    })

    expect(model.verification.verifiedCases).toBeGreaterThan(0)
    expect(model.verification.warning).toBeNull()
  })

  it('detects unavailable localStorage', () => {
    expect(isLocalStorageAvailable(undefined)).toBe(false)
  })

  it('detects writable localStorage-like storage', () => {
    const values = new Map<string, string>()
    const storage = {
      get length() {
        return values.size
      },
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: (index: number) => Array.from(values.keys())[index] ?? null,
      removeItem: (key: string) => {
        values.delete(key)
      },
      setItem: (key: string, value: string) => {
        values.set(key, value)
      },
    } satisfies Storage

    expect(isLocalStorageAvailable(storage)).toBe(true)
  })
})
