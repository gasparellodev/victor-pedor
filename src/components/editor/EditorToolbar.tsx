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
    <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-subtle)]">
      <div className="flex items-center gap-3">
        <span className="text-[12px] text-[var(--text-tertiary)]">
          {subtitleCount} {subtitleCount === 1 ? "legenda" : "legendas"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="shift-input" className="text-[12px] text-[var(--text-secondary)]">
          Ajustar (ms)
        </label>
        <input
          id="shift-input"
          type="number"
          value={shiftMs}
          onChange={(e) => setShiftMs(parseInt(e.target.value, 10) || 0)}
          className="
            w-20 px-2 py-1 text-[12px] font-mono rounded-md
            bg-[var(--bg-primary)] border border-[var(--border-default)]
            text-[var(--text-primary)]
            focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]
            transition-colors
          "
        />
        <button
          type="button"
          onClick={() => dispatch({ type: "SHIFT_ALL", offsetMs: shiftMs })}
          className="
            px-3 py-1 text-[12px] font-medium rounded-md
            bg-[var(--bg-tertiary)] text-[var(--text-secondary)]
            hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]
            border border-[var(--border-default)]
            transition-colors duration-150
          "
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
