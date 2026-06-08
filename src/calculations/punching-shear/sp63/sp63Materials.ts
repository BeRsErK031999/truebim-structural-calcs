import type { ConcreteClassName, ShearReinforcementSteelClass } from '../types'

import type { Sp63MaterialResult } from './sp63Types'

const benchmarkConcreteRbtMpa: Partial<Record<ConcreteClassName, number>> = {
  B30: 1.15,
}

const benchmarkReinforcementRswMpa: Partial<Record<ShearReinforcementSteelClass, number>> = {
  A240: 170,
}

export function getSp63BenchmarkMaterials(
  concreteClass: ConcreteClassName,
  reinforcementClass: ShearReinforcementSteelClass,
): Sp63MaterialResult | null {
  const Rbt = benchmarkConcreteRbtMpa[concreteClass]
  const Rsw = benchmarkReinforcementRswMpa[reinforcementClass]

  if (Rbt === undefined || Rsw === undefined) {
    return null
  }

  return {
    Rbt,
    Rsw,
  }
}

