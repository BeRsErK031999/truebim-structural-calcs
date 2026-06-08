import { getVerifiedCapabilityMatrix } from '@/calculations/punching-shear/verified/verifiedCapabilities'

export const engineerPortalRoute = '/engineer'

export const officeAppLinks = [
  'http://192.168.22.37/',
  'http://192.168.22.37/review',
  'http://192.168.22.37/validation-session',
  'http://192.168.22.37/release-evidence',
  'http://192.168.22.37/diagnostics',
] as const

export const engineerWorkflowSteps = [
  {
    title: 'Выполнить расчет',
    href: '/',
    description: 'Создайте или загрузите расчет продавливания и выгрузите отчет.',
    action: 'Проверьте исходные данные, единицы, предупреждения, уровень проверки, проверенные и черновые возможности.',
    returnToDeveloper: 'HTML/Markdown отчет и идентификатор расчета из экспорта.',
  },
  {
    title: 'Проверить отчет',
    href: '/validation-session',
    description: 'Соберите отчет расчета, метаданные пакета валидации и прогресс чеклиста.',
    action: 'Привяжите последнюю проверку, выгрузите отчеты, добавьте ссылки на доверенные доказательства и заморозьте снимок.',
    returnToDeveloper: 'Пакет сессии проверки с манифестом, чеклистом и заметками инженера.',
  },
  {
    title: 'Заполнить инженерную проверку',
    href: '/review',
    description: 'Сравните значения приложения с доверенными данными из WebCAD, Excel, ручного или нормативного расчета.',
    action: 'Заполните источник, проверяющего, дату проверки, ожидаемые значения, допуски и заметки по осям.',
    returnToDeveloper: 'Снимок проверки и JSON кандидата проверки после ручного принятия.',
  },
  {
    title: 'Выгрузить релизные материалы',
    href: '/release-evidence',
    description: 'Выгрузите аудиторский пакет для воспроизводимости релиза и диагностики.',
    action: 'Скачайте доказательства в HTML, Markdown или JSON без изменения статуса проверки.',
    returnToDeveloper: 'Пакет доказательств релиза и приложения с доверенными расчетами.',
  },
] as const

export const engineerReturnChecklist = [
  'HTML/Markdown отчет',
  'снимок проверки',
  'JSON кандидата проверки',
  'пакет сессии проверки',
  'приложения с доверенными расчетами',
  'заполненный чеклист',
] as const

export const engineerInstructionsText = [
  'Инструкции для инженерной передачи',
  '',
  '1. Выполните расчет и проверьте предупреждения, уровень проверки, проверенные и черновые возможности.',
  '2. Сравните отчет с доверенными данными WebCAD, Excel, ручного или нормативного расчета.',
  '3. Заполните инженерную проверку: источник, проверяющего, дату проверки, ожидаемые значения и заметки по осям.',
  '4. Создайте и выгрузите JSON кандидата проверки только после ручного принятия.',
  '5. Соберите пакет сессии проверки и приложите ссылки на доверенные доказательства.',
  '6. Выгрузите релизные материалы для аудита и воспроизводимости.',
  '',
  'Важно: принятая проверка и JSON кандидата не повышают статус до VERIFIED. Черновые возможности остаются черновыми до ручного импорта набора данных и прохождения проверочного запуска.',
] as const

export function buildEngineerInstructionsCopyText() {
  return engineerInstructionsText.join('\n')
}

export function buildReturnChecklistCopyText() {
  return ['Что вернуть разработчику:', ...engineerReturnChecklist.map((item) => `- ${item}`)].join('\n')
}

export function buildCurrentAppLinksCopyText() {
  return ['Текущие ссылки приложения:', ...officeAppLinks.map((link) => `- ${link}`)].join('\n')
}

export function getEngineerPortalCapabilitySummary() {
  const capabilities = getVerifiedCapabilityMatrix()

  return {
    verified: capabilities.filter((capability) => capability.status === 'verified'),
    partial: capabilities.filter((capability) => capability.status === 'partial'),
    draft: capabilities.filter((capability) => capability.status === 'draft'),
  }
}
