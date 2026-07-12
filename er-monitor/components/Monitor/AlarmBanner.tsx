"use client";

import { useMonitorStore } from "@/store/useMonitorStore";
import { evaluateAlarms } from "@/lib/alarmEngine";

export default function AlarmBanner() {
  const state = useMonitorStore((s) => s);
  const alarms = evaluateAlarms(state);
  if (alarms.length === 0 || state.alarms.silenced) return null;

  const top = alarms.sort((a, b) => (a.priority === "high" ? -1 : 1))[0];

  return (
    <div
      className={`w-full text-center py-1 font-bold text-white ${
        top.priority === "high" ? "bg-red-600 animate-pulse" : "bg-amber-500"
      }`}
    >
      {top.message}
    </div>
  );
}
