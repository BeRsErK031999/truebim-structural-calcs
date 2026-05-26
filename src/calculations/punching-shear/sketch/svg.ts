import type { BoundingBox, Point2D } from '../domain/point'

export type SvgElementBase = {
  id: string
  role:
    | 'slab'
    | 'slab-boundary'
    | 'column'
    | 'control-perimeter'
    | 'removed-perimeter'
    | 'opening'
    | 'opening-tangent'
    | 'label'
    | 'dimension'
    | 'stress-segment'
    | 'stress-marker'
    | 'moment-arrow'
    | 'eccentricity'
}

export type SvgPolygonElement = SvgElementBase & {
  type: 'polygon'
  points: Point2D[]
}

export type SvgRectElement = SvgElementBase & {
  type: 'rect'
  x: number
  y: number
  width: number
  height: number
}

export type SvgTextElement = SvgElementBase & {
  type: 'text'
  position: Point2D
  text: string
}

export type SvgLineElement = SvgElementBase & {
  type: 'line'
  start: Point2D
  end: Point2D
  label?: string
  stressRatio?: number
}

export type SvgCircleElement = SvgElementBase & {
  type: 'circle'
  center: Point2D
  radius: number
  label?: string
  stressRatio?: number
}

export type SvgSketchElement =
  | SvgPolygonElement
  | SvgRectElement
  | SvgTextElement
  | SvgLineElement
  | SvgCircleElement

export type PunchingSketchModel = {
  id: string
  viewBox: BoundingBox
  width: number
  height: number
  elements: SvgSketchElement[]
  metadata: {
    unit: 'mm'
    scaleMode: 'fit'
    formulas: 'disabled'
    stressDiagram: 'draft' | 'disabled'
  }
}

export function pointsToSvg(points: Point2D[]) {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

export function polygonToPath(points: Point2D[]) {
  if (points.length === 0) {
    return ''
  }

  const [firstPoint, ...restPoints] = points
  const commands = restPoints.map((point) => `L ${point.x} ${point.y}`)

  return [`M ${firstPoint.x} ${firstPoint.y}`, ...commands, 'Z'].join(' ')
}
