import type {
  PunchingShearInput,
  PunchingShearReportModel,
  PunchingShearResult,
} from '@/calculations/punching-shear'
import {
  buildEngineeringReportListing,
  type EngineeringReportLine,
  type EngineeringReportServiceBlock,
  unavailableParameterText,
} from '@/calculations/punching-shear/trace/engineeringReportLines'
import { getAppMetadata } from '@/shared/config/appMetadata'

import { createReportMetadata, type ReportMetadata } from './reportMetadata'

export function buildPunchingShearMarkdownReport(
  input: PunchingShearInput,
  result: PunchingShearResult,
  report: PunchingShearReportModel,
  reportMetadata: ReportMetadata = createReportMetadata(),
) {
  const metadata = getAppMetadata()
  const listing = buildEngineeringReportListing(input, result, report)
  const serviceBlocks: EngineeringReportServiceBlock[] = [
    ...listing.serviceBlocks,
    {
      id: 'metadata',
      title: 'Метаданные',
      rows: [
        { label: 'calculationId', value: reportMetadata.calculationId },
        { label: 'generatedAt', value: reportMetadata.generatedAt },
        { label: 'версия приложения', value: metadata.version },
        { label: 'commit', value: metadata.commit },
        { label: 'время сборки', value: metadata.buildTime },
        { label: 'источник проверки', value: formatVerificationSource(reportMetadata.verificationSource) },
      ],
    },
  ]

  return [
    '# Расчет на продавливание',
    '',
    `${listing.resultSummary.verificationText}. ${listing.resultSummary.statusText}. η = ${listing.resultSummary.utilizationText}.`,
    '',
    '## 1. Допущения и предпосылки',
    '',
    listing.assumptionsText,
    '',
    '## 2. Исходные данные',
    '',
    listing.inputText,
    '',
    '## 3. Расчет',
    '',
    ...listing.calculationSections.flatMap((section) => [
      `### ${section.title}`,
      '',
      renderCalculationLines(section.lines),
      '',
    ]),
    '## 4. Проверка условия',
    '',
    renderCalculationLines(listing.conditionLines),
    '',
    '## 5. Вывод',
    '',
    renderCalculationLines(listing.conclusionLines),
    '',
    `calculationId: ${reportMetadata.calculationId}; версия расчетного движка: ${metadata.version}; дата формирования: ${reportMetadata.generatedAt}; commit: ${metadata.commit}; verificationStatus: ${result.verificationStatus}.`,
    '',
    '## Техническое приложение',
    '',
    ...serviceBlocks.flatMap(renderServiceBlock),
    '',
  ].join('\n')
}

function renderCalculationLines(lines: EngineeringReportLine[]) {
  return lines.map((line) => cleanReportText(line.text)).join('\n\n')
}

function renderServiceBlock(block: EngineeringReportServiceBlock): string[] {
  const content: string[] = [`### ${block.title}`, '']

  if (block.rows) {
    content.push(table(block.rows.map((row) => [row.label, cleanServiceText(row.value)])), '')
  }

  if (block.items) {
    content.push(...block.items.map((item) => `- ${cleanServiceText(item)}`), '')
  }

  return content
}

function table(rows: Array<[string, string]>) {
  return [
    '| Поле | Значение |',
    '| --- | --- |',
    ...rows.map(([field, value]) => `| ${escapeMarkdownCell(field)} | ${escapeMarkdownCell(cleanReportText(value))} |`),
  ].join('\n')
}

function cleanReportText(value: string) {
  return value.replace(/\bn\/a\b/gi, unavailableParameterText())
}

function cleanServiceText(value: string) {
  return cleanReportText(value)
}

function formatVerificationSource(value: string) {
  const labels: Record<string, string> = {
    'NOT VERIFIED': 'не проверено',
    'WebCAD checked': 'проверено в WebCAD',
    'Manual engineer calculation': 'ручной инженерный расчет',
    'Verified Excel': 'проверенный Excel',
    'Normative example': 'нормативный пример',
  }

  return labels[value] ?? value
}

function escapeMarkdownCell(value: string) {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}
