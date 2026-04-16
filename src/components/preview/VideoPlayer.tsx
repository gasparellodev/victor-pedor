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
      className="w-full rounded-lg"
      preload="metadata"
    >
      <track kind="captions" />
      Seu navegador não suporta vídeo.
    </video>
  );
}
