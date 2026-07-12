"use client";

import { useEffect } from "react";
import { useMonitorStore } from "@/store/useMonitorStore";
import { RhythmType } from "@/types/monitor";

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

function SliderRow({ label, value, min, max, onChange, step = 1 }: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void; step?: number;
}) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 text-black px-1 rounded"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

export default function VitalControls() {
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

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Vitals</h2>
        {isDirty && (
          <span className="text-amber-400 text-xs font-semibold animate-pulse">
            Unsaved changes
          </span>
        )}
      </div>

      <SliderRow label="Heart Rate (bpm)" value={draft.heartRate} min={20} max={250}
        onChange={(v) => updateDraft({ heartRate: v })} />
      <SliderRow label="SpO2 (%)" value={draft.spo2} min={40} max={100}
        onChange={(v) => updateDraft({ spo2: v })} />
      <SliderRow label="Respiratory Rate (rpm)" value={draft.respiratoryRate} min={0} max={60}
        onChange={(v) => updateDraft({ respiratoryRate: v })} />
      <SliderRow label="Systolic BP" value={draft.systolicBP} min={40} max={260}
        onChange={(v) => updateDraft({ systolicBP: v })} />
      <SliderRow label="Diastolic BP" value={draft.diastolicBP} min={20} max={160}
        onChange={(v) => updateDraft({ diastolicBP: v })} />
      <SliderRow label="Temperature (°C)" value={draft.temperature} min={30} max={42} step={0.1}
        onChange={(v) => updateDraft({ temperature: v })} />

      <div className="pt-2">
        <label className="block text-sm mb-1">Rhythm</label>
        <select
          value={draft.rhythm}
          onChange={(e) => updateDraft({ rhythm: e.target.value as RhythmType })}
          className="w-full text-black rounded px-2 py-2"
        >
          {rhythmOptions.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

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
