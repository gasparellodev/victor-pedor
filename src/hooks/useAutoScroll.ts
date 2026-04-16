import { useEffect, type RefObject } from "react";

interface UseAutoScrollOptions {
  activeIndex: number | null;
  containerRef: RefObject<HTMLElement | null>;
  behavior?: ScrollBehavior;
  direction?: "horizontal" | "vertical";
}

export function useAutoScroll({
  activeIndex,
  containerRef,
  behavior = "smooth",
  direction = "vertical",
}: UseAutoScrollOptions): void {
  useEffect(() => {
    if (activeIndex === null) return;

    const container = containerRef.current;
    if (!container) return;

    const element = container.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`
    );
    if (!element) return;

    if (direction === "vertical") {
      element.scrollIntoView({ behavior, block: "nearest" });
    } else {
      const containerWidth = container.clientWidth;
      const elementOffset = element.offsetLeft;
      const elementWidth = element.offsetWidth;
      const left = elementOffset - containerWidth / 2 + elementWidth / 2;
      container.scrollTo({ left, behavior });
    }
  }, [activeIndex, containerRef, behavior, direction]);
}
