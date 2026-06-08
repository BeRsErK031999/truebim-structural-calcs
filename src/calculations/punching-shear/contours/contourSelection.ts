import type { ControlContour, ControlContourSelectionResult } from './controlContour'

export function selectDraftCriticalContour(
  contours: ControlContour[],
): ControlContourSelectionResult | null {
  const usableContours = contours.filter((contour) => contour.utilization !== null)

  if (usableContours.length === 0) {
    return null
  }

  const selected = usableContours.reduce((current, contour) =>
    (contour.utilization ?? 0) > (current.utilization ?? 0) ? contour : current,
  )

  return {
    selectedContourId: selected.id,
    selectedIndex: selected.index,
    criterion: 'max-utilization',
    status: 'draft',
    warning: 'Критический черновой контур выбран по максимальному черновому коэффициенту использования и не проверен по СП 63.',
  }
}
