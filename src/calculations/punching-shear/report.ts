import type { PunchingShearInput, PunchingShearReportModel, PunchingShearResult } from './types'

export function buildPunchingShearReport(
  input: PunchingShearInput,
  result: PunchingShearResult,
): PunchingShearReportModel {
  return {
    title: 'Punching Shear Draft Center Check',
    standard: 'СП63.13330 - draft verification pending',
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
      utilization: result.utilizationRatio,
      perimeterMm: result.controlPerimeterMm,
      effectiveDepthMm: result.effectiveDepthMm,
      passed: result.passed === null ? 'not evaluated' : String(result.passed),
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
    formulaSummary: [
      'DRAFT / NOT FOR DESIGN USE',
      'v = N / (u * h0)',
      'N = design shear force',
      'u = control perimeter',
      'h0 = effective depth',
    ],
    calculationValues: {
      N: result.designShearForceN,
      u: result.controlPerimeterMm,
      h0: result.effectiveDepthMm,
      v: result.shearStressMpa,
      R: result.draftConcreteResistanceMpa,
      utilization: result.utilizationRatio,
      passed: result.passed,
    },
    warnings: result.warnings,
    calculationSteps: [
      'DRAFT / NOT FOR DESIGN USE.',
      'Input schema validation completed.',
      'Units normalized into the current internal DTO shape.',
      'Draft material resistance selected.',
      'Control perimeter draft geometry generated.',
      'SVG sketch model generated from geometry DTOs.',
      'Draft center force-only check evaluated where supported.',
      'Moments, openings, slab edges, and shear reinforcement intentionally skipped.',
    ],
  }
}
