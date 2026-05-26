import type { ControlPerimeterResult, OpeningInput, PunchingShearInput } from '../types'
import type { Point2D } from '../domain/point'
import { createPaddedViewBox } from './viewport'
import type { PunchingSketchModel, SvgSketchElement } from './svg'

export function buildPunchingSketchModel(
  input: PunchingShearInput,
  perimeter: ControlPerimeterResult,
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

function formatMm(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} mm`
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
