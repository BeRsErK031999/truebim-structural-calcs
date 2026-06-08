import type { Sp63GeometryResult, Sp63OuterContourResult } from './sp63Types'

export function calculateSp63ControlGeometry(a1Mm: number, b1Mm: number, h0Mm: number): Sp63GeometryResult {
  const aM = mmToM(a1Mm + h0Mm)
  const bM = mmToM(b1Mm + h0Mm)
  const h0M = mmToM(h0Mm)
  const uM = 2 * (aM + bM)
  const AbM2 = uM * h0M
  const IxM3 = bM ** 2 * (bM / 6 + aM / 2)
  const IyM3 = aM ** 2 * (bM / 2 + aM / 6)
  const WxM2 = 2 * IxM3 / bM
  const WyM2 = 2 * IyM3 / aM

  return {
    a: aM,
    b: bM,
    u: uM,
    Ab: AbM2,
    Ix: IxM3,
    Iy: IyM3,
    Wx: WxM2,
    Wy: WyM2,
  }
}

export function calculateSp63OuterGeometry(
  a1Mm: number,
  b1Mm: number,
  h0Mm: number,
  swMm: number,
): Pick<
  Sp63OuterContourResult,
  'asw' | 'aPrime' | 'bPrime' | 'uPrime' | 'AbPrime' | 'IxPrime' | 'IyPrime' | 'WxPrime' | 'WyPrime' | 'AqPrime'
> {
  const aswMm = Math.ceil((1.5 * h0Mm) / swMm) * swMm
  const aPrimeM = mmToM(a1Mm + 2 * aswMm + h0Mm)
  const bPrimeM = mmToM(b1Mm + 2 * aswMm + h0Mm)
  const h0M = mmToM(h0Mm)
  const uPrimeM = 2 * (aPrimeM + bPrimeM + 2 * h0M)
  const AbPrimeM2 = uPrimeM * h0M
  const xDimensionM = bPrimeM + h0M
  const yDimensionM = aPrimeM + h0M
  const IxPrimeM3 = xDimensionM ** 2 * (xDimensionM / 6 + yDimensionM / 2)
  const IyPrimeM3 = yDimensionM ** 2 * (xDimensionM / 2 + yDimensionM / 6)
  const WxPrimeM2 = 2 * IxPrimeM3 / xDimensionM
  const WyPrimeM2 = 2 * IyPrimeM3 / yDimensionM

  return {
    asw: mmToM(aswMm),
    aPrime: aPrimeM,
    bPrime: bPrimeM,
    uPrime: uPrimeM,
    AbPrime: AbPrimeM2,
    IxPrime: IxPrimeM3,
    IyPrime: IyPrimeM3,
    WxPrime: WxPrimeM2,
    WyPrime: WyPrimeM2,
    AqPrime: aPrimeM * bPrimeM,
  }
}

export function mmToM(valueMm: number) {
  return valueMm / 1000
}

