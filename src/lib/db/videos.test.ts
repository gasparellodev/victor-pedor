import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Subtitle } from "@/types/subtitle";

const mockQuery = vi.fn();
const mockSql = Object.assign(vi.fn(), { query: mockQuery });

vi.mock("@neondatabase/serverless", () => ({
  neon: () => mockSql,
}));

vi.stubEnv("POSTGRES_URL", "postgres://test:test@localhost:5432/test");

const {
  createVideo,
  listVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  initializeDatabase,
} = await import("./videos");

const { mapRowToVideo, CREATE_TABLE_SQL } = await import("./schema");

const mockVideoRow = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "test-video.mp4",
  blob_url: "https://blob.vercel-storage.com/test-video.mp4",
  thumbnail_url: null,
  duration_ms: 120000,
  status: "uploading",
  transcript_id: null,
  subtitles: null,
  subtitle_style: null,
  error_message: null,
  created_at: "2026-04-16T08:00:00.000Z",
  updated_at: "2026-04-16T08:00:00.000Z",
};

describe("mapRowToVideo", () => {
  it("maps snake_case DB row to camelCase Video", () => {
    const video = mapRowToVideo(mockVideoRow);

    expect(video.id).toBe(mockVideoRow.id);
    expect(video.title).toBe(mockVideoRow.title);
    expect(video.blobUrl).toBe(mockVideoRow.blob_url);
    expect(video.thumbnailUrl).toBeNull();
    expect(video.durationMs).toBe(120000);
    expect(video.status).toBe("uploading");
    expect(video.transcriptId).toBeNull();
    expect(video.subtitles).toBeNull();
    expect(video.subtitleStyle).toBeNull();
    expect(video.errorMessage).toBeNull();
    expect(video.createdAt).toBeInstanceOf(Date);
    expect(video.updatedAt).toBeInstanceOf(Date);
  });

  it("maps row with populated JSONB fields", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 0, endTime: 3000, text: "Ola" },
    ];
    const subtitleStyle = {
      fontFamily: "Inter",
      fontSize: 24,
      fontColor: "#ffffff",
      backgroundColor: "#00000080",
      position: "bottom" as const,
    };

    const row = {
      ...mockVideoRow,
      status: "ready",
      subtitles,
      subtitle_style: subtitleStyle,
    };

    const video = mapRowToVideo(row);
    expect(video.subtitles).toEqual(subtitles);
    expect(video.subtitleStyle).toEqual(subtitleStyle);
    expect(video.status).toBe("ready");
  });
});

describe("initializeDatabase", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("executes CREATE TABLE SQL", async () => {
    mockQuery.mockResolvedValueOnce([]);
    await initializeDatabase();
    expect(mockQuery).toHaveBeenCalledWith(CREATE_TABLE_SQL);
  });
});

describe("createVideo", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("creates video with required fields", async () => {
    mockQuery.mockResolvedValueOnce([mockVideoRow]);

    const video = await createVideo({
      title: "test-video.mp4",
      blobUrl: "https://blob.vercel-storage.com/test-video.mp4",
    });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO videos"),
      ["test-video.mp4", "https://blob.vercel-storage.com/test-video.mp4", null]
    );
    expect(video.id).toBe(mockVideoRow.id);
    expect(video.title).toBe("test-video.mp4");
  });

  it("creates video with optional durationMs", async () => {
    mockQuery.mockResolvedValueOnce([{ ...mockVideoRow, duration_ms: 60000 }]);

    const video = await createVideo({
      title: "short-video.mp4",
      blobUrl: "https://blob.vercel-storage.com/short.mp4",
      durationMs: 60000,
    });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO videos"),
      ["short-video.mp4", "https://blob.vercel-storage.com/short.mp4", 60000]
    );
    expect(video.durationMs).toBe(60000);
  });

  it("rejects invalid input — empty title", async () => {
    await expect(
      createVideo({
        title: "",
        blobUrl: "https://blob.vercel-storage.com/test.mp4",
      })
    ).rejects.toThrow();
  });

  it("rejects invalid input — invalid URL", async () => {
    await expect(
      createVideo({
        title: "test.mp4",
        blobUrl: "not-a-url",
      })
    ).rejects.toThrow();
  });
});

describe("listVideos", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("returns all videos ordered by created_at DESC", async () => {
    const row2 = {
      ...mockVideoRow,
      id: "660e8400-e29b-41d4-a716-446655440001",
      title: "second-video.mp4",
      created_at: "2026-04-16T09:00:00.000Z",
    };
    mockQuery.mockResolvedValueOnce([row2, mockVideoRow]);

    const videos = await listVideos();

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("ORDER BY created_at DESC")
    );
    expect(videos).toHaveLength(2);
    expect(videos[0].title).toBe("second-video.mp4");
    expect(videos[1].title).toBe("test-video.mp4");
  });

  it("returns empty array when no videos exist", async () => {
    mockQuery.mockResolvedValueOnce([]);
    const videos = await listVideos();
    expect(videos).toEqual([]);
  });
});

describe("getVideoById", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("returns video when found", async () => {
    mockQuery.mockResolvedValueOnce([mockVideoRow]);

    const video = await getVideoById(mockVideoRow.id);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("WHERE id = $1"),
      [mockVideoRow.id]
    );
    expect(video).not.toBeNull();
    expect(video!.id).toBe(mockVideoRow.id);
  });

  it("returns null when not found", async () => {
    mockQuery.mockResolvedValueOnce([]);

    const video = await getVideoById("nonexistent-id");
    expect(video).toBeNull();
  });
});

describe("updateVideo", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("updates status field", async () => {
    const updatedRow = { ...mockVideoRow, status: "transcribing" };
    mockQuery.mockResolvedValueOnce([updatedRow]);

    const video = await updateVideo(mockVideoRow.id, {
      status: "transcribing",
    });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("status = $1"),
      ["transcribing", mockVideoRow.id]
    );
    expect(video!.status).toBe("transcribing");
  });

  it("updates multiple fields at once", async () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 0, endTime: 3000, text: "Ola" },
    ];
    const updatedRow = {
      ...mockVideoRow,
      status: "ready",
      subtitles,
    };
    mockQuery.mockResolvedValueOnce([updatedRow]);

    const video = await updateVideo(mockVideoRow.id, {
      status: "ready",
      subtitles,
    });

    expect(video!.status).toBe("ready");
    expect(video!.subtitles).toEqual(subtitles);
  });

  it("returns null when video not found", async () => {
    mockQuery.mockResolvedValueOnce([]);

    const video = await updateVideo("nonexistent-id", {
      status: "ready",
    });
    expect(video).toBeNull();
  });

  it("returns current video when no fields to update", async () => {
    mockQuery.mockResolvedValueOnce([mockVideoRow]);

    const video = await updateVideo(mockVideoRow.id, {});

    // Should call getVideoById instead of UPDATE
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("SELECT"),
      [mockVideoRow.id]
    );
    expect(video!.id).toBe(mockVideoRow.id);
  });

  it("serializes subtitles as JSON", async () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 0, endTime: 3000, text: "Test" },
    ];
    mockQuery.mockResolvedValueOnce([{ ...mockVideoRow, subtitles }]);

    await updateVideo(mockVideoRow.id, { subtitles });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("subtitles = $1"),
      [JSON.stringify(subtitles), mockVideoRow.id]
    );
  });

  it("serializes subtitleStyle as JSON", async () => {
    const subtitleStyle = {
      fontFamily: "Inter",
      fontSize: 24,
      fontColor: "#ffffff",
      backgroundColor: "#00000080",
      position: "bottom" as const,
    };
    mockQuery.mockResolvedValueOnce([
      { ...mockVideoRow, subtitle_style: subtitleStyle },
    ]);

    await updateVideo(mockVideoRow.id, { subtitleStyle });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("subtitle_style = $"),
      [JSON.stringify(subtitleStyle), mockVideoRow.id]
    );
  });
});

describe("deleteVideo", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("returns true when video is deleted", async () => {
    mockQuery.mockResolvedValueOnce([{ id: mockVideoRow.id }]);

    const result = await deleteVideo(mockVideoRow.id);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM videos WHERE id = $1"),
      [mockVideoRow.id]
    );
    expect(result).toBe(true);
  });

  it("returns false when video not found", async () => {
    mockQuery.mockResolvedValueOnce([]);

    const result = await deleteVideo("nonexistent-id");
    expect(result).toBe(false);
  });
});
