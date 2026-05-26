import type {
  ControlPerimeterResult,
  MomentTransferResult,
  OpeningInput,
  PunchingShearInput,
} from '../types'
import type { Point2D } from '../domain/point'
import { createPaddedViewBox } from './viewport'
import type { PunchingSketchModel, SvgSketchElement } from './svg'

export function buildPunchingSketchModel(
  input: PunchingShearInput,
  perimeter: ControlPerimeterResult,
  momentTransfer?: MomentTransferResult,
): PunchingSketchModel {
  const columnVertices = getColumnVertices(input)
  const openingElements = input.openings.map((opening) => createOpeningElement(opening))
  const allPoints = [
    ...columnVertices,
    ...perimeter.vertices,
    ...openingElements.flatMap((element) => rectToPoints(element)),
  ]
  const viewBox = createPaddedViewBox(allPoints, 140)
  const slabElement = createSlabElement(viewBox)
  const elements: SvgSketchElement[] = [
    slabElement,
    {
      id: 'column',
      role: 'column',
      type: 'polygon',
      points: columnVertices,
    },
    {
      id: 'control-perimeter',
      role: 'control-perimeter',
      type: 'polygon',
      points: perimeter.vertices,
    },
    ...openingElements,
    ...createStressElements(perimeter, momentTransfer),
    ...createDimensionElements(columnVertices, perimeter, viewBox),
    {
      id: 'label-control-perimeter',
      role: 'label',
      type: 'text',
      position: { x: perimeter.boundingBox.minX, y: perimeter.boundingBox.minY - 24 },
      text: 'Control perimeter draft geometry',
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
  columnVertices: Point2D[],
  perimeter: ControlPerimeterResult,
  viewBox: PunchingSketchModel['viewBox'],
): SvgSketchElement[] {
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
