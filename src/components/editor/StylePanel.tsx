"use client";

import { useState, type ReactNode } from "react";
import type { SubtitleStyle } from "@/lib/subtitle-style/types";
import {
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
  OUTLINE_WIDTH_MIN,
  OUTLINE_WIDTH_MAX,
} from "@/lib/subtitle-style/types";
import {
  FONT_PRESETS,
  FONT_COLOR_PALETTE,
  OUTLINE_COLOR_PALETTE,
} from "@/lib/subtitle-style/presets";
import {
  DEFAULT_MAX_CHARS_PER_LINE,
  DEFAULT_MAX_LINES,
  MAX_CHARS_PER_LINE_MAX,
  MAX_CHARS_PER_LINE_MIN,
} from "@/lib/subtitle-format";

interface StylePanelProps {
  style: SubtitleStyle;
  onUpdate: (partial: Partial<SubtitleStyle>) => void;
  onReformatAll?: () => void;
}

const WEIGHT_OPTIONS: { value: SubtitleStyle["fontWeight"]; label: string }[] = [
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Bold" },
  { value: "700", label: "Extra Bold" },
];

const DEFAULT_OPAQUE_BG = "#000000CC";

const FIELD_LABEL =
  "text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider";

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-[var(--outline-variant)]/40 first:border-t-0 pt-4 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Toggle ${title} section`}
        aria-expanded={open}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <span className={FIELD_LABEL}>{title}</span>
        <svg
          className={`w-4 h-4 text-[var(--on-surface-variant)] transition-transform ${
            open ? "" : "-rotate-90"
          }`}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </div>
  );
}

export function StylePanel({
  style,
  onUpdate,
  onReformatAll,
}: StylePanelProps) {
  const [fontOpen, setFontOpen] = useState(false);

  const maxCharsPerLine = style.maxCharsPerLine ?? DEFAULT_MAX_CHARS_PER_LINE;
  const maxLines = style.maxLines ?? DEFAULT_MAX_LINES;
  const outlineWidth = style.outlineWidth ?? 0;
  const outlineColor = style.outlineColor ?? "#000000";
  const bgEnabled = style.backgroundColor !== "transparent";

  return (
    <div className="space-y-4">
      {/* POSITION */}
      <Section title="Position">
        <div className="space-y-2">
          <span className={FIELD_LABEL}>Alignment</span>
          <div className="flex bg-[var(--surface-container)] rounded-lg p-1">
            {(["top", "center", "bottom"] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => onUpdate({ position: pos })}
                aria-label={`Align ${pos}`}
                className={`flex-1 py-1.5 flex justify-center transition-all rounded-md ${
                  style.position === pos
                    ? "text-[var(--on-surface)] bg-[var(--surface-container-highest)]"
                    : "text-slate-500 hover:text-[var(--on-surface)]"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  {pos === "top" && (
                    <path d="M8 11h3v10h2V11h3l-4-4-4 4zM4 3v2h16V3H4z" />
                  )}
                  {pos === "center" && (
                    <path d="M8 19h3v4h2v-4h3l-4-4-4 4zm8-14h-3V1h-2v4H8l4 4 4-4zM4 11v2h16v-2H4z" />
                  )}
                  {pos === "bottom" && (
                    <path d="M16 13h-3V3h-2v10H8l4 4 4-4zM4 19v2h16v-2H4z" />
                  )}
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
              X
            </span>
            <div
              aria-label="Anchor X"
              className="bg-[var(--surface-container)] rounded-lg px-3 py-2 text-sm font-mono font-bold text-[var(--on-surface)]"
            >
              {style.anchor ? `${Math.round(style.anchor.xPercent)}%` : "—"}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
              Y
            </span>
            <div
              aria-label="Anchor Y"
              className="bg-[var(--surface-container)] rounded-lg px-3 py-2 text-sm font-mono font-bold text-[var(--on-surface)]"
            >
              {style.anchor ? `${Math.round(style.anchor.yPercent)}%` : "—"}
            </div>
          </div>
        </div>

        {style.anchor && (
          <button
            type="button"
            onClick={() => onUpdate({ anchor: undefined })}
            className="w-full text-xs font-bold py-2 rounded-lg text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container)] transition-colors"
          >
            Reset position
          </button>
        )}
      </Section>

      {/* TEXT STYLE */}
      <Section title="Text Style">
        <div className="space-y-2">
          <span className={FIELD_LABEL}>Font Family</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setFontOpen(!fontOpen)}
              className="flex items-center justify-between w-full bg-[var(--surface-container)] rounded-lg p-3 cursor-pointer hover:bg-[var(--surface-container-high)] transition-colors"
            >
              <span
                className="text-sm font-bold font-headline"
                style={{ fontFamily: style.fontFamily }}
              >
                {style.fontFamily}
              </span>
              <svg
                className={`w-4 h-4 text-[var(--on-surface-variant)] transition-transform ${
                  fontOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
            {fontOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface-container-high)] rounded-lg border border-[var(--outline-variant)]/20 shadow-xl z-20 overflow-hidden">
                {FONT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className={FIELD_LABEL}>Size</span>
            <div className="flex items-center bg-[var(--surface-container)] rounded-lg p-2">
              <input
                type="number"
                min={FONT_SIZE_MIN}
                max={FONT_SIZE_MAX}
                value={style.fontSize}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= FONT_SIZE_MIN && v <= FONT_SIZE_MAX)
                    onUpdate({ fontSize: v });
                }}
                className="bg-transparent border-none w-full text-sm font-bold focus:ring-0 focus:outline-none text-[var(--on-surface)]"
              />
              <span className="text-[10px] text-slate-500 pr-1 shrink-0">PX</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className={FIELD_LABEL}>Weight</span>
            <div className="relative">
              <select
                value={style.fontWeight}
                onChange={(e) =>
                  onUpdate({
                    fontWeight: e.target.value as SubtitleStyle["fontWeight"],
                  })
                }
                className="w-full bg-[var(--surface-container)] rounded-lg p-2 text-xs font-bold focus:ring-0 focus:outline-none appearance-none text-[var(--on-surface)] border-none cursor-pointer"
              >
                {WEIGHT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--on-surface-variant)] pointer-events-none"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>
          </div>
        </div>
      </Section>

      {/* FILL */}
      <Section title="Fill">
        <div className="flex gap-3">
          {FONT_COLOR_PALETTE.map((color) => {
            const selected = style.fontColor.toUpperCase() === color;
            return (
              <button
                key={color}
                type="button"
                onClick={() => onUpdate({ fontColor: color })}
                aria-label={`Font color ${color}`}
                className={`w-9 h-9 rounded-full transition-all border border-[var(--outline-variant)] ${
                  selected
                    ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--surface)]"
                    : ""
                }`}
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
      </Section>

      {/* BORDER */}
      <Section title="Border">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--on-surface-variant)]">
              Outline width
            </span>
            <span className="text-xs font-bold font-mono text-[var(--on-surface)]">
              {outlineWidth} px
            </span>
          </div>
          <input
            type="range"
            min={OUTLINE_WIDTH_MIN}
            max={OUTLINE_WIDTH_MAX}
            step={1}
            value={outlineWidth}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) onUpdate({ outlineWidth: v });
            }}
            aria-label="Outline width"
            className="w-full accent-[var(--primary)]"
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs text-[var(--on-surface-variant)]">
            Outline color
          </span>
          <div className="flex gap-3">
            {OUTLINE_COLOR_PALETTE.map((color) => {
              const selected = outlineColor.toUpperCase() === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => onUpdate({ outlineColor: color })}
                  aria-label={`Outline color ${color}`}
                  className={`w-7 h-7 rounded-full transition-all border border-[var(--outline-variant)] ${
                    selected
                      ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--surface)]"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--on-surface-variant)]">
            Background
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={bgEnabled}
            aria-label="Toggle subtitle background"
            onClick={() =>
              onUpdate({
                backgroundColor: bgEnabled ? "transparent" : DEFAULT_OPAQUE_BG,
              })
            }
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              bgEnabled
                ? "bg-[var(--primary)]"
                : "bg-[var(--surface-container-highest)]"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                bgEnabled ? "translate-x-[18px]" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </Section>

      {/* EFFECTS — placeholder */}
      <Section title="Effects" defaultOpen={false}>
        <p className="text-xs text-[var(--on-surface-variant)] italic">
          Em breve — drop shadow, blur.
        </p>
      </Section>

      {/* FORMAT */}
      <Section title="Format">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--on-surface-variant)]">
              Limite por linha
            </span>
            <span className="text-xs font-bold font-mono text-[var(--on-surface)]">
              {maxCharsPerLine}
            </span>
          </div>
          <input
            type="range"
            min={MAX_CHARS_PER_LINE_MIN}
            max={MAX_CHARS_PER_LINE_MAX}
            step={1}
            value={maxCharsPerLine}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) onUpdate({ maxCharsPerLine: v });
            }}
            aria-label="Limite de caracteres por linha"
            className="w-full accent-[var(--primary)]"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--on-surface-variant)]">Linhas</span>
          <div className="flex bg-[var(--surface-container)] rounded-lg p-1">
            {([1, 2] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onUpdate({ maxLines: n })}
                aria-label={`Set maxLines to ${n}`}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  maxLines === n
                    ? "bg-[var(--surface-container-highest)] text-[var(--on-surface)]"
                    : "text-slate-500 hover:text-[var(--on-surface)]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {onReformatAll && (
          <button
            type="button"
            onClick={onReformatAll}
            className="w-full mt-1 py-3 bg-[var(--surface-container-highest)] rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/5 transition-all"
          >
            Reformatar todas
          </button>
        )}
      </Section>
    </div>
  );
}
