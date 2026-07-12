"use client";

interface VitalCardProps {
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  subLabel?: string;
  small?: boolean;
}

export default function VitalCard({ label, value, unit, color, subLabel, small }: VitalCardProps) {
  return (
    <div className="flex flex-col items-end px-2">
      <div className="flex justify-between w-full text-xs" style={{ color }}>
        <span>{label}</span>
        {subLabel && <span>{subLabel}</span>}
      </div>
      <div
        className={small ? "text-3xl font-bold" : "text-6xl font-bold leading-none"}
        style={{ color }}
      >
        {value}
        {unit && <span className="text-2xl ml-1">{unit}</span>}
      </div>
    </div>
  );
}
