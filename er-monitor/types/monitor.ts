export type RhythmType =
  | "NSR"
  | "SinusBradycardia"
  | "SinusTachycardia"
  | "AtrialFibrillation"
  | "AtrialFlutter"
  | "Junctional"
  | "SVT"
  | "PVC"
  | "Bigeminy"
  | "Trigeminy"
  | "VT"
  | "VF"
  | "Torsades"
  | "CompleteHeartBlock"
  | "Asystole"
  | "PEA";

export type PatientCategory = "Adult" | "Pediatric" | "Neonate";

export interface WaveformSettings {
  ecgGain: number; // 0.5 - 2
  ecgSweepSpeed: number; // mm/s, e.g. 12.5, 25, 50
  plethAmplitude: number; // 0 - 2
  respAmplitude: number; // 0 - 2
  noiseLevel: number; // 0 - 1
  artifactLevel: number; // 0 - 1
  baselineWander: number; // 0 - 1
}

export interface AlarmLimit {
  high?: number;
  low?: number;
}

export interface AlarmSettings {
  heartRate: AlarmLimit;
  spo2: AlarmLimit;
  respiratoryRate: AlarmLimit;
  systolicBP: AlarmLimit;
  temperature: AlarmLimit;
  silenced: boolean;
  activeAlarms: string[];
}

export interface SpecialEvents {
  motionArtifact: boolean;
  ecgLeadOff: boolean;
  spo2ProbeRemoved: boolean;
  lowPerfusion: boolean;
  weakPulse: boolean;
  batteryLow: boolean;
  powerFailure: boolean;
  pacemakerSpikes: boolean;
  pvcEveryNBeats: number; // 0 = off
  missedBeat: boolean;
  artifactBurst: boolean;
}

export interface TrendEntry {
  time: string;
  hr: number;
  spo2: number;
  rr: number;
  systolicBP: number;
  diastolicBP: number;
  map: number;
  temperature: number;
}

export interface ScenarioStep {
  id: string;
  atMinute: number;
  label?: string;
  patch: Partial<PatientMonitorState>;
}

export interface Scenario {
  id: string;
  name: string;
  steps: ScenarioStep[];
}

export interface PatientMonitorState {
  patientName: string;
  patientId: string;
  bedNumber: string;
  patientCategory: PatientCategory;

  heartRate: number;
  spo2: number;
  respiratoryRate: number;
  systolicBP: number;
  diastolicBP: number;
  map: number;
  temperature: number;
  perfusionIndex: number;

  rhythm: RhythmType;
  waveformSettings: WaveformSettings;
  alarms: AlarmSettings;
  events: SpecialEvents;

  trends: TrendEntry[];
  scenario: Scenario | null;
  scenarioRunning: boolean;
  scenarioElapsedSec: number;

  batteryLevel: number;
  networkConnected: boolean;
}
