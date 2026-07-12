"use client";

import { useMonitorStore } from "@/store/useMonitorStore";

export default function AlarmControls() {
  const alarms = useMonitorStore((s) => s.alarms);
  const updateAlarms = useMonitorStore((s) => s.updateAlarms);
  const events = useMonitorStore((s) => s.events);
  const updateEvents = useMonitorStore((s) => s.updateEvents);
  const resetAlarms = useMonitorStore((s) => s.resetAlarms);
  const silenceAlarms = useMonitorStore((s) => s.silenceAlarms);

  const limitFields: { key: keyof typeof alarms; label: string }[] = [
    { key: "heartRate", label: "Heart Rate" },
    { key: "spo2", label: "SpO2" },
    { key: "respiratoryRate", label: "Respiratory Rate" },
    { key: "systolicBP", label: "Systolic BP" },
    { key: "temperature", label: "Temperature" },
  ];

  const eventToggles: { key: keyof typeof events; label: string }[] = [
    { key: "motionArtifact", label: "Motion Artifact" },
    { key: "ecgLeadOff", label: "ECG Lead Off" },
    { key: "spo2ProbeRemoved", label: "SpO2 Probe Removed" },
    { key: "lowPerfusion", label: "Low Perfusion" },
    { key: "weakPulse", label: "Weak Pulse" },
    { key: "batteryLow", label: "Battery Low" },
    { key: "powerFailure", label: "Power Failure" },
    { key: "pacemakerSpikes", label: "Pacemaker Spikes" },
    { key: "missedBeat", label: "Missed Beat" },
    { key: "artifactBurst", label: "Artifact Burst" },
  ];

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg space-y-4">
      <h2 className="font-bold text-lg">Alarm Limits</h2>
      {limitFields.map((f) => {
        const limit = alarms[f.key] as { high?: number; low?: number };
        return (
          <div key={f.key} className="flex items-center gap-2 text-sm">
            <span className="w-32">{f.label}</span>
            {limit.high !== undefined && (
              <input
                type="number"
                value={limit.high}
                onChange={(e) =>
                  updateAlarms({ [f.key]: { ...limit, high: Number(e.target.value) } } as any)
                }
                className="w-16 text-black rounded px-1"
                placeholder="High"
              />
            )}
            {limit.low !== undefined && (
              <input
                type="number"
                value={limit.low}
                onChange={(e) =>
                  updateAlarms({ [f.key]: { ...limit, low: Number(e.target.value) } } as any)
                }
                className="w-16 text-black rounded px-1"
                placeholder="Low"
              />
            )}
          </div>
        );
      })}

      <div className="flex gap-2 pt-2">
        <button onClick={silenceAlarms} className="bg-amber-600 px-3 py-1 rounded text-sm">Alarm Silence</button>
        <button onClick={resetAlarms} className="bg-red-600 px-3 py-1 rounded text-sm">Alarm Reset</button>
      </div>

      <h2 className="font-bold text-lg pt-3">Special Events</h2>
      <div className="grid grid-cols-2 gap-2">
        {eventToggles.map((t) => (
          <label key={t.key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={events[t.key] as boolean}
              onChange={(e) => updateEvents({ [t.key]: e.target.checked } as any)}
            />
            {t.label}
          </label>
        ))}
      </div>
    </div>
  );
}
