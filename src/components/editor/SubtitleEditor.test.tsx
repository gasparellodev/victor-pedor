import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubtitleEditor } from "./SubtitleEditor";
import type { Subtitle } from "@/types/subtitle";

const subtitles: Subtitle[] = [
  { index: 1, startTime: 1000, endTime: 4000, text: "Primeira legenda" },
  { index: 2, startTime: 5000, endTime: 8000, text: "Segunda legenda" },
];

describe("SubtitleEditor", () => {
  it("renders all subtitles", () => {
    render(
      <SubtitleEditor subtitles={subtitles} dispatch={vi.fn()} />
    );

    expect(screen.getByDisplayValue("Primeira legenda")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Segunda legenda")).toBeInTheDocument();
  });

  it("shows empty message when no subtitles", () => {
    render(<SubtitleEditor subtitles={[]} dispatch={vi.fn()} />);

    expect(screen.getByText(/Nenhuma legenda/)).toBeInTheDocument();
  });

  it("renders toolbar", () => {
    render(
      <SubtitleEditor subtitles={subtitles} dispatch={vi.fn()} />
    );

    expect(screen.getByText("Aplicar")).toBeInTheDocument();
  });

  it("renders action buttons for each row", () => {
    render(
      <SubtitleEditor subtitles={subtitles} dispatch={vi.fn()} />
    );

    const deleteButtons = screen.getAllByTitle("Excluir legenda");
    expect(deleteButtons).toHaveLength(2);
  });
});
