"use client";

import { useEffect, useRef } from "react";
import { useMonitorStore } from "@/store/useMonitorStore";
import { generateBeatSamples, applyArtifacts, beatDurationFromHR, rrVariabilityFactor, smoothBuffer } from "@/lib/waveformEngine";

// Higher internal sample rate = smoother curve resolution before rendering.
const SAMPLE_RATE = 250;
const WIDTH = 800;
const HEIGHT = 120;

export default function ECGWave({ lead = "II" }: { lead?: "II" | "V1" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<number[]>(new Array(WIDTH * 2).fill(0));
  const beatPosRef = useRef(0);
  const beatIndexRef = useRef(0);
  const currentBeatRef = useRef<number[]>([]);
  const currentBeatDurRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const heartRate = useMonitorStore((s) => s.heartRate);
  const rhythm = useMonitorStore((s) => s.rhythm);
  const waveformSettings = useMonitorStore((s) => s.waveformSettings);
  const ecgLeadOff = useMonitorStore((s) => s.events.ecgLeadOff);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;

    const regenerateBeat = () => {
      const variability = rrVariabilityFactor(rhythm);
      const dur = Math.max(20, Math.round(beatDurationFromHR(heartRate, SAMPLE_RATE) * variability));
      const raw = generateBeatSamples(rhythm, dur, waveformSettings.ecgGain, beatIndexRef.current);
      const noisy = applyArtifacts(raw, waveformSettings, frame);
      currentBeatRef.current = smoothBuffer(noisy, 1);
      currentBeatDurRef.current = dur;
      beatIndexRef.current += 1;
    };

    regenerateBeat();

    // Render at a fixed pixel-advance rate mapped from sweep speed, decoupled
    // from sample rate, for a smooth continuous horizontal scroll.
    const pixelsPerFrame = Math.max(1, waveformSettings.ecgSweepSpeed / 25);

    const draw = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      const stepsThisFrame = Math.max(1, Math.round(delta / (1000 / SAMPLE_RATE)));

      for (let step = 0; step < stepsThisFrame; step++) {
        if (ecgLeadOff) {
          bufferRef.current.push(0);
          bufferRef.current.shift();
          continue;
        }
        if (beatPosRef.current >= currentBeatDurRef.current) {
          beatPosRef.current = 0;
          regenerateBeat();
        }
        const val = currentBeatRef.current[beatPosRef.current] ?? 0;
        bufferRef.current.push(val);
        bufferRef.current.shift();
        beatPosRef.current += 1;
      }

      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 1.8;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();

      const visible = bufferRef.current.slice(-WIDTH);
      const xScale = WIDTH / visible.length;

      visible.forEach((v, i) => {
        const x = i * xScale;
        const y = HEIGHT / 2 - v * (HEIGHT / 2.6);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = (i - 1) * xScale;
          const prevY = HEIGHT / 2 - visible[i - 1] * (HEIGHT / 2.6);
          const midX = (prevX + x) / 2;
          const midY = (prevY + y) / 2;
          ctx.quadraticCurveTo(prevX, prevY, midX, midY);
        }
      });
      ctx.stroke();

      frame++;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    };
  }, [heartRate, rhythm, waveformSettings, ecgLeadOff]);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-green-400 px-1">
        <span>{lead} x1 {rhythm === "NSR" ? "ST" : ""}</span>
        <span>ECG</span>
      </div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="w-full bg-black rounded"
      />
    </div>
  );
}
