import { put, del } from "@vercel/blob";

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export async function uploadVideo(file: File): Promise<{ url: string }> {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type as (typeof ALLOWED_VIDEO_TYPES)[number])) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_VIDEO_TYPES.join(", ")}`,
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${file.size} bytes. Maximum allowed: ${MAX_FILE_SIZE} bytes`,
    );
  }

  const blob = await put(file.name, file, { access: "public" });
  return { url: blob.url };
}

export async function deleteVideo(url: string): Promise<void> {
  await del(url);
}
