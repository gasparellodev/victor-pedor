"use client";

import type { Subtitle } from "@/types/subtitle";
import type { SubtitleAction } from "@/hooks/useSubtitleState";
import { TimestampInput } from "./TimestampInput";

interface SubtitleRowProps {
  subtitle: Subtitle;
  isActive: boolean;
  dispatch: React.Dispatch<SubtitleAction>;
}

export function SubtitleRow({ subtitle, isActive, dispatch }: SubtitleRowProps) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        isActive ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <span className="text-sm font-mono text-gray-400 mt-2 w-6 text-right shrink-0">
        {subtitle.index}
      </span>

      <div className="flex flex-col gap-2 shrink-0">
        <TimestampInput
          value={subtitle.startTime}
          onChange={(startTime) =>
            dispatch({ type: "UPDATE_START", index: subtitle.index, startTime })
          }
          label={`Início da legenda ${subtitle.index}`}
        />
        <TimestampInput
          value={subtitle.endTime}
          onChange={(endTime) =>
            dispatch({ type: "UPDATE_END", index: subtitle.index, endTime })
          }
          label={`Fim da legenda ${subtitle.index}`}
        />
      </div>

      <textarea
        value={subtitle.text}
        onChange={(e) =>
          dispatch({
            type: "UPDATE_TEXT",
            index: subtitle.index,
            text: e.target.value,
          })
        }
        className="flex-1 px-3 py-2 border border-gray-300 rounded resize-none text-sm min-h-[60px]"
        aria-label={`Texto da legenda ${subtitle.index}`}
        rows={2}
      />

      <div className="flex flex-col gap-1 shrink-0">
        <button
          type="button"
          onClick={() => dispatch({ type: "DELETE", index: subtitle.index })}
          className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
          title="Excluir legenda"
        >
          Excluir
        </button>
        <button
          type="button"
          onClick={() =>
            dispatch({ type: "INSERT", afterIndex: subtitle.index })
          }
          className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
          title="Inserir legenda após"
        >
          Inserir
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "MERGE", index: subtitle.index })}
          className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-50 rounded"
          title="Mesclar com próxima"
        >
          Mesclar
        </button>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: "SPLIT",
              index: subtitle.index,
              splitAt: Math.ceil(subtitle.text.split(" ").length / 2),
            })
          }
          className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-50 rounded"
          title="Dividir legenda"
        >
          Dividir
        </button>
      </div>
    </div>
  );
}
