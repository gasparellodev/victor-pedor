const THUMBNAIL_WIDTH = 320;
const THUMBNAIL_HEIGHT = 180;
const THUMBNAIL_QUALITY = 0.8;
const DEFAULT_CAPTURE_TIME = 1;

export async function captureVideoFrame(
  file: File,
  timeSeconds: number = DEFAULT_CAPTURE_TIME
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      // Clamp capture time to video duration
      const captureTime = Math.min(timeSeconds, video.duration);
      video.currentTime = captureTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = THUMBNAIL_WIDTH;
        canvas.height = THUMBNAIL_HEIGHT;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(video, 0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create thumbnail blob"));
            }
          },
          "image/jpeg",
          THUMBNAIL_QUALITY
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load video for thumbnail capture"));
    };
  });
}

export async function uploadThumbnail(
  blob: Blob,
  videoId: string
): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, `thumbnail-${videoId}.jpg`);
  formData.append("videoId", videoId);

  const res = await fetch("/api/thumbnail", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload thumbnail");
  }

  const data = await res.json();
  return data.url;
}
