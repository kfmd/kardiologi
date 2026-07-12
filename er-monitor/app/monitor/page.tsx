"use client";

import { useEffect } from "react";
import { useMonitorStore, subscribeMonitorSync } from "@/store/useMonitorStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import PatientHeader from "@/components/Monitor/PatientHeader";
import AlarmBanner from "@/components/Monitor/AlarmBanner";
import ECGWave from "@/components/Monitor/ECGWave";
import PlethWave from "@/components/Monitor/PlethWave";
import RespWave from "@/components/Monitor/RespWave";
import VitalCard from "@/components/Monitor/VitalCard";
import TrendTable from "@/components/Monitor/TrendTable";
import SoftButtons from "@/components/Monitor/SoftButtons";

export default function MonitorPage() {
  useKeyboardShortcuts();

  const heartRate = useMonitorStore((s) => s.heartRate);
  const spo2 = useMonitorStore((s) => s.spo2);
  const respiratoryRate = useMonitorStore((s) => s.respiratoryRate);
  const systolicBP = useMonitorStore((s) => s.systolicBP);
  const diastolicBP = useMonitorStore((s) => s.diastolicBP);
  const map = useMonitorStore((s) => s.map);
  const temperature = useMonitorStore((s) => s.temperature);
  const pushTrend = useMonitorStore((s) => s.pushTrend);
  const tickScenario = useMonitorStore((s) => s.tickScenario);

  // Receive live updates broadcast from Admin dashboard (other tab/window)
  useEffect(() => {
    const unsubscribe = subscribeMonitorSync();
    return unsubscribe;
  }, []);

  useEffect(() => {
    const trendInterval = setInterval(pushTrend, 1000 * 30);
    const scenarioInterval = setInterval(() => tickScenario(1), 1000);
    return () => {
      clearInterval(trendInterval);
      clearInterval(scenarioInterval);
    };
  }, [pushTrend, tickScenario]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col select-none">
      <PatientHeader />
      <AlarmBanner />

      <div className="flex flex-1">
        <div className="flex-1 flex flex-col gap-1 p-1">
          <ECGWave lead="II" />
          <ECGWave lead="V1" />
          <PlethWave />
          <RespWave />
        </div>

        <div className="w-56 flex flex-col justify-between p-2 border-l border-gray-700">
          <VitalCard label="ECG" value={heartRate} unit="bpm" color="#22c55e" />
          <VitalCard label="SpO2" value={spo2} unit="%" color="#22d3ee" />
          <VitalCard label="Resp" value={respiratoryRate} unit="rpm" color="#eab308" />
          <VitalCard
            label="NIBP"
            value={`${systolicBP}/${diastolicBP}`}
            subLabel={`(${map})`}
            color="#f8fafc"
            small
          />
          <VitalCard label="Temp" value={temperature} unit="°C" color="#f8fafc" small />
        </div>
      </div>

      <TrendTable />
      <SoftButtons />
    </div>
  );
}
