"use client";

import { useEffect, useRef } from "react";
import type { ChangeEvent, MouseEvent } from "react";

interface EditingSubtitleTextareaProps {
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onClick?: (event: MouseEvent<HTMLTextAreaElement>) => void;
  className?: string;
  rows?: number;
}

export function EditingSubtitleTextarea({
  value,
  onChange,
  onClick,
  className,
  rows = 3,
}: EditingSubtitleTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, []);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onClick={onClick}
      className={className}
      rows={rows}
    />
  );
}
