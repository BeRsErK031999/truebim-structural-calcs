import type { PunchingShearInput, PunchingShearReportModel, PunchingShearResult } from './types'

export function buildPunchingShearReport(
  input: PunchingShearInput,
  result: PunchingShearResult,
): PunchingShearReportModel {
  return {
    title: 'Punching Shear Calculation Stub',
    standard: 'СП63.13330 - implementation pending',
    caseType: input.caseType,
    inputSummary: {
      caseType: input.caseType,
      axialForceKn: input.forces.axialForceKn,
      concreteClass: input.concrete.className,
      slabThicknessMm: input.slab.thicknessMm,
      openingsCount: input.openings.length,
      shearReinforcementEnabled: input.shearReinforcement.enabled,
    },
    resultSummary: {
      status: result.status,
      utilization: result.utilization,
      perimeterMm: result.perimeter.perimeterMm,
      effectiveDepthMm: result.perimeter.effectiveDepthMm,
    },
    warnings: result.warnings,
    calculationSteps: [
      'Input schema validation completed.',
      'Units normalized into the current internal DTO shape.',
      'Material placeholder selected.',
      'Control perimeter placeholder generated.',
      'Engineering formulas intentionally skipped.',
    ],
  }
}
