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
    geometrySummary: {
      perimeterMm: result.perimeter.perimeterMm,
      effectiveDepthMm: result.perimeter.effectiveDepthMm,
      draftOffsetMm: result.perimeter.draftOffsetMm,
      vertexCount: result.perimeter.vertices.length,
      segmentCount: result.perimeter.segments.length,
      boundingBoxWidthMm: result.perimeter.boundingBox.width,
      boundingBoxHeightMm: result.perimeter.boundingBox.height,
    },
    segments: result.perimeter.segments.map((segment) => ({
      id: segment.id,
      kind: segment.kind,
      startX: segment.start.x,
      startY: segment.start.y,
      endX: segment.end.x,
      endY: segment.end.y,
      lengthMm: segment.lengthMm,
    })),
    svgMetadata: {
      viewBoxWidth: result.svgModel.viewBox.width,
      viewBoxHeight: result.svgModel.viewBox.height,
      elementCount: result.svgModel.elements.length,
      scaleMode: result.svgModel.metadata.scaleMode,
    },
    warnings: result.warnings,
    calculationSteps: [
      'Input schema validation completed.',
      'Units normalized into the current internal DTO shape.',
      'Material placeholder selected.',
      'Control perimeter draft geometry generated.',
      'SVG sketch model generated from geometry DTOs.',
      'Engineering formulas intentionally skipped.',
    ],
  }
}
