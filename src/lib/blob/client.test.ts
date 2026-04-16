import { describe, it, expect, vi, beforeEach } from "vitest";
import { put, del } from "@vercel/blob";
import {
  uploadVideo,
  deleteVideo,
  ALLOWED_VIDEO_TYPES,
  MAX_FILE_SIZE,
} from "./client";

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
  del: vi.fn(),
}));

function createFile(
  name: string,
  size: number,
  type: string,
): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("uploadVideo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads a valid file and returns the URL", async () => {
    const mockUrl = "https://blob.vercel-storage.com/video-abc123.mp4";
    vi.mocked(put).mockResolvedValue({
      url: mockUrl,
      pathname: "video.mp4",
      contentType: "video/mp4",
      contentDisposition: 'attachment; filename="video.mp4"',
      downloadUrl: mockUrl,
      etag: "abc123",
    });

    const file = createFile("video.mp4", 1024, "video/mp4");
    const result = await uploadVideo(file);

    expect(result).toEqual({ url: mockUrl });
    expect(put).toHaveBeenCalledOnce();
  });

  it("passes access: 'private' option to put", async () => {
    vi.mocked(put).mockResolvedValue({
      url: "https://blob.vercel-storage.com/video.mp4",
      pathname: "video.mp4",
      contentType: "video/mp4",
      contentDisposition: 'attachment; filename="video.mp4"',
      downloadUrl: "https://blob.vercel-storage.com/video.mp4",
      etag: "abc123",
    });

    const file = createFile("video.mp4", 1024, "video/mp4");
    await uploadVideo(file);

    expect(put).toHaveBeenCalledWith(file.name, file, {
      access: "private",
    });
  });

  it("rejects an invalid file type", async () => {
    const file = createFile("doc.pdf", 1024, "application/pdf");

    await expect(uploadVideo(file)).rejects.toThrow(
      "Invalid file type: application/pdf. Allowed types: video/mp4, video/webm, video/quicktime",
    );
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects a file exceeding MAX_FILE_SIZE", async () => {
    const oversized = MAX_FILE_SIZE + 1;
    const file = createFile("big.mp4", oversized, "video/mp4");

    await expect(uploadVideo(file)).rejects.toThrow(
      `File too large: ${oversized} bytes. Maximum allowed: ${MAX_FILE_SIZE} bytes`,
    );
    expect(put).not.toHaveBeenCalled();
  });
});

describe("deleteVideo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls del with the correct URL", async () => {
    vi.mocked(del).mockResolvedValue(undefined);

    const url = "https://blob.vercel-storage.com/video-abc123.mp4";
    await deleteVideo(url);

    expect(del).toHaveBeenCalledWith(url);
    expect(del).toHaveBeenCalledOnce();
  });
});

describe("constants", () => {
  it("has correct ALLOWED_VIDEO_TYPES", () => {
    expect(ALLOWED_VIDEO_TYPES).toEqual([
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ]);
  });

  it("has correct MAX_FILE_SIZE (500MB)", () => {
    expect(MAX_FILE_SIZE).toBe(500 * 1024 * 1024);
  });
});
