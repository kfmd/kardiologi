import { PatientMonitorState } from "@/types/monitor";

export interface AlarmCheckResult {
  id: string;
  message: string;
  priority: "high" | "medium" | "low";
  type: "physiological" | "technical";
}

export function evaluateAlarms(state: PatientMonitorState): AlarmCheckResult[] {
  const results: AlarmCheckResult[] = [];
  const { alarms, heartRate, spo2, respiratoryRate, systolicBP, temperature, events } = state;

  if (alarms.heartRate.high && heartRate > alarms.heartRate.high) {
    results.push({ id: "hr-high", message: `HR High: ${heartRate}`, priority: "high", type: "physiological" });
  }
  if (alarms.heartRate.low && heartRate < alarms.heartRate.low) {
    results.push({ id: "hr-low", message: `HR Low: ${heartRate}`, priority: "high", type: "physiological" });
  }
  if (alarms.spo2.low && spo2 < alarms.spo2.low) {
    results.push({ id: "spo2-low", message: `SpO2 Low: ${spo2}%`, priority: "high", type: "physiological" });
  }
  if (alarms.respiratoryRate.high && respiratoryRate > alarms.respiratoryRate.high) {
    results.push({ id: "rr-high", message: `RR High: ${respiratoryRate}`, priority: "medium", type: "physiological" });
  }
  if (alarms.respiratoryRate.low && respiratoryRate < alarms.respiratoryRate.low) {
    results.push({ id: "rr-low", message: `RR Low: ${respiratoryRate}`, priority: "medium", type: "physiological" });
  }
  if (alarms.systolicBP.high && systolicBP > alarms.systolicBP.high) {
    results.push({ id: "bp-high", message: `BP High: ${systolicBP}`, priority: "medium", type: "physiological" });
  }
  if (alarms.systolicBP.low && systolicBP < alarms.systolicBP.low) {
    results.push({ id: "bp-low", message: `BP Low: ${systolicBP}`, priority: "high", type: "physiological" });
  }
  if (alarms.temperature.high && temperature > alarms.temperature.high) {
    results.push({ id: "temp-high", message: `Temp High: ${temperature}`, priority: "low", type: "physiological" });
  }
  if (alarms.temperature.low && temperature < alarms.temperature.low) {
    results.push({ id: "temp-low", message: `Temp Low: ${temperature}`, priority: "low", type: "physiological" });
  }

  if (events.ecgLeadOff) {
    results.push({ id: "ecg-lead-off", message: "ECG Lead Off", priority: "medium", type: "technical" });
  }
  if (events.spo2ProbeRemoved) {
    results.push({ id: "spo2-probe", message: "SpO2 Probe Off", priority: "medium", type: "technical" });
  }
  if (events.batteryLow) {
    results.push({ id: "battery-low", message: "Battery Low", priority: "low", type: "technical" });
  }
  if (events.powerFailure) {
    results.push({ id: "power-failure", message: "Power Failure", priority: "high", type: "technical" });
  }

  return results;
}
