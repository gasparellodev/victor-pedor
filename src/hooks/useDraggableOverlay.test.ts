import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useRef } from "react";
import { useDraggableOverlay } from "./useDraggableOverlay";

function setup({
  enabled = true,
  initialAnchor,
  rect = { left: 0, top: 0, width: 1000, height: 500 },
  onChange,
}: {
  enabled?: boolean;
  initialAnchor?: { xPercent: number; yPercent: number };
  rect?: { left: number; top: number; width: number; height: number };
  onChange?: (a: { xPercent: number; yPercent: number }) => void;
} = {}) {
  const container = document.createElement("div");
  container.getBoundingClientRect = () =>
    ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({}),
    }) as DOMRect;

  const { result } = renderHook(() => {
    const ref = useRef<HTMLDivElement>(container);
    return useDraggableOverlay({
      containerRef: ref,
      enabled,
      initialAnchor,
      onChange,
    });
  });

  return { result, container };
}

function pointerEvent(
  type: "pointermove" | "pointerup" | "pointercancel",
  x: number,
  y: number
) {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, "clientX", { value: x });
  Object.defineProperty(ev, "clientY", { value: y });
  return ev;
}

describe("useDraggableOverlay", () => {
  it("returns initialAnchor when provided", () => {
    const { result } = setup({
      initialAnchor: { xPercent: 25, yPercent: 75 },
    });
    expect(result.current.anchor).toEqual({ xPercent: 25, yPercent: 75 });
    expect(result.current.isDragging).toBe(false);
  });

  it("computes anchor as percentage of container rect on pointer down", () => {
    const onChange = vi.fn();
    const { result } = setup({
      rect: { left: 0, top: 0, width: 1000, height: 500 },
      onChange,
    });

    act(() => {
      result.current.onPointerDown({
        preventDefault: () => {},
        clientX: 500,
        clientY: 250,
      } as unknown as React.PointerEvent);
    });

    expect(result.current.anchor).toEqual({ xPercent: 50, yPercent: 50 });
    expect(result.current.isDragging).toBe(true);
    expect(onChange).toHaveBeenCalledWith({ xPercent: 50, yPercent: 50 });
  });

  it("clamps anchor to 0-100 when pointer is outside the container", () => {
    const { result } = setup({
      rect: { left: 100, top: 100, width: 200, height: 100 },
    });

    act(() => {
      result.current.onPointerDown({
        preventDefault: () => {},
        clientX: 50,
        clientY: 50,
      } as unknown as React.PointerEvent);
    });

    expect(result.current.anchor).toEqual({ xPercent: 0, yPercent: 0 });

    act(() => {
      result.current.onPointerDown({
        preventDefault: () => {},
        clientX: 9999,
        clientY: 9999,
      } as unknown as React.PointerEvent);
    });

    expect(result.current.anchor).toEqual({ xPercent: 100, yPercent: 100 });
  });

  it("updates anchor on pointer move while dragging and stops after pointer up", () => {
    const onChange = vi.fn();
    const { result } = setup({
      rect: { left: 0, top: 0, width: 1000, height: 500 },
      onChange,
    });

    act(() => {
      result.current.onPointerDown({
        preventDefault: () => {},
        clientX: 100,
        clientY: 100,
      } as unknown as React.PointerEvent);
    });

    act(() => {
      window.dispatchEvent(pointerEvent("pointermove", 800, 400));
    });
    expect(result.current.anchor).toEqual({ xPercent: 80, yPercent: 80 });
    expect(result.current.isDragging).toBe(true);

    act(() => {
      window.dispatchEvent(pointerEvent("pointerup", 800, 400));
    });
    expect(result.current.isDragging).toBe(false);

    onChange.mockClear();
    act(() => {
      window.dispatchEvent(pointerEvent("pointermove", 200, 200));
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not react when disabled", () => {
    const onChange = vi.fn();
    const { result } = setup({ enabled: false, onChange });

    act(() => {
      result.current.onPointerDown({
        preventDefault: () => {},
        clientX: 500,
        clientY: 250,
      } as unknown as React.PointerEvent);
    });

    expect(result.current.anchor).toBeNull();
    expect(result.current.isDragging).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });
});
