"use client";

import { useCallback, useState } from "react";

interface TimestampInputProps {
  value: number;
  onChange: (ms: number) => void;
  label: string;
}

export function formatTimestamp(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;

  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0") +
    "," +
    String(millis).padStart(3, "0")
  );
}

export function parseTimestamp(str: string): number | null {
  const match = str.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  if (!match) return null;

  const [, h, m, s, ms] = match;
  return (
    parseInt(h, 10) * 3600000 +
    parseInt(m, 10) * 60000 +
    parseInt(s, 10) * 1000 +
    parseInt(ms, 10)
  );
}

export function TimestampInput({ value, onChange, label }: TimestampInputProps) {
  const [text, setText] = useState(formatTimestamp(value));
  const [error, setError] = useState(false);

  const handleBlur = useCallback(() => {
    const parsed = parseTimestamp(text);
    if (parsed !== null) {
      setError(false);
      onChange(parsed);
    } else {
      setError(true);
    }
  }, [text, onChange]);

  return (
    <input
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      aria-label={label}
      className={`
        w-[120px] px-2.5 py-1.5 text-[12px] font-mono rounded-md
        bg-[var(--surface)] border transition-colors duration-150
        focus:outline-none focus:ring-1
        ${
          error
            ? "border-[var(--error)] focus:ring-[var(--error)]"
            : "border-[var(--outline-variant)] focus:border-[var(--primary)] focus:ring-[var(--primary)]"
        }
        text-[var(--on-surface)] placeholder:text-[var(--outline)]
      `}
      placeholder="00:00:00,000"
    />
  );
}
