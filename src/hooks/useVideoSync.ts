"use client";

import { useEffect, useRef, useState } from "react";

export function useVideoSync(
  videoRef: React.RefObject<HTMLVideoElement | null>
): number {
  const [currentTime, setCurrentTime] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function tick() {
      if (video) {
        setCurrentTime(video.currentTime * 1000); // convert to ms
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [videoRef]);

  return currentTime;
}
