import type { ContourComparisonRow, ControlContour } from './controlContour'

export function compareControlContours(
  contours: ControlContour[],
  selectedContourId: string | null,
): ContourComparisonRow[] {
  return contours.map((contour) => ({
    contourId: contour.id,
    index: contour.index,
    offsetMm: contour.offsetMm,
    perimeterMm: contour.perimeterMm,
    draftStressMpa: contour.draftStressMpa,
    utilization: contour.utilization,
    selected: contour.id === selectedContourId,
    warnings: contour.warnings,
  }))
}
