import type { ConcreteClassName } from '../../types'

type VerifiedExpectedTemplate = {
  controlPerimeterMm: number | null
  effectiveDepthMm: number | null
  shearStressMpa: number | null
  utilizationRatio: number | null
  passed: boolean | null
}

type VerifiedCenterCaseTemplate = {
  id: string
  title: string
  source: string
  standard: string
  caseType: 'center'
  input: {
    caseType: 'center'
    forces: {
      axialForceKn: number
      momentXKnM: number
      momentYKnM: number
    }
    slab: {
      thicknessMm: number
      effectiveDepthMm: number
      concreteCoverMm: number
    }
    concrete: {
      className: ConcreteClassName
    }
    rectColumn: {
      widthXMm: number
      widthYMm: number
    }
    openings: []
    shearReinforcement: {
      enabled: false
    }
  }
  expected: VerifiedExpectedTemplate
  tolerance: {
    relativePercent: number
    absolute: number
  }
  notes: string
  status: 'draft' | 'verified'
}

export const verifiedCenterCaseTemplate: VerifiedCenterCaseTemplate = {
  id: 'verified-center-rect-TODO',
  title: 'Проверенный центральный случай для прямоугольной колонны',
  source: 'TODO: заменить на manual/webcad/excel/нормативный пример с описанием источника',
  standard: 'СП63.13330',
  caseType: 'center',
  input: {
    caseType: 'center',
    forces: {
      axialForceKn: 0,
      momentXKnM: 0,
      momentYKnM: 0,
    },
    slab: {
      thicknessMm: 0,
      effectiveDepthMm: 0,
      concreteCoverMm: 0,
    },
    concrete: {
      className: 'B25',
    },
    rectColumn: {
      widthXMm: 0,
      widthYMm: 0,
    },
    openings: [],
    shearReinforcement: {
      enabled: false,
    },
  },
  expected: {
    controlPerimeterMm: null,
    effectiveDepthMm: null,
    shearStressMpa: null,
    utilizationRatio: null,
    passed: null,
  },
  tolerance: {
    relativePercent: 0.1,
    absolute: 0.000001,
  },
  notes: 'TODO: описать допущения, версию источника и кто выполнил инженерную сверку.',
  status: 'draft',
}
