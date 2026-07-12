"use client";

import { useEffect, useState } from "react";
import { useMonitorStore } from "@/store/useMonitorStore";

export default function PatientHeader() {
  const [time, setTime] = useState("");
  const patientName = useMonitorStore((s) => s.patientName);
  const patientCategory = useMonitorStore((s) => s.patientCategory);
  const bedNumber = useMonitorStore((s) => s.bedNumber);
  const batteryLevel = useMonitorStore((s) => s.batteryLevel);
  const networkConnected = useMonitorStore((s) => s.networkConnected);
  const alarms = useMonitorStore((s) => s.alarms);

  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    update();
    const id = setInterval(update, 1000 * 10);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between bg-black text-white px-3 py-1 text-sm border-b border-gray-700">
      <div className="flex items-center gap-4">
        <span className="font-semibold">{patientName}</span>
        <span className="text-gray-400">{patientCategory}</span>
        <span className="text-gray-400">Bed {bedNumber}</span>
      </div>
      <div className="flex items-center gap-3">
        {alarms.activeAlarms.length > 0 && !alarms.silenced && (
          <span className="text-red-500 animate-pulse font-bold">ALARM</span>
        )}
        <span className={networkConnected ? "text-green-500" : "text-red-500"}>
          {networkConnected ? "NET" : "NO NET"}
        </span>
        <span className={batteryLevel < 20 ? "text-red-500" : "text-gray-300"}>
          BATT {batteryLevel}%
        </span>
        <span>{time}</span>
      </div>
    </div>
  );
}
