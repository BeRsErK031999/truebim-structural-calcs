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
    id: 'draft-center-with-mx',
    title: 'Draft center rectangular column with Mx',
    source: draftSource,
    standard: 'РЎРџ63 pending verification',
    caseType: 'center',
    input: {
      caseType: 'center',
      forces: {
        axialForceKn: 420,
        momentXKnM: 12,
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
      utilizationRatio: 1.0648569139021067,
      passed: true,
    },
    tolerance: draftTolerance,
    notes: 'Draft moment case keeps provisional stress redistribution values; governing pass/fail uses SP63 interaction.',
    status: 'draft',
  },
  {
    id: 'draft-center-with-my',
    title: 'Draft center rectangular column with My',
    source: draftSource,
    standard: 'РЎРџ63 pending verification',
    caseType: 'center',
    input: {
      caseType: 'center',
      forces: {
        axialForceKn: 420,
        momentXKnM: 0,
        momentYKnM: 12,
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
      utilizationRatio: 1.0648569139021067,
      passed: true,
    },
    tolerance: draftTolerance,
    notes: 'Draft moment case keeps provisional stress redistribution values; governing pass/fail uses SP63 interaction.',
    status: 'draft',
  },
  {
    id: 'draft-center-with-mx-my',
    title: 'Draft center rectangular column with Mx and My',
    source: draftSource,
    standard: 'РЎРџ63 pending verification',
    caseType: 'center',
    input: {
      caseType: 'center',
      forces: {
        axialForceKn: 420,
        momentXKnM: 12,
        momentYKnM: 8,
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
      utilizationRatio: 1.180054416420252,
      passed: false,
    },
    tolerance: draftTolerance,
    notes: 'Draft combined-moment case generated from current provisional linear stress redistribution.',
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
  {
    id: 'draft-edge-rectangular',
    title: 'Draft edge rectangular column clipping geometry',
    source: draftSource,
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
      passed: false,
    },
    tolerance: draftTolerance,
    notes: 'Draft edge case using current boundary clipping arithmetic only.',
    status: 'draft',
  },
  {
    id: 'draft-corner-rectangular',
    title: 'Draft corner rectangular column clipping geometry',
    source: draftSource,
    standard: 'SP63 pending verification',
    caseType: 'corner',
    input: {
      caseType: 'corner',
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
        topMm: 0,
      },
      openings: [],
      shearReinforcement: {
        enabled: false,
      },
    },
    expected: {
      controlPerimeterMm: 590,
      effectiveDepthMm: 190,
      shearStressMpa: 3.746654772524532,
      utilizationRatio: 3.568242640499554,
      passed: false,
    },
    tolerance: draftTolerance,
    notes: 'Draft corner case using current boundary clipping arithmetic only.',
    status: 'draft',
  },
  {
    id: 'draft-opening-near-column',
    title: 'Draft opening near rectangular column tangent subtraction',
    source: draftSource,
    standard: 'SP63 pending verification',
    caseType: 'opening',
    input: {
      caseType: 'opening',
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
      openings: [
        {
          id: 'opening-1',
          widthXMm: 200,
          widthYMm: 300,
          centerXMm: 600,
          centerYMm: 0,
        },
      ],
      shearReinforcement: {
        enabled: false,
      },
    },
    expected: {
      controlPerimeterMm: 1770,
      effectiveDepthMm: 190,
      shearStressMpa: 1.248884924174844,
      utilizationRatio: 1.1894142134998513,
      passed: false,
    },
    tolerance: draftTolerance,
    notes: 'Draft opening case using current tangent subtraction arithmetic only.',
    status: 'draft',
  },
  {
    id: 'draft-opening-with-moment',
    title: 'Draft opening near rectangular column with moments',
    source: draftSource,
    standard: 'SP63 pending verification',
    caseType: 'opening',
    input: {
      caseType: 'opening',
      forces: {
        axialForceKn: 420,
        momentXKnM: 12,
        momentYKnM: 8,
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
      openings: [
        {
          id: 'opening-1',
          widthXMm: 200,
          widthYMm: 300,
          centerXMm: 600,
          centerYMm: 0,
        },
      ],
      shearReinforcement: {
        enabled: false,
      },
    },
    expected: {
      controlPerimeterMm: 1770,
      effectiveDepthMm: 190,
      shearStressMpa: 1.248884924174844,
      utilizationRatio: 1.5926054723133602,
      passed: false,
    },
    tolerance: draftTolerance,
    notes: 'Draft opening plus moment case generated from current provisional geometry and stress redistribution.',
    status: 'draft',
  },
]
