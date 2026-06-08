import type { ControlContour } from './controlContour'

export const multipleContourDraftWarning =
  'Выбор нескольких контуров является черновым и требует проверки по СП 63.'

export function createContourWarnings(contours: ControlContour[]) {
  if (contours.length === 0) {
    return []
  }

  return [
    multipleContourDraftWarning,
    'Черновые смещения контуров являются подготовительными геометрическими значениями и не являются проверенными критическими контурами по СП 63.',
  ]
}
