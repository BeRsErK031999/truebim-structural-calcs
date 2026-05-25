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
    ...createDimensionElements(columnVertices, perimeter),
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
): SvgSketchElement[] {
  if (columnVertices.length === 0) {
    return []
  }

  const columnBox = {
    minX: Math.min(...columnVertices.map((point) => point.x)),
    maxX: Math.max(...columnVertices.map((point) => point.x)),
    maxY: Math.max(...columnVertices.map((point) => point.y)),
  }
  const y = columnBox.maxY + 42

  return [
    {
      id: 'dimension-column-width',
      role: 'dimension',
      type: 'line',
      start: { x: columnBox.minX, y },
      end: { x: columnBox.maxX, y },
      label: 'column width',
    },
    {
      id: 'dimension-contour-offset',
      role: 'dimension',
      type: 'line',
      start: { x: columnBox.maxX, y: 0 },
      end: { x: perimeter.boundingBox.maxX, y: 0 },
      label: 'draft offset',
    },
  ]
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
