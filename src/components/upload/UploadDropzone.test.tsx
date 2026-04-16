import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UploadDropzone } from "./UploadDropzone";

describe("UploadDropzone", () => {
  it("renders upload instructions", () => {
    render(<UploadDropzone onFileSelect={vi.fn()} />);
    expect(
      screen.getByText(/Arraste o vídeo aqui/)
    ).toBeInTheDocument();
  });

  it("shows accepted formats", () => {
    render(<UploadDropzone onFileSelect={vi.fn()} />);
    expect(screen.getByText(/MP4, WebM ou QuickTime/)).toBeInTheDocument();
  });

  it("calls onFileSelect with valid file", async () => {
    const onFileSelect = vi.fn();
    const user = userEvent.setup();

    render(<UploadDropzone onFileSelect={onFileSelect} />);

    const input = screen.getByLabelText("Selecionar vídeo");
    const file = new File(["video"], "test.mp4", { type: "video/mp4" });

    await user.upload(input, file);

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it("shows error for invalid file type via drop", () => {
    render(<UploadDropzone onFileSelect={vi.fn()} />);

    const dropzone = screen.getByRole("button");
    const file = new File(["doc"], "test.pdf", { type: "application/pdf" });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/Tipo de arquivo inválido/);
  });

  it("is disabled when disabled prop is true", () => {
    render(<UploadDropzone onFileSelect={vi.fn()} disabled />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("opacity-50");
  });
});
