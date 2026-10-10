import { useEffect, useRef, useState } from 'react';

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
  const startedRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  // Low-power mode: small coarse-pointer screens (phones). Seven autoplaying
  // videos exhaust a phone tab's memory budget and get it killed, so here
  // the poster holds until an explicit tap. Desktop keeps full autoplay.
  const lowPower =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse) and (max-width: 760px)').matches;

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
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          inViewRef.current = entry.isIntersecting;
          if (!entry.isIntersecting) {
            stop();
            return;
          }
          if (!lowPower || startedRef.current) start();
        },
        { threshold: 0.05, rootMargin: lowPower ? '0px' : '240px' }
      );
      observer.observe(video);
    } else if (!lowPower) {
      start();
    }
    // Background tabs keep decoding otherwise — a classic phone-tab killer.
    const onVisibility = () => {
      if (document.hidden) {
        stop();
        return;
      }
      if (inViewRef.current && (!lowPower || startedRef.current)) start();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.pause();
    };
  }, [lowPower]);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      startedRef.current = true;
      if (video.preload === 'none') {
        video.preload = 'metadata';
        video.load();
      }
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  return (
    <>
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
      {lowPower && !playing && (
        <button
          type="button"
          className="motion-plate__toggle"
          onClick={toggle}
          aria-label={ariaLabel ? `Play video: ${ariaLabel}` : 'Play video'}
        >
          <span aria-hidden="true">▶</span>
        </button>
      )}
    </>
  );
}
