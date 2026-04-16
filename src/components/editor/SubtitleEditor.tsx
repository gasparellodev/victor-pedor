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
      <p className="text-center text-gray-500 py-8">
        Nenhuma legenda disponível.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <EditorToolbar dispatch={dispatch} />

      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
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
