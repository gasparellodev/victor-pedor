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
      className={`
        group flex items-start gap-3 p-3 rounded-lg border transition-all duration-150
        ${
          isActive
            ? "border-[var(--primary)] bg-[rgba(173,198,255,0.12)]"
            : "border-[var(--outline-variant)] hover:border-[var(--outline-variant)] bg-[var(--surface-container-low)]"
        }
      `}
    >
      {/* Index */}
      <span className="text-[12px] font-mono text-[var(--outline)] mt-2 w-5 text-right shrink-0">
        {subtitle.index}
      </span>

      {/* Timestamps */}
      <div className="flex flex-col gap-1.5 shrink-0">
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

      {/* Text */}
      <textarea
        value={subtitle.text}
        onChange={(e) =>
          dispatch({
            type: "UPDATE_TEXT",
            index: subtitle.index,
            text: e.target.value,
          })
        }
        className="
          flex-1 px-3 py-2 rounded-md text-[13px] leading-relaxed resize-none min-h-[52px]
          bg-[var(--surface)] border border-[var(--outline-variant)]
          text-[var(--on-surface)] placeholder:text-[var(--outline)]
          focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]
          transition-colors duration-150
        "
        aria-label={`Texto da legenda ${subtitle.index}`}
        rows={2}
      />

      {/* Actions */}
      <div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          type="button"
          onClick={() => dispatch({ type: "DELETE", index: subtitle.index })}
          className="text-[11px] px-2 py-1 rounded text-[var(--error)] hover:bg-[rgba(255,180,171,0.12)] transition-colors"
          title="Excluir legenda"
        >
          Excluir
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "INSERT", afterIndex: subtitle.index })}
          className="text-[11px] px-2 py-1 rounded text-[var(--primary)] hover:bg-[rgba(173,198,255,0.12)] transition-colors"
          title="Inserir legenda após"
        >
          Inserir
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "MERGE", index: subtitle.index })}
          className="text-[11px] px-2 py-1 rounded text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] transition-colors"
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
          className="text-[11px] px-2 py-1 rounded text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] transition-colors"
          title="Dividir legenda"
        >
          Dividir
        </button>
      </div>
    </div>
  );
}
