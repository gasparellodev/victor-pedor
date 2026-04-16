import Anthropic from "@anthropic-ai/sdk";
import type { Subtitle } from "@/types/subtitle";
import { SYSTEM_PROMPT, buildCorrectionPrompt } from "./prompts";

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

interface CorrectedEntry {
  index: number;
  text: string;
}

export async function correctSubtitles(
  subtitles: Subtitle[]
): Promise<Subtitle[]> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildCorrectionPrompt(subtitles),
      },
    ],
  });

  const textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Strip markdown code fences if Claude wraps response in ```json ... ```
  let rawText = textBlock.text.trim();
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  let corrected: CorrectedEntry[];
  try {
    corrected = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Failed to parse Claude response as JSON: ${rawText.slice(0, 200)}`
    );
  }

  if (!Array.isArray(corrected)) {
    throw new Error("Claude response is not an array");
  }

  if (corrected.length !== subtitles.length) {
    throw new Error(
      `Correction subtitle count mismatch: expected ${subtitles.length}, got ${corrected.length}`
    );
  }

  return subtitles.map((original, i) => ({
    ...original,
    text: corrected[i].text,
  }));
}
