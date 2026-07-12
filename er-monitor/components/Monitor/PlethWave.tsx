"use client";

import { useEffect, useRef } from "react";
import { useMonitorStore } from "@/store/useMonitorStore";
import { generatePlethBeat, beatDurationFromHR } from "@/lib/waveformEngine";

const SAMPLE_RATE = 150;
const WIDTH = 800;
const HEIGHT = 100;

export default function PlethWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<number[]>(new Array(WIDTH).fill(0));
  const beatPosRef = useRef(0);
  const currentBeatRef = useRef<number[]>([]);
  const currentDurRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const heartRate = useMonitorStore((s) => s.heartRate);
  const perfusionIndex = useMonitorStore((s) => s.perfusionIndex);
  const amplitude = useMonitorStore((s) => s.waveformSettings.plethAmplitude);
  const probeRemoved = useMonitorStore((s) => s.events.spo2ProbeRemoved);
  const motionArtifact = useMonitorStore((s) => s.events.motionArtifact);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const regenerateBeat = () => {
      const dur = beatDurationFromHR(heartRate, SAMPLE_RATE);
      currentBeatRef.current = generatePlethBeat(dur, amplitude, perfusionIndex);
      currentDurRef.current = dur;
    };
    regenerateBeat();

    const draw = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;
      const stepsThisFrame = Math.max(1, Math.round(delta / (1000 / SAMPLE_RATE)));

      for (let step = 0; step < stepsThisFrame; step++) {
        if (probeRemoved) {
          bufferRef.current.push(0);
          bufferRef.current.shift();
          continue;
        }
        if (beatPosRef.current >= currentDurRef.current) {
          beatPosRef.current = 0;
          regenerateBeat();
        }
        let val = currentBeatRef.current[beatPosRef.current] ?? 0;
        if (motionArtifact) val += (Math.random() - 0.5) * 0.3;
        bufferRef.current.push(val);
        bufferRef.current.shift();
        beatPosRef.current += 1;
      }

      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 1.8;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();

      bufferRef.current.forEach((v, i) => {
        const y = HEIGHT - 10 - v * (HEIGHT - 20);
        if (i === 0) {
          ctx.moveTo(i, y);
        } else {
          const prevY = HEIGHT - 10 - bufferRef.current[i - 1] * (HEIGHT - 20);
          const midX = i - 0.5;
          const midY = (prevY + y) / 2;
          ctx.quadraticCurveTo(i - 1, prevY, midX, midY);
        }
      });
      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    };
  }, [heartRate, perfusionIndex, amplitude, probeRemoved, motionArtifact]);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-cyan-400 px-1">
        <span>Pleth</span>
        <span>SpO2 %</span>
      </div>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="w-full bg-black rounded" />
    </div>
  );
}
