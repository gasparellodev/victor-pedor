import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditingSubtitleTextarea } from "./EditingSubtitleTextarea";

describe("EditingSubtitleTextarea", () => {
  it("focuses the textarea and positions caret at end on mount", () => {
    render(<EditingSubtitleTextarea value="hello" onChange={() => {}} />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;

    expect(document.activeElement).toBe(textarea);
    expect(textarea.selectionStart).toBe(5);
    expect(textarea.selectionEnd).toBe(5);
  });

  it("does not re-run the focus effect on parent re-renders", () => {
    const { rerender } = render(
      <EditingSubtitleTextarea value="hello" onChange={() => {}} />
    );
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;

    textarea.setSelectionRange(2, 2);
    rerender(<EditingSubtitleTextarea value="hello" onChange={() => {}} />);

    expect(textarea.selectionStart).toBe(2);
    expect(textarea.selectionEnd).toBe(2);
  });

  it("keeps typed characters contiguous when typing in the middle", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [value, setValue] = useState("abcdef");
      return (
        <EditingSubtitleTextarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      );
    }

    render(<Harness />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;

    textarea.setSelectionRange(3, 3);
    await user.keyboard("XY");

    expect(textarea.value).toBe("abcXYdef");
  });

  it("fires onChange when the user types", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState("abc");
      return (
        <EditingSubtitleTextarea
          value={value}
          onChange={(e) => {
            onChange(e);
            setValue(e.target.value);
          }}
        />
      );
    }

    render(<Harness />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;

    await user.type(textarea, "d");

    expect(textarea.value).toBe("abcd");
    expect(onChange).toHaveBeenCalled();
  });
});
