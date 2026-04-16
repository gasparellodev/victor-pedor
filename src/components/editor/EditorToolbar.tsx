"use client";

import { useState } from "react";
import type { SubtitleAction } from "@/hooks/useSubtitleState";

interface EditorToolbarProps {
  dispatch: React.Dispatch<SubtitleAction>;
  subtitleCount: number;
}

export function EditorToolbar({ dispatch, subtitleCount }: EditorToolbarProps) {
  const [shiftMs, setShiftMs] = useState(0);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--surface-container-low)] rounded-lg border border-[var(--outline-variant)]">
      <div className="flex items-center gap-3">
        <span className="text-[12px] text-[var(--outline)]">
          {subtitleCount} {subtitleCount === 1 ? "legenda" : "legendas"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="shift-input" className="text-[12px] text-[var(--on-surface-variant)]">
          Ajustar (ms)
        </label>
        <input
          id="shift-input"
          type="number"
          value={shiftMs}
          onChange={(e) => setShiftMs(parseInt(e.target.value, 10) || 0)}
          className="
            w-20 px-2 py-1 text-[12px] font-mono rounded-md
            bg-[var(--surface)] border border-[var(--outline-variant)]
            text-[var(--on-surface)]
            focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]
            transition-colors
          "
        />
        <button
          type="button"
          onClick={() => dispatch({ type: "SHIFT_ALL", offsetMs: shiftMs })}
          className="
            px-3 py-1 text-[12px] font-medium rounded-md
            bg-[var(--surface-container)] text-[var(--on-surface-variant)]
            hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]
            border border-[var(--outline-variant)]
            transition-colors duration-150
          "
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
