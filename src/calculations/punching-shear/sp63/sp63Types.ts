import type { ConcreteClassName, ShearReinforcementSteelClass } from '../types'

export type Sp63BenchmarkStatus = 'mathcad-benchmark-candidate' | 'matched' | 'pending' | 'unsupported'

export type Sp63InteractionInput = {
  concreteClass: ConcreteClassName
  reinforcementClass: ShearReinforcementSteelClass
  shearBarDiameterMm: number
  manualAswMm2?: number
  manualSwMm?: number
  h: number
  h0: number
  a1: number
  b1: number
  Finf: number
  Fsup: number
  MxInf: number
  MxSup: number
  MyInf: number
  MySup: number
  shearReinforcementEnabled: boolean
}

export type Sp63MaterialResult = {
  Rbt: number
  Rsw: number
}

export type Sp63GeometryResult = {
  a: number
  b: number
  u: number
  Ab: number
  Ix: number
  Iy: number
  Wx: number
  Wy: number
}

export type Sp63ConcreteCapacityResult = {
  FbUlt: number
  MxBUlt: number
  MyBUlt: number
}

export type Sp63ReinforcementResult = {
  sw1: number
  sw: number
  nw: number
  Asw: number
  qsw: number
  FswUlt: number
  FswUltEffective: number
  MxSwUlt: number
  MySwUlt: number
  Fult: number
  MxUlt: number
  MyUlt: number
}

export type Sp63OuterContourResult = {
  asw: number
  aPrime: number
  bPrime: number
  uPrime: number
  AbPrime: number
  IxPrime: number
  IyPrime: number
  WxPrime: number
  WyPrime: number
  FbUltPrime: number
  MxBUltPrime: number
  MyBUltPrime: number
  AqPrime: number
  FsbPrime: number
  FPrime: number
  utilization: number
}

export type Sp63InteractionResult = Sp63GeometryResult &
  Sp63MaterialResult &
  Sp63ConcreteCapacityResult &
  Sp63ReinforcementResult & {
    F: number
    Mx: number
    My: number
    forceCapConcreteOnly: number
    utilizationConcreteOnly: number
    utilizationWithReinforcement: number | null
    outerContour: Sp63OuterContourResult | null
    benchmarkStatus: Sp63BenchmarkStatus
    warnings: string[]
  }
