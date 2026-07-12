import { RhythmType } from "@/types/monitor";

/**
 * Realistic ECG waveform generator based on the McSharry dynamical model
 * (the same underlying approach used by ECGSYN / PhysioNet's fecgsyn toolbox:
 * https://archive.physionet.org/physiotools/ipmcode/fecgsyn/,
 * https://github.com/fernandoandreotti/fecgsyn).
 *
 * Instead of solving the full 3D ODE limit-cycle system (heavy for real-time
 * canvas rendering), we use the equivalent closed-form representation: each
 * PQRST complex is modeled as a sum of asymmetric Gaussian functions,
 * exactly as described in McSharry et al. 2003 ("A dynamical model for
 * generating synthetic ECG signals", IEEE Trans Biomed Eng), which is the
 * mathematical basis for ECGSYN/fecgsyn's beat morphology.
 *
 * z(t) = sum_i  a_i * exp( -(theta - theta_i)^2 / (2 * b_i^2) )
 *
 * where each wave (P, Q, R, S, T) is a Gaussian with:
 *   a_i = amplitude
 *   b_i = width
 *   theta_i = angular position on the cardiac cycle (radians, -pi..pi)
 */

export interface GaussianWave {
  a: number; // amplitude (mV, scaled)
  b: number; // width (radians)
  theta: number; // center angle (radians)
}

export interface RhythmMorphology {
  waves: GaussianWave[];
  /** Multiplies overall RR-interval variability (0 = perfectly regular) */
  rrVariability: number;
  /** If true, P wave is absent (e.g. AFib, junctional, VT/VF) */
  noPWave?: boolean;
  /** Chaotic/flatline rendering instead of Gaussian PQRST (VF, asystole) */
  chaotic?: boolean;
  flatline?: boolean;
}

const DEG = Math.PI / 180;

// Standard McSharry et al. (2003) default parameter set for a normal beat,
// as used in ECGSYN's reference implementation.
const NSR_WAVES: GaussianWave[] = [
  { a: 1.2, b: 0.25, theta: -70 * DEG },   // P wave
  { a: -5.0, b: 0.1, theta: -15 * DEG },   // Q wave
  { a: 30.0, b: 0.1, theta: 0 * DEG },     // R wave
  { a: -7.5, b: 0.1, theta: 15 * DEG },    // S wave
  { a: 0.75, b: 0.4, theta: 100 * DEG },   // T wave
];

function scaledWaves(scale: number, thetaShift: Partial<Record<"P" | "Q" | "R" | "S" | "T", number>> = {}): GaussianWave[] {
  const [p, q, r, s, t] = NSR_WAVES;
  return [
    { ...p, a: p.a * scale, theta: p.theta + (thetaShift.P ?? 0) * DEG },
    { ...q, a: q.a * scale, theta: q.theta + (thetaShift.Q ?? 0) * DEG },
    { ...r, a: r.a * scale, theta: r.theta + (thetaShift.R ?? 0) * DEG },
    { ...s, a: s.a * scale, theta: s.theta + (thetaShift.S ?? 0) * DEG },
    { ...t, a: t.a * scale, theta: t.theta + (thetaShift.T ?? 0) * DEG },
  ];
}

export const rhythmMorphology: Record<RhythmType, RhythmMorphology> = {
  NSR: { waves: scaledWaves(1), rrVariability: 0.02 },
  SinusBradycardia: { waves: scaledWaves(1), rrVariability: 0.02 },
  SinusTachycardia: { waves: scaledWaves(0.95), rrVariability: 0.01 },

  AtrialFibrillation: {
    waves: scaledWaves(1, {}).filter((w) => w !== scaledWaves(1)[0]), // remove P
    rrVariability: 0.35,
    noPWave: true,
  },

  AtrialFlutter: {
    waves: [
      { a: 2.5, b: 0.12, theta: -90 * DEG },
      { a: 2.0, b: 0.12, theta: -50 * DEG },
      ...scaledWaves(1).slice(1),
    ],
    rrVariability: 0.05,
  },

  Junctional: {
    waves: scaledWaves(1).slice(1), // no P wave, QRS-T only
    rrVariability: 0.02,
    noPWave: true,
  },

  SVT: { waves: scaledWaves(0.9).slice(1), rrVariability: 0.01, noPWave: true },

  PVC: {
    waves: [
      { a: 22, b: 0.18, theta: -10 * DEG },
      { a: -18, b: 0.16, theta: 30 * DEG },
      { a: 3, b: 0.3, theta: 110 * DEG },
    ],
    rrVariability: 0.05,
    noPWave: true,
  },

  Bigeminy: { waves: scaledWaves(1), rrVariability: 0.02 }, // handled via injection logic
  Trigeminy: { waves: scaledWaves(1), rrVariability: 0.02 }, // handled via injection logic

  VT: {
    waves: [
      { a: 20, b: 0.22, theta: -20 * DEG },
      { a: -15, b: 0.2, theta: 40 * DEG },
    ],
    rrVariability: 0.08,
    noPWave: true,
  },

  VF: { waves: [], rrVariability: 1, chaotic: true, noPWave: true },

  Torsades: {
    waves: [
      { a: 18, b: 0.2, theta: -20 * DEG },
      { a: -14, b: 0.2, theta: 30 * DEG },
    ],
    rrVariability: 0.4,
    chaotic: true,
    noPWave: true,
  },

  CompleteHeartBlock: {
    waves: scaledWaves(1),
    rrVariability: 0.03,
  },

  Asystole: { waves: [], rrVariability: 0, flatline: true, noPWave: true },

  PEA: {
    waves: scaledWaves(0.4).slice(1),
    rrVariability: 0.02,
    noPWave: true,
  },
};

/** Wraps angle into -pi..pi */
function wrapAngle(theta: number): number {
  while (theta > Math.PI) theta -= 2 * Math.PI;
  while (theta < -Math.PI) theta += 2 * Math.PI;
  return theta;
}

/**
 * Samples one full beat cycle (0..1 fraction of RR interval) into a
 * pixel-domain amplitude array of length `numSamples`, using the
 * Gaussian-sum PQRST model above (ECGSYN-equivalent morphology).
 */
export function synthesizeBeat(
  morphology: RhythmMorphology,
  numSamples: number,
  gain: number
): number[] {
  const samples = new Array(numSamples).fill(0);

  if (morphology.flatline) return samples;

  if (morphology.chaotic) {
    // VF / Torsades: irregular oscillation, not a fixed PQRST, matching
    // fecgsyn's approach of superimposing multiple frequencies for
    // pathological/chaotic rhythms rather than a clean Gaussian sum.
    const f1 = 4 + Math.random() * 3;
    const f2 = 7 + Math.random() * 4;
    for (let i = 0; i < numSamples; i++) {
      const t = i / numSamples;
      const val =
        Math.sin(2 * Math.PI * f1 * t) * (0.6 + Math.random() * 0.4) +
        Math.sin(2 * Math.PI * f2 * t + 1.3) * (0.3 + Math.random() * 0.3);
      samples[i] = val * gain * 0.5;
    }
    return samples;
  }

  for (let i = 0; i < numSamples; i++) {
    const theta = wrapAngle((i / numSamples) * 2 * Math.PI - Math.PI);
    let z = 0;
    for (const wave of morphology.waves) {
      const dtheta = wrapAngle(theta - wave.theta);
      z += wave.a * Math.exp(-(dtheta * dtheta) / (2 * wave.b * wave.b));
    }
    samples[i] = (z / 30) * gain; // normalize R-wave amplitude (~30) to ~1.0
  }

  return samples;
}

/** Injects a PVC-shaped beat in place of a normal beat (for Bigeminy/Trigeminy) */
export function synthesizePVCBeat(numSamples: number, gain: number): number[] {
  return synthesizeBeat(rhythmMorphology.PVC, numSamples, gain);
}
