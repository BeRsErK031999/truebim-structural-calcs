export const roundDraftPerimeterWarning =
  'Round column perimeter is draft-only and requires SP63 verification.'

export const roundUnsupportedPositionWarning =
  'Round edge/corner is not implemented yet.'

export function createRoundWarnings(position: 'center' | 'edge' | 'corner') {
  return position === 'center'
    ? [
        roundDraftPerimeterWarning,
        'Round draft offset uses h0/2 placeholder values pending SP63 verification.',
      ]
    : [
        roundDraftPerimeterWarning,
        roundUnsupportedPositionWarning,
      ]
}
