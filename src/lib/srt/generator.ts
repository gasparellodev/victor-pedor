import type { Subtitle } from "@/types/subtitle";

function formatTimestamp(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;

  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0") +
    "," +
    String(millis).padStart(3, "0")
  );
}

export function generateSrt(subtitles: Subtitle[]): string {
  if (subtitles.length === 0) {
    return "";
  }

  return (
    subtitles
      .map((sub, i) => {
        const index = i + 1;
        const start = formatTimestamp(sub.startTime);
        const end = formatTimestamp(sub.endTime);
        return `${index}\n${start} --> ${end}\n${sub.text}`;
      })
      .join("\n\n") + "\n"
  );
}
