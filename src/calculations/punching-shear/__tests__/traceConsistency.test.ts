import { describe, expect, it } from 'vitest'

import { buildPunchingShearHtmlReport } from '@/features/report-export/reportHtml'
import { buildPunchingShearMarkdownReport } from '@/features/report-export/reportMarkdown'

import { defaultPunchingShearInput } from '../defaults'
import { calculatePunchingShear } from '../engine'
import { buildPunchingShearReport } from '../report'
import { buildPunchingShearTrace } from '../trace/traceBuilder'
import type { PunchingShearInput } from '../types'
import { formatTraceSourceLabel, traceSourceLabels } from '../trace/traceLabels'
import type { TraceSourceType } from '../trace/traceStep'

const allowedSourceTypes = new Set<TraceSourceType>([
  'verified',
  'partial',
  'draft',
  'manual',
  'placeholder',
])

const scenarios: Array<{
  name: string
  input: PunchingShearInput
  draftOnly?: boolean
  warningPattern?: RegExp
}> = [
  {
    name: 'center force-only',
    input: defaultPunchingShearInput,
  },
  {
    name: 'center + moments',
    input: {
      ...defaultPunchingShearInput,
      forces: {
        axialForceKn: 420,
        momentXKnM: 12,
        momentYKnM: 8,
      },
    },
    draftOnly: true,
    warningPattern: /Moment transfer/i,
  },
  {
    name: 'edge',
    input: {
      ...defaultPunchingShearInput,
      caseType: 'edge',
    },
    draftOnly: true,
    warningPattern: /boundary|draft/i,
  },
  {
    name: 'corner',
    input: {
      ...defaultPunchingShearInput,
      caseType: 'corner',
    },
    draftOnly: true,
    warningPattern: /boundary|draft/i,
  },
  {
    name: 'opening',
    input: {
      ...defaultPunchingShearInput,
      caseType: 'opening',
      openings: [
        {
          id: 'audit-opening-1',
          widthXMm: 400,
          widthYMm: 300,
          centerXMm: 650,
          centerYMm: 0,
        },
      ],
    },
    draftOnly: true,
    warningPattern: /Openings|opening|draft/i,
  },
  {
    name: 'wall-end',
    input: {
      ...defaultPunchingShearInput,
      caseType: 'wall-end',
    },
    draftOnly: true,
    warningPattern: /Wall-end|wall|draft/i,
  },
  {
    name: 'wall-corner',
    input: {
      ...defaultPunchingShearInput,
      caseType: 'wall-corner',
    },
    draftOnly: true,
    warningPattern: /Wall-corner|wall|draft/i,
  },
  {
    name: 'multiple contours',
    input: {
      ...defaultPunchingShearInput,
      multipleContours: {
        enabled: true,
        count: 3,
        offsetStep: 'h0/2',
      },
    },
    draftOnly: true,
    warningPattern: /Multiple contour|contour|draft/i,
  },
  {
    name: 'shear reinforcement',
    input: {
      ...defaultPunchingShearInput,
      shearReinforcement: {
        ...defaultPunchingShearInput.shearReinforcement,
        enabled: true,
      },
    },
    draftOnly: true,
    warningPattern: /Shear reinforcement|reinforcement|draft/i,
  },
  {
    name: 'round center',
    input: {
      ...defaultPunchingShearInput,
      caseType: 'round',
      roundColumn: {
        ...defaultPunchingShearInput.roundColumn!,
        position: 'center',
      },
    },
    draftOnly: true,
    warningPattern: /Round column|round|draft/i,
  },
  {
    name: 'round unsupported edge',
    input: {
      ...defaultPunchingShearInput,
      caseType: 'round',
      roundColumn: {
        ...defaultPunchingShearInput.roundColumn!,
        position: 'edge',
      },
    },
    draftOnly: true,
    warningPattern: /not implemented|unsupported|Round edge/i,
  },
  {
    name: 'round unsupported corner',
    input: {
      ...defaultPunchingShearInput,
      caseType: 'round',
      roundColumn: {
        ...defaultPunchingShearInput.roundColumn!,
        position: 'corner',
      },
    },
    draftOnly: true,
    warningPattern: /not implemented|unsupported|Round edge/i,
  },
]

describe('trace consistency audit', () => {
  it.each(scenarios)('keeps trace and result fields aligned for $name', ({ input }) => {
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const steps = report.calculationTrace.flatMap((section) => section.steps)

    expect(report.calculationTrace.length).toBeGreaterThan(0)
    expect(steps.length).toBeGreaterThan(0)
    expect(report.calculationTrace).toEqual(buildPunchingShearTrace(input, result))

    expect(findStep(steps, 'control-perimeter')?.result).toBe(formatNullable(result.controlPerimeterMm))
    expect(findStep(steps, 'effective-depth')?.result).toBe(formatNullable(result.effectiveDepthMm))
    expect(findStep(steps, 'stress')?.result).toBe(formatNullable(result.shearStressMpa, 6))
    expect(findStep(steps, 'utilization')?.result).toBe(formatNullable(result.utilizationRatio, 6))

    expect(findStep(steps, 'verification-level')?.result).toBe(result.verificationLevel.toUpperCase())
  })

  it.each(scenarios)('keeps exported reports aligned with trace steps for $name', ({ input }) => {
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(html).toContain('Calculation Trace')
    expect(markdown).toContain('## Calculation Trace')

    for (const section of report.calculationTrace) {
      expect(html).toContain(section.title)
      expect(markdown).toContain(section.title)

      for (const step of section.steps) {
        expect(html).toContain(step.title)
        expect(markdown).toContain(step.title)
        expect(decodeHtml(html)).toContain(step.formula)
        expect(markdown).toContain(step.formula)
        expect(html).toContain(formatTraceSourceLabel(step.sourceType))
        expect(markdown).toContain(formatTraceSourceLabel(step.sourceType))
      }
    }
  })

  it.each(scenarios)('uses allowed finite trace values for $name', ({ input }) => {
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const serializedTrace = JSON.stringify(report.calculationTrace)

    expect(serializedTrace).not.toMatch(/\b(?:NaN|Infinity|-Infinity)\b/)

    for (const step of report.calculationTrace.flatMap((section) => section.steps)) {
      expect(allowedSourceTypes.has(step.sourceType)).toBe(true)
    }
  })

  it.each(scenarios.filter((scenario) => scenario.draftOnly))(
    'does not mark draft-only scenario trace steps as verified for $name',
    ({ input }) => {
      const result = calculatePunchingShear(input)
      const report = buildPunchingShearReport(input, result)
      const nonLifecycleSteps = report.calculationTrace
        .flatMap((section) => section.steps)
        .filter((step) => step.id !== 'input-validation' && step.id !== 'verification-level')

      expect(
        result.draftFeatures.some((feature) => result.verifiedFeatures.includes(feature)),
      ).toBe(false)
      expect(nonLifecycleSteps.some((step) => step.sourceType === 'verified')).toBe(false)
    },
  )

  it.each(scenarios.filter((scenario) => scenario.warningPattern))(
    'surfaces expected draft/partial warnings for $name',
    ({ input, warningPattern }) => {
      const result = calculatePunchingShear(input)
      const report = buildPunchingShearReport(input, result)
      const traceWarnings = report.calculationTrace.flatMap((section) =>
        section.steps.flatMap((step) => step.warnings),
      )
      const allWarnings = [...result.warnings, ...traceWarnings].join('\n')

      expect(allWarnings).toMatch(warningPattern!)
    },
  )

  it.each(scenarios)('does not expose internal IDs as visible trace labels for $name', ({ input }) => {
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const labels = report.calculationTrace.flatMap((section) => [
      section.title,
      ...section.steps.map((step) => step.title),
    ])

    for (const label of labels) {
      expect(label).not.toMatch(/^[a-z]+(?:-[a-z0-9]+)+$/)
    }

    for (const sourceLabel of Object.values(traceSourceLabels)) {
      expect(sourceLabel).not.toMatch(/^[a-z]+$/)
    }
  })
})

function findStep<T extends { id: string }>(steps: T[], id: string) {
  return steps.find((step) => step.id === id)
}

function formatNullable(value: number | null | undefined, digits = 3) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? 'n/a'
    : value.toFixed(digits)
}

function decodeHtml(value: string) {
  return value
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}
