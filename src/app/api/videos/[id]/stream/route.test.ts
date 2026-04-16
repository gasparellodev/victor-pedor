import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { get } from "@vercel/blob";
import { getVideoById } from "@/lib/db/videos";

vi.mock("@vercel/blob", () => ({
  get: vi.fn(),
}));

vi.mock("@/lib/db/videos", () => ({
  getVideoById: vi.fn(),
}));

const VALID_UUID = "eb9f304a-cce2-4715-8866-2352f7cf10d9";
const SIZE = 5_000_000;
const DOWNLOAD_URL = "https://blob.vercel-storage.com/video.mp4?token=signed";

function makeReq(headers: Record<string, string> = {}) {
  return new Request(`http://localhost/api/videos/${VALID_UUID}/stream`, {
    headers,
  });
}

function makeParams() {
  return { params: Promise.resolve({ id: VALID_UUID }) };
}

function mockBlobResult() {
  vi.mocked(getVideoById).mockResolvedValue({
    id: VALID_UUID,
    title: "test.mp4",
    blobUrl: "blob://video.mp4",
    thumbnailUrl: null,
    durationMs: 100_000,
    status: "ready",
    transcriptId: null,
    subtitles: null,
    subtitleStyle: null,
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  vi.mocked(get).mockResolvedValue({
    stream: new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.close();
      },
    }),
    blob: {
      url: "https://blob.vercel-storage.com/video.mp4",
      downloadUrl: DOWNLOAD_URL,
      pathname: "video.mp4",
      contentType: "video/mp4",
      contentDisposition: "inline",
      size: SIZE,
      uploadedAt: new Date(),
    },
  } as Awaited<ReturnType<typeof get>>);
}

describe("GET /api/videos/[id]/stream", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBlobResult();
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  it("responds 200 with Accept-Ranges when no Range header is sent", async () => {
    const res = await GET(makeReq(), makeParams());

    expect(res.status).toBe(200);
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    expect(res.headers.get("Content-Type")).toBe("video/mp4");
    expect(res.headers.get("Content-Length")).toBe(String(SIZE));
  });

  it("forwards upstream 206 verbatim (status, Content-Length, Content-Range from upstream)", async () => {
    const start = 0;
    const end = 1023;
    const expectedLen = end - start + 1;

    fetchSpy.mockResolvedValue(
      new Response(new Uint8Array(expectedLen), {
        status: 206,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": String(expectedLen),
          "Content-Range": `bytes ${start}-${end}/${SIZE}`,
        },
      })
    );

    const res = await GET(
      makeReq({ Range: `bytes=${start}-${end}` }),
      makeParams()
    );

    expect(res.status).toBe(206);
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    expect(res.headers.get("Content-Range")).toBe(`bytes ${start}-${end}/${SIZE}`);
    expect(res.headers.get("Content-Length")).toBe(String(expectedLen));
    expect(res.headers.get("Content-Type")).toBe("video/mp4");

    expect(fetchSpy).toHaveBeenCalledWith(
      DOWNLOAD_URL,
      expect.objectContaining({
        headers: expect.objectContaining({ Range: `bytes=${start}-${end}` }),
      })
    );

    const body = await res.arrayBuffer();
    expect(body.byteLength).toBe(expectedLen);
  });

  it("forwards the Vercel Blob token in the upstream Range fetch", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_token_xyz";
    fetchSpy.mockResolvedValue(
      new Response(new Uint8Array(1024), {
        status: 206,
        headers: {
          "Content-Length": "1024",
          "Content-Range": `bytes 0-1023/${SIZE}`,
        },
      })
    );

    await GET(makeReq({ Range: "bytes=0-1023" }), makeParams());

    expect(fetchSpy).toHaveBeenCalledWith(
      DOWNLOAD_URL,
      expect.objectContaining({
        headers: expect.objectContaining({
          Range: "bytes=0-1023",
          Authorization: "Bearer vercel_blob_token_xyz",
        }),
      })
    );

    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  it("falls back to 200 when upstream ignores Range and returns the full body", async () => {
    fetchSpy.mockResolvedValue(
      new Response(new Uint8Array(SIZE), {
        status: 200,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": String(SIZE),
        },
      })
    );

    const res = await GET(
      makeReq({ Range: `bytes=0-1023` }),
      makeParams()
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    expect(res.headers.get("Content-Length")).toBe(String(SIZE));
    expect(res.headers.get("Content-Range")).toBeNull();
  });

  it("treats open-ended ranges (bytes=N-) as N to size-1", async () => {
    const start = 1_000_000;
    const expectedEnd = SIZE - 1;
    const expectedLen = expectedEnd - start + 1;

    fetchSpy.mockResolvedValue(
      new Response(new Uint8Array(expectedLen), {
        status: 206,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": String(expectedLen),
          "Content-Range": `bytes ${start}-${expectedEnd}/${SIZE}`,
        },
      })
    );

    const res = await GET(
      makeReq({ Range: `bytes=${start}-` }),
      makeParams()
    );

    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Range")).toBe(
      `bytes ${start}-${expectedEnd}/${SIZE}`
    );
    expect(res.headers.get("Content-Length")).toBe(String(expectedLen));
    expect(fetchSpy).toHaveBeenCalledWith(
      DOWNLOAD_URL,
      expect.objectContaining({
        headers: expect.objectContaining({
          Range: `bytes=${start}-${expectedEnd}`,
        }),
      })
    );
  });

  it("returns 416 when the requested range is unsatisfiable", async () => {
    const res = await GET(
      makeReq({ Range: `bytes=${SIZE + 100}-${SIZE + 200}` }),
      makeParams()
    );

    expect(res.status).toBe(416);
    expect(res.headers.get("Content-Range")).toBe(`bytes */${SIZE}`);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects malformed Range headers with 416", async () => {
    const res = await GET(
      makeReq({ Range: "bananas=1-2" }),
      makeParams()
    );

    expect(res.status).toBe(416);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns 400 for non-UUID ids without touching the blob store", async () => {
    const req = new Request("http://localhost/api/videos/not-a-uuid/stream");
    const params = { params: Promise.resolve({ id: "not-a-uuid" }) };

    const res = await GET(req, params);

    expect(res.status).toBe(400);
    expect(getVideoById).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });

  it("returns 404 when the video record is missing", async () => {
    vi.mocked(getVideoById).mockResolvedValue(null);

    const res = await GET(makeReq(), makeParams());

    expect(res.status).toBe(404);
  });
});
