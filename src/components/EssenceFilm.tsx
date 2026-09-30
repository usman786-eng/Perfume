import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

type EssenceChapter = {
  label: string;
  context: string;
  title: string;
  emphasis: string;
  copy: string;
  timeRange: string;
  camera: string;
  lighting: string;
  pills: string[];
};

/** Twin of the Sovereign film: identical pinned 100vh stage, parallax speeds,
 *  letterbox, grain and HUD hierarchy — but a looping NOOR 03 video core. */
const ESSENCE_CHAPTERS: EssenceChapter[] = [
  {
    label: 'FRAME 01 / THE AWAKENING',
    context: 'INTRODUCTION: LIGHT, UNCORKED',
    title: 'Saffron',
    emphasis: 'ignites.',
    copy: 'Hand-picked crimson threads spark against cold morning air. The first breath is mineral, golden, impossible to ignore — light striking cut glass.',
    timeRange: '0–2S',
    camera: 'Macro close-up, centered, locked-off tripod. Eye-level with the flacon.',
    lighting: 'Cold sparkle key with a warm 3200K volumetric halo; glinting saffron dust.',
    pills: ['SAFFRON SPARK', 'COLD TOP RADIANCE', 'GOLDEN VOLUMETRIC'],
  },
  {
    label: 'FRAME 02 / THE HEART',
    context: 'THE HEART: DRIED ROSE',
    title: 'Petals,',
    emphasis: 'remembered.',
    copy: 'Not a fresh rose — a remembered one. Dried damask petals turn honeyed and dark, pulling the brilliance down toward the skin.',
    timeRange: '2–4S',
    camera: 'Slow push-in, locked-off. Focus rests on the rose-gold heart.',
    lighting: 'Rosy amber wash; a soft internal glow moves through the liquid.',
    pills: ['DAMASK HEART', 'HONEYED DEPTH', 'SKIN PROXIMITY'],
  },
  {
    label: 'FRAME 03 / THE TRACE',
    context: 'THE TRACE: SPICE INTO GOLD',
    title: 'Spice turns',
    emphasis: 'to gold.',
    copy: 'Green cardamom lifts, then dissolves into sandalwood and amber. The trace it leaves is warm, dry, and quietly expensive.',
    timeRange: '4–6S',
    camera: 'Settling wide, locked-off. Full flacon held in the amber field.',
    lighting: 'Golden-hour warmth; the liquid glows like a light-box from within.',
    pills: ['GREEN CARDAMOM', 'AMBER DRY-DOWN', '100 ML EAU DE PARFUM'],
  },
];

function formatLoopTimecode(sec: number): string {
  const clamped = Math.max(0, sec || 0);
  const whole = Math.floor(clamped);
  const frames = Math.min(29, Math.floor((clamped - whole) * 30));
  return `00:${String(whole).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}

export default function EssenceFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<HTMLDivElement>(null);
  const abyssRef = useRef<HTMLDivElement>(null);
  const halationRef = useRef<HTMLDivElement>(null);
  const flareRef = useRef<HTMLDivElement>(null);
  const barTopRef = useRef<HTMLDivElement>(null);
  const barBotRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const timecodeRef = useRef<HTMLElement>(null);

  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);
  const velocityRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const visibleRef = useRef(true);
  const blurOnRef = useRef(false);

  const [chapter, setChapter] = useState(0);
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll choreography: same pinned-scroll progress contract as Sovereign.
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const prev = targetProgressRef.current;
          targetProgressRef.current = self.progress;
          velocityRef.current = Math.min(1, Math.abs(self.progress - prev) * 38);
          const next = Math.min(ESSENCE_CHAPTERS.length - 1, Math.floor(self.progress * ESSENCE_CHAPTERS.length));
          setChapter((current) => (current === next ? current : next));
          if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${self.progress})`;
          }
        },
      });
      return () => trigger.kill();
    },
    { scope: sectionRef }
  );

  // Depth rig + velocity FX loop. Transform/opacity writes only.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            visibleRef.current = entry.isIntersecting;
            const video = videoRef.current;
            if (!video) return;
            if (entry.isIntersecting && !reduceMotion) {
              video.play().catch(() => { /* autoplay blocked — poster holds */ });
            } else {
              video.pause();
            }
          }, { threshold: 0 });
    if (observer) observer.observe(section);

    const onPointerMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      pointerRef.current.y = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onTimeUpdate = () => {
      if (timecodeRef.current && videoRef.current) {
        const next = formatLoopTimecode(videoRef.current.currentTime);
        if (timecodeRef.current.textContent !== next) timecodeRef.current.textContent = next;
      }
    };
    const video = videoRef.current;
    video?.addEventListener('timeupdate', onTimeUpdate);

    let raf = 0;
    const render = () => {
      raf = requestAnimationFrame(render);
      if (!visibleRef.current) return;
      const diff = targetProgressRef.current - smoothProgressRef.current;
      smoothProgressRef.current += diff * 0.09;
      velocityRef.current *= 0.92;
      const p = Math.max(0, Math.min(1, smoothProgressRef.current));
      const vMag = Math.min(1, velocityRef.current);
      const vDir = diff >= 0 ? 1 : -1;
      const skew = vDir * Math.min(2, vMag * 5);

      // Video core: gentle pointer drift + Ken Burns swell + velocity energy.
      if (framesRef.current) {
        const breathe = reduceMotion ? 1 : 1 + 0.012 * Math.sin(performance.now() * 0.0009);
        framesRef.current.style.transform = `perspective(1200px) translate3d(${(pointerRef.current.x * -8).toFixed(2)}px, ${(pointerRef.current.y * -5).toFixed(2)}px, 0) rotateY(${(pointerRef.current.x * 1.4).toFixed(2)}deg) scale(${((1 + p * 0.15) * breathe).toFixed(4)}) skewY(${(skew * 0.4).toFixed(2)}deg)`;
        const wantBlur = vMag > 0.32;
        if (wantBlur !== blurOnRef.current) {
          blurOnRef.current = wantBlur;
          framesRef.current.style.filter = wantBlur
            ? `blur(${Math.min(0.8, (vMag - 0.32) * 2).toFixed(2)}px) saturate(1.08)`
            : '';
        }
      }
      if (bgRef.current) {
        bgRef.current.style.transform = `perspective(1200px) translateZ(-260px) scale(1.28) translate3d(0, ${(p * 110).toFixed(1)}px, 0)`;
      }
      if (fgRef.current) {
        fgRef.current.style.transform = `perspective(1200px) translateZ(210px) scale(0.88) translate3d(0, ${(-p * 190).toFixed(1)}px, 0) skewY(${(skew * 1.6).toFixed(2)}deg)`;
      }
      if (abyssRef.current) abyssRef.current.style.opacity = (0.08 + p * 0.92).toFixed(3);
      if (halationRef.current) {
        halationRef.current.style.opacity = (0.22 + p * 0.5 + Math.min(0.25, vMag * 0.5)).toFixed(3);
      }
      const barS = Math.min(1, p / 0.07).toFixed(3);
      if (barTopRef.current) barTopRef.current.style.transform = `scaleY(${barS})`;
      if (barBotRef.current) barBotRef.current.style.transform = `scaleY(${barS})`;
      if (flareRef.current) {
        flareRef.current.style.transform = `scaleX(${(1 + vMag * 1.8).toFixed(3)})`;
        flareRef.current.style.opacity = (0.3 + p * 0.45).toFixed(3);
      }
      if (copyRef.current) copyRef.current.classList.toggle('is-fast', vMag > 0.45);
    };
    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      if (observer) observer.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      video?.removeEventListener('timeupdate', onTimeUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jumpTo = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const distance = Math.max(0, section.offsetHeight - window.innerHeight);
    const target = index === ESSENCE_CHAPTERS.length - 1 ? 0.96 : (index + 0.5) / ESSENCE_CHAPTERS.length;
    if (distance < 2 || reduceMotion) {
      targetProgressRef.current = target;
      smoothProgressRef.current = target;
      setChapter(index);
      return;
    }
    window.scrollTo({ top: section.offsetTop + distance * target, behavior: 'smooth' });
  };

  const active = ESSENCE_CHAPTERS[chapter];

  return (
    <section
      className="sovereign-film essence-film"
      id="essence"
      ref={sectionRef}
      aria-label="DAYRAH SCENTS — Essence, a looping NOOR 03 amber-gold film"
    >
      <div className="sovereign-film__stage" ref={stageRef}>
        <div className="sf-abyss" ref={abyssRef} aria-hidden="true" />
        <div className="sf-bg" ref={bgRef} aria-hidden="true">
          <i className="sf-bg__nebula n1" />
          <i className="sf-bg__nebula n2" />
          <i className="sf-bg__petal p1" />
          <i className="sf-bg__petal p2" />
          <i className="sf-bg__petal p3" />
        </div>
        {/* Looping NOOR 03 video core — same frame, same hierarchy as Sovereign */}
        <div className="sovereign-film__frames" ref={framesRef} aria-hidden="true">
          <video
            ref={videoRef}
            className="essence-film__video"
            src="/videos/noor-essence.mp4"
            poster="/images/noor-03.jpg"
            autoPlay={!reduceMotion}
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
          />
        </div>

        <div className="sf-fg" ref={fgRef} aria-hidden="true">
          <i className="sf-fg__vignette" />
          <i className="sf-fg__petal f1" />
          <i className="sf-fg__petal f2" />
          <i className="sf-fg__petal f3" />
          <i className="sf-fg__petal f4" />
          <i className="sf-fg__bokeh b1" />
          <i className="sf-fg__bokeh b2" />
          <i className="sf-fg__bokeh b3" />
          <i className="sf-fg__bokeh b4" />
          <i className="sf-fg__bokeh b5" />
          <i className="sf-leak l1" />
          <i className="sf-leak l2" />
          <div className="sf-flare" ref={flareRef} />
        </div>
        <div className="sf-halation" ref={halationRef} aria-hidden="true" />

        <div className="sovereign-film__wash" aria-hidden="true" />
        <div className="sovereign-film__grain sf-grain" aria-hidden="true" />

        <div className="sf-bar sf-bar--top" ref={barTopRef} aria-hidden="true" />
        <div className="sf-bar sf-bar--bot" ref={barBotRef} aria-hidden="true" />
        <div className="sf-flicker" aria-hidden="true" />

        <div className="sovereign-film__topline">
          <div className="sovereign-film__topline-left">
            <span className="sovereign-film__brand-pill">NOOR 03</span>
            <span>THE ESSENCE FILM&nbsp; / &nbsp;AMBER GOLD STUDY&nbsp; · &nbsp;SAFFRON · ROSE · CARDAMOM</span>
          </div>
          <div className="sovereign-film__topline-controls">
            <span className="sovereign-film__brand-pill">EAU DE PARFUM · 100 ML</span>
          </div>
        </div>

        <div className="sovereign-film__layout">
          <div className="sovereign-film__copy" aria-live="polite" ref={copyRef}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={chapter}
                initial={{ opacity: 0, y: 18, filter: 'blur(7px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(5px)' }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="sovereign-film__kicker">{active.label}</p>
                <p className="sovereign-film__context">{active.context}</p>
                <h1>
                  {active.title}
                  <br />
                  <em>{active.emphasis}</em>
                </h1>
                <p className="sovereign-film__description">{active.copy}</p>
                <div className="sovereign-film__fx-pills">
                  {active.pills.map((pill) => (
                    <span key={pill}>{pill}</span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="sovereign-film__actions">
              <Link className="sovereign-film__link" to="/product/noor-03">
                DISCOVER NOOR 03 <span>↗</span>
              </Link>
              <span className="sovereign-film__hint">SCROLL TO MOVE THROUGH THE ESSENCE</span>
            </div>
          </div>

          <aside className="sovereign-film__specs" aria-label="Essence camera and lighting telemetry">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={chapter}
                className="sovereign-film__specs-card"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="sovereign-film__spec-row">
                  <span>TIME WINDOW</span>
                  <b>{active.timeRange} · LOOPING STUDY</b>
                </div>
                <div className="sovereign-film__spec-row">
                  <span>CAMERA ANGLE</span>
                  <p>{active.camera}</p>
                </div>
                <div className="sovereign-film__spec-row">
                  <span>LIGHTING RIG</span>
                  <p>{active.lighting}</p>
                </div>
                <div className="sovereign-film__spec-row">
                  <span>BOTTLE INSCRIPTION</span>
                  <b>DAYRAH SCENTS — NOOR 03 · 100 ML</b>
                </div>
              </motion.div>
            </AnimatePresence>
          </aside>
        </div>

        <div className="sovereign-film__chapters" aria-label="Essence chapters">
          {ESSENCE_CHAPTERS.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={chapter === index ? 'is-active' : ''}
              onClick={() => jumpTo(index)}
              aria-label={`Jump to ${item.context}`}
              aria-current={chapter === index ? 'step' : undefined}
            >
              <span>0{index + 1}</span>
              <i />
            </button>
          ))}
        </div>

        <div className="sovereign-film__bottom">
          <a href="#sovereign-buy" className="sovereign-film__scroll-mark" aria-label="Scroll to continue">
            ↓
          </a>
          <div className="sovereign-film__timeline-stops" role="group" aria-label="Move to essence chapter">
            {ESSENCE_CHAPTERS.map((item, index) => (
              <button
                key={item.label}
                type="button"
                className={chapter === index ? 'is-active' : ''}
                onClick={() => jumpTo(index)}
              >
                <b>E0{index + 1}</b>
                <span>{item.timeRange}</span>
              </button>
            ))}
          </div>
          <span className="sovereign-film__readout">
            <span className="sovereign-film__timecode" ref={timecodeRef}>00:00:00</span>
            <span>·</span>
            <b>ESSENCE</b>
            <i>/ LOOP</i>
          </span>
        </div>
        <div className="sovereign-film__progress">
          <div ref={progressBarRef} />
        </div>
      </div>
    </section>
  );
}
