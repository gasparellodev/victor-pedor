"use client";

import { useState } from "react";
import type { SubtitleStyle } from "@/lib/subtitle-style/types";
import { FONT_SIZE_MIN, FONT_SIZE_MAX } from "@/lib/subtitle-style/types";
import { FONT_PRESETS } from "@/lib/subtitle-style/presets";

interface StylePanelProps {
  style: SubtitleStyle;
  onUpdate: (partial: Partial<SubtitleStyle>) => void;
}

const WEIGHT_OPTIONS: { value: SubtitleStyle["fontWeight"]; label: string }[] = [
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Bold" },
  { value: "700", label: "Extra Bold" },
];

const COLOR_PRESETS = [
  { value: "#FFFFFF", className: "bg-white border border-[var(--outline-variant)]" },
  { value: "#ADC6FF", className: "bg-[#ADC6FF]" },
  { value: "#FFB786", className: "bg-[#FFB786]" },
  { value: "#000000", className: "bg-black border border-[var(--outline-variant)]" },
  { value: "#00000080", className: "bg-gradient-to-tr from-[var(--primary)] to-[var(--tertiary)]" },
];

export function StylePanel({ style, onUpdate }: StylePanelProps) {
  const [fontOpen, setFontOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Font Family — dropdown */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
          Font Family
        </label>
        <div className="relative">
          <button
            onClick={() => setFontOpen(!fontOpen)}
            className="flex items-center justify-between w-full bg-[var(--surface-container)] rounded-lg p-3 cursor-pointer hover:bg-[var(--surface-container-high)] transition-colors"
          >
            <span className="text-sm font-bold font-headline" style={{ fontFamily: style.fontFamily }}>
              {style.fontFamily}
            </span>
            <svg className={`w-4 h-4 text-[var(--on-surface-variant)] transition-transform ${fontOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
          {fontOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface-container-high)] rounded-lg border border-[var(--outline-variant)]/20 shadow-xl z-20 overflow-hidden">
              {FONT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    onUpdate({ fontFamily: preset.family });
                    setFontOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    style.fontFamily === preset.family
                      ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "text-[var(--on-surface)] hover:bg-[var(--surface-container-highest)]"
                  }`}
                  style={{ fontFamily: preset.family }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Size & Weight — Stitch layout */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
            Size
          </label>
          <div className="flex items-center bg-[var(--surface-container)] rounded-lg p-2">
            <input
              type="number"
              min={FONT_SIZE_MIN}
              max={FONT_SIZE_MAX}
              value={style.fontSize}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= FONT_SIZE_MIN && v <= FONT_SIZE_MAX) onUpdate({ fontSize: v });
              }}
              className="bg-transparent border-none w-full text-sm font-bold focus:ring-0 focus:outline-none text-[var(--on-surface)]"
            />
            <span className="text-[10px] text-slate-500 pr-1 shrink-0">PX</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
            Weight
          </label>
          <div className="relative">
            <select
              value={style.fontWeight}
              onChange={(e) => onUpdate({ fontWeight: e.target.value as SubtitleStyle["fontWeight"] })}
              className="w-full bg-[var(--surface-container)] rounded-lg p-2 text-xs font-bold focus:ring-0 focus:outline-none appearance-none text-[var(--on-surface)] border-none cursor-pointer"
            >
              {WEIGHT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--on-surface-variant)] pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Colors — circular swatches */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
          Colors
        </label>
        <div className="flex gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onUpdate({ fontColor: preset.value.replace(/80$/, "") || "#FFFFFF", backgroundColor: preset.value })}
              className={`w-8 h-8 rounded-full cursor-pointer transition-all ${preset.className} ${
                style.fontColor === preset.value || style.backgroundColor === preset.value
                  ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--surface)]"
                  : ""
              }`}
            />
          ))}
        </div>
      </div>

      {/* Alignment — icon buttons */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
          Alignment
        </label>
        <div className="flex bg-[var(--surface-container)] rounded-lg p-1">
          {(["top", "center", "bottom"] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => onUpdate({ position: pos })}
              className={`flex-1 py-1.5 flex justify-center transition-all rounded-md ${
                style.position === pos
                  ? "text-[var(--on-surface)] bg-[var(--surface-container-highest)]"
                  : "text-slate-500 hover:text-[var(--on-surface)]"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                {pos === "top" && <path d="M8 11h3v10h2V11h3l-4-4-4 4zM4 3v2h16V3H4z" />}
                {pos === "center" && <path d="M8 19h3v4h2v-4h3l-4-4-4 4zm8-14h-3V1h-2v4H8l4 4 4-4zM4 11v2h16v-2H4z" />}
                {pos === "bottom" && <path d="M16 13h-3V3h-2v10H8l4 4 4-4zM4 19v2h16v-2H4z" />}
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Apply to All Segments */}
      <button className="w-full py-4 bg-[var(--surface-container-highest)] rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/5 transition-all">
        Apply to All Segments
      </button>
    </div>
  );
}
