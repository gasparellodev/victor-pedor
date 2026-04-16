"use client";

import type { SubtitleStyle } from "@/lib/subtitle-style/types";
import { FONT_SIZE_MIN, FONT_SIZE_MAX } from "@/lib/subtitle-style/types";
import {
  FONT_PRESETS,
  TEXT_COLOR_PRESETS,
  BG_COLOR_PRESETS,
} from "@/lib/subtitle-style/presets";

interface StylePanelProps {
  style: SubtitleStyle;
  onUpdate: (partial: Partial<SubtitleStyle>) => void;
}

export function StylePanel({ style, onUpdate }: StylePanelProps) {
  return (
    <div className="space-y-6">
      {/* Font Family */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-[var(--on-surface-variant)] mb-3 font-medium">
          Font Family
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FONT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onUpdate({ fontFamily: preset.family })}
              className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left ${
                style.fontFamily === preset.family
                  ? "bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/40"
                  : "bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]"
              }`}
              style={{ fontFamily: preset.family }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Size & Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--on-surface-variant)] mb-3 font-medium">
            Size
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={FONT_SIZE_MIN}
              max={FONT_SIZE_MAX}
              value={style.fontSize}
              onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value, 10) })}
              className="flex-1 accent-blue-400 h-1 bg-[var(--surface-container-highest)] rounded-full appearance-none cursor-pointer"
            />
            <span className="text-sm text-[var(--on-surface)] font-medium w-8 text-right">
              {style.fontSize}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--on-surface-variant)] mb-3 font-medium">
            Weight
          </label>
          <div className="flex gap-1">
            {(["400", "500", "600", "700"] as const).map((w) => (
              <button
                key={w}
                onClick={() => onUpdate({ fontWeight: w })}
                className={`flex-1 px-2 py-1.5 rounded text-xs transition-all ${
                  style.fontWeight === w
                    ? "bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/40"
                    : "bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]"
                }`}
                style={{ fontWeight: parseInt(w, 10) }}
              >
                {w === "400" ? "Regular" : w === "500" ? "Medium" : w === "600" ? "Semi" : "Bold"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Colors */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-[var(--on-surface-variant)] mb-3 font-medium">
          Colors
        </label>
        <div className="grid grid-cols-2 gap-4">
          {/* Text color */}
          <div>
            <span className="text-[10px] text-[var(--outline)] mb-2 block">Text</span>
            <div className="flex gap-1.5 flex-wrap">
              {TEXT_COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdate({ fontColor: color })}
                  className={`w-7 h-7 rounded-lg border-2 transition-all ${
                    style.fontColor === color
                      ? "border-blue-400 scale-110"
                      : "border-transparent hover:border-[var(--outline-variant)]"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          {/* Background color */}
          <div>
            <span className="text-[10px] text-[var(--outline)] mb-2 block">Background</span>
            <div className="flex gap-1.5 flex-wrap">
              {BG_COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdate({ backgroundColor: color })}
                  className={`w-7 h-7 rounded-lg border-2 transition-all ${
                    style.backgroundColor === color
                      ? "border-blue-400 scale-110"
                      : "border-transparent hover:border-[var(--outline-variant)]"
                  } ${color === "transparent" ? "border-dashed border-[var(--outline-variant)] relative overflow-hidden" : ""}`}
                  style={color !== "transparent" ? { backgroundColor: color } : undefined}
                  title={color === "transparent" ? "None" : color}
                >
                  {color === "transparent" && (
                    <span className="absolute inset-0 flex items-center justify-center text-[var(--outline)] text-xs">✕</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alignment / Position */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-[var(--on-surface-variant)] mb-3 font-medium">
          Alignment
        </label>
        <div className="flex gap-1">
          {(["top", "center", "bottom"] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => onUpdate({ position: pos })}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                style.position === pos
                  ? "bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/40"
                  : "bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]"
              }`}
            >
              {pos === "top" ? "↑" : pos === "center" ? "↔" : "↓"} {pos}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
