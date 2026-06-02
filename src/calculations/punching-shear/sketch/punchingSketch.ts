import type { ControlContour } from '../contours/controlContour'
import type {
  ControlPerimeterResult,
  MomentTransferResult,
  OpeningInput,
  PunchingShearInput,
} from '../types'
import type { Point2D } from '../domain/point'
import { createWallCornerGeometry } from '../wall/wallCornerGeometry'
import { createPaddedViewBox } from './viewport'
import type { PunchingSketchModel, SvgSketchElement } from './svg'

export function buildPunchingSketchModel(
  input: PunchingShearInput,
  perimeter: ControlPerimeterResult,
  momentTransfer?: MomentTransferResult,
  controlContours: ControlContour[] = [],
  selectedContourId: string | null = null,
): PunchingSketchModel {
  const columnVertices = getColumnVertices(input)
  const wallVertices = getWallVertices(input)
  const openingElements = input.openings.map((opening) => createOpeningElement(opening))
  const allPoints = [
    ...columnVertices,
    ...wallVertices,
    ...perimeter.vertices,
    ...controlContours.flatMap((contour) => contour.vertices),
    ...perimeter.removedSegments.flatMap((segment) => [segment.start, segment.end]),
    ...perimeter.openingTangents.flatMap((tangent) => [tangent.start, tangent.end]),
    ...openingElements.flatMap((element) => rectToPoints(element)),
  ]
  const viewBox = createPaddedViewBox(allPoints, 140)
  const slabElement = createSlabElement(viewBox)
  const elements: SvgSketchElement[] = [
    slabElement,
    ...createSupportElements(columnVertices, wallVertices),
    ...createBoundaryElements(perimeter),
    ...createMultiContourElements(controlContours, selectedContourId),
    ...createControlPerimeterElements(perimeter),
    ...createRemovedPerimeterElements(perimeter),
    ...openingElements,
    ...createOpeningTangentElements(perimeter),
    ...createStressElements(perimeter, momentTransfer),
    ...createDimensionElements(input, columnVertices, wallVertices, perimeter, viewBox),
    ...createBoundaryLabels(perimeter),
    ...createMultiContourLabels(controlContours, selectedContourId),
    {
      id: 'label-control-perimeter',
      role: 'label',
      type: 'text',
      position: { x: perimeter.boundingBox.minX, y: perimeter.boundingBox.minY - 24 },
      text:
        input.caseType === 'wall-corner'
          ? 'Draft wall corner punching geometry'
          : input.caseType === 'wall-end'
            ? 'Draft wall punching geometry'
            : 'Control perimeter draft geometry',
    },
  ]

  return {
    id: 'punching-shear-preview',
    viewBox,
    width: viewBox.width,
    height: viewBox.height,
    elements,
    metadata: {
      unit: 'mm',
      scaleMode: 'fit',
      formulas: 'disabled',
      stressDiagram: momentTransfer?.stressDistribution ? 'draft' : 'disabled',
    },
  }
}

function createMultiContourElements(
  contours: ControlContour[],
  selectedContourId: string | null,
): SvgSketchElement[] {
  return contours.flatMap((contour) =>
    contour.segments.map((segment) => ({
      id: `multi-contour-${contour.index}-${segment.id}`,
      role:
        contour.id === selectedContourId ? 'selected-control-contour' : 'control-contour',
      type: 'line',
      start: segment.start,
      end: segment.end,
      label: contour.id === selectedContourId ? 'selected draft critical contour' : undefined,
    })),
  )
}

function createMultiContourLabels(
  contours: ControlContour[],
  selectedContourId: string | null,
): SvgSketchElement[] {
  return contours.map((contour) => ({
    id: `label-${contour.id}`,
    role: 'label',
    type: 'text',
    position: {
      x: contour.boundingBox.minX,
      y: contour.boundingBox.minY - 18 - contour.index * 20,
    },
    text:
      contour.id === selectedContourId
        ? `contour ${contour.index} - selected draft critical contour`
        : `contour ${contour.index}`,
  }))
}

function createSupportElements(
  columnVertices: Point2D[],
  wallVertices: Point2D[],
): SvgSketchElement[] {
  const elements: SvgSketchElement[] = []

  if (columnVertices.length > 0) {
    elements.push({
      id: 'column',
      role: 'column',
      type: 'polygon',
      points: columnVertices,
    })
  }

  if (wallVertices.length > 0) {
    elements.push({
      id: 'wall',
      role: 'wall',
      type: 'polygon',
      points: wallVertices,
    })
  }

  return elements
}

function createControlPerimeterElements(perimeter: ControlPerimeterResult): SvgSketchElement[] {
  return perimeter.segments.map((segment) => ({
    id: `control-perimeter-${segment.id}`,
    role: 'control-perimeter',
    type: 'line',
    start: segment.start,
    end: segment.end,
  }))
}

function createRemovedPerimeterElements(perimeter: ControlPerimeterResult): SvgSketchElement[] {
  return perimeter.removedSegments.map((segment) => ({
    id: `removed-perimeter-${segment.id}`,
    role: 'removed-perimeter',
    type: 'line',
    start: segment.start,
    end: segment.end,
    label: segment.openingId ? `removed ${segment.openingId}` : 'removed',
  }))
}

function createOpeningTangentElements(perimeter: ControlPerimeterResult): SvgSketchElement[] {
  return perimeter.openingTangents.map((tangent, index) => ({
    id: `opening-tangent-${tangent.openingId}-${index + 1}`,
    role: 'opening-tangent',
    type: 'line',
    start: tangent.start,
    end: tangent.end,
  }))
}

function createBoundaryElements(perimeter: ControlPerimeterResult): SvgSketchElement[] {
  const slabBox = perimeter.clippingMetadata.slabBox

  if (!slabBox) {
    return []
  }

  const left = Number.isFinite(slabBox.minX) ? slabBox.minX : perimeter.boundingBox.minX - 180
  const right = Number.isFinite(slabBox.maxX) ? slabBox.maxX : perimeter.boundingBox.maxX + 180
  const top = Number.isFinite(slabBox.minY) ? slabBox.minY : perimeter.boundingBox.minY - 180
  const bottom = Number.isFinite(slabBox.maxY) ? slabBox.maxY : perimeter.boundingBox.maxY + 180

  return [
    {
      id: 'slab-boundary-box',
      role: 'slab-boundary',
      type: 'polygon',
      points: [
        { x: left, y: top },
        { x: right, y: top },
        { x: right, y: bottom },
        { x: left, y: bottom },
      ],
    },
  ]
}

function createBoundaryLabels(perimeter: ControlPerimeterResult): SvgSketchElement[] {
  const labels: SvgSketchElement[] = []

  if (perimeter.edgeAffected) {
    labels.push({
      id: 'label-edge-affected',
      role: 'label',
      type: 'text',
      position: { x: perimeter.boundingBox.minX, y: perimeter.boundingBox.maxY + 36 },
      text: perimeter.cornerAffected ? 'Corner clipping draft' : 'Edge clipping draft',
    })
  }

  if (perimeter.openingAffected) {
    labels.push({
      id: 'label-opening-affected',
      role: 'label',
      type: 'text',
      position: { x: perimeter.boundingBox.minX, y: perimeter.boundingBox.maxY + 64 },
      text: 'Opening subtraction draft',
    })
  }

  return labels
}

function getColumnVertices(input: PunchingShearInput): Point2D[] {
  if (!input.rectColumn) {
    return []
  }

  const halfWidth = input.rectColumn.widthXMm / 2
  const halfHeight = input.rectColumn.widthYMm / 2

  return [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ]
}

function getWallVertices(input: PunchingShearInput): Point2D[] {
  if (input.caseType === 'wall-corner' && input.wallCorner) {
    return createWallCornerGeometry(input.wallCorner).vertices
  }

  if (input.caseType !== 'wall-end' || !input.wall) {
    return []
  }

  const halfThickness = input.wall.wallThickness / 2

  return [
    { x: 0, y: -halfThickness },
    { x: input.wall.wallLength, y: -halfThickness },
    { x: input.wall.wallLength, y: halfThickness },
    { x: 0, y: halfThickness },
  ]
}

function createOpeningElement(opening: OpeningInput): SvgSketchElement {
  return {
    id: `opening-${opening.id}`,
    role: 'opening',
    type: 'rect',
    x: opening.centerXMm - opening.widthXMm / 2,
    y: opening.centerYMm - opening.widthYMm / 2,
    width: opening.widthXMm,
    height: opening.widthYMm,
  }
}

function createSlabElement(viewBox: PunchingSketchModel['viewBox']): SvgSketchElement {
  return {
    id: 'slab-preview-extent',
    role: 'slab',
    type: 'rect',
    x: viewBox.minX,
    y: viewBox.minY,
    width: viewBox.width,
    height: viewBox.height,
  }
}

function createDimensionElements(
  input: PunchingShearInput,
  columnVertices: Point2D[],
  wallVertices: Point2D[],
  perimeter: ControlPerimeterResult,
  viewBox: PunchingSketchModel['viewBox'],
): SvgSketchElement[] {
  if (input.caseType === 'wall-end' && input.wall && wallVertices.length > 0) {
    return createWallDimensionElements(input, wallVertices, perimeter, viewBox)
  }

  if (input.caseType === 'wall-corner' && input.wallCorner && wallVertices.length > 0) {
    return createWallCornerDimensionElements(input, wallVertices, perimeter, viewBox)
  }

  if (columnVertices.length === 0) {
    return []
  }

  const columnBox = {
    minX: Math.min(...columnVertices.map((point) => point.x)),
    maxX: Math.max(...columnVertices.map((point) => point.x)),
    minY: Math.min(...columnVertices.map((point) => point.y)),
    maxY: Math.max(...columnVertices.map((point) => point.y)),
  }
  const widthY = columnBox.maxY + 42
  const heightX = columnBox.maxX + 42
  const perimeterWidthY = perimeter.boundingBox.maxY + 72
  const perimeterHeightX = perimeter.boundingBox.maxX + 72
  const axisStart = {
    x: viewBox.minX + 36,
    y: viewBox.minY + 36,
  }

  return [
    {
      id: 'dimension-column-width',
      role: 'dimension',
      type: 'line',
      start: { x: columnBox.minX, y: widthY },
      end: { x: columnBox.maxX, y: widthY },
      label: `${formatMm(columnBox.maxX - columnBox.minX)} column X`,
    },
    {
      id: 'dimension-column-height',
      role: 'dimension',
      type: 'line',
      start: { x: heightX, y: columnBox.minY },
      end: { x: heightX, y: columnBox.maxY },
      label: `${formatMm(columnBox.maxY - columnBox.minY)} column Y`,
    },
    {
      id: 'dimension-contour-offset',
      role: 'dimension',
      type: 'line',
      start: { x: columnBox.maxX, y: 0 },
      end: { x: perimeter.boundingBox.maxX, y: 0 },
      label: `${formatMm(perimeter.draftOffsetMm)} draft offset`,
    },
    {
      id: 'dimension-control-perimeter-width',
      role: 'dimension',
      type: 'line',
      start: { x: perimeter.boundingBox.minX, y: perimeterWidthY },
      end: { x: perimeter.boundingBox.maxX, y: perimeterWidthY },
      label: `${formatMm(perimeter.boundingBox.width)} contour X`,
    },
    {
      id: 'dimension-control-perimeter-height',
      role: 'dimension',
      type: 'line',
      start: { x: perimeterHeightX, y: perimeter.boundingBox.minY },
      end: { x: perimeterHeightX, y: perimeter.boundingBox.maxY },
      label: `${formatMm(perimeter.boundingBox.height)} contour Y`,
    },
    {
      id: 'axis-x',
      role: 'dimension',
      type: 'line',
      start: axisStart,
      end: { x: axisStart.x + 90, y: axisStart.y },
      label: 'X',
    },
    {
      id: 'axis-y',
      role: 'dimension',
      type: 'line',
      start: axisStart,
      end: { x: axisStart.x, y: axisStart.y + 90 },
      label: 'Y',
    },
    {
      id: 'label-scale',
      role: 'label',
      type: 'text',
      position: { x: viewBox.minX + 36, y: viewBox.maxY - 36 },
      text: 'Scale: 1 unit = 1 mm, fit-to-view',
    },
  ]
}

function createWallCornerDimensionElements(
  input: PunchingShearInput,
  wallVertices: Point2D[],
  perimeter: ControlPerimeterResult,
  viewBox: PunchingSketchModel['viewBox'],
): SvgSketchElement[] {
  const wallCorner = input.wallCorner

  if (!wallCorner) {
    return []
  }

  const geometry = createWallCornerGeometry(wallCorner)
  const wallBox = {
    minX: Math.min(...wallVertices.map((point) => point.x)),
    maxX: Math.max(...wallVertices.map((point) => point.x)),
    minY: Math.min(...wallVertices.map((point) => point.y)),
    maxY: Math.max(...wallVertices.map((point) => point.y)),
  }
  const signX = wallCorner.orientation === 'top-right' || wallCorner.orientation === 'bottom-right' ? -1 : 1
  const signY = wallCorner.orientation === 'bottom-left' || wallCorner.orientation === 'bottom-right' ? -1 : 1
  const xDimensionY = signY > 0 ? wallBox.minY - 42 : wallBox.maxY + 42
  const yDimensionX = signX > 0 ? wallBox.minX - 42 : wallBox.maxX + 42
  const axisStart = {
    x: viewBox.minX + 36,
    y: viewBox.minY + 36,
  }

  return [
    {
      id: 'dimension-wall-corner-length-x',
      role: 'dimension',
      type: 'line',
      start: { x: 0, y: xDimensionY },
      end: { x: signX * wallCorner.wallLengthX, y: xDimensionY },
      label: `${formatMm(wallCorner.wallLengthX)} wall length X`,
    },
    {
      id: 'dimension-wall-corner-length-y',
      role: 'dimension',
      type: 'line',
      start: { x: yDimensionX, y: 0 },
      end: { x: yDimensionX, y: signY * wallCorner.wallLengthY },
      label: `${formatMm(wallCorner.wallLengthY)} wall length Y`,
    },
    {
      id: 'dimension-wall-corner-thickness-x',
      role: 'dimension',
      type: 'line',
      start: { x: signX * (wallCorner.wallLengthX * 0.45), y: 0 },
      end: { x: signX * (wallCorner.wallLengthX * 0.45), y: signY * wallCorner.wallThicknessX },
      label: `${formatMm(wallCorner.wallThicknessX)} thickness X`,
    },
    {
      id: 'dimension-wall-corner-thickness-y',
      role: 'dimension',
      type: 'line',
      start: { x: 0, y: signY * (wallCorner.wallLengthY * 0.45) },
      end: { x: signX * wallCorner.wallThicknessY, y: signY * (wallCorner.wallLengthY * 0.45) },
      label: `${formatMm(wallCorner.wallThicknessY)} thickness Y`,
    },
    {
      id: 'dimension-wall-corner-contour-offset',
      role: 'dimension',
      type: 'line',
      start: geometry.innerCorner,
      end: { x: signX * -perimeter.draftOffsetMm, y: signY * -perimeter.draftOffsetMm },
      label: `${formatMm(perimeter.draftOffsetMm)} draft offset`,
    },
    {
      id: 'label-wall-corner-orientation',
      role: 'label',
      type: 'text',
      position: { x: perimeter.boundingBox.minX, y: perimeter.boundingBox.maxY + 36 },
      text: `wall corner ${wallCorner.orientation}`,
    },
    {
      id: 'label-wall-corner-inner',
      role: 'label',
      type: 'text',
      position: { x: geometry.innerCorner.x + 18 * signX, y: geometry.innerCorner.y + 28 * signY },
      text: 'inner corner',
    },
    {
      id: 'label-wall-corner-outer',
      role: 'label',
      type: 'text',
      position: { x: geometry.outerCorner.x + 18 * signX, y: geometry.outerCorner.y + 28 * signY },
      text: 'outer corner',
    },
    {
      id: 'label-wall-corner-x-arm',
      role: 'label',
      type: 'text',
      position: geometry.labels.xArm,
      text: 'X arm',
    },
    {
      id: 'label-wall-corner-y-arm',
      role: 'label',
      type: 'text',
      position: geometry.labels.yArm,
      text: 'Y arm',
    },
    {
      id: 'axis-x',
      role: 'dimension',
      type: 'line',
      start: axisStart,
      end: { x: axisStart.x + 90, y: axisStart.y },
      label: 'X',
    },
    {
      id: 'axis-y',
      role: 'dimension',
      type: 'line',
      start: axisStart,
      end: { x: axisStart.x, y: axisStart.y + 90 },
      label: 'Y',
    },
    {
      id: 'label-scale',
      role: 'label',
      type: 'text',
      position: { x: viewBox.minX + 36, y: viewBox.maxY - 36 },
      text: 'Scale: 1 unit = 1 mm, fit-to-view',
    },
  ]
}

function createWallDimensionElements(
  input: PunchingShearInput,
  wallVertices: Point2D[],
  perimeter: ControlPerimeterResult,
  viewBox: PunchingSketchModel['viewBox'],
): SvgSketchElement[] {
  const wallBox = {
    minX: Math.min(...wallVertices.map((point) => point.x)),
    maxX: Math.max(...wallVertices.map((point) => point.x)),
    minY: Math.min(...wallVertices.map((point) => point.y)),
    maxY: Math.max(...wallVertices.map((point) => point.y)),
  }
  const lengthY = wallBox.maxY + 42
  const thicknessX = wallBox.minX - 42
  const perimeterWidthY = perimeter.boundingBox.maxY + 72
  const perimeterHeightX = perimeter.boundingBox.minX - 72
  const axisStart = {
    x: viewBox.minX + 36,
    y: viewBox.minY + 36,
  }

  return [
    {
      id: 'dimension-wall-length',
      role: 'dimension',
      type: 'line',
      start: { x: wallBox.minX, y: lengthY },
      end: { x: wallBox.maxX, y: lengthY },
      label: `${formatMm(input.wall?.wallLength ?? wallBox.maxX - wallBox.minX)} wall length`,
    },
    {
      id: 'dimension-wall-thickness',
      role: 'dimension',
      type: 'line',
      start: { x: thicknessX, y: wallBox.minY },
      end: { x: thicknessX, y: wallBox.maxY },
      label: `${formatMm(input.wall?.wallThickness ?? wallBox.maxY - wallBox.minY)} wall thickness`,
    },
    {
      id: 'dimension-wall-contour-offset',
      role: 'dimension',
      type: 'line',
      start: { x: wallBox.minX, y: 0 },
      end: { x: perimeter.boundingBox.minX, y: 0 },
      label: `${formatMm(perimeter.draftOffsetMm)} draft offset`,
    },
    {
      id: 'dimension-wall-control-perimeter-width',
      role: 'dimension',
      type: 'line',
      start: { x: perimeter.boundingBox.minX, y: perimeterWidthY },
      end: { x: perimeter.boundingBox.maxX, y: perimeterWidthY },
      label: `${formatMm(perimeter.boundingBox.width)} contour X`,
    },
    {
      id: 'dimension-wall-control-perimeter-height',
      role: 'dimension',
      type: 'line',
      start: { x: perimeterHeightX, y: perimeter.boundingBox.minY },
      end: { x: perimeterHeightX, y: perimeter.boundingBox.maxY },
      label: `${formatMm(perimeter.boundingBox.height)} contour Y`,
    },
    {
      id: 'axis-x',
      role: 'dimension',
      type: 'line',
      start: axisStart,
      end: { x: axisStart.x + 90, y: axisStart.y },
      label: 'X',
    },
    {
      id: 'axis-y',
      role: 'dimension',
      type: 'line',
      start: axisStart,
      end: { x: axisStart.x, y: axisStart.y + 90 },
      label: 'Y',
    },
    {
      id: 'label-scale',
      role: 'label',
      type: 'text',
      position: { x: viewBox.minX + 36, y: viewBox.maxY - 36 },
      text: 'Scale: 1 unit = 1 mm, fit-to-view',
    },
  ]
}

function createStressElements(
  perimeter: ControlPerimeterResult,
  momentTransfer?: MomentTransferResult,
): SvgSketchElement[] {
  const distribution = momentTransfer?.stressDistribution

  if (!distribution) {
    return []
  }

  const maxPoint = distribution.points.reduce((current, point) =>
    point.stressMpa > current.stressMpa ? point : current,
  )
  const minPoint = distribution.points.reduce((current, point) =>
    point.stressMpa < current.stressMpa ? point : current,
  )
  const momentArrows = createMomentArrowElements(perimeter, momentTransfer)
  const eccentricityMarker = createEccentricityElements(momentTransfer)

  return [
    ...perimeter.segments.map((segment) => {
      const segmentStress = distribution.segmentStresses.find(
        (stress) => stress.segmentId === segment.id,
      )

      return {
        id: `stress-segment-${segment.id}`,
        role: 'stress-segment',
        type: 'line',
        start: segment.start,
        end: segment.end,
        stressRatio: segmentStress?.normalizedStress ?? 0,
      } satisfies SvgSketchElement
    }),
    ...distribution.points.map(
      (point) =>
        ({
          id: `stress-marker-${point.id}`,
          role: 'stress-marker',
          type: 'circle',
          center: point.position,
          radius: 9,
          stressRatio: point.normalizedStress,
        }) satisfies SvgSketchElement,
    ),
    {
      id: 'label-max-stress',
      role: 'label',
      type: 'text',
      position: { x: maxPoint.position.x + 18, y: maxPoint.position.y - 18 },
      text: `max ${formatMpa(distribution.maxStressMpa)}`,
    },
    {
      id: 'label-min-stress',
      role: 'label',
      type: 'text',
      position: { x: minPoint.position.x + 18, y: minPoint.position.y + 28 },
      text: `min ${formatMpa(distribution.minStressMpa)}`,
    },
    ...momentArrows,
    ...eccentricityMarker,
  ]
}

function createMomentArrowElements(
  perimeter: ControlPerimeterResult,
  momentTransfer: MomentTransferResult,
): SvgSketchElement[] {
  const arrows: SvgSketchElement[] = []
  const topY = perimeter.boundingBox.minY - 54
  const rightX = perimeter.boundingBox.maxX + 54

  if (momentTransfer.momentXKnM > 0) {
    arrows.push({
      id: 'moment-arrow-mx',
      role: 'moment-arrow',
      type: 'line',
      start: { x: perimeter.boundingBox.minX, y: topY },
      end: { x: perimeter.boundingBox.maxX, y: topY },
      label: 'Mx draft',
    })
  }

  if (momentTransfer.momentYKnM > 0) {
    arrows.push({
      id: 'moment-arrow-my',
      role: 'moment-arrow',
      type: 'line',
      start: { x: rightX, y: perimeter.boundingBox.minY },
      end: { x: rightX, y: perimeter.boundingBox.maxY },
      label: 'My draft',
    })
  }

  return arrows
}

function createEccentricityElements(momentTransfer: MomentTransferResult): SvgSketchElement[] {
  if (!momentTransfer.enabled) {
    return []
  }

  const center = {
    x: momentTransfer.eccentricityX,
    y: momentTransfer.eccentricityY,
  }

  return [
    {
      id: 'eccentricity-vector',
      role: 'eccentricity',
      type: 'line',
      start: { x: 0, y: 0 },
      end: center,
      label: 'e draft',
    },
    {
      id: 'eccentricity-marker',
      role: 'eccentricity',
      type: 'circle',
      center,
      radius: 10,
    },
  ]
}

function formatMm(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} mm`
}

function formatMpa(value: number) {
  return `${value.toFixed(3)} MPa`
}

function rectToPoints(element: SvgSketchElement): Point2D[] {
  if (element.type !== 'rect') {
    return []
  }

  return [
    { x: element.x, y: element.y },
    { x: element.x + element.width, y: element.y },
    { x: element.x + element.width, y: element.y + element.height },
    { x: element.x, y: element.y + element.height },
  ]
}
