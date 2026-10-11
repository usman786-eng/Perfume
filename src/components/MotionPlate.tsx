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
  const inViewRef = useRef(false);

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
      // nears the viewport — keeps motion off the initial load.
      if (video.preload === 'none') {
        video.preload = 'metadata';
        video.load();
      }
      video.play().catch(() => undefined);
    };
    const stop = () => video.pause();
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          inViewRef.current = entry.isIntersecting;
          if (entry.isIntersecting) start();
          else stop();
        },
        { threshold: 0.05, rootMargin: '240px' }
      );
      observer.observe(video);
    } else {
      start();
    }
    // Background tabs keep decoding otherwise — pause on hide, resume if
    // still in view on return.
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (inViewRef.current) start();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
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
