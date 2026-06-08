import type { PunchingShearInput, PunchingShearResult } from '../types'
import { formatNullable, formatNumber } from './traceFormat'
import type { TraceSection } from './traceSection'
import type { TraceStep } from './traceStep'

const sourceReference = 'SP63 interaction benchmark candidate based on Mathcad PDF fixture'
const candidateWarning =
  'SP63 interaction benchmark is not VERIFIED and must remain draft until engineer acceptance.'

export function traceForSp63Interaction(
  input: PunchingShearInput,
  result: PunchingShearResult,
): TraceSection | null {
  const sp63 = result.sp63Interaction

  if (!sp63) {
    return null
  }

  const warnings = [candidateWarning, ...sp63.warnings]

  return {
    id: 'sp63-interaction-benchmark-trace',
    title: 'SP63 Interaction Benchmark Trace',
    steps: [
      {
        id: 'sp63-moment-reduction',
        title: 'Moment reduction',
        description: 'Mathcad benchmark uses half-sum design moments for interaction checks.',
        formula: 'Mx = (Mx.sup + Mx.inf) / 2; My = (My.sup + My.inf) / 2',
        substitutedFormula: `Mx = (${formatNumber(0)} + ${formatNumber(input.forces.momentXKnM)}) / 2; My = (${formatNumber(0)} + ${formatNumber(input.forces.momentYKnM)}) / 2`,
        result: `Mx = ${formatNumber(sp63.Mx)}; My = ${formatNumber(sp63.My)}`,
        units: 'kN*m',
        sourceType: 'draft',
        sourceReference,
        warnings,
      },
      {
        id: 'sp63-concrete-capacity',
        title: 'Concrete capacity',
        description: 'Concrete force and moment limits are calculated from contour area and section moduli.',
        formula: 'Fb.ult = Rbt * Ab; Mx.b.ult = Rbt * Wx * h0; My.b.ult = Rbt * Wy * h0',
        substitutedFormula: `Rbt = ${formatNumber(sp63.Rbt)} MPa; Ab = ${formatNumber(sp63.Ab, 6)} m2; Wx = ${formatNumber(sp63.Wx, 6)} m2; Wy = ${formatNumber(sp63.Wy, 6)} m2`,
        result: `Fb.ult = ${formatNumber(sp63.FbUlt, 3)}; Mx.b.ult = ${formatNumber(sp63.MxBUlt, 3)}; My.b.ult = ${formatNumber(sp63.MyBUlt, 3)}`,
        units: 'kN, kN*m',
        sourceType: 'draft',
        sourceReference,
        warnings,
      },
      {
        id: 'sp63-reinforcement-capacity',
        title: 'Reinforcement capacity',
        description: 'Shear reinforcement contribution follows the Mathcad benchmark candidate formulas.',
        formula: 'qsw = Rsw * Asw / sw; Fsw.ult = 0.8 * qsw * u',
        substitutedFormula: `Rsw = ${formatNumber(sp63.Rsw)} MPa; Asw = ${formatNumber(sp63.Asw, 3)} cm2; sw = ${formatNumber(sp63.sw)} mm; u = ${formatNumber(sp63.u, 3)} m`,
        result: `Fsw.ult = ${formatNumber(sp63.FswUlt, 3)}; Fult = ${formatNumber(sp63.Fult, 3)}`,
        units: 'kN',
        sourceType: 'draft',
        sourceReference,
        warnings,
      },
      {
        id: 'sp63-interaction-check',
        title: 'Interaction check',
        description: 'Concrete-only and reinforced interaction utilizations are evaluated separately from the draft stress check.',
        formula: 'min(F/Fult + Mx/Mx.ult + My/My.ult, 1.5 * F/Fult)',
        substitutedFormula: `F = ${formatNumber(sp63.F)} kN; Mx = ${formatNumber(sp63.Mx)} kN*m; My = ${formatNumber(sp63.My)} kN*m`,
        result: `concrete = ${formatNumber(sp63.utilizationConcreteOnly, 3)}; reinforcement = ${formatNullable(sp63.utilizationWithReinforcement, 3)}`,
        units: 'ratio',
        sourceType: 'draft',
        sourceReference,
        warnings,
      },
      {
        id: 'sp63-outer-contour-check',
        title: 'Outer contour check',
        description: 'Outer contour utilization is calculated behind the shear reinforcement zone.',
        formula: "min(F'/Fb.ult' + Mx/Mx.b.ult' + My/My.b.ult', 1.5 * F'/Fb.ult')",
        substitutedFormula: sp63.outerContour
          ? `F' = ${formatNumber(sp63.outerContour.FPrime, 3)} kN; u' = ${formatNumber(sp63.outerContour.uPrime, 3)} m`
          : 'outer contour disabled',
        result: formatNullable(sp63.outerContour?.utilization, 3),
        units: 'ratio',
        sourceType: 'draft',
        sourceReference,
        warnings,
      },
    ] satisfies TraceStep[],
  }
}

