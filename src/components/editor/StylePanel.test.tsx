import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StylePanel } from "./StylePanel";
import { DEFAULT_SUBTITLE_STYLE } from "@/lib/subtitle-style/presets";
import type { SubtitleStyle } from "@/lib/subtitle-style/types";

function renderStylePanel(overrides: Partial<SubtitleStyle> = {}, extra?: {
  onReformatAll?: () => void;
}) {
  const onUpdate = vi.fn();
  const { onReformatAll } = extra ?? {};
  render(
    <StylePanel
      style={{ ...DEFAULT_SUBTITLE_STYLE, ...overrides }}
      onUpdate={onUpdate}
      onReformatAll={onReformatAll}
    />
  );
  return { onUpdate };
}

describe("StylePanel — format section", () => {
  it("renders the char-limit slider with the default value 42", () => {
    renderStylePanel();
    const slider = screen.getByLabelText(
      "Limite de caracteres por linha"
    ) as HTMLInputElement;
    expect(slider.value).toBe("42");
  });

  it("calls onUpdate with the new maxCharsPerLine when the slider changes", () => {
    const { onUpdate } = renderStylePanel();
    const slider = screen.getByLabelText(
      "Limite de caracteres por linha"
    ) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "32" } });
    expect(onUpdate).toHaveBeenCalledWith({ maxCharsPerLine: 32 });
  });

  it("toggles between 1 and 2 lines", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderStylePanel({ maxLines: 2 });
    await user.click(screen.getByRole("button", { name: "1" }));
    expect(onUpdate).toHaveBeenCalledWith({ maxLines: 1 });
  });

  it("does not render the Reformatar todas button when onReformatAll is omitted", () => {
    renderStylePanel();
    expect(
      screen.queryByRole("button", { name: /reformatar todas/i })
    ).toBeNull();
  });

  it("renders the Reformatar todas button and calls onReformatAll when clicked", async () => {
    const user = userEvent.setup();
    const onReformatAll = vi.fn();
    renderStylePanel({}, { onReformatAll });
    await user.click(
      screen.getByRole("button", { name: /reformatar todas/i })
    );
    expect(onReformatAll).toHaveBeenCalledTimes(1);
  });

  it("renders 42 as default when maxCharsPerLine is undefined on the style", () => {
    renderStylePanel({ maxCharsPerLine: undefined });
    const slider = screen.getByLabelText(
      "Limite de caracteres por linha"
    ) as HTMLInputElement;
    expect(slider.value).toBe("42");
  });
});
