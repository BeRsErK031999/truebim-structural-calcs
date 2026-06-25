import type { ConcreteClassName, ShearReinforcementSteelClass } from '../types'

import type { Sp63MaterialResult } from './sp63Types'

const benchmarkConcreteRbtMpa: Record<ConcreteClassName, number> = {
  B15: 0.75,
  B20: 0.9,
  B25: 1.05,
  B30: 1.15,
  B35: 1.3,
  B40: 1.4,
}

const benchmarkReinforcementRswMpa: Record<ShearReinforcementSteelClass, number> = {
  A240: 170,
  A400: 280,
  A500: 355,
  B500: 355,
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
