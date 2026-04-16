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
});
