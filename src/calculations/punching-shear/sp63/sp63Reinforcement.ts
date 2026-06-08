import type {
  Sp63ConcreteCapacityResult,
  Sp63GeometryResult,
  Sp63ReinforcementResult,
} from './sp63Types'

export function calculateSp63Reinforcement(
  h0Mm: number,
  a1Mm: number,
  b1Mm: number,
  shearBarDiameterMm: number,
  RswMpa: number,
  geometry: Sp63GeometryResult,
  concreteCapacity: Sp63ConcreteCapacityResult,
): Sp63ReinforcementResult {
  const sw1Mm = ceilToStep(h0Mm / 3, 5)
  const swMm = floorToStep(Math.min(a1Mm / 4, b1Mm / 4, h0Mm / 3), 5)
  const nw =
    Math.floor((0.5 * h0Mm - sw1Mm) / swMm) +
    Math.floor((0.5 * h0Mm) / swMm) +
    1
  const AswMm2 = nw * Math.PI * shearBarDiameterMm ** 2 / 4
  const AswCm2 = AswMm2 / 100
  const qswKnPerM = RswMpa * AswMm2 / swMm
  const FswUltKn = 0.8 * qswKnPerM * geometry.u
  const FswUltEffectiveKn =
    FswUltKn >= 0.25 * concreteCapacity.FbUlt ? FswUltKn : 0
  const MxSwUltKnM = 0.8 * qswKnPerM * geometry.Wx
  const MySwUltKnM = 0.8 * qswKnPerM * geometry.Wy

  return {
    sw1: sw1Mm,
    sw: swMm,
    nw,
    Asw: AswCm2,
    qsw: qswKnPerM,
    FswUlt: FswUltKn,
    FswUltEffective: FswUltEffectiveKn,
    MxSwUlt: MxSwUltKnM,
    MySwUlt: MySwUltKnM,
    Fult: Math.min(2 * concreteCapacity.FbUlt, concreteCapacity.FbUlt + FswUltEffectiveKn),
    MxUlt: Math.min(2 * concreteCapacity.MxBUlt, concreteCapacity.MxBUlt + MxSwUltKnM),
    MyUlt: Math.min(2 * concreteCapacity.MyBUlt, concreteCapacity.MyBUlt + MySwUltKnM),
  }
}

function ceilToStep(value: number, step: number) {
  return Math.ceil(value / step) * step
}

function floorToStep(value: number, step: number) {
  return Math.floor(value / step) * step
}

