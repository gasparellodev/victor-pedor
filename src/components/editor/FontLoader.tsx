"use client";

import { FONT_PRESETS } from "@/lib/subtitle-style/presets";

const googleFontsUrl = `https://fonts.googleapis.com/css2?${FONT_PRESETS.map(
  (p) => `family=${p.googleFont}`
).join("&")}&display=swap`;

export function FontLoader() {
  return (
    <link rel="stylesheet" href={googleFontsUrl} />
  );
}
