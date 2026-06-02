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
    warning: 'draftCriticalContour uses maximum draft utilization and is not SP63 verified.',
  }
}
