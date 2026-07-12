import { RhythmType, WaveformSettings } from "@/types/monitor";
import { synthesizeBeat, synthesizePVCBeat, rhythmMorphology } from "./ecgSynth";

/**
 * Generates one beat of ECG samples using the ECGSYN-equivalent Gaussian-sum
 * PQRST model (see lib/ecgSynth.ts), with optional injected PVC beats for
 * Bigeminy/Trigeminy patterns and beat-to-beat RR variability for
 * physiologically realistic irregularity (AFib, VT, etc).
 */
export function generateBeatSamples(
  rhythm: RhythmType,
  beatDurationSamples: number,
  gain: number,
  beatIndex: number = 0
): number[] {
  if (rhythm === "Bigeminy" && beatIndex % 2 === 1) {
    return synthesizePVCBeat(beatDurationSamples, gain);
  }
  if (rhythm === "Trigeminy" && beatIndex % 3 === 2) {
    return synthesizePVCBeat(beatDurationSamples, gain);
  }
  const morphology = rhythmMorphology[rhythm];
  return synthesizeBeat(morphology, beatDurationSamples, gain);
}

/** RR-interval variability multiplier for a given rhythm (physiological irregularity) */
export function rrVariabilityFactor(rhythm: RhythmType): number {
  const morphology = rhythmMorphology[rhythm];
  if (!morphology) return 0;
  const variability = morphology.rrVariability;
  return 1 + (Math.random() - 0.5) * 2 * variability;
}

function interpolateSamples(samples: number[], numOut: number): number[] {
  if (samples.length === numOut) return samples;
  const out = new Array(numOut);
  for (let i = 0; i < numOut; i++) {
    const x = (i / (numOut - 1)) * (samples.length - 1);
    const x0 = Math.floor(x);
    const x1 = Math.min(x0 + 1, samples.length - 1);
    const t = x - x0;
    out[i] = samples[x0] * (1 - t) + samples[x1] * t;
  }
  return out;
}

/** Smooths a buffer using a small moving average, softening residual jaggedness
 *  from sample-rate discretization while preserving sharp R-wave peaks. */
export function smoothBuffer(buffer: number[], windowSize: number = 2): number[] {
  if (windowSize <= 0) return buffer;
  const out = new Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    let sum = 0;
    let count = 0;
    for (let k = -windowSize; k <= windowSize; k++) {
      const idx = i + k;
      if (idx >= 0 && idx < buffer.length) {
        sum += buffer[idx];
        count++;
      }
    }
    out[i] = sum / count;
  }
  return out;
}

/** Adds gaussian-ish noise + baseline wander to a sample buffer */
export function applyArtifacts(
  samples: number[],
  settings: WaveformSettings,
  tOffset: number
): number[] {
  return samples.map((v, i) => {
    let out = v;
    if (settings.noiseLevel > 0) {
      out += (Math.random() - 0.5) * settings.noiseLevel * 0.08;
    }
    if (settings.baselineWander > 0) {
      out += Math.sin((tOffset + i) * 0.008) * settings.baselineWander * 0.15;
    }
    if (settings.artifactLevel > 0 && Math.random() < settings.artifactLevel * 0.008) {
      out += (Math.random() - 0.5) * 1.2;
    }
    return out;
  });
}

/** Beat duration in samples based on HR and sample rate */
export function beatDurationFromHR(hr: number, sampleRate: number): number {
  const bpm = Math.max(hr, 1);
  const secondsPerBeat = 60 / bpm;
  return Math.round(secondsPerBeat * sampleRate);
}

/** Generates a pleth pulse shaped by amplitude & perfusion index */
export function generatePlethBeat(
  beatDurationSamples: number,
  amplitude: number,
  perfusionIndex: number
): number[] {
  const samples: number[] = new Array(beatDurationSamples).fill(0);
  const pi = Math.max(0.1, Math.min(perfusionIndex, 10)) / 10;
  for (let i = 0; i < beatDurationSamples; i++) {
    const x = i / beatDurationSamples;
    const systolicRise = Math.pow(Math.sin(Math.PI * Math.min(x / 0.25, 1)), 1.5);
    const dicroticNotch = x > 0.25 && x < 0.55 ? Math.exp(-(Math.pow((x - 0.4) * 12, 2))) * 0.15 : 0;
    const diastolicFall = x >= 0.25 ? Math.exp(-((x - 0.25) * 3.5)) : 0;
    const val = (x < 0.25 ? systolicRise : diastolicFall + dicroticNotch) * amplitude * (0.4 + pi * 0.6);
    samples[i] = val;
  }
  return smoothBuffer(samples, 1);
}

/** Generates a respiration sine wave segment */
export function generateRespSamples(
  numSamples: number,
  rr: number,
  amplitude: number,
  sampleRate: number
): number[] {
  const cyclesPerSample = rr / 60 / sampleRate;
  const samples: number[] = new Array(numSamples).fill(0);
  for (let i = 0; i < numSamples; i++) {
    samples[i] = Math.sin(2 * Math.PI * cyclesPerSample * i) * amplitude;
  }
  return samples;
}
