"use client";

import { useState } from "react";
import { useMonitorStore } from "@/store/useMonitorStore";
import { Scenario, ScenarioStep, RhythmType } from "@/types/monitor";

const rhythmOptions: { value: RhythmType; label: string }[] = [
  { value: "NSR", label: "Normal Sinus Rhythm (NSR)" },
  { value: "SinusBradycardia", label: "Sinus Bradycardia" },
  { value: "SinusTachycardia", label: "Sinus Tachycardia" },
  { value: "AtrialFibrillation", label: "Atrial Fibrillation" },
  { value: "AtrialFlutter", label: "Atrial Flutter" },
  { value: "Junctional", label: "Junctional Rhythm" },
  { value: "SVT", label: "SVT" },
  { value: "PVC", label: "PVC" },
  { value: "Bigeminy", label: "Bigeminy" },
  { value: "Trigeminy", label: "Trigeminy" },
  { value: "VT", label: "Ventricular Tachycardia (VT)" },
  { value: "VF", label: "Ventricular Fibrillation (VF)" },
  { value: "Torsades", label: "Torsades de Pointes" },
  { value: "CompleteHeartBlock", label: "Complete Heart Block" },
  { value: "Asystole", label: "Asystole" },
  { value: "PEA", label: "Pulseless Electrical Activity (PEA)" },
];

const presetHealthyAdult: Scenario = {
  id: "healthy-adult-deteriorating",
  name: "Healthy Adult -> Deterioration -> VF -> ROSC",
  steps: [
    { id: "s0", atMinute: 0, label: "Baseline", patch: { heartRate: 80, systolicBP: 120, diastolicBP: 80, spo2: 99, respiratoryRate: 16, rhythm: "NSR" } },
    { id: "s1", atMinute: 2, label: "Deterioration", patch: { heartRate: 120, spo2: 94, respiratoryRate: 28 } },
    { id: "s2", atMinute: 5, label: "VT", patch: { heartRate: 170, rhythm: "VT" } },
    { id: "s3", atMinute: 6, label: "VF Arrest", patch: { rhythm: "VF", heartRate: 0, systolicBP: 0, diastolicBP: 0 } },
    { id: "s4", atMinute: 8, label: "Post-Defib ROSC", patch: { rhythm: "NSR", heartRate: 90, systolicBP: 110, diastolicBP: 70, spo2: 96 } },
  ],
};

const presetSepsis: Scenario = {
  id: "sepsis-progression",
  name: "Sepsis -> Septic Shock",
  steps: [
    { id: "s0", atMinute: 0, label: "Early Sepsis", patch: { heartRate: 105, systolicBP: 100, diastolicBP: 65, spo2: 96, respiratoryRate: 22, temperature: 38.6, rhythm: "SinusTachycardia" } },
    { id: "s1", atMinute: 3, label: "Worsening Hypotension", patch: { heartRate: 125, systolicBP: 85, diastolicBP: 55, respiratoryRate: 28 } },
    { id: "s2", atMinute: 6, label: "Septic Shock", patch: { heartRate: 140, systolicBP: 70, diastolicBP: 40, spo2: 90 } },
  ],
};

const presets: Scenario[] = [presetHealthyAdult, presetSepsis];

let stepCounter = 0;
function newStepId() {
  stepCounter += 1;
  return `step-${Date.now()}-${stepCounter}`;
}

function emptyStep(atMinute: number): ScenarioStep {
  return {
    id: newStepId(),
    atMinute,
    label: "New Step",
    patch: { heartRate: 80, spo2: 98, respiratoryRate: 16, rhythm: "NSR" },
  };
}

export default function ScenarioBuilder() {
  const scenario = useMonitorStore((s) => s.scenario);
  const scenarioRunning = useMonitorStore((s) => s.scenarioRunning);
  const scenarioElapsedSec = useMonitorStore((s) => s.scenarioElapsedSec);
  const setScenario = useMonitorStore((s) => s.setScenario);
  const startScenario = useMonitorStore((s) => s.startScenario);
  const pauseScenario = useMonitorStore((s) => s.pauseScenario);
  const resumeScenario = useMonitorStore((s) => s.resumeScenario);
  const restartScenario = useMonitorStore((s) => s.restartScenario);

  const [draftSteps, setDraftSteps] = useState<ScenarioStep[]>(presetHealthyAdult.steps);
  const [scenarioName, setScenarioName] = useState(presetHealthyAdult.name);

  const loadPreset = (id: string) => {
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    setDraftSteps(preset.steps.map((s) => ({ ...s, patch: { ...s.patch } })));
    setScenarioName(preset.name);
    setScenario(preset);
  };

  const applyDraft = () => {
    setScenario({ id: "custom-" + Date.now(), name: scenarioName, steps: draftSteps });
  };

  const addStep = () => {
    const lastMinute = draftSteps.length > 0 ? Math.max(...draftSteps.map((s) => s.atMinute)) : 0;
    setDraftSteps((prev) => [...prev, emptyStep(lastMinute + 2)]);
  };

  const updateStepMeta = (id: string, field: "atMinute" | "label", value: any) => {
    setDraftSteps((prev) => prev.map((step) => (step.id === id ? { ...step, [field]: value } : step)));
  };

  const updateStepPatch = (id: string, field: string, value: any) => {
    setDraftSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, patch: { ...step.patch, [field]: value } } : step))
    );
  };

  const removeStep = (id: string) => setDraftSteps((prev) => prev.filter((s) => s.id !== id));

  const mm = Math.floor(scenarioElapsedSec / 60);
  const ss = scenarioElapsedSec % 60;

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg space-y-4">
      <h2 className="font-bold text-lg">Scenario Builder</h2>

      <div className="flex gap-2 items-center text-sm">
        <span>Active: {scenario?.name ?? "None"}</span>
        <span className={`font-mono ${scenarioRunning ? "text-green-400" : "text-gray-400"}`}>
          {mm.toString().padStart(2, "0")}:{ss.toString().padStart(2, "0")}
          {scenarioRunning ? " (running)" : " (stopped)"}
        </span>
      </div>

      <div>
        <label className="block text-sm mb-1">Load Preset</label>
        <select
          onChange={(e) => e.target.value && loadPreset(e.target.value)}
          defaultValue=""
          className="w-full text-black rounded px-2 py-2"
        >
          <option value="" disabled>Select a preset scenario...</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={startScenario} disabled={!scenario} className="bg-green-600 disabled:bg-gray-700 disabled:text-gray-400 px-3 py-1 rounded text-sm">Start</button>
        <button onClick={pauseScenario} disabled={!scenarioRunning} className="bg-amber-600 disabled:bg-gray-700 disabled:text-gray-400 px-3 py-1 rounded text-sm">Pause</button>
        <button onClick={resumeScenario} disabled={scenarioRunning || !scenario} className="bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 px-3 py-1 rounded text-sm">Resume</button>
        <button onClick={restartScenario} disabled={!scenario} className="bg-red-600 disabled:bg-gray-700 disabled:text-gray-400 px-3 py-1 rounded text-sm">Restart</button>
      </div>

      <div className="border-t border-gray-700 pt-3">
        <label className="block text-sm mb-1">Scenario Name</label>
        <input
          value={scenarioName}
          onChange={(e) => setScenarioName(e.target.value)}
          className="w-full text-black rounded px-2 py-1 mb-3"
        />

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {draftSteps
            .sort((a, b) => a.atMinute - b.atMinute)
            .map((step) => (
              <div key={step.id} className="bg-gray-800 p-3 rounded text-xs space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={step.atMinute}
                      onChange={(e) => updateStepMeta(step.id, "atMinute", Number(e.target.value))}
                      className="w-14 text-black rounded px-1 py-1"
                    />
                    <span>min</span>
                  </div>
                  <input
                    value={step.label ?? ""}
                    onChange={(e) => updateStepMeta(step.id, "label", e.target.value)}
                    className="flex-1 text-black rounded px-1 py-1"
                    placeholder="Step label"
                  />
                  <button onClick={() => removeStep(step.id)} className="text-red-400 px-2">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-400 mb-0.5">HR</label>
                    <input
                      type="number"
                      value={step.patch.heartRate as number ?? ""}
                      onChange={(e) => updateStepPatch(step.id, "heartRate", Number(e.target.value))}
                      className="w-full text-black rounded px-1 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-0.5">SpO2</label>
                    <input
                      type="number"
                      value={step.patch.spo2 as number ?? ""}
                      onChange={(e) => updateStepPatch(step.id, "spo2", Number(e.target.value))}
                      className="w-full text-black rounded px-1 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-0.5">RR</label>
                    <input
                      type="number"
                      value={step.patch.respiratoryRate as number ?? ""}
                      onChange={(e) => updateStepPatch(step.id, "respiratoryRate", Number(e.target.value))}
                      className="w-full text-black rounded px-1 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-0.5">Systolic BP</label>
                    <input
                      type="number"
                      value={step.patch.systolicBP as number ?? ""}
                      onChange={(e) => updateStepPatch(step.id, "systolicBP", Number(e.target.value))}
                      className="w-full text-black rounded px-1 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-0.5">Diastolic BP</label>
                    <input
                      type="number"
                      value={step.patch.diastolicBP as number ?? ""}
                      onChange={(e) => updateStepPatch(step.id, "diastolicBP", Number(e.target.value))}
                      className="w-full text-black rounded px-1 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-0.5">Rhythm</label>
                    <select
                      value={(step.patch.rhythm as RhythmType) ?? "NSR"}
                      onChange={(e) => updateStepPatch(step.id, "rhythm", e.target.value as RhythmType)}
                      className="w-full text-black rounded px-1 py-1"
                    >
                      {rhythmOptions.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="flex gap-2 pt-3">
          <button onClick={addStep} className="bg-gray-700 px-3 py-1 rounded text-sm">+ Add Step</button>
          <button onClick={applyDraft} className="bg-green-700 px-3 py-1 rounded text-sm">Apply as Active Scenario</button>
        </div>
      </div>
    </div>
  );
}
