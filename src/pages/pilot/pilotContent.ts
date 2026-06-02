import { getVerifiedCapabilityMatrix, type VerifiedCapability } from '@/calculations/punching-shear/verified/verifiedCapabilities'
import { listPilotFeedback } from '@/features/pilot-feedback'
import { listValidationSessions } from '@/features/validation-session'

export const pilotRoute = '/pilot'

export const pilotWarnings = [
  'Статус ПРОВЕРЕНО не означает полную поддержку СП 63.',
  'Крайние колонны, угловые колонны и отверстия пока остаются черновыми.',
  'Передача моментов поддерживается частично и требует доверенной инженерной проверки.',
  'Каждый пилотный расчет требует ручной проверки перед инженерным применением.',
  'Доверенные проверочные материалы нужно вернуть вместе с пакетом валидации.',
] as const

export const pilotQuickStartSteps = [
  {
    title: 'Выполнить расчет',
    description: 'Введите геометрию, материалы, нагрузки и запустите расчет продавливания.',
    href: '/',
  },
  {
    title: 'Проверить отчет',
    description: 'Выгрузите или просмотрите отчет расчета и зафиксируйте все допущения.',
    href: '/',
  },
  {
    title: 'Открыть проверку',
    description: 'Сравните результат приложения с ручным расчетом, Excel, WebCAD или другим доверенным источником.',
    href: '/review',
  },
  {
    title: 'Создать кандидата',
    description: 'Создавайте кандидата проверки только после заполнения доверенных значений и статуса проверки.',
    href: '/review',
  },
  {
    title: 'Подготовить сессию валидации',
    description: 'Свяжите review evidence, заморозьте regression context и выгрузите пакет валидации.',
    href: '/validation-session',
  },
  {
    title: 'Передать пакет разработчику',
    description: 'Верните отчет, снимок проверки, candidate JSON, пакет валидации и JSON с отзывами.',
    href: '/release-evidence',
  },
] as const

export const pilotReadinessNotes = [
  'Центральный расчет только от силы проверен для текущей доверенной области.',
  'Центральные расчеты с Mx/My доступны как частичные пилотные случаи передачи моментов.',
  'Край, угол, отверстия, армирование и круглые колонны нужно считать черновыми.',
  'Wall-end and wall-corner punching geometry is draft-only and requires trusted verification before design use.',
  'Принятая проверка фиксирует доказательства, но не переводит расчет в VERIFIED автоматически.',
] as const

export const pilotUsableItems = [
  'Тестировать расчетный UI и сравнивать результат с доверенными инженерными материалами.',
  'Выгружать HTML/Markdown отчеты для пакетов проверки.',
  'Использовать режим проверки для фиксации принятия, отклонения и расхождений.',
  'Готовить сессии валидации, релизные материалы и пакеты отзывов пилота.',
  'Использовать центральный прямоугольный случай только от силы как текущую доверенную пилотную базу.',
] as const

export const pilotNotDesignUseItems = [
  'Нельзя использовать приложение как единственный источник проектного решения.',
  'Нельзя считать полную поддержку СП 63.13330.2018 реализованной.',
  'Нельзя применять случаи у стены, торца стены, нескольких контуров, поперечной арматуры, круглых колонн, края, угла или отверстий как финальный проверенный проектный расчет.',
  'Если найдено расхождение, его нужно оформить через отзыв, заметки проверки или кандидата проверки.',
] as const

export const pilotRoadmapItems = [
  'Проверенный центр только от силы',
  'Проверенный центр с моментами',
  'Проверенные край/угол',
  'Проверенные отверстия',
  'Случаи у стены и торца стены',
  'Wall-corner punching geometry',
  'Несколько контрольных контуров',
  'Поперечная арматура',
  'Официальный отчет DOCX/PDF',
  'Полная трассировка СП 63',
  'Пакет эталонных примеров',
] as const

export type PilotDashboard = {
  verifiedFeatures: VerifiedCapability[]
  partialFeatures: VerifiedCapability[]
  draftFeatures: VerifiedCapability[]
  feedbackCount: number
  validationSessionsCount: number
  candidatesCount: number
  releaseEvidenceStatus: 'ready' | 'needs-validation-package'
}

export function buildPilotDashboard(storage: Storage | undefined = globalThis.localStorage): PilotDashboard {
  const capabilities = getVerifiedCapabilityMatrix()
  const validationSessions = listValidationSessions(storage)
  const candidatesCount = validationSessions.filter((session) => session.candidate).length

  return {
    verifiedFeatures: capabilities.filter((capability) => capability.status === 'verified'),
    partialFeatures: capabilities.filter((capability) => capability.status === 'partial'),
    draftFeatures: capabilities.filter((capability) => capability.status === 'draft'),
    feedbackCount: listPilotFeedback(storage).length,
    validationSessionsCount: validationSessions.length,
    candidatesCount,
    releaseEvidenceStatus: validationSessions.some((session) => session.exports.packageExported)
      ? 'ready'
      : 'needs-validation-package',
  }
}
