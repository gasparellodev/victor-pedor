import { AssemblyAI } from "assemblyai";
import { get } from "@vercel/blob";
import type { Subtitle } from "@/types/subtitle";

export interface TranscribedWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptionStatus {
  status: "queued" | "processing" | "completed" | "error";
  words?: TranscribedWord[];
  error?: string;
}

const PAUSE_THRESHOLD_MS = 500;
const MAX_WORDS_PER_SUBTITLE = 10;
const SENTENCE_ENDINGS = /[.!?]$/;

function getClient(): AssemblyAI {
  return new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });
}

export async function submitTranscription(audioUrl: string): Promise<string> {
  const client = getClient();

  // Download video from private Blob store using authenticated SDK
  const blobResult = await get(audioUrl, { access: "private" });
  if (!blobResult) {
    throw new Error("Failed to fetch video from storage: not found");
  }

  // Read stream into buffer
  if (!blobResult.stream) {
    throw new Error("Failed to read video stream from storage");
  }
  const reader = blobResult.stream.getReader();
  const chunks: Uint8Array[] = [];
  let done = false;
  while (!done) {
    const result = await reader.read();
    done = result.done;
    if (result.value) chunks.push(result.value);
  }
  const buffer = Buffer.concat(chunks);

  const uploadUrl = await client.files.upload(Buffer.from(buffer));

  const transcript = await client.transcripts.transcribe({
    audio_url: uploadUrl,
    language_code: "pt",
    speech_models: ["universal-3-pro"],
  });
  return transcript.id;
}

export async function checkTranscriptionStatus(
  transcriptId: string
): Promise<TranscriptionStatus> {
  const client = getClient();
  const transcript = await client.transcripts.get(transcriptId);

  if (transcript.status === "error") {
    return {
      status: "error",
      error: transcript.error ?? "Unknown transcription error",
    };
  }

  if (transcript.status === "completed" && transcript.words) {
    return {
      status: "completed",
      words: transcript.words.map((w) => ({
        text: w.text,
        start: w.start,
        end: w.end,
        confidence: w.confidence,
      })),
    };
  }

  return { status: transcript.status as "queued" | "processing" };
}

export function wordsToSubtitles(words: TranscribedWord[]): Subtitle[] {
  if (words.length === 0) return [];

  const subtitles: Subtitle[] = [];
  let currentWords: TranscribedWord[] = [words[0]];

  for (let i = 1; i < words.length; i++) {
    const prev = words[i - 1];
    const curr = words[i];

    const hasLongPause = curr.start - prev.end > PAUSE_THRESHOLD_MS;
    const prevEndsSentence = SENTENCE_ENDINGS.test(prev.text);
    const atWordLimit = currentWords.length >= MAX_WORDS_PER_SUBTITLE;

    if (hasLongPause || prevEndsSentence || atWordLimit) {
      subtitles.push(buildSubtitle(currentWords, subtitles.length + 1));
      currentWords = [curr];
    } else {
      currentWords.push(curr);
    }
  }

  if (currentWords.length > 0) {
    subtitles.push(buildSubtitle(currentWords, subtitles.length + 1));
  }

  return subtitles;
}

function buildSubtitle(words: TranscribedWord[], index: number): Subtitle {
  return {
    index,
    startTime: words[0].start,
    endTime: words[words.length - 1].end,
    text: words.map((w) => w.text).join(" "),
  };
}
