"use client";

import { useEffect, useRef } from "react";
import { useMonitorStore } from "@/store/useMonitorStore";

const SAMPLE_RATE = 100;
const WIDTH = 800;
const HEIGHT = 100;

export default function RespWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<number[]>(new Array(WIDTH).fill(0));
  const phaseRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const rr = useMonitorStore((s) => s.respiratoryRate);
  const amplitude = useMonitorStore((s) => s.waveformSettings.respAmplitude);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;
      const stepsThisFrame = Math.max(1, Math.round(delta / (1000 / SAMPLE_RATE)));

      for (let step = 0; step < stepsThisFrame; step++) {
        if (rr <= 0) {
          bufferRef.current.push(0);
          bufferRef.current.shift();
          continue;
        }
        const cyclesPerSample = rr / 60 / SAMPLE_RATE;
        const val = Math.sin(2 * Math.PI * cyclesPerSample * phaseRef.current) * amplitude;
        bufferRef.current.push(val);
        bufferRef.current.shift();
        phaseRef.current += 1;
      }

      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 1.8;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();

      bufferRef.current.forEach((v, i) => {
        const y = HEIGHT / 2 - v * (HEIGHT / 2.5);
        if (i === 0) {
          ctx.moveTo(i, y);
        } else {
          const prevY = HEIGHT / 2 - bufferRef.current[i - 1] * (HEIGHT / 2.5);
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
  }, [rr, amplitude]);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-yellow-400 px-1">
        <span>Resp x2</span>
        <span>rpm</span>
      </div>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="w-full bg-black rounded" />
    </div>
  );
}
