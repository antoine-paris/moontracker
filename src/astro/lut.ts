// Génération du tableau TERMINATOR_LUT_CRES par calcul numérique
// Chaque entrée correspond à une fraction f (%) de l'aire du petit disque,
// et donne rR = X (grand rayon) et dR = Y (distance des centres).

/*
function E_from_Y(Y: number): number {
    return Math.PI / 2 - (1 + Y * Y) * (Math.PI / 2 - Math.atan(Y)) + Y;
}
function e_from_Y(Y: number): number { return E_from_Y(Y) / Math.PI; }
function X_from_Y(Y: number): number { return Math.sqrt(1 + Y * Y); }


function solveY_from_e(e_target: number): number {
    let lo = 0;
    let hi = 1;
    while (e_from_Y(hi) < e_target - 1e-14) {
        hi *= 2;
        if (hi > 1e6) break;
    }
    for (let i = 0; i < 100; i++) {
        const mid = 0.5 * (lo + hi);
        const val = e_from_Y(mid);
        if (val < e_target) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
}
export const TERMINATOR_LUT_CRES: Array<{ f: number; rR: number; dR: number }> = [];
    for (let f = 1; f <= 49; f++) {
        const e_target = f / 100;
        const Y = solveY_from_e(e_target);
        const X = X_from_Y(Y);
        TERMINATOR_LUT_CRES.push({ f, rR: X, dR: Y });
    }
*/

// Précalculé avec le code commenté ci-dessus des raisons de performance
export const TERMINATOR_LUT_CRES: Array<{ f: number; rR: number; dR: number }> = [
  { f: 1, rR: 1.0001264814647446, dR: 0.015905311284288598 },
  { f: 2, rR: 1.0005189337402591, dR: 0.032220129930605704 },
  { f: 3, rR: 1.0011982171783809, dR: 0.0489680516374513 },
  { f: 4, rR: 1.0021871516206684, dR: 0.0661746694253082 },
  { f: 5, rR: 1.0035107408330763, dR: 0.08386779457783547 },
  { f: 6, rR: 1.0051964277809604, dR: 0.10207770777012667 },
  { f: 7, rR: 1.0072743857507385, dR: 0.12083744531198748 },
  { f: 8, rR: 1.009777851272342, dR: 0.14018312637471136 },
  { f: 9, rR: 1.012743505951352, dR: 0.1601543282169932 },
  { f: 10, rR: 1.0162119157330227, dR: 0.18079451783110112 },
  { f: 11, rR: 1.0202280378583408, dR: 0.20215155016046849 },
  { f: 12, rR: 1.0248418079201134, dR: 0.2242782451798805 },
  { f: 13, rR: 1.0301088220954107, dR: 0.24723305879027258 },
  { f: 14, rR: 1.0360911329638598, dR: 0.27108086580637625 },
  { f: 15, rR: 1.0428581815090696, dR: 0.2958938774973282 },
  { f: 16, rR: 1.0504878931939987, dR: 0.3217527214293078 },
  { f: 17, rR: 1.0590679727352954, dR: 0.3487477180909553 },
  { f: 18, rR: 1.0686974408266428, dR: 0.3769803974073659 },
  { f: 19, rR: 1.0794884671868006, dR: 0.4065653093776056 },
  { f: 20, rR: 1.0915685687681047, dR: 0.4376321975385823 },
  { f: 21, rR: 1.1050832609056234, dR: 0.47032862291572897 },
  { f: 22, rR: 1.1201992742182008, dR: 0.504823151171758 },
  { f: 23, rR: 1.137108483445354, dR: 0.5413092490650726 },
  { f: 24, rR: 1.1560327393280965, dR: 0.5800100812903364 },
  { f: 25, rR: 1.177229855739742, dR: 0.6211844599191243 },
  { f: 26, rR: 1.2010010882861943, dR: 0.6651342827314068 },
  { f: 27, rR: 1.2277005574908788, dR: 0.7122139136968713 },
  { f: 28, rR: 1.2577472344081828, dR: 0.7628421236805374 },
  { f: 29, rR: 1.2916403418540163, dR: 0.817517444893233 },
  { f: 30, rR: 1.329979365717774, dR: 0.8768381339991167 },
  { f: 31, rR: 1.3734903737872348, dR: 0.9415284418891432 },
  { f: 32, rR: 1.423061094014365, dR: 1.0124736427667447 },
  { f: 33, rR: 1.4797883581433566, dR: 1.0907674293343246 },
  { f: 34, rR: 1.5450433198074405, dR: 1.1777770842063435 },
  { f: 35, rR: 1.6205627413815176, dR: 1.2752347230035652 },
  { f: 36, rR: 1.708579383912963, dR: 1.385367644754417 },
  { f: 37, rR: 1.8120125561567524, dR: 1.5110888470469654 },
  { f: 38, rR: 1.934753916832045, dR: 1.6562828015459616 },
  { f: 39, rR: 2.0821091481231946, dR: 1.8262471094291417 },
  { f: 40, rR: 2.2615046139555948, dR: 2.028399151780153 },
  { f: 41, rR: 2.4836651076412486, dR: 2.273453840946549 },
  { f: 42, rR: 2.764674899487546, dR: 2.5774846846987227 },
  { f: 43, rR: 3.1298053942812034, dR: 2.965751474090794 },
  { f: 44, rR: 3.62117045660428, dR: 3.4803556536342155 },
  { f: 45, rR: 4.314568156014174, dR: 4.197082126059907 },
  { f: 46, rR: 5.361585189118876, dR: 5.267503748473169 },
  { f: 47, rR: 7.11591025436942, dR: 7.045294794984796 },
  { f: 48, rR: 10.638587756722007, dR: 10.591484761707179 },
  { f: 49, rR: 21.23479422889962, dR: 21.211234899074327 },
];

export function interpCres(pct: number) {
  const p = Math.min(49, Math.max(1, pct));
  const i0 = Math.floor(p);
  const i1 = Math.ceil(p);
  if (i0 === i1) {
    const row = TERMINATOR_LUT_CRES.find(x => x.f === i0)!;
    return { rR: row.rR, dR: row.dR };
  }
  const a = TERMINATOR_LUT_CRES.find(x => x.f === i0)!;
  const b = TERMINATOR_LUT_CRES.find(x => x.f === i1)!;
  const t = (p - i0) / (i1 - i0);
  return { rR: a.rR + (b.rR - a.rR) * t, dR: a.dR + (b.dR - a.dR) * t };
}

export function sampleTerminatorLUT(frac: number) {
  const pct = Math.max(0, Math.min(100, frac * 100));
  if (pct <= 50) {
    const p = pct < 1 ? 1 : pct > 49 ? 49 : pct;
    return interpCres(p);
  } else {
    const p = 100 - pct; // 0..49
    const pm = p < 1 ? 1 : p > 49 ? 49 : p;
    return interpCres(pm);
  }
}
