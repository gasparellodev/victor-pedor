import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getVideoById } from "@/lib/db/videos";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RANGE_REGEX = /^bytes=(\d+)-(\d*)$/;

interface ParsedRange {
  start: number;
  end: number;
}

type RangeParseResult =
  | { ok: true; range: ParsedRange }
  | { ok: false; reason: "malformed" | "unsatisfiable" };

function parseRange(header: string, size: number): RangeParseResult {
  const match = RANGE_REGEX.exec(header.trim());
  if (!match) return { ok: false, reason: "malformed" };

  const start = parseInt(match[1], 10);
  const end = match[2] === "" ? size - 1 : parseInt(match[2], 10);

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    start < 0 ||
    start >= size ||
    end < start ||
    end >= size
  ) {
    return { ok: false, reason: "unsatisfiable" };
  }

  return { ok: true, range: { start, end } };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
    }

    const video = await getVideoById(id);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const blobResult = await get(video.blobUrl, { access: "private" });

    if (!blobResult || !blobResult.stream) {
      return NextResponse.json({ error: "Video file not found" }, { status: 404 });
    }

    const contentType = blobResult.blob.contentType ?? "video/mp4";
    const size = blobResult.blob.size;
    const downloadUrl = blobResult.blob.downloadUrl;

    const rangeHeader = request.headers.get("range");

    if (rangeHeader && size) {
      const parsed = parseRange(rangeHeader, size);

      if (!parsed.ok) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}` },
        });
      }

      const { start, end } = parsed.range;
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      const upstream = await fetch(downloadUrl, {
        headers: {
          Range: `bytes=${start}-${end}`,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const headers: Record<string, string> = {
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      };

      const upstreamLen = upstream.headers.get("content-length");
      if (upstreamLen) headers["Content-Length"] = upstreamLen;

      const upstreamRange = upstream.headers.get("content-range");
      if (upstream.status === 206 && upstreamRange) {
        headers["Content-Range"] = upstreamRange;
      }

      return new Response(upstream.body, {
        status: upstream.status === 206 ? 206 : 200,
        headers,
      });
    }

    return new Response(blobResult.stream as ReadableStream, {
      headers: {
        "Content-Type": contentType,
        ...(size ? { "Content-Length": size.toString() } : {}),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stream failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
