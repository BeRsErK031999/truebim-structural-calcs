import { describe, expect, it } from 'vitest'

import { punchingShearVerificationCases } from '../verificationDataset'
import { runVerificationCase, runVerificationCases } from '../verificationRunner'
import { summarizeVerificationResults } from '../verificationSummary'
import type { VerificationCase } from '../verificationCase'

describe('punching shear verification runner', () => {
  it('passes all draft verification cases against current arithmetic', () => {
    const { results, summary } = runVerificationCases(punchingShearVerificationCases)

    expect(results).toHaveLength(3)
    expect(results.every((result) => result.passed)).toBe(true)
    expect(summary).toMatchObject({
      totalCases: 3,
      draftCases: 3,
      verifiedCases: 0,
      failedCases: 0,
      warning: 'No SP63 verified cases yet',
    })
  })

  it('fails when an expected value does not match actual arithmetic', () => {
    const brokenCase: VerificationCase = {
      ...punchingShearVerificationCases[0],
      expected: {
        ...punchingShearVerificationCases[0].expected,
        controlPerimeterMm: punchingShearVerificationCases[0].expected.controlPerimeterMm + 10,
      },
    }

    const result = runVerificationCase(brokenCase)

    expect(result.passed).toBe(false)
    expect(result.fieldResults).toContainEqual(
      expect.objectContaining({
        field: 'controlPerimeterMm',
        passed: false,
      }),
    )
  })

  it('does not allow verified status without a trusted source marker', () => {
    const incorrectlyVerifiedCase: VerificationCase = {
      ...punchingShearVerificationCases[0],
      status: 'verified',
      source: 'internal draft arithmetic, not SP63 verified',
    }

    const result = runVerificationCase(incorrectlyVerifiedCase)

    expect(result.statusAllowed).toBe(false)
    expect(result.passed).toBe(false)
  })

  it('counts pass, fail, draft, and verified cases in summary', () => {
    expect(
      summarizeVerificationResults([
        { status: 'draft', passed: true },
        { status: 'draft', passed: false },
        { status: 'verified', passed: true },
      ]),
    ).toMatchObject({
      totalCases: 3,
      draftCases: 2,
      verifiedCases: 1,
      passedCases: 2,
      failedCases: 1,
      warning: null,
    })
  })
})
