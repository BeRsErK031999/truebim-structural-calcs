import { describe, expect, it } from 'vitest'

import { validateVerifiedCase } from './create-verified-case.mjs'

const validVerifiedCase = {
  id: 'verified-center-rect-001',
  title: 'Проверенный центральный случай',
  source: 'manual calculation by structural engineer',
  standard: 'СП63.13330',
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
    shearStressMpa: 0.94,
    utilizationRatio: 0.9,
    passed: true,
  },
  tolerance: {
    relativePercent: 0.1,
    absolute: 0.000001,
  },
  notes: 'Инженерная сверка выполнена отдельно от draft arithmetic.',
  status: 'verified',
}

describe('verified case validation helper', () => {
  it('rejects null expected values', () => {
    const result = validateVerifiedCase({
      ...validVerifiedCase,
      expected: {
        ...validVerifiedCase.expected,
        shearStressMpa: null,
      },
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toContain(
      'Поле "expected.shearStressMpa" должно быть числом, null/TODO не допускается.',
    )
  })

  it('rejects verified status without trusted source', () => {
    const result = validateVerifiedCase({
      ...validVerifiedCase,
      source: 'internal draft arithmetic, not СП63 verified',
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toContain(
      'Поле "source" должно содержать один из trusted marker: manual, webcad, excel, нормативный пример.',
    )
  })

  it('accepts verified case with numeric expected values and trusted source', () => {
    expect(validateVerifiedCase(validVerifiedCase)).toEqual({
      valid: true,
      errors: [],
    })
  })

  it('rejects status verified if source is weak', () => {
    const result = validateVerifiedCase({
      ...validVerifiedCase,
      source: 'checked visually by developer',
    })

    expect(result.valid).toBe(false)
  })
})
