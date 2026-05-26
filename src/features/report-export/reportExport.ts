import { useCalculationStore } from '@/entities/calculation/model/store'

import { downloadTextFile } from './downloadFile'
import { buildPunchingShearHtmlReport } from './reportHtml'
import { buildPunchingShearMarkdownReport } from './reportMarkdown'
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
    const content = buildPunchingShearHtmlReport(
      state.draft,
      state.punchingShearResult,
      state.punchingShearReport,
    )
    const filename = createReportFilename('html')

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
    const content = buildPunchingShearMarkdownReport(
      state.draft,
      state.punchingShearResult,
      state.punchingShearReport,
    )
    const filename = createReportFilename('md')

    downloadTextFile(filename, content, 'text/markdown')

    return { ok: true, filename }
  } catch (error) {
    return { ok: false, error: getDownloadErrorMessage(error) }
  }
}

function createReportFilename(extension: 'html' | 'md') {
  const date = new Date().toISOString().slice(0, 10)

  return sanitizeFileName(`truebim-punching-shear-report-${date}.${extension}`)
}

function getDownloadErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return `Не удалось скачать отчет: ${error.message}`
  }

  return 'Не удалось скачать отчет. Проверьте настройки браузера и повторите попытку.'
}
