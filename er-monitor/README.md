# ICU / ER Patient Monitor Simulator

Educational bedside patient monitor simulator (Mindray ePM / Philips IntelliVue style)
for ACLS, ATLS, PALS, and critical care training. NOT for clinical use.

## Setup

```bash
npm install
npm run dev
```

Open:
- http://localhost:3000/monitor — Student Monitor Display
- http://localhost:3000/admin — Instructor Login (password: instructor123)

## ECG Waveform Engine

The ECG trace is generated using the McSharry et al. (2003) dynamical model —
the same mathematical foundation used by PhysioNet's ECGSYN and the fecgsyn
toolbox (https://github.com/fernandoandreotti/fecgsyn). Each PQRST complex is
built as a sum of asymmetric Gaussian functions positioned at physiological
angles around the cardiac cycle, rather than hand-drawn point arrays. This
produces smooth, clinically realistic P-QRS-T morphology for all 16 supported
rhythms, with:

- Beat-to-beat RR-interval variability tuned per rhythm (e.g. high variability
  for AFib/VT, near-zero for NSR)
- Chaotic multi-frequency synthesis for VF/Torsades (matching fecgsyn's
  approach for pathological irregular rhythms)
- Injected PVC-morphology beats every 2nd/3rd beat for Bigeminy/Trigeminy
- Quadratic-curve canvas rendering (not raw line segments) for a smooth,
  non-jagged trace at any sweep speed

See `lib/ecgSynth.ts` for the Gaussian-sum model and `lib/waveformEngine.ts`
for beat sequencing, RR variability, and artifact injection.

## Structure

- `app/monitor` — Student-facing read-only monitor display
- `app/admin` — Instructor login + `/admin/dashboard` control panel
- `components/Monitor` — ECGWave, PlethWave, RespWave, VitalCard, PatientHeader, TrendTable, AlarmBanner, SoftButtons
- `components/Admin` — VitalControls, WaveformControls, AlarmControls, ScenarioBuilder, LivePreview
- `store/useMonitorStore.ts` — Zustand global state + draft/accept/cancel workflow + cross-tab broadcast sync
- `store/useAuthStore.ts` — Simple instructor login gate
- `lib/ecgSynth.ts` — ECGSYN-equivalent Gaussian-sum PQRST morphology model
- `lib/waveformEngine.ts` — Beat sequencing, RR variability, artifact injection, pleth/resp generators
- `lib/alarmEngine.ts` — Physiological + technical alarm evaluation
- `lib/broadcastSync.ts` — Cross-tab live sync via BroadcastChannel (localStorage fallback)
- `hooks/useKeyboardShortcuts.ts` — Space (pause/resume), R (restart), A (silence alarms), F (fullscreen)
- `types/monitor.ts` — Core TypeScript data model

## Live Sync & Draft Workflow

- Admin Vitals/Waveform tabs use a **draft** state: adjust sliders, then click
  "Accept & Apply to Monitor" to push changes live (broadcast to all open
  Student Monitor tabs instantly), or "Cancel" to discard.
- Alarm limits and special-event toggles apply immediately (no draft step).
- Scenario Builder includes two working presets and a full step editor with
  rhythm **dropdowns** (no free-text rhythm entry).

## Keyboard Shortcuts (on Monitor page)

- Space: Pause/Resume scenario
- R: Restart scenario
- A: Toggle alarm silence
- F: Toggle fullscreen

## Notes

- Change instructor password in `store/useAuthStore.ts` (`ADMIN_PASSWORD`).
- Architecture keeps all cross-view state in Zustand + BroadcastChannel so a
  server-based WebSocket/Supabase Realtime sync can be swapped in later
  without refactoring components.
