import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVideoSync } from "./useVideoSync";

let rafCallbacks: FrameRequestCallback[] = [];
let rafIdCounter = 0;
const cancelledIds = new Set<number>();

function flushRaf() {
  const callbacks = rafCallbacks;
  rafCallbacks = [];
  for (const cb of callbacks) {
    cb(performance.now());
  }
}

function makeMockVideo(currentTimeSeconds: number): HTMLVideoElement {
  return { currentTime: currentTimeSeconds } as unknown as HTMLVideoElement;
}

describe("useVideoSync", () => {
  beforeEach(() => {
    rafCallbacks = [];
    rafIdCounter = 0;
    cancelledIds.clear();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafIdCounter += 1;
      const id = rafIdCounter;
      if (!cancelledIds.has(id)) rafCallbacks.push(cb);
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      cancelledIds.add(id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts at 0 before any frame fires", () => {
    const ref = { current: null as HTMLVideoElement | null };
    const { result } = renderHook(() => useVideoSync(ref));
    expect(result.current).toBe(0);
  });

  it("returns currentTime in milliseconds when ref is set at mount", () => {
    const ref = { current: makeMockVideo(2.5) };
    const { result } = renderHook(() => useVideoSync(ref));

    act(() => flushRaf());

    expect(result.current).toBe(2500);
  });

  it("picks up the video element when it is attached AFTER mount", () => {
    // This is the regression we are guarding against:
    // VideoPlayer mounts conditionally after `video` is fetched, so the hook
    // is mounted while ref.current is still null. The rAF loop must keep
    // running and pick up the element once it's attached.
    const ref = { current: null as HTMLVideoElement | null };
    const { result } = renderHook(() => useVideoSync(ref));

    // Several frames pass while ref is still null — currentTime stays 0.
    act(() => flushRaf());
    act(() => flushRaf());
    expect(result.current).toBe(0);

    // Video element becomes available (e.g. <video> just rendered).
    ref.current = makeMockVideo(1.25);

    act(() => flushRaf());

    expect(result.current).toBe(1250);
  });

  it("tracks currentTime updates across frames", () => {
    const video = makeMockVideo(0);
    const ref = { current: video };
    const { result } = renderHook(() => useVideoSync(ref));

    act(() => flushRaf());
    expect(result.current).toBe(0);

    video.currentTime = 0.5;
    act(() => flushRaf());
    expect(result.current).toBe(500);

    video.currentTime = 3;
    act(() => flushRaf());
    expect(result.current).toBe(3000);
  });

  it("cancels the rAF loop on unmount", () => {
    const ref = { current: makeMockVideo(0) };
    const { unmount } = renderHook(() => useVideoSync(ref));

    act(() => flushRaf());
    const queuedAfterFirstFrame = rafCallbacks.length;
    expect(queuedAfterFirstFrame).toBeGreaterThan(0);

    unmount();
    rafCallbacks = [];
    // After unmount, nothing should re-queue itself.
    flushRaf();
    expect(rafCallbacks.length).toBe(0);
  });
});
