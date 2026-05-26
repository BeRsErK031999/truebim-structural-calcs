import { useCalculationStore } from '@/entities/calculation/model/store'

import { downloadTextFile } from './downloadFile'
import { buildPunchingShearHtmlReport } from './reportHtml'
import { buildPunchingShearMarkdownReport } from './reportMarkdown'
import { createReportMetadata } from './reportMetadata'
import { sanitizeFileName } from './sanitizeFileName'

type ExportCalculationResult =
  | { ok: true; filename: string }
  | { ok: false; error: string }

export function exportCurrentCalculationAsHtml(): ExportCalculationResult {
  const state = useCalculationStore.getState()

  if (!state.draft || !state.punchingShearResult || !state.punchingShearReport) {
    return { ok: false, error: 'Сначала выполните расчет, затем выгрузите отчет.' }
  }

  try {
    const reportMetadata = createReportMetadata()
    const content = buildPunchingShearHtmlReport(
      state.draft,
      state.punchingShearResult,
      state.punchingShearReport,
      reportMetadata,
    )
    const filename = createReportFilename(reportMetadata.calculationId, 'html')

    downloadTextFile(filename, content, 'text/html')

    return { ok: true, filename }
  } catch (error) {
    return { ok: false, error: getDownloadErrorMessage(error) }
  }
}

export function exportCurrentCalculationAsMarkdown(): ExportCalculationResult {
  const state = useCalculationStore.getState()

  if (!state.draft || !state.punchingShearResult || !state.punchingShearReport) {
    return { ok: false, error: 'Сначала выполните расчет, затем выгрузите отчет.' }
  }

  try {
    const reportMetadata = createReportMetadata()
    const content = buildPunchingShearMarkdownReport(
      state.draft,
      state.punchingShearResult,
      state.punchingShearReport,
      reportMetadata,
    )
    const filename = createReportFilename(reportMetadata.calculationId, 'md')

    downloadTextFile(filename, content, 'text/markdown')

    return { ok: true, filename }
  } catch (error) {
    return { ok: false, error: getDownloadErrorMessage(error) }
  }
}

function createReportFilename(calculationId: string, extension: 'html' | 'md') {
  return sanitizeFileName(`truebim-punching-shear-report-${calculationId}.${extension}`)
}

function getDownloadErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return `Не удалось скачать отчет: ${error.message}`
  }

  return 'Не удалось скачать отчет. Проверьте настройки браузера и повторите попытку.'
}
