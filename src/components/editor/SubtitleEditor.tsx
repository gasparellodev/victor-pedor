"use client";

import type { Subtitle } from "@/types/subtitle";
import type { SubtitleAction } from "@/hooks/useSubtitleState";
import { SubtitleRow } from "./SubtitleRow";
import { EditorToolbar } from "./EditorToolbar";

interface SubtitleEditorProps {
  subtitles: Subtitle[];
  dispatch: React.Dispatch<SubtitleAction>;
  activeIndex?: number;
}

export function SubtitleEditor({
  subtitles,
  dispatch,
  activeIndex,
}: SubtitleEditorProps) {
  if (subtitles.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--text-tertiary)]">
        <p className="text-[14px]">Nenhuma legenda disponível.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      <EditorToolbar dispatch={dispatch} subtitleCount={subtitles.length} />

      <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
        {subtitles.map((sub) => (
          <SubtitleRow
            key={sub.index}
            subtitle={sub}
            isActive={sub.index === activeIndex}
            dispatch={dispatch}
          />
        ))}
      </div>
    </div>
  );
}
