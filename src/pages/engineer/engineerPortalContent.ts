import { getVerifiedCapabilityMatrix } from '@/calculations/punching-shear/verified/verifiedCapabilities'

export const engineerPortalRoute = '/engineer'

export const officeAppLinks = [
  'http://192.168.22.37/',
  'http://192.168.22.37/review',
  'http://192.168.22.37/validation-session',
  'http://192.168.22.37/release-evidence',
  'http://192.168.22.37/diagnostics',
] as const

export const officeAppLinkActions = [
  { href: '/', label: 'Открыть расчет' },
  { href: '/review', label: 'Открыть проверку' },
  { href: '/validation-session', label: 'Открыть пакет проверки' },
  { href: '/release-evidence', label: 'Открыть материалы проверки' },
  { href: '/diagnostics', label: 'Открыть диагностику' },
] as const

export const engineerWorkflowSteps = [
  {
    title: 'Выполнить расчет',
    href: '/',
    description: 'Создайте или откройте расчет продавливания и проверьте исходные данные.',
    action: 'Проверьте геометрию, нагрузки, единицы измерения, предупреждения и итоговый коэффициент использования.',
    preparedMaterials: 'Отчет расчета и номер сохраненного расчета.',
    buttonLabel: 'Открыть расчет',
  },
  {
    title: 'Сравнить с эталоном',
    href: '/review',
    description: 'Сравните результат приложения с эталонным расчетом из WebCAD, Excel, ручного или нормативного расчета.',
    action: 'Заполните эталонные значения, допуски, источник расчета, дату проверки и комментарии по осям.',
    preparedMaterials: 'Черновик результатов проверки и сохраненная версия проверки.',
    buttonLabel: 'Открыть проверку',
  },
  {
    title: 'Подтвердить проверку',
    href: '/validation-session',
    description: 'Прикрепите результаты проверки и сохраните итоговую версию расчета.',
    action: 'Соберите материалы проверки и проверьте заполнение чеклиста.',
    preparedMaterials: 'Архив проверки с чеклистом и комментариями инженера.',
    buttonLabel: 'Открыть пакет проверки',
  },
  {
    title: 'Скачать материалы проверки',
    href: '/release-evidence',
    description: 'Подготовьте материалы, по которым можно понять, какая версия расчета была проверена.',
    action: 'Скачайте материалы проверки в нужном формате.',
    preparedMaterials: 'Архив проверки, отчет расчета, чеклист и эталонные расчеты.',
    buttonLabel: 'Открыть материалы',
  },
] as const

export const engineerReturnChecklist = [
  'Отчет расчета',
  'Сохраненная версия проверки',
  'Черновик результатов проверки',
  'Архив проверки с чеклистом',
  'Эталонные расчеты',
  'Комментарии инженера',
] as const

export const engineerInstructionsText = [
  'Инструкции для инженерной проверки',
  '',
  '1. Выполните расчет и проверьте исходные данные, предупреждения и итоговый коэффициент использования.',
  '2. Сравните результат с эталонным расчетом из WebCAD, Excel, ручного или нормативного расчета.',
  '3. Заполните источник, проверяющего, дату проверки, ожидаемые значения, допуски и комментарии по осям.',
  '4. Прикрепите результаты проверки и сохраните итоговую версию расчета.',
  '5. Соберите материалы проверки и проверьте заполнение чеклиста.',
  '6. Скачайте материалы проверки в нужном формате.',
  '',
  'Важно: подтвержденная проверка не меняет расчетные формулы автоматически. Непроверенные области остаются непроверенными до отдельной инженерной верификации.',
] as const

export function buildEngineerInstructionsCopyText() {
  return engineerInstructionsText.join('\n')
}

export function buildReturnChecklistCopyText() {
  return ['Материалы проверки:', ...engineerReturnChecklist.map((item) => `- ${item}`)].join('\n')
}

export function buildCurrentAppLinksCopyText() {
  return ['Разделы приложения:', ...officeAppLinkActions.map((link) => `- ${link.label}: ${link.href}`)].join('\n')
}

export function getEngineerPortalCapabilitySummary() {
  const capabilities = getVerifiedCapabilityMatrix()

  return {
    verified: capabilities.filter((capability) => capability.status === 'verified'),
    partial: capabilities.filter((capability) => capability.status === 'partial'),
    draft: capabilities.filter((capability) => capability.status === 'draft'),
  }
}
