import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubtitleOverlay } from "./SubtitleOverlay";
import type { Subtitle } from "@/types/subtitle";

const subtitles: Subtitle[] = [
  { index: 1, startTime: 1000, endTime: 4000, text: "Primeira legenda" },
  { index: 2, startTime: 5000, endTime: 8000, text: "Segunda legenda" },
];

describe("SubtitleOverlay", () => {
  it("shows active subtitle for current time", () => {
    render(<SubtitleOverlay subtitles={subtitles} currentTime={2000} />);
    expect(screen.getByText("Primeira legenda")).toBeInTheDocument();
  });

  it("shows second subtitle when time is in range", () => {
    render(<SubtitleOverlay subtitles={subtitles} currentTime={6000} />);
    expect(screen.getByText("Segunda legenda")).toBeInTheDocument();
  });

  it("shows nothing when no subtitle is active", () => {
    const { container } = render(
      <SubtitleOverlay subtitles={subtitles} currentTime={4500} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows nothing for empty subtitles", () => {
    const { container } = render(
      <SubtitleOverlay subtitles={[]} currentTime={2000} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows subtitle at exact start time", () => {
    render(<SubtitleOverlay subtitles={subtitles} currentTime={1000} />);
    expect(screen.getByText("Primeira legenda")).toBeInTheDocument();
  });

  it("shows subtitle at exact end time", () => {
    render(<SubtitleOverlay subtitles={subtitles} currentTime={4000} />);
    expect(screen.getByText("Primeira legenda")).toBeInTheDocument();
  });

  it("renders at bottom-12 when no anchor is set (default position)", () => {
    render(<SubtitleOverlay subtitles={subtitles} currentTime={2000} />);
    const paragraph = screen.getByText("Primeira legenda");
    const wrapper = paragraph.parentElement as HTMLElement;
    expect(wrapper.className).toContain("bottom-12");
  });

  it("positions paragraph via inline left/top when style.anchor is set", () => {
    const style = {
      fontFamily: "Manrope",
      fontSize: 24,
      fontWeight: "700" as const,
      fontColor: "#FFFFFF",
      backgroundColor: "#00000080",
      position: "bottom" as const,
      anchor: { xPercent: 30, yPercent: 70 },
    };
    render(
      <SubtitleOverlay
        subtitles={subtitles}
        currentTime={2000}
        style={style}
      />
    );
    const paragraph = screen.getByText("Primeira legenda") as HTMLElement;
    expect(paragraph.style.left).toBe("30%");
    expect(paragraph.style.top).toBe("70%");
  });

  it("uses pointer-events-none when draggable is false (default)", () => {
    const { container } = render(
      <SubtitleOverlay subtitles={subtitles} currentTime={2000} />
    );
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain("pointer-events-none");
  });

  it("uses pointer-events-auto on paragraph and cursor-grab when draggable is true", () => {
    render(
      <SubtitleOverlay
        subtitles={subtitles}
        currentTime={2000}
        draggable
      />
    );
    const paragraph = screen.getByText("Primeira legenda") as HTMLElement;
    expect(paragraph.className).toContain("pointer-events-auto");
    expect(paragraph.className).toContain("cursor-grab");
  });
});
