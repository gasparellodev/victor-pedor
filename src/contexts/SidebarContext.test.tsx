import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}

describe("SidebarContext", () => {
  it("defaults collapsed to false", () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.collapsed).toBe(false);
  });

  it("toggle flips collapsed state", () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });

    act(() => {
      result.current.toggle();
    });
    expect(result.current.collapsed).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.collapsed).toBe(false);
  });

  it("setCollapsed sets collapsed to a specific value", () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });

    act(() => {
      result.current.setCollapsed(true);
    });
    expect(result.current.collapsed).toBe(true);

    act(() => {
      result.current.setCollapsed(false);
    });
    expect(result.current.collapsed).toBe(false);
  });

  it("throws when useSidebar is used outside SidebarProvider", () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useSidebar());
    }).toThrow("useSidebar must be used within a SidebarProvider");

    spy.mockRestore();
  });
});
