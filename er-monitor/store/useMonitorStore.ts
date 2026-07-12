import { create } from "zustand";
import {
  PatientMonitorState,
  RhythmType,
  AlarmSettings,
  WaveformSettings,
  SpecialEvents,
  TrendEntry,
  Scenario,
} from "@/types/monitor";
import { syncBus } from "@/lib/broadcastSync";

/** Fields the instructor can stage as a draft before Accepting/Cancelling */
export interface DraftVitals {
  heartRate: number;
  spo2: number;
  respiratoryRate: number;
  systolicBP: number;
  diastolicBP: number;
  temperature: number;
  rhythm: RhythmType;
  waveformSettings: WaveformSettings;
}

interface MonitorActions {
  setVital: <K extends keyof PatientMonitorState>(key: K, value: PatientMonitorState[K]) => void;
  setRhythm: (rhythm: RhythmType) => void;
  setBP: (systolic: number, diastolic: number) => void;
  updateWaveformSettings: (patch: Partial<WaveformSettings>) => void;
  updateAlarms: (patch: Partial<AlarmSettings>) => void;
  updateEvents: (patch: Partial<SpecialEvents>) => void;
  pushTrend: () => void;
  clearTrends: () => void;
  silenceAlarms: () => void;
  resetAlarms: () => void;

  // Scenario
  setScenario: (scenario: Scenario) => void;
  startScenario: () => void;
  pauseScenario: () => void;
  resumeScenario: () => void;
  restartScenario: () => void;
  tickScenario: (deltaSec: number) => void;

  // Draft (Accept/Cancel workflow)
  draft: DraftVitals | null;
  isDirty: boolean;
  updateDraft: (patch: Partial<DraftVitals>) => void;
  acceptDraft: () => void;
  cancelDraft: () => void;
  initDraftFromLive: () => void;

  // Cross-tab sync
  applyIncomingState: (patch: Partial<PatientMonitorState>) => void;
  broadcastState: (patch: Partial<PatientMonitorState>) => void;
}

const defaultWaveformSettings: WaveformSettings = {
  ecgGain: 1,
  ecgSweepSpeed: 25,
  plethAmplitude: 1,
  respAmplitude: 1,
  noiseLevel: 0,
  artifactLevel: 0,
  baselineWander: 0,
};

const defaultAlarms: AlarmSettings = {
  heartRate: { high: 150, low: 50 },
  spo2: { low: 90 },
  respiratoryRate: { high: 30, low: 8 },
  systolicBP: { high: 180, low: 80 },
  temperature: { high: 39, low: 35 },
  silenced: false,
  activeAlarms: [],
};

const defaultEvents: SpecialEvents = {
  motionArtifact: false,
  ecgLeadOff: false,
  spo2ProbeRemoved: false,
  lowPerfusion: false,
  weakPulse: false,
  batteryLow: false,
  powerFailure: false,
  pacemakerSpikes: false,
  pvcEveryNBeats: 0,
  missedBeat: false,
  artifactBurst: false,
};

function computeMAP(systolic: number, diastolic: number): number {
  return Math.round(diastolic + (systolic - diastolic) / 3);
}

export const useMonitorStore = create<PatientMonitorState & MonitorActions>((set, get) => ({
  patientName: "General Factory Default",
  patientId: "0001",
  bedNumber: "3",
  patientCategory: "Adult",

  heartRate: 80,
  spo2: 98,
  respiratoryRate: 20,
  systolicBP: 120,
  diastolicBP: 80,
  map: computeMAP(120, 80),
  temperature: 37.2,
  perfusionIndex: 5,

  rhythm: "NSR",
  waveformSettings: defaultWaveformSettings,
  alarms: defaultAlarms,
  events: defaultEvents,

  trends: [],
  scenario: null,
  scenarioRunning: false,
  scenarioElapsedSec: 0,

  batteryLevel: 100,
  networkConnected: true,

  draft: null,
  isDirty: false,

  setVital: (key, value) => {
    set({ [key]: value } as any);
    get().broadcastState({ [key]: value } as any);
  },

  setRhythm: (rhythm) => {
    set({ rhythm });
    get().broadcastState({ rhythm });
  },

  setBP: (systolic, diastolic) => {
    const map = computeMAP(systolic, diastolic);
    set({ systolicBP: systolic, diastolicBP: diastolic, map });
    get().broadcastState({ systolicBP: systolic, diastolicBP: diastolic, map });
  },

  updateWaveformSettings: (patch) => {
    const merged = { ...get().waveformSettings, ...patch };
    set({ waveformSettings: merged });
    get().broadcastState({ waveformSettings: merged });
  },

  updateAlarms: (patch) => {
    const merged = { ...get().alarms, ...patch };
    set({ alarms: merged });
    get().broadcastState({ alarms: merged });
  },

  updateEvents: (patch) => {
    const merged = { ...get().events, ...patch };
    set({ events: merged });
    get().broadcastState({ events: merged });
  },

  pushTrend: () => {
    const s = get();
    const entry: TrendEntry = {
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      hr: s.heartRate,
      spo2: s.spo2,
      rr: s.respiratoryRate,
      systolicBP: s.systolicBP,
      diastolicBP: s.diastolicBP,
      map: s.map,
      temperature: s.temperature,
    };
    set({ trends: [entry, ...s.trends].slice(0, 50) });
  },

  clearTrends: () => set({ trends: [] }),

  silenceAlarms: () => {
    const merged = { ...get().alarms, silenced: true };
    set({ alarms: merged });
    get().broadcastState({ alarms: merged });
  },

  resetAlarms: () => {
    const merged = { ...get().alarms, activeAlarms: [], silenced: false };
    set({ alarms: merged });
    get().broadcastState({ alarms: merged });
  },

  setScenario: (scenario) => set({ scenario, scenarioElapsedSec: 0, scenarioRunning: false }),

  startScenario: () => {
    const s = get();
    if (!s.scenario) return;
    const firstStep = s.scenario.steps.find((step) => step.atMinute === 0);
    let patch: Partial<PatientMonitorState> = {};
    if (firstStep) patch = { ...firstStep.patch };
    set({ scenarioRunning: true, scenarioElapsedSec: 0, ...patch });
    get().broadcastState(patch);
  },

  pauseScenario: () => set({ scenarioRunning: false }),
  resumeScenario: () => set({ scenarioRunning: true }),

  restartScenario: () => {
    const s = get();
    if (!s.scenario) {
      set({ scenarioElapsedSec: 0, scenarioRunning: true });
      return;
    }
    const firstStep = s.scenario.steps.find((step) => step.atMinute === 0);
    let patch: Partial<PatientMonitorState> = {};
    if (firstStep) patch = { ...firstStep.patch };
    set({ scenarioElapsedSec: 0, scenarioRunning: true, ...patch });
    get().broadcastState(patch);
  },

  tickScenario: (deltaSec) => {
    const s = get();
    if (!s.scenarioRunning || !s.scenario) return;
    const prevElapsed = s.scenarioElapsedSec;
    const newElapsed = prevElapsed + deltaSec;

    const dueSteps = s.scenario.steps
      .filter((step) => step.atMinute > 0)
      .filter((step) => step.atMinute * 60 <= newElapsed && step.atMinute * 60 > prevElapsed);

    let patch: Partial<PatientMonitorState> = {};
    dueSteps.forEach((step) => { patch = { ...patch, ...step.patch }; });

    set({ scenarioElapsedSec: newElapsed, ...patch });
    if (Object.keys(patch).length > 0) get().broadcastState(patch);
  },

  initDraftFromLive: () => {
    const s = get();
    set({
      draft: {
        heartRate: s.heartRate,
        spo2: s.spo2,
        respiratoryRate: s.respiratoryRate,
        systolicBP: s.systolicBP,
        diastolicBP: s.diastolicBP,
        temperature: s.temperature,
        rhythm: s.rhythm,
        waveformSettings: { ...s.waveformSettings },
      },
      isDirty: false,
    });
  },

  updateDraft: (patch) => {
    const s = get();
    const base = s.draft ?? {
      heartRate: s.heartRate,
      spo2: s.spo2,
      respiratoryRate: s.respiratoryRate,
      systolicBP: s.systolicBP,
      diastolicBP: s.diastolicBP,
      temperature: s.temperature,
      rhythm: s.rhythm,
      waveformSettings: { ...s.waveformSettings },
    };
    set({ draft: { ...base, ...patch }, isDirty: true });
  },

  acceptDraft: () => {
    const s = get();
    if (!s.draft) return;
    const map = computeMAP(s.draft.systolicBP, s.draft.diastolicBP);
    const patch: Partial<PatientMonitorState> = {
      heartRate: s.draft.heartRate,
      spo2: s.draft.spo2,
      respiratoryRate: s.draft.respiratoryRate,
      systolicBP: s.draft.systolicBP,
      diastolicBP: s.draft.diastolicBP,
      map,
      temperature: s.draft.temperature,
      rhythm: s.draft.rhythm,
      waveformSettings: s.draft.waveformSettings,
    };
    set({ ...patch, isDirty: false });
    get().broadcastState(patch);
  },

  cancelDraft: () => {
    get().initDraftFromLive();
  },

  applyIncomingState: (patch) => set(patch as any),

  broadcastState: (patch) => {
    syncBus.publish({ type: "monitor-state", patch });
  },
}));

/** Call once on the Student Monitor page to receive live updates from Admin tabs */
export function subscribeMonitorSync() {
  return syncBus.subscribe((msg) => {
    if (msg?.type === "monitor-state" && msg.patch) {
      useMonitorStore.getState().applyIncomingState(msg.patch);
    }
  });
}
