import {
  defaultAxisConvention,
  type AxisConvention,
} from './axisConvention'

export type AxisConventionValidationResult = {
  passed: boolean
  convention: AxisConvention
  warnings: string[]
}

export function validateAxisConvention(
  convention: Partial<AxisConvention> | null | undefined,
): AxisConventionValidationResult {
  const resolvedConvention = {
    ...defaultAxisConvention,
    ...convention,
  }
  const warnings = createAxisConventionWarnings(resolvedConvention)

  return {
    passed: warnings.length === 0,
    convention: resolvedConvention,
    warnings,
  }
}

export function createAxisConventionWarnings(convention: AxisConvention) {
  const warnings: string[] = []

  if (convention.traversal !== defaultAxisConvention.traversal) {
    warnings.push(
      `Axis convention mismatch: perimeter traversal is ${convention.traversal}, expected ${defaultAxisConvention.traversal}.`,
    )
  }
  if (convention.xPositiveDirection !== defaultAxisConvention.xPositiveDirection) {
    warnings.push(
      `Axis convention mismatch: X positive direction is ${convention.xPositiveDirection}, expected ${defaultAxisConvention.xPositiveDirection}.`,
    )
  }
  if (convention.yPositiveDirection !== defaultAxisConvention.yPositiveDirection) {
    warnings.push(
      `Axis convention mismatch: Y positive direction is ${convention.yPositiveDirection}, expected ${defaultAxisConvention.yPositiveDirection}.`,
    )
  }
  if (convention.momentXSignConvention !== defaultAxisConvention.momentXSignConvention) {
    warnings.push('Axis convention mismatch: Mx sign convention differs from the verified regression baseline.')
  }
  if (convention.momentYSignConvention !== defaultAxisConvention.momentYSignConvention) {
    warnings.push('Axis convention mismatch: My sign convention differs from the verified regression baseline.')
  }

  return warnings
}
