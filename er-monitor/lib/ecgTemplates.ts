import { RhythmType } from "@/types/monitor";

/**
 * Each rhythm template is a normalized single-beat waveform:
 * array of [xFraction (0-1 across one beat cycle), yValue (-1 to 1)]
 * These get resampled/stretched based on current heart rate and sweep speed.
 */

export type BeatPoint = [number, number];

const nsrBeat: BeatPoint[] = [
  [0.0, 0], [0.05, 0.05], [0.08, 0.15], [0.11, 0.05], [0.13, 0],
  [0.18, 0], [0.2, -0.15], [0.22, 1.0], [0.24, -0.35], [0.26, 0.05], [0.28, 0],
  [0.45, 0], [0.5, 0.1], [0.55, 0.35], [0.6, 0.45], [0.65, 0.3], [0.7, 0.1], [0.75, 0],
  [1.0, 0],
];

const bradyBeat = nsrBeat; // same morphology, rate handled by HR
const tachyBeat = nsrBeat;

const afibBeat: BeatPoint[] = [
  [0.0, 0.02], [0.05, -0.03], [0.1, 0.04], [0.15, -0.02],
  [0.2, -0.15], [0.22, 1.0], [0.24, -0.35], [0.26, 0.03],
  [0.5, 0.08], [0.55, 0.3], [0.6, 0.4], [0.65, 0.25], [0.7, 0.05],
  [1.0, 0.0],
];

const aflutterBeat: BeatPoint[] = [
  [0.0, 0.2], [0.1, -0.2], [0.2, 0.2], [0.3, -0.15], [0.35, 1.0], [0.37, -0.3],
  [0.6, 0.1], [0.65, 0.35], [0.7, 0.2], [0.75, 0],
  [1.0, 0.15],
];

const junctionalBeat: BeatPoint[] = [
  [0.0, 0], [0.2, -0.15], [0.22, 1.0], [0.24, -0.35], [0.26, 0],
  [0.45, 0], [0.5, 0.1], [0.55, 0.35], [0.6, 0.45], [0.65, 0.3], [0.7, 0.1],
  [1.0, 0],
];

const svtBeat: BeatPoint[] = [
  [0.0, 0], [0.15, -0.2], [0.17, 1.0], [0.19, -0.35], [0.21, 0],
  [0.4, 0.1], [0.45, 0.35], [0.5, 0.4], [0.55, 0.2],
  [1.0, 0],
];

const pvcBeat: BeatPoint[] = [
  [0.0, 0], [0.1, -0.1], [0.15, 0.5], [0.2, -0.6], [0.3, 0.15], [0.4, 0],
  [1.0, 0],
];

const vtBeat: BeatPoint[] = [
  [0.0, 0], [0.1, 0.6], [0.2, -0.7], [0.3, 0.5], [0.4, -0.4], [0.5, 0.2], [0.6, 0],
  [1.0, 0],
];

const vfBeat: BeatPoint[] = [
  [0.0, 0], [0.1, 0.5], [0.2, -0.6], [0.3, 0.4], [0.4, -0.5], [0.5, 0.3],
  [0.6, -0.4], [0.7, 0.5], [0.8, -0.3], [0.9, 0.2], [1.0, 0],
];

const torsadesBeat: BeatPoint[] = [
  [0.0, 0], [0.1, 0.3], [0.2, -0.8], [0.3, 0.9], [0.4, -0.6],
  [0.5, 0.4], [0.6, -0.2], [0.7, 0.1], [1.0, 0],
];

const chbBeat: BeatPoint[] = [
  [0.0, 0], [0.1, 0.15], [0.2, -0.15], [0.22, 1.0], [0.24, -0.35],
  [0.5, 0], [0.55, 0.2], [0.6, 0.1],
  [1.0, 0],
];

const asystoleBeat: BeatPoint[] = [[0.0, 0], [1.0, 0]];

const peaBeat: BeatPoint[] = [
  [0.0, 0], [0.2, -0.1], [0.22, 0.4], [0.24, -0.15], [0.26, 0],
  [0.5, 0.05], [0.55, 0.1],
  [1.0, 0],
];

export const rhythmTemplates: Record<RhythmType, BeatPoint[]> = {
  NSR: nsrBeat,
  SinusBradycardia: bradyBeat,
  SinusTachycardia: tachyBeat,
  AtrialFibrillation: afibBeat,
  AtrialFlutter: aflutterBeat,
  Junctional: junctionalBeat,
  SVT: svtBeat,
  PVC: pvcBeat,
  Bigeminy: nsrBeat, // handled by injecting pvcBeat every 2nd beat in generator
  Trigeminy: nsrBeat, // handled by injecting pvcBeat every 3rd beat in generator
  VT: vtBeat,
  VF: vfBeat,
  Torsades: torsadesBeat,
  CompleteHeartBlock: chbBeat,
  Asystole: asystoleBeat,
  PEA: peaBeat,
};

/** Rhythms whose "rate" is not driven by the HR slider directly (chaotic/flat) */
export const irregularRhythms: RhythmType[] = ["AtrialFibrillation", "VF", "Torsades", "Asystole"];
