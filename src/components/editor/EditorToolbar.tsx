"use client";

import { useState } from "react";
import type { SubtitleAction } from "@/hooks/useSubtitleState";

interface EditorToolbarProps {
  dispatch: React.Dispatch<SubtitleAction>;
}

export function EditorToolbar({ dispatch }: EditorToolbarProps) {
  const [shiftMs, setShiftMs] = useState(0);

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2">
        <label htmlFor="shift-input" className="text-sm text-gray-600">
          Ajustar todos (ms):
        </label>
        <input
          id="shift-input"
          type="number"
          value={shiftMs}
          onChange={(e) => setShiftMs(parseInt(e.target.value, 10) || 0)}
          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
        />
        <button
          type="button"
          onClick={() => dispatch({ type: "SHIFT_ALL", offsetMs: shiftMs })}
          className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-800"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
