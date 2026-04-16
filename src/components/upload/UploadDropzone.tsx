"use client";

import { useCallback, useRef, useState } from "react";
import { ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE } from "@/lib/blob/client";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function UploadDropzone({ onFileSelect, disabled }: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);

      if (
        !ALLOWED_VIDEO_TYPES.includes(
          file.type as (typeof ALLOWED_VIDEO_TYPES)[number]
        )
      ) {
        setError(
          `Tipo de arquivo inválido: ${file.type}. Aceitos: MP4, WebM, QuickTime.`
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(
          `Arquivo muito grande. Máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        );
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [disabled, validateAndSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  return (
    <div className="animate-fade-in">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleClick();
        }}
        className={`
          flex flex-col items-center justify-center
          w-full min-h-[240px] p-10
          border border-dashed rounded-xl
          cursor-pointer transition-all duration-200
          ${disabled ? "opacity-40 cursor-not-allowed" : ""}
          ${
            isDragOver
              ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
              : "border-[var(--border-default)] hover:border-[var(--text-tertiary)] bg-[var(--bg-secondary)]"
          }
        `}
      >
        <div className={`w-12 h-12 mb-5 rounded-xl flex items-center justify-center ${
          isDragOver ? "bg-[var(--accent-subtle)]" : "bg-[var(--bg-tertiary)]"
        }`}>
          <svg
            className={`w-6 h-6 ${isDragOver ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>
        <p className="text-[15px] font-medium text-[var(--text-primary)]">
          Arraste o vídeo aqui ou clique para selecionar
        </p>
        <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">
          MP4, WebM ou QuickTime (máx. 500MB)
        </p>
      </div>

      {error && (
        <div className="mt-3 px-4 py-3 rounded-lg bg-[var(--danger-subtle)] border border-[var(--danger)]/20" role="alert">
          <p className="text-[13px] text-[var(--danger)]">{error}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleChange}
        className="hidden"
        aria-label="Selecionar vídeo"
      />
    </div>
  );
}
