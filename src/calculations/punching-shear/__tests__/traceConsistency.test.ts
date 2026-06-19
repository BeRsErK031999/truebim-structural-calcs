import { describe, expect, it } from 'vitest'

import { buildPunchingShearHtmlReport } from '@/features/report-export/reportHtml'
import { buildPunchingShearMarkdownReport } from '@/features/report-export/reportMarkdown'

import { defaultPunchingShearInput } from '../defaults'
import { calculatePunchingShear } from '../engine'
import { buildPunchingShearReport } from '../report'
import { buildPunchingShearTrace } from '../trace/traceBuilder'
import { buildEngineeringReportListing } from '../trace/engineeringReportLines'
import { traceSourceLabels } from '../trace/traceLabels'
import type { TraceSourceType } from '../trace/traceStep'
import type { PunchingShearInput } from '../types'

const allowedSourceTypes = new Set<TraceSourceType>([
  'verified',
  'partial',
  'draft',
  'manual',
  'placeholder',
])
const eta = '\u03b7'

const scenarios: Array<{
  name: string
  input: PunchingShearInput
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
    warningPattern: /Moment transfer/i,
  },
  {
    name: 'edge',
    input: {
      ...defaultPunchingShearInput,
      caseType: 'edge',
    },
    warningPattern: /boundary|draft/i,
  },
  {
    name: 'corner',
    input: {
      ...defaultPunchingShearInput,
      caseType: 'corner',
    },
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
    warningPattern: /Openings|opening|draft/i,
  },
  {
    name: 'wall-end',
    input: {
      ...defaultPunchingShearInput,
      caseType: 'wall-end',
    },
    warningPattern: /Wall-end|wall|draft/i,
  },
  {
    name: 'wall-corner',
    input: {
      ...defaultPunchingShearInput,
      caseType: 'wall-corner',
    },
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

  it.each(scenarios)('renders exported reports as engineering calculation listings for $name', ({ input }) => {
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)
    const listing = buildEngineeringReportListing(input, result, report)

    expect(html).toContain('Расчет на продавливание')
    expect(html).toContain('1. Допущения и предпосылки')
    expect(html).toContain('2. Исходные данные')
    expect(html).toContain('3. Расчет')
    expect(html).toContain('4. Проверка условия')
    expect(html).toContain('5. Вывод')
    expect(markdown).toContain('## 1. Допущения и предпосылки')
    expect(markdown).toContain('## 3. Расчет')
    if (result.status !== 'not_implemented' && result.status !== 'invalid_input') {
      expect(markdown).toContain('A_b = u · h₀')
      expect(markdown).toContain('F_b,ult = Rbt · A_b')
    }
    expect(markdown).toContain(`${eta} =`)
    expect(markdown).not.toContain('Формула:')
    expect(markdown).not.toContain('Подстановка:')
    expect(markdown).not.toContain('Результат:')
    expect(markdown).not.toContain('offset')
    expect(html).not.toContain('черновое смещение')

    for (const section of listing.calculationSections) {
      expect(html).toContain(section.title)
      expect(markdown).toContain(section.title)
    }

    expect(decodeHtml(html)).not.toMatch(/\b(?:DTO|schema|safeParse|explainability|trace foundation)\b/i)
    expect(markdown).not.toMatch(/\b(?:DTO|schema|safeParse|explainability|trace foundation)\b/i)
    expect(markdown).not.toMatch(/\bu = u\b|\bh0 = h0\b|\bR = R\b|η = η/)
    expect(markdown).not.toContain('n/a')
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

  it('does not leak trace source labels into exported reports', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    for (const sourceLabel of Object.values(traceSourceLabels)) {
      expect(html).not.toContain(sourceLabel)
      expect(markdown).not.toContain(sourceLabel)
    }
  })
})

function findStep<T extends { id: string }>(steps: T[], id: string) {
  return steps.find((step) => step.id === id)
}

function formatNullable(value: number | null | undefined, decimals = 3) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'n/a'
  }

  return value.toFixed(decimals)
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
