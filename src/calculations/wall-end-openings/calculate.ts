import {
  getWallEndConcreteMaterial,
  getWallEndReinforcementMaterial,
  kgPerCm2ToTonPerM2,
} from './materials'
import type {
  ComputedWallEndCutout,
  WallEndCutoutInput,
  WallEndCutoutSide,
  WallEndOpeningsInput,
  WallEndOpeningsResult,
} from './types'

const EPSILON = 1e-9

type BaseGeometry = {
  h0Mm: number
  h0M: number
  wallThicknessM: number
  lx1M: number
  lx2M: number
  lyM: number
  lx1Mm: number
  lx2Mm: number
  lyMm: number
  leftX: number
  rightX: number
  bottomY: number
  topY: number
}

export function calculateWallEndOpenings(input: WallEndOpeningsInput): WallEndOpeningsResult {
  const base = buildBaseGeometry(input)
  const initialCutouts = computeCutouts(input, base)
  const activeLengthM = sum(initialCutouts.map((cutout) => cutout.activeLengthMm)) / 1000
  const uM = base.lx1M + base.lx2M + base.lyM - activeLengthM
  const staticMomentM3 = calculateStaticMoment(base, initialCutouts)
  const contourCentroidYM = safeDivide(staticMomentM3, uM)
  const cutouts = computeCutouts(input, base)
  const x0M = -(input.wallThicknessMm + base.h0Mm / 2) / 2 / 1000
  const wallCentroidYM = (input.wallThicknessMm / 2 + base.h0Mm / 2 + input.alternateContour.yMinusMm) / 1000
  const e0yM = contourCentroidYM - wallCentroidYM
  const aq1M2 = calculateAq1(base)
  const aqM2 = calculateAq(input, base)
  const eqyM = calculateEqy(base, aqM2, wallCentroidYM)
  const loads = calculateLoads(input, aq1M2, aqM2, e0yM)
  const ibyM3 = calculateIby(base, contourCentroidYM, cutouts)
  const wMinusByM2 = positiveOrZero(safeDivide(ibyM3, contourCentroidYM))
  const wPlusByM2 = positiveOrZero(safeDivide(ibyM3, base.lyM - contourCentroidYM))
  const concrete = calculateConcrete(input, base, uM, loads.myTonM, wMinusByM2, wPlusByM2, loads.fTon)
  const reinforcement = calculateReinforcement(
    input,
    base,
    uM,
    loads.myTonM,
    loads.fTon,
    concrete,
    wMinusByM2,
    wPlusByM2,
  )

  const warnings = [
    'Черновой расчет по Excel-образцу. Нормативная верификация этой вкладки еще не выполнена.',
  ]

  if (uM <= EPSILON || base.h0Mm <= EPSILON) {
    warnings.push('Расчетный контур или рабочая высота плиты имеют нулевое значение.')
  }

  return {
    status: uM > EPSILON && base.h0Mm > EPSILON ? 'draft_reference' : 'invalid_input',
    warnings,
    geometry: {
      h0Mm: base.h0Mm,
      lx1M: base.lx1M,
      lx2M: base.lx2M,
      lyM: base.lyM,
      uM,
      areaM2: uM,
      staticMomentM3,
      x0M,
      wallCentroidYM,
      contourCentroidYM,
      e0xM: 0,
      e0yM,
      aq1M2,
      aqM2,
      eqxM: 0,
      eqyM,
      ibyM3,
      wMinusByM2,
      wPlusByM2,
    },
    loads,
    concrete,
    reinforcement,
    plot: buildPlot(base, contourCentroidYM, cutouts),
    cutouts,
  }
}

function buildBaseGeometry(input: WallEndOpeningsInput): BaseGeometry {
  const h0Mm = Math.max(0, input.slab.heightMm - (input.slab.coverXMm + input.slab.coverYMm) / 2)
  const lxMm = input.wallThicknessMm + h0Mm
  const lyMm = input.alternateContour.yMinusMm + input.wallThicknessMm + h0Mm + input.alternateContour.yPlusMm
  const leftX = -(input.wallThicknessMm + h0Mm / 2) / 2
  const rightX = input.wallThicknessMm / 2 + (h0Mm * 3) / 4
  const bottomY = -input.wallThicknessMm / 2 - h0Mm / 2 - input.alternateContour.yMinusMm
  const topY = bottomY + lyMm

  return {
    h0Mm,
    h0M: h0Mm / 1000,
    wallThicknessM: input.wallThicknessMm / 1000,
    lx1M: lxMm / 1000,
    lx2M: lxMm / 1000,
    lyM: lyMm / 1000,
    lx1Mm: lxMm,
    lx2Mm: lxMm,
    lyMm,
    leftX,
    rightX,
    bottomY,
    topY,
  }
}

function computeCutouts(
  input: WallEndOpeningsInput,
  base: BaseGeometry,
): ComputedWallEndCutout[] {
  const cutouts: ComputedWallEndCutout[] = []

  for (const side of ['lx1', 'lx2', 'ly'] as const) {
    input.cutouts[side].forEach((cutout, index) => {
      cutouts.push(computeCutout(side, index, cutout, base))
    })
  }

  return cutouts
}

function computeCutout(
  side: WallEndCutoutSide,
  index: number,
  cutout: WallEndCutoutInput,
  base: BaseGeometry,
): ComputedWallEndCutout {
  const sideLengthMm = getSideLengthMm(side, base)
  const offsetMm = Math.max(0, cutout.offsetMm)
  const lengthMm = Math.max(0, cutout.lengthMm)
  const startAlongSide = Math.min(offsetMm, sideLengthMm)
  const endAlongSide = Math.min(offsetMm + lengthMm, sideLengthMm)
  const activeLengthMm = Math.max(0, endAlongSide - startAlongSide)

  if (side === 'ly') {
    const startY = base.bottomY + startAlongSide
    const endY = base.bottomY + endAlongSide

    return {
      ...cutout,
      side,
      index,
      activeLengthMm,
      startMm: startAlongSide,
      endMm: endAlongSide,
      startPoint: { x: base.rightX, y: startY },
      endPoint: { x: base.rightX, y: endY },
    }
  }

  const y = side === 'lx1' ? base.bottomY : base.topY
  const startX = base.rightX - endAlongSide
  const endX = base.rightX - startAlongSide

  return {
    ...cutout,
    side,
    index,
    activeLengthMm,
    startMm: startAlongSide,
    endMm: endAlongSide,
    startPoint: { x: startX, y },
    endPoint: { x: endX, y },
  }
}

function calculateStaticMoment(base: BaseGeometry, cutouts: ComputedWallEndCutout[]) {
  const x2CutMomentMm2 = sum(
    cutouts
      .filter((cutout) => cutout.side === 'lx2')
      .map((cutout) => cutout.activeLengthMm * base.lyMm),
  )
  const lyCutMomentMm2 = sum(
    cutouts
      .filter((cutout) => cutout.side === 'ly')
      .map((cutout) => cutout.activeLengthMm * (cutout.startMm + cutout.activeLengthMm / 2)),
  )

  return (
    base.lx2M * base.lyM +
    (base.lyM * base.lyM) / 2 -
    x2CutMomentMm2 / 1_000_000 -
    lyCutMomentMm2 / 1_000_000
  )
}

function calculateAq1(base: BaseGeometry) {
  const h0HalfM = base.h0M / 2
  return (
    base.wallThicknessM * (Math.max(base.lx1M, base.lx2M) - h0HalfM) +
    base.lyM * h0HalfM +
    (base.lx1M - h0HalfM) * h0HalfM +
    (base.lx2M - h0HalfM) * h0HalfM
  )
}

function calculateAq(input: WallEndOpeningsInput, base: BaseGeometry) {
  const h0HalfM = base.h0M / 2
  const baseAq =
    (base.lx1M - h0HalfM) * h0HalfM +
    (base.lx2M - h0HalfM) * h0HalfM +
    base.lyM * h0HalfM
  const expandedAq =
    base.wallThicknessM * (Math.max(base.lx1M, base.lx2M) - h0HalfM) +
    (base.lyM + base.h0M) * base.h0M +
    (base.lx1M - h0HalfM) * base.h0M +
    (base.lx2M - h0HalfM) * base.h0M

  if (input.scheme === 'foundation-column') {
    return input.forces.fiTon < 0 ? expandedAq : baseAq
  }

  if (input.scheme === 'roof-column-below' && input.forces.fiTon > 0) {
    return expandedAq
  }

  return baseAq
}

function calculateEqy(base: BaseGeometry, aqM2: number, wallCentroidYM: number) {
  const h0HalfM = base.h0M / 2
  const numerator =
    (base.lx1M - h0HalfM) * h0HalfM * (base.h0M / 4) +
    (base.lx2M - h0HalfM) * h0HalfM * (base.lyM - base.h0M / 4) +
    base.lyM * h0HalfM * (base.lyM / 2)

  return safeDivide(numerator, aqM2) - wallCentroidYM
}

function calculateLoads(input: WallEndOpeningsInput, aq1M2: number, aqM2: number, e0yM: number) {
  const myqTonM = 0
  const fq1Ton = -2.5 * 1.1 * aq1M2 * (input.slab.heightMm - (input.slab.coverXMm + input.slab.coverYMm) / 2) / 1000
  const fqTon =
    input.scheme === 'foundation-column'
      ? input.forces.fiTon < 0
        ? input.forces.qiTonPerM2 * aqM2
        : -input.forces.qiTonPerM2 * aqM2
      : input.forces.fiTon < 0
        ? 0
        : -input.forces.qiTonPerM2 * aqM2
  const fTon = Math.abs(input.forces.fiTon + fq1Ton + fqTon)
  const myLocalTonM = (input.forces.myiTonM + myqTonM) / 2
  const myFromForceTonM =
    -input.forces.fiTon * e0yM / (input.splitAdditionalMoment ? 2 : 1)
  const myTonM = myLocalTonM + myFromForceTonM

  return {
    fiTon: input.forces.fiTon,
    fq1Ton,
    fqTon,
    fTon,
    myiTonM: input.forces.myiTonM,
    myqTonM,
    myLocalTonM,
    myFromForceTonM,
    myTonM,
  }
}

function calculateIby(
  base: BaseGeometry,
  contourCentroidYM: number,
  cutouts: ComputedWallEndCutout[],
) {
  const yMm = contourCentroidYM * 1000
  const x1InertiaMm3 = sum(
    cutouts
      .filter((cutout) => cutout.side === 'lx1')
      .map((cutout) => cutout.activeLengthMm * yMm ** 2),
  )
  const x2InertiaMm3 = sum(
    cutouts
      .filter((cutout) => cutout.side === 'lx2')
      .map((cutout) => cutout.activeLengthMm * (yMm - base.lyMm) ** 2),
  )
  const lyInertiaMm3 = sum(
    cutouts
      .filter((cutout) => cutout.side === 'ly')
      .map((cutout) => {
        const length = cutout.activeLengthMm
        const centroid = cutout.startMm + length / 2
        return length ** 3 / 12 + length * (yMm - centroid) ** 2
      }),
  )

  return (
    base.lx1M * contourCentroidYM ** 2 -
    x1InertiaMm3 / 1_000_000_000 +
    (base.lyM ** 3 / 12 + base.lyM * Math.abs(base.lyM / 2 - contourCentroidYM) ** 2) -
    lyInertiaMm3 / 1_000_000_000 +
    base.lx2M * (base.lyM - contourCentroidYM) ** 2 -
    x2InertiaMm3 / 1_000_000_000
  )
}

function calculateConcrete(
  input: WallEndOpeningsInput,
  base: BaseGeometry,
  uM: number,
  myTonM: number,
  wMinusByM2: number,
  wPlusByM2: number,
  fTon: number,
) {
  const material = getWallEndConcreteMaterial(input.concrete.className)
  const rbtTonPerM2 = kgPerCm2ToTonPerM2(material.rbtKgPerCm2)
  const coefficient = rbtTonPerM2 * input.concrete.gammaB1 * input.concrete.gammaB234
  const fbUltTon = coefficient * uM * base.h0M
  const momentSectionModulus = selectMomentSectionModulus(input.forces.fiTon, myTonM, wMinusByM2, wPlusByM2)
  const mbyUltTonM = coefficient * momentSectionModulus * base.h0M
  const forceRatio = safeDivide(Math.abs(fTon), fbUltTon)
  const momentRatio = safeDivide(Math.abs(myTonM), mbyUltTonM)
  const utilization = forceRatio + Math.min(forceRatio / 2, momentRatio)
  const passed = utilization < 1

  return {
    rbtTonPerM2,
    fbUltTon,
    forceRatio,
    mbyUltTonM,
    momentRatio,
    utilization,
    passed,
    message: passed
      ? 'Условие прочности выполнено. Прочность обеспечена.'
      : 'Условие прочности не выполнено.',
  }
}

function calculateReinforcement(
  input: WallEndOpeningsInput,
  base: BaseGeometry,
  uM: number,
  myTonM: number,
  fTon: number,
  concrete: WallEndOpeningsResult['concrete'],
  wMinusByM2: number,
  wPlusByM2: number,
) {
  const material = getWallEndReinforcementMaterial(input.reinforcement.className)
  const rswTonPerM2 = kgPerCm2ToTonPerM2(material.rswKgPerCm2)
  const aswCm2 = (Math.PI * (input.reinforcement.diameterMm / 10) ** 2 * input.reinforcement.barCount) / 4
  const qswRawTonPerM =
    input.reinforcement.spacingMm > EPSILON
      ? (rswTonPerM2 * aswCm2) / input.reinforcement.spacingMm / 10
      : 0
  const qswMinimumTonPerM = (0.25 * concrete.rbtTonPerM2 * base.h0Mm) / 800
  const qswTonPerM = qswRawTonPerM > qswMinimumTonPerM ? qswRawTonPerM : 0
  const fswUltTon = 0.8 * qswTonPerM * uM
  const momentSectionModulus = selectMomentSectionModulus(input.forces.fiTon, myTonM, wMinusByM2, wPlusByM2)
  const mswyUltTonM = 0.8 * qswTonPerM * momentSectionModulus
  const fUltTon = Math.min(concrete.fbUltTon + fswUltTon, 2 * concrete.fbUltTon)
  const myUltTonM = Math.min(concrete.mbyUltTonM + mswyUltTonM, 2 * concrete.mbyUltTonM)
  const forceRatio = safeDivide(Math.abs(fTon), fUltTon)
  const momentRatio = safeDivide(Math.abs(myTonM), myUltTonM)
  const utilization = forceRatio + Math.min(forceRatio / 2, momentRatio)
  const passed = utilization < 1
  const qswUpperTonPerM = (concrete.rbtTonPerM2 * base.h0Mm) / 800

  return {
    rswTonPerM2,
    aswCm2,
    qswTonPerM,
    fswUltTon,
    fUltTon,
    forceRatio,
    mswyUltTonM,
    myUltTonM,
    momentRatio,
    utilization,
    passed,
    message: passed
      ? 'Условие прочности выполнено. Прочность обеспечена.'
      : 'Условие прочности не выполнено.',
    excessMessage:
      qswRawTonPerM > qswUpperTonPerM
        ? "Арматура установлена с избытком. Часть 'лишней' арматуры в расчете не учтена."
        : null,
  }
}

function selectMomentSectionModulus(fiTon: number, myTonM: number, wMinusByM2: number, wPlusByM2: number) {
  if (Math.abs(myTonM) <= EPSILON) {
    return Math.min(wMinusByM2, wPlusByM2)
  }

  if (fiTon > 0) {
    return myTonM > 0 ? wPlusByM2 : wMinusByM2
  }

  return myTonM > 0 ? wMinusByM2 : wPlusByM2
}

function buildPlot(
  base: BaseGeometry,
  contourCentroidYM: number,
  cutouts: ComputedWallEndCutout[],
): WallEndOpeningsResult['plot'] {
  const contourSegments = [
    {
      side: 'lx1' as const,
      start: { x: base.leftX, y: base.bottomY },
      end: { x: base.rightX, y: base.bottomY },
    },
    {
      side: 'ly' as const,
      start: { x: base.rightX, y: base.bottomY },
      end: { x: base.rightX, y: base.topY },
    },
    {
      side: 'lx2' as const,
      start: { x: base.rightX, y: base.topY },
      end: { x: base.leftX, y: base.topY },
    },
  ]
  const removedSegments = cutouts
    .filter((cutout) => cutout.activeLengthMm > EPSILON)
    .map((cutout) => ({ side: cutout.side, start: cutout.startPoint, end: cutout.endPoint }))
  const activeSegments = contourSegments.flatMap((segment) =>
    subtractCutoutsFromSegment(segment, removedSegments.filter((removed) => removed.side === segment.side)),
  )
  const margin = 48
  const wallHalfMm = base.wallThicknessM * 1000 / 2
  const points = [
    ...contourSegments.flatMap((segment) => [segment.start, segment.end]),
    { x: base.leftX, y: -wallHalfMm },
    { x: base.rightX - base.h0Mm / 2, y: wallHalfMm },
  ]
  const minX = Math.min(...points.map((point) => point.x)) - margin
  const maxX = Math.max(...points.map((point) => point.x)) + margin
  const minY = Math.min(...points.map((point) => point.y)) - margin
  const maxY = Math.max(...points.map((point) => point.y)) + margin

  return {
    wallPoints: [
      { x: base.leftX, y: -wallHalfMm },
      { x: base.rightX - base.h0Mm / 2, y: -wallHalfMm },
      { x: base.rightX - base.h0Mm / 2, y: wallHalfMm },
      { x: base.leftX, y: wallHalfMm },
    ],
    contourPoints: [
      { x: base.leftX, y: base.bottomY },
      { x: base.rightX, y: base.bottomY },
      { x: base.rightX, y: base.topY },
      { x: base.leftX, y: base.topY },
    ],
    activeSegments,
    removedSegments,
    wallCentroid: { x: 0, y: 0 },
    contourCentroid: { x: 0, y: contourCentroidYM * 1000 - (base.wallThicknessM * 1000) / 2 - base.h0Mm / 2 },
    bounds: { minX, maxX, minY, maxY },
  }
}

function subtractCutoutsFromSegment(
  segment: { side: WallEndCutoutSide; start: { x: number; y: number }; end: { x: number; y: number } },
  removedSegments: Array<{ side: WallEndCutoutSide; start: { x: number; y: number }; end: { x: number; y: number } }>,
) {
  if (removedSegments.length === 0) {
    return [segment]
  }

  const horizontal = segment.start.y === segment.end.y
  const axisStart = horizontal ? Math.min(segment.start.x, segment.end.x) : Math.min(segment.start.y, segment.end.y)
  const axisEnd = horizontal ? Math.max(segment.start.x, segment.end.x) : Math.max(segment.start.y, segment.end.y)
  const removed = removedSegments
    .map((item) => ({
      start: horizontal ? Math.min(item.start.x, item.end.x) : Math.min(item.start.y, item.end.y),
      end: horizontal ? Math.max(item.start.x, item.end.x) : Math.max(item.start.y, item.end.y),
    }))
    .filter((item) => item.end > item.start)
    .sort((left, right) => left.start - right.start)

  const spans: Array<{ start: number; end: number }> = []
  let cursor = axisStart

  for (const item of removed) {
    if (item.start > cursor) {
      spans.push({ start: cursor, end: Math.min(item.start, axisEnd) })
    }
    cursor = Math.max(cursor, item.end)
  }

  if (cursor < axisEnd) {
    spans.push({ start: cursor, end: axisEnd })
  }

  return spans
    .filter((span) => span.end - span.start > EPSILON)
    .map((span) => {
      if (horizontal) {
        return {
          side: segment.side,
          start: { x: span.start, y: segment.start.y },
          end: { x: span.end, y: segment.start.y },
        }
      }

      return {
        side: segment.side,
        start: { x: segment.start.x, y: span.start },
        end: { x: segment.start.x, y: span.end },
      }
    })
}

function getSideLengthMm(side: WallEndCutoutSide, base: BaseGeometry) {
  if (side === 'lx1') {
    return base.lx1Mm
  }

  if (side === 'lx2') {
    return base.lx2Mm
  }

  return base.lyMm
}

function safeDivide(numerator: number, denominator: number) {
  if (Math.abs(denominator) <= EPSILON) {
    return 0
  }

  return numerator / denominator
}

function positiveOrZero(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}
