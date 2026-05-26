import { describe, expect, it } from 'vitest'

import { calculatePunchingShear } from '../../engine'
import { compareClippingVerification } from '../clippingComparison'
import { compareGeometryVerification } from '../geometryComparison'
import { compareOpeningVerification } from '../openingComparison'
import { compareRemovedSegments } from '../segmentComparison'
import { buildVerificationSnapshot } from '../verificationSnapshot'
import { buildVerificationSnapshotHtml } from '../verificationSnapshotHtml'
import type { VerificationCase } from '../verificationCase'

const edgeCase: VerificationCase = {
  id: 'test-edge-geometry',
  title: 'Test edge geometry',
  source: 'internal draft arithmetic, not SP63 verified',
  standard: 'SP63 pending verification',
  caseType: 'edge',
  input: {
    caseType: 'edge',
    forces: {
      axialForceKn: 420,
      momentXKnM: 0,
      momentYKnM: 0,
    },
    slab: {
      thicknessMm: 220,
      effectiveDepthMm: 190,
      concreteCoverMm: 30,
    },
    concrete: {
      className: 'B25',
    },
    rectColumn: {
      widthXMm: 400,
      widthYMm: 400,
    },
    slabEdges: {
      leftMm: 0,
    },
    openings: [],
    shearReinforcement: {
      enabled: false,
    },
  },
  expected: {
    controlPerimeterMm: 1180,
    effectiveDepthMm: 190,
    shearStressMpa: 1.873327386262266,
    utilizationRatio: 1.784121320249777,
    clippedPerimeterMm: 1180,
    removedPerimeterMm: 1180,
    removedSegmentCount: 3,
    tangentCount: 0,
    openingAffected: false,
    edgeAffected: true,
    cornerAffected: false,
    passed: false,
  },
  tolerance: {
    relativePercent: 0.000001,
    absolute: 0.000001,
    geometryToleranceMm: 0.001,
    stressTolerancePercent: 0.000001,
  },
  notes: 'Draft comparison fixture.',
  status: 'draft',
}

const openingCase: VerificationCase = {
  ...edgeCase,
  id: 'test-opening-geometry',
  title: 'Test opening geometry',
  caseType: 'opening',
  input: {
    ...edgeCase.input,
    caseType: 'opening',
    slabEdges: undefined,
    openings: [
      {
        id: 'opening-1',
        widthXMm: 200,
        widthYMm: 300,
        centerXMm: 600,
        centerYMm: 0,
      },
    ],
  },
  expected: {
    ...edgeCase.expected,
    controlPerimeterMm: 1770,
    shearStressMpa: 1.248884924174844,
    utilizationRatio: 1.1894142134998513,
    clippedPerimeterMm: 2360,
    removedPerimeterMm: 590,
    removedSegmentCount: 1,
    tangentCount: 2,
    openingAffected: true,
    edgeAffected: false,
    cornerAffected: false,
  },
}

describe('geometry verification comparison', () => {
  it('passes matching geometry comparison values', () => {
    const result = calculatePunchingShear(edgeCase.input)
    const comparison = compareGeometryVerification(edgeCase, result)

    expect(comparison.passed).toBe(true)
    expect(comparison.diffSummary).toContain('Geometry verification comparison passed.')
  })

  it('fails and reports readable diff summary for mismatched geometry', () => {
    const result = calculatePunchingShear(edgeCase.input)
    const comparison = compareGeometryVerification(
      {
        ...edgeCase,
        expected: {
          ...edgeCase.expected,
          clippedPerimeterMm: 999,
        },
      },
      result,
    )

    expect(comparison.passed).toBe(false)
    expect(comparison.diffSummary[0]).toContain('clippedPerimeterMm')
  })

  it('compares clipping values', () => {
    const result = calculatePunchingShear(edgeCase.input)
    const comparison = compareClippingVerification({
      expectedClippedPerimeterMm: edgeCase.expected.clippedPerimeterMm,
      expectedRemovedPerimeterMm: edgeCase.expected.removedPerimeterMm,
      actualClippedPerimeterMm: result.perimeter.clippedPerimeterMm,
      actualRemovedPerimeterMm: result.perimeter.removedPerimeterMm,
      toleranceMm: 0.001,
      status: edgeCase.status,
    })

    expect(comparison.passed).toBe(true)
  })

  it('compares tangent metadata', () => {
    const result = calculatePunchingShear(openingCase.input)
    const comparison = compareOpeningVerification({
      expectedOpeningAffected: openingCase.expected.openingAffected,
      expectedTangentCount: openingCase.expected.tangentCount,
      actualOpeningAffected: result.perimeter.openingAffected,
      actualTangents: result.perimeter.openingTangents,
      status: openingCase.status,
    })

    expect(comparison.passed).toBe(true)
    expect(comparison.actualTangentCount).toBe(2)
  })

  it('compares removed segment accounting', () => {
    const result = calculatePunchingShear(openingCase.input)
    const comparison = compareRemovedSegments({
      expectedCount: openingCase.expected.removedSegmentCount,
      expectedRemovedPerimeterMm: openingCase.expected.removedPerimeterMm,
      actualSegments: result.perimeter.removedSegments,
      toleranceMm: 0.001,
    })

    expect(comparison.passed).toBe(true)
    expect(comparison.actualCount).toBe(1)
  })

  it('generates verification snapshot HTML with geometry overlays', () => {
    const snapshot = buildVerificationSnapshot(openingCase)
    const html = buildVerificationSnapshotHtml(snapshot)

    expect(snapshot.metadata.format).toBe('Verification Snapshot')
    expect(html).toContain('Verification Snapshot')
    expect(html).toContain('active perimeter')
    expect(html).toContain('removed perimeter')
    expect(html).toContain('tangent count')
    expect(html).toContain('Openings and boundary clipping are draft geometry only.')
  })
})
