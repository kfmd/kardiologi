"use client";

import { useEffect } from "react";
import { useMonitorStore } from "@/store/useMonitorStore";

export function useKeyboardShortcuts() {
  const pauseScenario = useMonitorStore((s) => s.pauseScenario);
  const resumeScenario = useMonitorStore((s) => s.resumeScenario);
  const scenarioRunning = useMonitorStore((s) => s.scenarioRunning);
  const restartScenario = useMonitorStore((s) => s.restartScenario);
  const alarms = useMonitorStore((s) => s.alarms);
  const updateAlarms = useMonitorStore((s) => s.updateAlarms);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          scenarioRunning ? pauseScenario() : resumeScenario();
          break;
        case "r":
          restartScenario();
          break;
        case "a":
          updateAlarms({ silenced: !alarms.silenced });
          break;
        case "f":
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [scenarioRunning, pauseScenario, resumeScenario, restartScenario, alarms.silenced, updateAlarms]);
}
