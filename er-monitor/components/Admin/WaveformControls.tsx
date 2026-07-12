"use client";

import { useEffect } from "react";
import { useMonitorStore } from "@/store/useMonitorStore";
import { WaveformSettings } from "@/types/monitor";

export default function WaveformControls() {
  const draft = useMonitorStore((s) => s.draft);
  const isDirty = useMonitorStore((s) => s.isDirty);
  const initDraftFromLive = useMonitorStore((s) => s.initDraftFromLive);
  const updateDraft = useMonitorStore((s) => s.updateDraft);
  const acceptDraft = useMonitorStore((s) => s.acceptDraft);
  const cancelDraft = useMonitorStore((s) => s.cancelDraft);

  useEffect(() => {
    if (!draft) initDraftFromLive();
  }, [draft, initDraftFromLive]);

  if (!draft) return null;

  const fields: { key: keyof WaveformSettings; label: string; min: number; max: number; step: number }[] = [
    { key: "ecgGain", label: "ECG Gain", min: 0.5, max: 2, step: 0.1 },
    { key: "ecgSweepSpeed", label: "Sweep Speed (mm/s)", min: 6.25, max: 50, step: 6.25 },
    { key: "plethAmplitude", label: "Pleth Amplitude", min: 0, max: 2, step: 0.1 },
    { key: "respAmplitude", label: "Resp Amplitude", min: 0, max: 2, step: 0.1 },
    { key: "noiseLevel", label: "Noise", min: 0, max: 1, step: 0.05 },
    { key: "artifactLevel", label: "Artifact Level", min: 0, max: 1, step: 0.05 },
    { key: "baselineWander", label: "Baseline Wander", min: 0, max: 1, step: 0.05 },
  ];

  const updateSetting = (key: keyof WaveformSettings, value: number) => {
    updateDraft({ waveformSettings: { ...draft.waveformSettings, [key]: value } });
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Waveform Controls</h2>
        {isDirty && <span className="text-amber-400 text-xs font-semibold animate-pulse">Unsaved changes</span>}
      </div>

      {fields.map((f) => (
        <div key={f.key} className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span>{f.label}</span>
            <span>{draft.waveformSettings[f.key]}</span>
          </div>
          <input
            type="range"
            min={f.min}
            max={f.max}
            step={f.step}
            value={draft.waveformSettings[f.key]}
            onChange={(e) => updateSetting(f.key, Number(e.target.value))}
            className="w-full"
          />
        </div>
      ))}

      <div className="flex gap-2 pt-4 border-t border-gray-700 mt-3">
        <button
          onClick={acceptDraft}
          disabled={!isDirty}
          className={`flex-1 py-2 rounded font-semibold text-sm ${
            isDirty ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 cursor-not-allowed text-gray-400"
          }`}
        >
          Accept &amp; Apply to Monitor
        </button>
        <button
          onClick={cancelDraft}
          disabled={!isDirty}
          className={`flex-1 py-2 rounded font-semibold text-sm ${
            isDirty ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 cursor-not-allowed text-gray-400"
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
