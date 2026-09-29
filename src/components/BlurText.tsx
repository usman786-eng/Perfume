import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, type Transition } from 'framer-motion';

type BlurTextProps = {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  stepDuration?: number;
};

const buildKeyframes = (from: Record<string, string | number>, steps: Array<Record<string, string | number>>) => {
  const keys = new Set<string>([...Object.keys(from), ...steps.flatMap((step) => Object.keys(step))]);
  const frames: Record<string, Array<string | number>> = {};
  keys.forEach((key) => { frames[key] = [from[key], ...steps.map((step) => step[key])]; });
  return frames;
};

// React Bits BlurText, adapted for this project and Framer Motion.
export default function BlurText({ text = '', delay = 90, className = '', animateBy = 'words', direction = 'top', threshold = 0.1, rootMargin = '0px', stepDuration = 0.34 }: BlurTextProps) {
  const segments = animateBy === 'words' ? text.split(' ') : text.split('');
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.unobserve(ref.current as Element);
      }
    }, { threshold, rootMargin });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const from = useMemo(() => direction === 'top' ? { filter: 'blur(10px)', opacity: 0, y: -35 } : { filter: 'blur(10px)', opacity: 0, y: 35 }, [direction]);
  const steps = useMemo(() => [
    { filter: 'blur(4px)', opacity: 0.45, y: direction === 'top' ? 4 : -4 },
    { filter: 'blur(0px)', opacity: 1, y: 0 },
  ], [direction]);
  const frames = buildKeyframes(from, steps);
  const count = steps.length + 1;
  const totalDuration = stepDuration * (count - 1);
  const times = Array.from({ length: count }, (_, index) => index / (count - 1));

  return (
    <span ref={ref} className={`blur-text ${className}`} aria-label={text}>
      {segments.map((segment, index) => {
        const transition: Transition = { duration: totalDuration, times, delay: (index * delay) / 1000, ease: [0.22, 1, 0.36, 1] };
        return <motion.span key={`${segment}-${index}`} aria-hidden="true" initial={from} animate={inView ? frames : from} transition={transition} className="blur-word">{segment || '\u00a0'}{animateBy === 'words' && index < segments.length - 1 ? '\u00a0' : ''}</motion.span>;
      })}
    </span>
  );
}
