import { beforeEach, describe, expect, it, vi } from 'vitest'

import { defaultPunchingShearInput } from '@/calculations/punching-shear/defaults'
import { calculatePunchingShear } from '@/calculations/punching-shear/engine'
import { buildPunchingShearReport } from '@/calculations/punching-shear/report'
import { useCalculationStore } from '@/entities/calculation/model/store'

import { downloadTextFile } from '../downloadFile'
import {
  buildReportSummary,
  buildPunchingShearHtmlReport,
  buildPunchingShearMarkdownReport,
  createCalculationId,
  formatUtilization,
  exportCurrentCalculationAsHtml,
  exportCurrentCalculationAsMarkdown,
  sanitizeFileName,
} from '../index'

vi.mock('../downloadFile', () => ({
  downloadTextFile: vi.fn(),
}))

const mockedDownloadTextFile = vi.mocked(downloadTextFile)

describe('report export', () => {
  beforeEach(() => {
    mockedDownloadTextFile.mockReset()
    useCalculationStore.setState({
      draft: defaultPunchingShearInput,
      punchingShearResult: null,
      punchingShearReport: null,
      activeCalculationId: null,
      activeSavedCalculationId: null,
    })
  })

  it('builds an HTML report with the draft warning', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)

    expect(html).toContain('DRAFT CALCULATION - NOT FOR DESIGN USE')
    expect(html).toContain('TrueBIM Structural Calculations - Punching Shear Report')
  })

  it('includes verification capability sections', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    expect(html).toContain('Verification Capabilities')
    expect(html).toContain('Verification Evidence')
    expect(markdown).toContain('## Verification Capabilities')
    expect(markdown).toContain('verified-center-rect-001')
  })

  it('includes the applicability section in exported reports', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    expect(html).toContain('Applicability')
    expect(html).toContain('Suitable for pilot review, comparison, and evidence collection.')
    expect(html).toContain('Not a final design document unless verified capability coverage matches the selected case.')
    expect(markdown).toContain('## Applicability')
    expect(markdown).toContain('- partial features: none')
    expect(markdown).toContain('- draft features: none')
  })

  it('builds a Markdown report with the formula', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    expect(markdown).toContain('v = N / (u * h0)')
  })

  it('includes the calculation trace section in exported reports', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    expect(html).toContain('Calculation Trace')
    expect(html).toContain('Input validation')
    expect(html).toContain('VERIFIED - center-force-only evidence: verified-center-rect-001')
    expect(markdown).toContain('## Calculation Trace')
    expect(markdown).toContain('Stress')
    expect(markdown).toContain('v = N / (u * h0)')
  })

  it('includes moment transfer and stress distribution sections', () => {
    const input = {
      ...defaultPunchingShearInput,
      forces: {
        axialForceKn: 420,
        momentXKnM: 12,
        momentYKnM: 8,
      },
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(html).toContain('Moment Transfer')
    expect(html).toContain('Stress Distribution')
    expect(html).toContain('Stress Regression')
    expect(html).toContain('Axis Convention')
    expect(html).toContain('Moment transfer draft-only')
    expect(markdown).toContain('## Moment Transfer')
    expect(markdown).toContain('## Stress Distribution')
    expect(markdown).toContain('## Stress Regression')
    expect(markdown).toContain('## Axis Convention')
  })

  it('includes input N and calculated u, h0, v and utilization values', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    expect(markdown).toContain(`| N | ${defaultPunchingShearInput.forces.axialForceKn} kN |`)
    expect(markdown).toContain(`| u | ${result.controlPerimeterMm} mm |`)
    expect(markdown).toContain(`| h0 | ${result.effectiveDepthMm} mm |`)
    expect(markdown).toContain(`| v | ${result.shearStressMpa?.toFixed(3)} MPa |`)
    expect(markdown).toContain(
      `| utilization ratio | ${result.utilizationRatio?.toFixed(3)} (${(
        (result.utilizationRatio ?? 0) * 100
      ).toFixed(1)}%) |`,
    )
  })

  it('generates calculation IDs with timestamp and short commit', () => {
    expect(createCalculationId(new Date(2026, 4, 26, 4, 17, 54))).toMatch(
      /^ps-center-20260526-041754-[a-zA-Z0-9-]+$/,
    )
  })

  it('formats utilization with ratio and percent', () => {
    expect(formatUtilization(0.8920606601248884)).toBe('0.892 (89.2%)')
  })

  it('includes assumptions, unsupported features and verification source in reports', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const metadata = {
      generatedAt: '2026-05-26T04:17:54.000Z',
      calculationId: 'ps-center-20260526-041754-d576a71',
      verificationSource: 'NOT VERIFIED' as const,
    }
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report, metadata)
    const markdown = buildPunchingShearMarkdownReport(
      defaultPunchingShearInput,
      result,
      report,
      metadata,
    )

    expect(html).toContain('Assumptions')
    expect(html).toContain('Openings use draft tangent subtraction geometry')
    expect(html).toContain('Unsupported in this draft')
    expect(html).toContain('verified SP63 coefficients')
    expect(html).toContain('Verification source')
    expect(html).toContain('NOT VERIFIED')
    expect(markdown).toContain('## Assumptions')
    expect(markdown).toContain('## Unsupported in this draft')
    expect(markdown).toContain('- Verification source: NOT VERIFIED')
  })

  it('renders SVG numeric labels and axes in HTML report', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)

    expect(html).toContain('400 mm column X')
    expect(html).toContain('95 mm draft offset')
    expect(html).toContain('X')
    expect(html).toContain('Y')
    expect(html).toContain('Scale: 1 unit = 1 mm, fit-to-view')
  })

  it('includes wall geometry section in exported reports', () => {
    const input = {
      ...defaultPunchingShearInput,
      caseType: 'wall-end' as const,
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(report.wallGeometrySummary).toMatchObject({
      enabled: true,
      wallLengthMm: 1200,
      wallThicknessMm: 200,
    })
    expect(html).toContain('Wall Geometry')
    expect(html).toContain('Draft wall punching geometry')
    expect(markdown).toContain('## Wall Geometry')
    expect(markdown).toContain('| wall length | 1200 mm |')
    expect(markdown).toContain('Wall-end punching support is draft geometry only.')
  })

  it('includes wall corner geometry section in exported reports', () => {
    const input = {
      ...defaultPunchingShearInput,
      caseType: 'wall-corner' as const,
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(report.wallCornerGeometrySummary).toMatchObject({
      enabled: true,
      wallLengthXMm: 1200,
      wallLengthYMm: 1000,
      wallThicknessXMm: 200,
      wallThicknessYMm: 220,
      orientation: 'top-left',
      applicability: 'draft-only',
    })
    expect(html).toContain('Wall Corner Geometry')
    expect(html).toContain('Draft wall corner punching geometry')
    expect(markdown).toContain('## Wall Corner Geometry')
    expect(markdown).toContain('| wall length X | 1200 mm |')
    expect(markdown).toContain('| applicability | draft-only |')
    expect(markdown).toContain('Wall-corner punching support is draft geometry only.')
  })

  it('includes round column geometry section in exported reports', () => {
    const input = {
      ...defaultPunchingShearInput,
      caseType: 'round' as const,
      roundColumn: {
        diameterMm: 400,
        slabThickness: 220,
        effectiveDepth: 190,
        cover: 30,
        position: 'center' as const,
      },
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(report.roundGeometrySummary).toMatchObject({
      enabled: true,
      diameterMm: 400,
      position: 'center',
      applicability: 'draft-only',
    })
    expect(html).toContain('Round Column Geometry')
    expect(html).toContain('400 mm diameter')
    expect(markdown).toContain('## Round Column Geometry')
    expect(markdown).toContain('| diameter | 400 mm |')
    expect(markdown).toContain('Round column perimeter is draft-only and requires SP63 verification.')
  })

  it('includes multiple control perimeter section in exported reports', () => {
    const input = {
      ...defaultPunchingShearInput,
      multipleContours: {
        enabled: true,
        count: 2,
        offsetStep: 'h0/2' as const,
      },
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(html).toContain('Multiple Control Perimeters')
    expect(html).toContain('Multiple contour selection is draft-only and requires SP63 verification.')
    expect(markdown).toContain('## Multiple Control Perimeters')
    expect(markdown).toContain('draft-contour-1')
  })

  it('includes shear reinforcement section in exported reports', () => {
    const input = {
      ...defaultPunchingShearInput,
      shearReinforcement: {
        ...defaultPunchingShearInput.shearReinforcement,
        enabled: true,
      },
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(report.shearReinforcementSummary).toMatchObject({
      enabled: true,
      steelClass: 'A400',
      layoutType: 'closed-stirrups',
      rowCount: 2,
      legsPerRow: 4,
    })
    expect(html).toContain('Shear Reinforcement')
    expect(html).toContain('Draft reinforcement layout: closed-stirrups')
    expect(markdown).toContain('## Shear Reinforcement')
    expect(markdown).toContain('| steel class | A400 |')
    expect(markdown).toContain('Shear reinforcement contribution is DRAFT-only.')
  })

  it('formats copy report summary', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)

    expect(buildReportSummary(result)).toBe(
      'N=420kN | u=2360mm | h0=190mm | v=0.937MPa | util=0.892',
    )
  })

  it('sanitizes unsafe filenames', () => {
    expect(sanitizeFileName(' ../bad:name report?.html ')).toBe('bad-name-report.html')
  })

  it('downloads through a mocked downloadFile implementation without crashing', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)

    useCalculationStore.setState({
      draft: defaultPunchingShearInput,
      punchingShearResult: result,
      punchingShearReport: report,
      activeCalculationId: 'calc-stable-report-id',
    })

    expect(exportCurrentCalculationAsHtml()).toEqual({
      ok: true,
      filename: 'truebim-punching-shear-report-calc-stable-report-id.html',
    })
    expect(mockedDownloadTextFile).toHaveBeenCalledOnce()
    expect(mockedDownloadTextFile.mock.calls[0][1]).toContain('calc-stable-report-id')
  })

  it('uses the same stable calculation ID for HTML and Markdown exports', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)

    useCalculationStore.setState({
      draft: defaultPunchingShearInput,
      punchingShearResult: result,
      punchingShearReport: report,
      activeCalculationId: 'calc-shared-id',
    })

    expect(exportCurrentCalculationAsHtml()).toMatchObject({
      ok: true,
      filename: 'truebim-punching-shear-report-calc-shared-id.html',
    })
    expect(exportCurrentCalculationAsMarkdown()).toMatchObject({
      ok: true,
      filename: 'truebim-punching-shear-report-calc-shared-id.md',
    })
    expect(mockedDownloadTextFile.mock.calls[0][1]).toContain('calc-shared-id')
    expect(mockedDownloadTextFile.mock.calls[1][1]).toContain('calc-shared-id')
  })

  it('guards export when no calculation exists', () => {
    expect(exportCurrentCalculationAsHtml()).toEqual({
      ok: false,
      error: 'Сначала выполните расчет, затем выгрузите отчет.',
    })
    expect(mockedDownloadTextFile).not.toHaveBeenCalled()
  })
})
