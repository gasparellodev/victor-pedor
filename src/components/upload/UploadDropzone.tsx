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
    <div>
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
          w-full min-h-[200px] p-8
          border-2 border-dashed rounded-xl
          cursor-pointer transition-colors
          ${disabled ? "opacity-50 cursor-not-allowed border-gray-300 bg-gray-50" : ""}
          ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
        `}
      >
        <svg
          className="w-12 h-12 mb-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-lg font-medium text-gray-700">
          Arraste o vídeo aqui ou clique para selecionar
        </p>
        <p className="mt-2 text-sm text-gray-500">
          MP4, WebM ou QuickTime (máx. 500MB)
        </p>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
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
