import type { VerificationCase } from './verificationCase'

const draftSource = 'internal draft arithmetic, not СП63 verified'
const draftTolerance = {
  relativePercent: 0.000001,
  absolute: 0.000001,
}
const manualVerificationTolerance = {
  relativePercent: 0.1,
  absolute: 0.000001,
}

export const punchingShearVerificationCases: VerificationCase[] = [
  {
    id: 'verified-center-rect-001',
    title: 'Verified center rectangular column manual arithmetic check',
    source:
      'manual calculation: center rectangular column punching shear arithmetic, checked 2026-05-26',
    verificationSource: 'Manual engineer calculation',
    checkedBy: 'manual verification workflow',
    checkedAt: '2026-05-26',
    comparisonNotes:
      'Manual check: u = 2360 mm, h0 = 190 mm, v = 0.936663693 MPa, utilization = 0.892060660, passed = true.',
    standard: 'SP63.13330',
    caseType: 'center',
    input: {
      caseType: 'center',
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
      openings: [],
      shearReinforcement: {
        enabled: false,
      },
    },
    expected: {
      controlPerimeterMm: 2360,
      effectiveDepthMm: 190,
      shearStressMpa: 0.936663693131133,
      utilizationRatio: 0.8920606601248884,
      passed: true,
    },
    tolerance: manualVerificationTolerance,
    notes:
      'Verified against a manual arithmetic check for the current center rectangular draft scope. The draft warning remains because broader SP63 behavior is still not verified.',
    status: 'verified',
  },
  {
    id: 'draft-center-rect-001',
    title: 'Draft center rectangular column, default geometry',
    source: draftSource,
    standard: 'СП63 pending verification',
    caseType: 'center',
    input: {
      caseType: 'center',
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
      openings: [],
      shearReinforcement: {
        enabled: false,
      },
    },
    expected: {
      controlPerimeterMm: 2360,
      effectiveDepthMm: 190,
      shearStressMpa: 0.936663693131133,
      utilizationRatio: 0.8920606601248884,
      passed: true,
    },
    tolerance: draftTolerance,
    notes: 'Draft baseline produced by the current placeholder arithmetic only.',
    status: 'draft',
  },
  {
    id: 'draft-center-rect-002',
    title: 'Draft center rectangular column, higher load',
    source: draftSource,
    standard: 'СП63 pending verification',
    caseType: 'center',
    input: {
      caseType: 'center',
      forces: {
        axialForceKn: 600,
        momentXKnM: 0,
        momentYKnM: 0,
      },
      slab: {
        thicknessMm: 240,
        effectiveDepthMm: 205,
        concreteCoverMm: 35,
      },
      concrete: {
        className: 'B30',
      },
      rectColumn: {
        widthXMm: 500,
        widthYMm: 350,
      },
      openings: [],
      shearReinforcement: {
        enabled: false,
      },
    },
    expected: {
      controlPerimeterMm: 2520,
      effectiveDepthMm: 205,
      shearStressMpa: 1.16144018583043,
      utilizationRatio: 1.0099479876786346,
      passed: false,
    },
    tolerance: draftTolerance,
    notes: 'Draft failing example for summary and regression checks.',
    status: 'draft',
  },
  {
    id: 'draft-center-rect-003',
    title: 'Draft center rectangular column, reduced depth',
    source: draftSource,
    standard: 'СП63 pending verification',
    caseType: 'center',
    input: {
      caseType: 'center',
      forces: {
        axialForceKn: 250,
        momentXKnM: 0,
        momentYKnM: 0,
      },
      slab: {
        thicknessMm: 190,
        effectiveDepthMm: 160,
        concreteCoverMm: 30,
      },
      concrete: {
        className: 'B20',
      },
      rectColumn: {
        widthXMm: 300,
        widthYMm: 500,
      },
      openings: [],
      shearReinforcement: {
        enabled: false,
      },
    },
    expected: {
      controlPerimeterMm: 2240,
      effectiveDepthMm: 160,
      shearStressMpa: 0.6975446428571429,
      utilizationRatio: 0.7750496031746033,
      passed: true,
    },
    tolerance: draftTolerance,
    notes: 'Draft baseline for a rectangular column with unequal side lengths.',
    status: 'draft',
  },
]
