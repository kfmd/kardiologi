"use client";

import { useMonitorStore } from "@/store/useMonitorStore";

const buttons = [
  "More", "Alarm Reset", "Alarm Pause", "ECG 24h Sum",
  "Screen Setup", "Alarm Setup", "Patient Management", "Review", "Standby", "Main Menu",
];

export default function SoftButtons() {
  const resetAlarms = useMonitorStore((s) => s.resetAlarms);
  const silenceAlarms = useMonitorStore((s) => s.silenceAlarms);

  const handleClick = (label: string) => {
    if (label === "Alarm Reset") resetAlarms();
    if (label === "Alarm Pause") silenceAlarms();
  };

  return (
    <div className="grid grid-cols-5 md:grid-cols-10 gap-1 bg-gray-900 p-1">
      {buttons.map((b) => (
        <button
          key={b}
          onClick={() => handleClick(b)}
          className="text-xs text-white bg-gray-800 hover:bg-gray-700 rounded py-2 px-1"
        >
          {b}
        </button>
      ))}
    </div>
  );
}
