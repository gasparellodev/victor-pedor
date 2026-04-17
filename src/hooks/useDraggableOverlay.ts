"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SubtitleAnchor } from "@/lib/subtitle-style/types";

interface UseDraggableOverlayOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  initialAnchor?: SubtitleAnchor;
  enabled: boolean;
  onChange?: (anchor: SubtitleAnchor) => void;
}

interface UseDraggableOverlayResult {
  anchor: SubtitleAnchor | null;
  isDragging: boolean;
  onPointerDown: (event: React.PointerEvent) => void;
}

function clampPercent(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function anchorFromEvent(
  container: HTMLElement,
  clientX: number,
  clientY: number
): SubtitleAnchor {
  const rect = container.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return { xPercent: 50, yPercent: 85 };
  }
  return {
    xPercent: clampPercent(((clientX - rect.left) / rect.width) * 100),
    yPercent: clampPercent(((clientY - rect.top) / rect.height) * 100),
  };
}

export function useDraggableOverlay({
  containerRef,
  initialAnchor,
  enabled,
  onChange,
}: UseDraggableOverlayOptions): UseDraggableOverlayResult {
  const [draggedAnchor, setDraggedAnchor] = useState<SubtitleAnchor | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!enabled) return;

    function handleMove(event: PointerEvent) {
      if (!draggingRef.current) return;
      const container = containerRef.current;
      if (!container) return;
      const next = anchorFromEvent(container, event.clientX, event.clientY);
      setDraggedAnchor(next);
      onChangeRef.current?.(next);
    }

    function handleUp() {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setIsDragging(false);
      setDraggedAnchor(null);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [enabled, containerRef]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!enabled) return;
      const container = containerRef.current;
      if (!container) return;
      event.preventDefault();
      draggingRef.current = true;
      setIsDragging(true);
      const next = anchorFromEvent(container, event.clientX, event.clientY);
      setDraggedAnchor(next);
      onChangeRef.current?.(next);
    },
    [enabled, containerRef]
  );

  const anchor = draggedAnchor ?? initialAnchor ?? null;

  return { anchor, isDragging, onPointerDown };
}
