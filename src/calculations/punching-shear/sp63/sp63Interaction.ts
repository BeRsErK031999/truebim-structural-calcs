import { calculateSp63ControlGeometry, calculateSp63OuterGeometry, mmToM } from './sp63Geometry'
import { getSp63BenchmarkMaterials } from './sp63Materials'
import { calculateSp63Reinforcement } from './sp63Reinforcement'
import { createSp63BenchmarkWarnings } from './sp63BenchmarkWarnings'
import type {
  Sp63ConcreteCapacityResult,
  Sp63InteractionInput,
  Sp63InteractionResult,
  Sp63OuterContourResult,
} from './sp63Types'

const concreteDensityTonPerM3 = 2.5
const gravityMPerS2 = 9.81

export function calculateSp63Interaction(input: Sp63InteractionInput): Sp63InteractionResult | null {
  const materials = getSp63BenchmarkMaterials(input.concreteClass, input.reinforcementClass)

  if (!materials) {
    return null
  }

  const geometry = calculateSp63ControlGeometry(input.a1, input.b1, input.h0)
  const concreteCapacity = calculateConcreteCapacity(materials.Rbt, geometry.Ab, geometry.Wx, geometry.Wy, input.h0)
  const reinforcement = calculateSp63Reinforcement(
    input.h0,
    input.a1,
    input.b1,
    input.shearBarDiameterMm,
    materials.Rsw,
    geometry,
    concreteCapacity,
    input.manualAswMm2,
    input.manualSwMm,
  )
  const F = input.Finf - input.Fsup
  const Mx = (input.MxSup + input.MxInf) / 2
  const My = (input.MySup + input.MyInf) / 2
  const forceCapConcreteOnly = 1.5 * F / concreteCapacity.FbUlt
  const utilizationConcreteOnly = Math.min(
    F / concreteCapacity.FbUlt + Mx / concreteCapacity.MxBUlt + My / concreteCapacity.MyBUlt,
    forceCapConcreteOnly,
  )
  const utilizationWithReinforcement = input.shearReinforcementEnabled
    ? Math.min(
        F / reinforcement.Fult + Mx / reinforcement.MxUlt + My / reinforcement.MyUlt,
        1.5 * F / reinforcement.Fult,
      )
    : null
  const outerContour = input.shearReinforcementEnabled
    ? calculateOuterContour(input, materials.Rbt, reinforcement.sw, Mx, My)
    : null
  const benchmarkStatus = isMathcadBenchmarkMatched({
    input,
    concreteCapacity,
    reinforcement,
    utilizationConcreteOnly,
    utilizationWithReinforcement,
    outerContour,
  })
    ? 'matched'
    : 'mathcad-benchmark-candidate'

  return {
    ...geometry,
    ...materials,
    ...concreteCapacity,
    ...reinforcement,
    F,
    Mx,
    My,
    forceCapConcreteOnly,
    utilizationConcreteOnly,
    utilizationWithReinforcement,
    outerContour,
    benchmarkStatus,
    warnings: createSp63BenchmarkWarnings(benchmarkStatus),
  }
}

function calculateConcreteCapacity(
  RbtMpa: number,
  AbM2: number,
  WxM2: number,
  WyM2: number,
  h0Mm: number,
): Sp63ConcreteCapacityResult {
  const h0M = mmToM(h0Mm)

  return {
    FbUlt: RbtMpa * AbM2 * 1000,
    MxBUlt: RbtMpa * WxM2 * h0M * 1000,
    MyBUlt: RbtMpa * WyM2 * h0M * 1000,
  }
}

function calculateOuterContour(
  input: Sp63InteractionInput,
  RbtMpa: number,
  swMm: number,
  MxKnM: number,
  MyKnM: number,
): Sp63OuterContourResult {
  const outerGeometry = calculateSp63OuterGeometry(input.a1, input.b1, input.h0, swMm)
  const outerCapacity = calculateConcreteCapacity(
    RbtMpa,
    outerGeometry.AbPrime,
    outerGeometry.WxPrime,
    outerGeometry.WyPrime,
    input.h0,
  )
  const FsbPrimeKn = input.h / 1000 * concreteDensityTonPerM3 * gravityMPerS2 * outerGeometry.AqPrime
  const FPrimeKn = input.Finf - input.Fsup - FsbPrimeKn
  const utilization = Math.min(
    FPrimeKn / outerCapacity.FbUlt + MxKnM / outerCapacity.MxBUlt + MyKnM / outerCapacity.MyBUlt,
    1.5 * FPrimeKn / outerCapacity.FbUlt,
  )

  return {
    ...outerGeometry,
    FbUltPrime: outerCapacity.FbUlt,
    MxBUltPrime: outerCapacity.MxBUlt,
    MyBUltPrime: outerCapacity.MyBUlt,
    FsbPrime: FsbPrimeKn,
    FPrime: FPrimeKn,
    utilization,
  }
}

function isMathcadBenchmarkMatched({
  input,
  concreteCapacity,
  reinforcement,
  utilizationConcreteOnly,
  utilizationWithReinforcement,
  outerContour,
}: {
  input: Sp63InteractionInput
  concreteCapacity: Sp63ConcreteCapacityResult
  reinforcement: ReturnType<typeof calculateSp63Reinforcement>
  utilizationConcreteOnly: number
  utilizationWithReinforcement: number | null
  outerContour: Sp63OuterContourResult | null
}) {
  return (
    input.concreteClass === 'B30' &&
    input.reinforcementClass === 'A240' &&
    input.shearBarDiameterMm === 6 &&
    input.h === 220 &&
    input.h0 === 190 &&
    input.a1 === 800 &&
    input.b1 === 500 &&
    input.Finf === 800 &&
    input.Fsup === 0 &&
    input.MxInf === 60 &&
    input.MxSup === 0 &&
    input.MyInf === 50 &&
    input.MySup === 0 &&
    input.shearReinforcementEnabled &&
    near(concreteCapacity.FbUlt, 734.16, 0.005) &&
    near(reinforcement.Fult, 1164.835, 0.005) &&
    near(utilizationConcreteOnly, 1.366, 0.005) &&
    near(utilizationWithReinforcement, 0.861, 0.005) &&
    near(outerContour?.utilization, 0.626, 0.005)
  )
}

function near(actual: number | null | undefined, expected: number, relativeTolerance: number) {
  return actual !== null &&
    actual !== undefined &&
    Number.isFinite(actual) &&
    Math.abs(actual - expected) <= Math.abs(expected) * relativeTolerance
}
