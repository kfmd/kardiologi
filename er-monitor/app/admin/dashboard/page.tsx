"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import VitalControls from "@/components/Admin/VitalControls";
import WaveformControls from "@/components/Admin/WaveformControls";
import AlarmControls from "@/components/Admin/AlarmControls";
import ScenarioBuilder from "@/components/Admin/ScenarioBuilder";
import LivePreview from "@/components/Admin/LivePreview";
import { useMonitorStore, subscribeMonitorSync } from "@/store/useMonitorStore";

type Tab = "vitals" | "waveforms" | "alarms" | "scenarios" | "patient" | "settings";

export default function AdminDashboardPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("vitals");

  const patientName = useMonitorStore((s) => s.patientName);
  const patientCategory = useMonitorStore((s) => s.patientCategory);
  const bedNumber = useMonitorStore((s) => s.bedNumber);
  const setVital = useMonitorStore((s) => s.setVital);
  const trends = useMonitorStore((s) => s.trends);
  const clearTrends = useMonitorStore((s) => s.clearTrends);

  useEffect(() => {
    if (!isAuthenticated) router.push("/admin");
  }, [isAuthenticated, router]);

  useEffect(() => {
    const unsubscribe = subscribeMonitorSync();
    return unsubscribe;
  }, []);

  if (!isAuthenticated) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "vitals", label: "Vitals" },
    { id: "waveforms", label: "Waveforms" },
    { id: "alarms", label: "Alarms" },
    { id: "scenarios", label: "Scenarios" },
    { id: "patient", label: "Patient Info" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className="w-48 bg-gray-900 text-white p-4 space-y-2">
        <h1 className="font-bold text-lg mb-4">Instructor Panel</h1>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`block w-full text-left px-3 py-2 rounded text-sm ${
              tab === t.id ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={() => { logout(); router.push("/admin"); }}
          className="block w-full text-left px-3 py-2 rounded text-sm text-red-400 hover:bg-gray-800 mt-8"
        >
          Logout
        </button>
        <a
          href="/monitor"
          target="_blank"
          className="block w-full text-left px-3 py-2 rounded text-sm text-green-400 hover:bg-gray-800"
        >
          Open Student Monitor ↗
        </a>
      </aside>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {tab === "vitals" && <VitalControls />}
          {tab === "waveforms" && <WaveformControls />}
          {tab === "alarms" && <AlarmControls />}
          {tab === "scenarios" && <ScenarioBuilder />}

          {tab === "patient" && (
            <div className="bg-gray-900 text-white p-4 rounded-lg space-y-3">
              <h2 className="font-bold text-lg">Patient Info</h2>
              <div>
                <label className="block text-sm mb-1">Patient Name</label>
                <input
                  value={patientName}
                  onChange={(e) => setVital("patientName", e.target.value)}
                  className="w-full text-black rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Bed Number</label>
                <input
                  value={bedNumber}
                  onChange={(e) => setVital("bedNumber", e.target.value)}
                  className="w-full text-black rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Category</label>
                <select
                  value={patientCategory}
                  onChange={(e) => setVital("patientCategory", e.target.value as any)}
                  className="w-full text-black rounded px-2 py-1"
                >
                  <option value="Adult">Adult</option>
                  <option value="Pediatric">Pediatric</option>
                  <option value="Neonate">Neonate</option>
                </select>
              </div>
              <div className="pt-2">
                <button onClick={clearTrends} className="bg-red-600 px-3 py-1 rounded text-sm">
                  Clear Trend Table ({trends.length} entries)
                </button>
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="bg-gray-900 text-white p-4 rounded-lg space-y-2">
              <h2 className="font-bold text-lg">Settings</h2>
              <p className="text-sm text-gray-400">
                Keyboard shortcuts: Space = Pause/Resume scenario, R = Restart, A = Toggle alarm silence, F = Fullscreen.
              </p>
              <p className="text-sm text-gray-400">
                Vitals and Waveform tabs use a Draft workflow: adjust sliders, then click
                "Accept &amp; Apply to Monitor" to push changes live, or "Cancel" to discard.
              </p>
              <p className="text-sm text-gray-400">
                Sync is cross-tab via BroadcastChannel — open Student Monitor in a separate tab to see live updates.
              </p>
            </div>
          )}
        </div>

        <LivePreview />
      </main>
    </div>
  );
}
