"use client";

import { useMonitorStore } from "@/store/useMonitorStore";

export default function TrendTable() {
  const trends = useMonitorStore((s) => s.trends);

  return (
    <div className="bg-black text-white text-xs border-t border-gray-700 max-h-28 overflow-y-auto">
      <table className="w-full">
        <thead>
          <tr className="text-gray-400">
            <th className="text-left px-2">Time</th>
            <th className="text-green-400">HR</th>
            <th className="text-cyan-400">SpO2</th>
            <th className="text-yellow-400">RR</th>
            <th className="text-red-400">BP</th>
            <th className="text-red-400">MAP</th>
            <th className="text-white">Temp</th>
          </tr>
        </thead>
        <tbody>
          {trends.map((t, i) => (
            <tr key={i}>
              <td className="text-left px-2">{t.time}</td>
              <td className="text-center text-green-400">{t.hr}</td>
              <td className="text-center text-cyan-400">{t.spo2}</td>
              <td className="text-center text-yellow-400">{t.rr}</td>
              <td className="text-center text-red-400">{t.systolicBP}/{t.diastolicBP}</td>
              <td className="text-center text-red-400">({t.map})</td>
              <td className="text-center text-white">{t.temperature}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
