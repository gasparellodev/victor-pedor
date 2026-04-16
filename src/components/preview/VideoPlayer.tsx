"use client";

import type { RefObject } from "react";

interface VideoPlayerProps {
  src: string;
  videoRef: RefObject<HTMLVideoElement | null>;
}

export function VideoPlayer({ src, videoRef }: VideoPlayerProps) {
  return (
    <video
      ref={videoRef}
      src={src}
      controls
      className="w-full rounded-xl border border-[var(--border-subtle)] bg-black"
      preload="metadata"
    >
      <track kind="captions" />
    </video>
  );
}
