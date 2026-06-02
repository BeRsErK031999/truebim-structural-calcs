import type { ControlContour } from './controlContour'

export const multipleContourDraftWarning =
  'Multiple contour selection is draft-only and requires SP63 verification.'

export function createContourWarnings(contours: ControlContour[]) {
  if (contours.length === 0) {
    return []
  }

  return [
    multipleContourDraftWarning,
    'Draft contour offsets are geometry preparation values and are not verified SP63 critical contours.',
  ]
}
