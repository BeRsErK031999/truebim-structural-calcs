import { describe, expect, it } from 'vitest'

import { defaultPunchingShearInput } from '../defaults'
import { calculatePunchingShear } from '../engine'
import { buildPunchingShearReport } from '../report'
import { punchingShearInputSchema } from '../schemas'

describe('punching shear clean-room scaffold', () => {
  it('validates the default input', () => {
    expect(() => punchingShearInputSchema.parse(defaultPunchingShearInput)).not.toThrow()
  })

  it('returns not_implemented status from the engine', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)

    expect(result.status).toBe('not_implemented')
  })

  it('includes the engineering stub warning in the report', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)

    expect(report.warnings).toContain('Engineering formulas are not implemented yet')
  })

  it('rejects negative dimensions', () => {
    const input = {
      ...defaultPunchingShearInput,
      slab: {
        ...defaultPunchingShearInput.slab,
        thicknessMm: -220,
      },
    }

    expect(() => punchingShearInputSchema.parse(input)).toThrow()
  })
})
