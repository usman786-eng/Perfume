import { useEffect, useRef } from 'react';

export default function MotionPlate({
  src,
  poster,
  className = '',
  ariaLabel,
}: {
  src: string;
  poster?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // Muted must be set as an IDL property, not just the JSX attribute —
    // mobile browsers (notably iOS) ignore the attribute and then block
    // autoplay as "unmuted". Set it imperatively before any play() call.
    video.muted = true;
    video.defaultMuted = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const start = () => {
      // Upgrade from preload="none" only once, the first time the plate
      // nears the viewport — keeps ~28MB of motion off the initial load.
      if (video.preload === 'none') {
        video.preload = 'metadata';
        video.load();
      }
      video.play().catch(() => undefined);
    };
    if (typeof IntersectionObserver === 'undefined') {
      start();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start();
        } else {
          video.pause();
        }
      },
      { threshold: 0.05, rootMargin: '240px' }
    );
    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      loop
      muted
      playsInline
      preload="none"
      disablePictureInPicture
      aria-label={ariaLabel}
    />
  );
}