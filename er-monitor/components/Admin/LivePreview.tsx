"use client";

import { useMonitorStore } from "@/store/useMonitorStore";
import ECGWave from "@/components/Monitor/ECGWave";
import PlethWave from "@/components/Monitor/PlethWave";
import RespWave from "@/components/Monitor/RespWave";
import VitalCard from "@/components/Monitor/VitalCard";

export default function LivePreview() {
  const heartRate = useMonitorStore((s) => s.heartRate);
  const spo2 = useMonitorStore((s) => s.spo2);
  const respiratoryRate = useMonitorStore((s) => s.respiratoryRate);
  const systolicBP = useMonitorStore((s) => s.systolicBP);
  const diastolicBP = useMonitorStore((s) => s.diastolicBP);
  const map = useMonitorStore((s) => s.map);
  const temperature = useMonitorStore((s) => s.temperature);
  const rhythm = useMonitorStore((s) => s.rhythm);
  const isDirty = useMonitorStore((s) => s.isDirty);
  const draft = useMonitorStore((s) => s.draft);

  return (
    <div className="bg-black text-white p-2 rounded-lg space-y-1 sticky top-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-sm text-gray-400">Live Preview (as seen on Student Monitor)</h2>
        {isDirty && (
          <span className="text-amber-400 text-xs font-semibold">
            Draft pending: HR {draft?.heartRate}, Rhythm {draft?.rhythm}
          </span>
        )}
      </div>
      <ECGWave lead="II" />
      <PlethWave />
      <RespWave />
      <div className="flex flex-wrap gap-3 pt-2">
        <VitalCard label="HR" value={heartRate} unit="bpm" color="#22c55e" small />
        <VitalCard label="SpO2" value={spo2} unit="%" color="#22d3ee" small />
        <VitalCard label="RR" value={respiratoryRate} unit="rpm" color="#eab308" small />
        <VitalCard label="BP" value={`${systolicBP}/${diastolicBP}`} subLabel={`(${map})`} color="#f8fafc" small />
        <VitalCard label="Temp" value={temperature} unit="°C" color="#f8fafc" small />
        <VitalCard label="Rhythm" value={rhythm} color="#22c55e" small />
      </div>
    </div>
  );
}
