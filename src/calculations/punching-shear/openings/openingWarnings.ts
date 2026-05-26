export function createOpeningWarnings(openingAffected: boolean) {
  return openingAffected
    ? [
        'Openings and boundary clipping are draft geometry only.',
        'Opening subtraction uses clean-room tangent geometry; СП63 formulas are not verified.',
      ]
    : []
}
