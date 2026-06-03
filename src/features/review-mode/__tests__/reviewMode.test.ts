import { describe, expect, it } from 'vitest'

import { calculatePunchingShear, defaultPunchingShearInput } from '@/calculations/punching-shear'

import { createEmptyReviewEvidence } from '../reviewEvidence'
import { buildReviewComparison } from '../reviewMismatch'
import { compareFrozenReviewSnapshot, createReviewSession, freezeReviewSnapshot } from '../reviewSession'
import { transitionReviewStatus } from '../reviewStatus'

describe('engineering review mode', () => {
  it('highlights matching trusted values in green match state', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const evidence = {
      ...createEmptyReviewEvidence(),
      expectedValues: {
        controlPerimeterMm: result.controlPerimeterMm ?? 0,
      },
    }
    const comparison = buildReviewComparison(result, evidence)
    const perimeter = comparison.items.find((item) => item.key === 'controlPerimeterMm')

    expect(perimeter?.severity).toBe('match')
  })

  it('returns tolerance warning before full mismatch', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const actual = result.controlPerimeterMm ?? 0
    const evidence = {
      ...createEmptyReviewEvidence(),
      expectedValues: {
        controlPerimeterMm: actual + 0.9,
      },
    }
    const comparison = buildReviewComparison(result, evidence)
    const perimeter = comparison.items.find((item) => item.key === 'controlPerimeterMm')

    expect(perimeter?.severity).toBe('warning')
  })

  it('detects mismatch outside tolerance', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const actual = result.controlPerimeterMm ?? 0
    const evidence = {
      ...createEmptyReviewEvidence(),
      expectedValues: {
        controlPerimeterMm: actual + 5,
      },
    }
    const comparison = buildReviewComparison(result, evidence)
    const perimeter = comparison.items.find((item) => item.key === 'controlPerimeterMm')

    expect(perimeter?.severity).toBe('mismatch')
    expect(comparison.mismatchCount).toBeGreaterThan(0)
  })

  it('allows review status transitions through accepted and investigation states', () => {
    const reviewed = transitionReviewStatus('pending-review', 'reviewed')
    const accepted = transitionReviewStatus(reviewed, 'accepted')

    expect(accepted).toBe('accepted')
    expect(transitionReviewStatus(accepted, 'needs-investigation')).toBe('needs-investigation')
  })

  it('allows reviewed-needs-evidence before accepted evidence is complete', () => {
    const needsEvidence = transitionReviewStatus('pending-review', 'reviewed-needs-evidence')

    expect(needsEvidence).toBe('reviewed-needs-evidence')
    expect(transitionReviewStatus(needsEvidence, 'needs-investigation')).toBe('needs-investigation')
  })

  it('detects drift against frozen review snapshots', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const comparison = buildReviewComparison(result, createEmptyReviewEvidence())
    const session = freezeReviewSnapshot({
      session: createReviewSession({ input: defaultPunchingShearInput }),
      result,
      comparisonItems: comparison.items,
    })
    const changedResult = {
      ...result,
      controlPerimeterMm: (result.controlPerimeterMm ?? 0) + 1,
    }
    const drift = compareFrozenReviewSnapshot(session.frozenSnapshots[0], changedResult)

    expect(drift.map((item) => item.field)).toContain('controlPerimeterMm')
  })

  it('accepted review does not auto-promote VERIFIED', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      forces: {
        ...defaultPunchingShearInput.forces,
        momentXKnM: 25,
      },
    })
    const session = {
      ...createReviewSession({ input: defaultPunchingShearInput }),
      status: transitionReviewStatus('pending-review', 'accepted'),
    }

    expect(session.status).toBe('accepted')
    expect(result.verifiedFeatures).not.toContain('center-moment-transfer')
    expect(result.verificationLevel).not.toBe('verified')
  })
})
