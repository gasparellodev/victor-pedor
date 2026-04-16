import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAutoScroll } from "./useAutoScroll";

function createMockContainer(children: HTMLElement[] = []) {
  const container = document.createElement("div");
  Object.defineProperty(container, "clientWidth", { value: 400, writable: true });

  container.scrollTo = vi.fn();

  for (const child of children) {
    container.appendChild(child);
  }

  container.querySelector = vi.fn((selector: string) => {
    const match = selector.match(/\[data-index="(\d+)"\]/);
    if (!match) return null;
    const index = parseInt(match[1], 10);
    return children[index] ?? null;
  }) as unknown as typeof container.querySelector;

  return container;
}

function createMockChild(opts: { offsetLeft?: number; offsetWidth?: number } = {}) {
  const el = document.createElement("div");
  el.scrollIntoView = vi.fn();
  Object.defineProperty(el, "offsetLeft", { value: opts.offsetLeft ?? 0, writable: true });
  Object.defineProperty(el, "offsetWidth", { value: opts.offsetWidth ?? 100, writable: true });
  return el;
}

describe("useAutoScroll", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing when activeIndex is null", () => {
    const child = createMockChild();
    const container = createMockContainer([child]);
    const containerRef = { current: container };

    renderHook(() =>
      useAutoScroll({ activeIndex: null, containerRef })
    );

    expect(child.scrollIntoView).not.toHaveBeenCalled();
    expect(container.scrollTo).not.toHaveBeenCalled();
  });

  it("does nothing when containerRef.current is null", () => {
    const containerRef = { current: null };

    // Should not throw
    renderHook(() =>
      useAutoScroll({ activeIndex: 0, containerRef })
    );
  });

  it("calls scrollIntoView on the correct child for vertical direction", () => {
    const child0 = createMockChild();
    const child1 = createMockChild();
    const container = createMockContainer([child0, child1]);
    const containerRef = { current: container };

    renderHook(() =>
      useAutoScroll({
        activeIndex: 1,
        containerRef,
        direction: "vertical",
      })
    );

    expect(child1.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "nearest",
    });
    expect(child0.scrollIntoView).not.toHaveBeenCalled();
  });

  it("calls scrollTo on container for horizontal direction", () => {
    const child0 = createMockChild({ offsetLeft: 0, offsetWidth: 100 });
    const child1 = createMockChild({ offsetLeft: 200, offsetWidth: 120 });
    const container = createMockContainer([child0, child1]);
    const containerRef = { current: container };

    renderHook(() =>
      useAutoScroll({
        activeIndex: 1,
        containerRef,
        direction: "horizontal",
      })
    );

    // expected left = offsetLeft - containerWidth/2 + offsetWidth/2
    // = 200 - 200 + 60 = 60
    expect(container.scrollTo).toHaveBeenCalledWith({
      left: 60,
      behavior: "smooth",
    });
  });

  it("re-triggers scroll when activeIndex changes", () => {
    const child0 = createMockChild();
    const child1 = createMockChild();
    const container = createMockContainer([child0, child1]);
    const containerRef = { current: container };

    const { rerender } = renderHook(
      ({ activeIndex }: { activeIndex: number | null }) =>
        useAutoScroll({ activeIndex, containerRef, direction: "vertical" }),
      { initialProps: { activeIndex: 0 as number | null } }
    );

    expect(child0.scrollIntoView).toHaveBeenCalledTimes(1);

    rerender({ activeIndex: 1 });

    expect(child1.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("defaults to smooth behavior and vertical direction", () => {
    const child = createMockChild();
    const container = createMockContainer([child]);
    const containerRef = { current: container };

    renderHook(() =>
      useAutoScroll({ activeIndex: 0, containerRef })
    );

    expect(child.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "nearest",
    });
  });
});
