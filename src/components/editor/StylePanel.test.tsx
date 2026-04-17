import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StylePanel } from "./StylePanel";
import { DEFAULT_SUBTITLE_STYLE } from "@/lib/subtitle-style/presets";
import type { SubtitleStyle } from "@/lib/subtitle-style/types";

function renderStylePanel(
  overrides: Partial<SubtitleStyle> = {},
  extra?: { onReformatAll?: () => void }
) {
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
    await user.click(screen.getByRole("button", { name: "Set maxLines to 1" }));
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

describe("StylePanel — fill section", () => {
  it("renders exactly 3 font color swatches (white, yellow, black)", () => {
    renderStylePanel();
    expect(
      screen.getByRole("button", { name: "Font color #FFFFFF" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Font color #FFD600" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Font color #000000" })
    ).toBeInTheDocument();
  });

  it("sets fontColor to yellow when the yellow swatch is clicked", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderStylePanel({ fontColor: "#FFFFFF" });
    await user.click(
      screen.getByRole("button", { name: "Font color #FFD600" })
    );
    expect(onUpdate).toHaveBeenCalledWith({ fontColor: "#FFD600" });
  });

  it("sets fontColor to black when the black swatch is clicked", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderStylePanel({ fontColor: "#FFFFFF" });
    await user.click(
      screen.getByRole("button", { name: "Font color #000000" })
    );
    expect(onUpdate).toHaveBeenCalledWith({ fontColor: "#000000" });
  });
});

describe("StylePanel — border section", () => {
  it("renders the outline width slider with the default value 2", () => {
    renderStylePanel();
    const slider = screen.getByLabelText("Outline width") as HTMLInputElement;
    expect(slider.value).toBe("2");
  });

  it("calls onUpdate with the new outlineWidth when the slider changes", () => {
    const { onUpdate } = renderStylePanel();
    const slider = screen.getByLabelText("Outline width") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "4" } });
    expect(onUpdate).toHaveBeenCalledWith({ outlineWidth: 4 });
  });

  it("renders 2 outline color swatches (black, white)", () => {
    renderStylePanel();
    expect(
      screen.getByRole("button", { name: "Outline color #000000" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Outline color #FFFFFF" })
    ).toBeInTheDocument();
  });

  it("sets outlineColor to white when the white outline swatch is clicked", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderStylePanel({ outlineColor: "#000000" });
    await user.click(
      screen.getByRole("button", { name: "Outline color #FFFFFF" })
    );
    expect(onUpdate).toHaveBeenCalledWith({ outlineColor: "#FFFFFF" });
  });

  it("background toggle is off when backgroundColor is transparent", () => {
    renderStylePanel({ backgroundColor: "transparent" });
    const toggle = screen.getByRole("switch", {
      name: "Toggle subtitle background",
    });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("background toggle is on when backgroundColor is opaque", () => {
    renderStylePanel({ backgroundColor: "#000000CC" });
    const toggle = screen.getByRole("switch", {
      name: "Toggle subtitle background",
    });
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("enabling the background toggle sets backgroundColor to a default opaque color", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderStylePanel({ backgroundColor: "transparent" });
    await user.click(
      screen.getByRole("switch", { name: "Toggle subtitle background" })
    );
    expect(onUpdate).toHaveBeenCalledWith({ backgroundColor: "#000000CC" });
  });

  it("disabling the background toggle sets backgroundColor to transparent", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderStylePanel({ backgroundColor: "#000000CC" });
    await user.click(
      screen.getByRole("switch", { name: "Toggle subtitle background" })
    );
    expect(onUpdate).toHaveBeenCalledWith({ backgroundColor: "transparent" });
  });
});

describe("StylePanel — position section", () => {
  it("shows '—' in anchor readout when no anchor is set", () => {
    renderStylePanel({ anchor: undefined });
    expect(screen.getByLabelText("Anchor X")).toHaveTextContent("—");
    expect(screen.getByLabelText("Anchor Y")).toHaveTextContent("—");
  });

  it("shows anchor coordinates when anchor is set", () => {
    renderStylePanel({ anchor: { xPercent: 30, yPercent: 70 } });
    expect(screen.getByLabelText("Anchor X")).toHaveTextContent("30%");
    expect(screen.getByLabelText("Anchor Y")).toHaveTextContent("70%");
  });

  it("does not render reset button when no anchor is set", () => {
    renderStylePanel({ anchor: undefined });
    expect(screen.queryByRole("button", { name: /reset position/i })).toBeNull();
  });

  it("renders reset button when anchor is set and clears the anchor on click", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderStylePanel({
      anchor: { xPercent: 30, yPercent: 70 },
    });
    await user.click(screen.getByRole("button", { name: /reset position/i }));
    expect(onUpdate).toHaveBeenCalledWith({ anchor: undefined });
  });
});

describe("StylePanel — collapsible sections", () => {
  it("toggles the Format section when its header is clicked", async () => {
    const user = userEvent.setup();
    renderStylePanel();
    const header = screen.getByRole("button", {
      name: /toggle format section/i,
    });
    const slider = screen.getByLabelText("Limite de caracteres por linha");
    expect(slider).toBeVisible();
    await user.click(header);
    expect(
      screen.queryByLabelText("Limite de caracteres por linha")
    ).toBeNull();
  });
});
