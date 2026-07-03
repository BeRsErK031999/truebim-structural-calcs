export type WallEndConcreteClass =
  | 'B10'
  | 'B15'
  | 'B20'
  | 'B25'
  | 'B30'
  | 'B35'
  | 'B40'
  | 'B45'
  | 'B50'
  | 'B55'
  | 'B60'

export type WallEndReinforcementClass = 'A240' | 'A300' | 'A400' | 'A500' | 'B500'

export type WallEndScheme =
  | 'floor-columns-above-and-below'
  | 'floor-column-above'
  | 'roof-column-below'
  | 'foundation-column'

export type WallEndCutoutSide = 'lx1' | 'lx2' | 'ly'

export type WallEndCutoutInput = {
  offsetMm: number
  lengthMm: number
}

export type WallEndOpeningsInput = {
  scheme: WallEndScheme
  splitAdditionalMoment: boolean
  wallThicknessMm: number
  slab: {
    heightMm: number
    coverXMm: number
    coverYMm: number
  }
  forces: {
    fiTon: number
    myiTonM: number
    qiTonPerM2: number
  }
  concrete: {
    className: WallEndConcreteClass
    gammaB1: number
    gammaB234: number
  }
  reinforcement: {
    className: WallEndReinforcementClass
    diameterMm: number
    barCount: number
    spacingMm: number
  }
  cutouts: Record<WallEndCutoutSide, WallEndCutoutInput[]>
  alternateContour: {
    yPlusMm: number
    yMinusMm: number
  }
}

export type ComputedWallEndCutout = WallEndCutoutInput & {
  side: WallEndCutoutSide
  index: number
  activeLengthMm: number
  startMm: number
  endMm: number
  startPoint: { x: number; y: number }
  endPoint: { x: number; y: number }
}

export type WallEndOpeningsResult = {
  status: 'draft_reference' | 'invalid_input'
  warnings: string[]
  geometry: {
    h0Mm: number
    lx1M: number
    lx2M: number
    lyM: number
    uM: number
    areaM2: number
    staticMomentM3: number
    x0M: number
    wallCentroidYM: number
    contourCentroidYM: number
    e0xM: number
    e0yM: number
    aq1M2: number
    aqM2: number
    eqxM: number
    eqyM: number
    ibyM3: number
    wMinusByM2: number
    wPlusByM2: number
  }
  loads: {
    fiTon: number
    fq1Ton: number
    fqTon: number
    fTon: number
    myiTonM: number
    myqTonM: number
    myLocalTonM: number
    myFromForceTonM: number
    myTonM: number
  }
  concrete: {
    rbtTonPerM2: number
    fbUltTon: number
    forceRatio: number
    mbyUltTonM: number
    momentRatio: number
    utilization: number
    passed: boolean
    message: string
  }
  reinforcement: {
    rswTonPerM2: number
    aswCm2: number
    qswTonPerM: number
    fswUltTon: number
    fUltTon: number
    forceRatio: number
    mswyUltTonM: number
    myUltTonM: number
    momentRatio: number
    utilization: number
    passed: boolean
    message: string
    excessMessage: string | null
  }
  plot: {
    wallPoints: Array<{ x: number; y: number }>
    contourPoints: Array<{ x: number; y: number }>
    activeSegments: Array<{ side: WallEndCutoutSide; start: { x: number; y: number }; end: { x: number; y: number } }>
    removedSegments: Array<{ side: WallEndCutoutSide; start: { x: number; y: number }; end: { x: number; y: number } }>
    wallCentroid: { x: number; y: number }
    contourCentroid: { x: number; y: number }
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  }
  cutouts: ComputedWallEndCutout[]
}
