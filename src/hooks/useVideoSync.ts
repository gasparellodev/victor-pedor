"use client";

import { useEffect, useState } from "react";

export function useVideoSync(
  videoRef: React.RefObject<HTMLVideoElement | null>
): number {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    let raf = 0;

    function tick() {
      const video = videoRef.current;
      if (video) setCurrentTime(video.currentTime * 1000);
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [videoRef]);

  return currentTime;
}
