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

  it('builds a Markdown report with the formula', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

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
    })

    expect(exportCurrentCalculationAsHtml()).toEqual({
      ok: true,
      filename: expect.stringMatching(
        /^truebim-punching-shear-report-ps-center-\d{8}-\d{6}-[a-zA-Z0-9-]+\.html$/,
      ),
    })
    expect(mockedDownloadTextFile).toHaveBeenCalledOnce()
  })

  it('guards export when no calculation exists', () => {
    expect(exportCurrentCalculationAsHtml()).toEqual({
      ok: false,
      error: 'Сначала выполните расчет, затем выгрузите отчет.',
    })
    expect(mockedDownloadTextFile).not.toHaveBeenCalled()
  })
})
