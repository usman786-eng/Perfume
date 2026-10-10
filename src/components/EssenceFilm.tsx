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
  pillSeparator?: string;
  pills: string[];
  video?: string;
};

/** Companion to the Sovereign film: identical pinned 100vh stage, parallax speeds,
 *  letterbox, grain and HUD hierarchy — but a looping NOOR 03 video core. */
const ESSENCE_CHAPTERS: EssenceChapter[] = [
  {
    label: 'NOTE 01 / THE OPENING',
    context: 'TOP: CARDAMOM & LIME',
    title: 'Cardamom',
    emphasis: 'commands.',
    copy: 'Clean cardamom and cold lime open with deliberate clarity. A crisp, executive first impression — precise, never loud.',
    timeRange: 'TOP',
    camera: 'Olfactive family: warm floral-woody.',
    lighting: 'Built for boardroom presence and quiet power.',
    pills: ['CARDAMOM', 'LIME', 'CRISP OPENER'],
    video: '/videos/botanicals-swirl.mp4',
  },
  {
    label: 'NOTE 02 / THE HEART',
    context: 'HEART: STRENGTH WITH RESTRAINT',
    title: 'Rose,',
    emphasis: 'structured.',
    copy: 'A lifted rose heart, held in balance rather than sweetness. Contrast without excess.',
    timeRange: 'HEART',
    camera: 'Character: measured, confident, timeless.',
    lighting: 'A signature that speaks before words are spoken.',
    pills: ['ROSE HEART', 'MEASURED', 'UNDERSTATED'],
    video: '/videos/decanter-glow-02.mp4',
  },
  {
    label: 'NOTE 03 / THE BASE',
    context: 'BASE: DRY, POLISHED, LASTING',
    title: 'Sandalwood',
    emphasis: 'endures.',
    copy: 'Dry, polished sandalwood settles into a close and lasting trace. Quiet dominance that stays with you.',
    timeRange: 'BASE',
    camera: 'Longevity: eight to ten hours on skin.',
    lighting: 'DAYRAH NOOR 03 · Eau de parfum · 100 ml.',
    pills: ['SANDALWOOD', 'LASTING TRACE', '100 ML EAU DE PARFUM'],
    video: '/videos/decanter-void.mp4',
  },
];

function formatLoopTimecode(sec: number): string {
  const clamped = Math.max(0, sec || 0);
  const whole = Math.floor(clamped);
  const frames = Math.min(29, Math.floor((clamped - whole) * 30));
  return `00:${String(whole).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}

export default function EssenceFilm({
  scrollTo = '#sovereign-buy',
  preload = 'auto',
}: {
  /** Anchor the bottom scroll-mark points at. Defaults to the /sovereign layout. */
  scrollTo?: string;
  /** Use a lighter preload when the section sits below the fold. */
  preload?: 'auto' | 'metadata' | 'none';
} = {}) {
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

  // Swap the looping motion study for each note without restarting the loop.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const wanted = ESSENCE_CHAPTERS[chapter]?.video;
    if (!wanted) return;
    const current = video.currentSrc || video.src || '';
    if (current.includes(wanted)) {
      // Same study already assigned — but never force a first play here.
      // With preload="none" the mount render must not start the download;
      // the viewport observer below starts playback on approach instead.
      if (video.preload !== 'none') {
        video.play().catch(() => { /* autoplay blocked — poster holds */ });
      }
      return;
    }
    video.src = wanted;
    video.load();
    video.play().catch(() => { /* autoplay blocked — poster holds */ });
  }, [chapter, reduceMotion]);

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
    // Same mobile-autoplay hardening as MotionPlate: the muted IDL property
    // must be set imperatively or phones treat the video as unmuted.
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
    }
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            visibleRef.current = entry.isIntersecting;
            const video = videoRef.current;
            if (!video) return;
            if (entry.isIntersecting && !reduceMotion) {
              // Upgrade from preload="none" on first approach — the motion
              // study stays off the initial load until the section nears view.
              if (video.preload === 'none') {
                video.preload = preload;
                video.load();
              }
              video.play().catch(() => { /* autoplay blocked ΓÇö poster holds */ });
            } else {
              video.pause();
            }
          }, { threshold: 0, rootMargin: '400px' });
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

    // Background tabs keep decoding otherwise — pause on hide, resume only
    // if the section is still near the viewport on return.
    const onVisibility = () => {
      const v = videoRef.current;
      const sectionEl = sectionRef.current;
      if (!v || !sectionEl) return;
      if (document.hidden) {
        v.pause();
        return;
      }
      if (reduceMotion) return;
      const rect = sectionEl.getBoundingClientRect();
      if (rect.bottom > -400 && rect.top < window.innerHeight + 400) {
        if (v.preload === 'none') {
          v.preload = preload;
          v.load();
        }
        v.play().catch(() => { /* autoplay blocked — poster holds */ });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

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
      document.removeEventListener('visibilitychange', onVisibility);
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
      aria-label="DAYRAH NOOR 03 — executive eau de parfum presentation"
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
        {/* Per-note looping motion study — same frame, same hierarchy as Sovereign */}
        <div className="sovereign-film__frames" ref={framesRef} aria-hidden="true">
          <video
            ref={videoRef}
            className="essence-film__video"
            src="/videos/botanicals-swirl.mp4"
            poster="/images/noor-03.jpg"
            loop
            muted
            playsInline
            preload="none"
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
            <span>THE SIGNATURE&nbsp; / &nbsp;CARDAMOM · LIME · ROSE · SANDALWOOD</span>
          </div>
          <div className="sovereign-film__topline-controls">
            <span className="sovereign-film__brand-pill">EAU DE PARFUM ┬╖ 100 ML</span>
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
                DISCOVER DAYRAH NOOR 03 <span>→</span>
              </Link>
              <span className="sovereign-film__hint">ADD TO COLLECTION</span>
            </div>
          </div>

          <aside className="sovereign-film__specs" aria-label="Fragrance composition">
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
                  <span>STAGE</span>
                  <b>{active.timeRange}</b>
                </div>
                <div className="sovereign-film__spec-row">
                  <span>PROFILE</span>
                  <p>{active.camera}</p>
                </div>
                <div className="sovereign-film__spec-row">
                  <span>STATEMENT</span>
                  <p>{active.lighting}</p>
                </div>
                <div className="sovereign-film__spec-row">
                  <span>COMPOSITION</span>
                  <b>DAYRAH NOOR 03 · 100 ML</b>
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
          <a href={scrollTo} className="sovereign-film__scroll-mark" aria-label="Scroll to continue">
            ↓
          </a>
          <div className="sovereign-film__timeline-stops" role="group" aria-label="Fragrance notes">
            {ESSENCE_CHAPTERS.map((item, index) => (
              <button
                key={item.label}
                type="button"
                className={chapter === index ? 'is-active' : ''}
                onClick={() => jumpTo(index)}
              >
                <b>0{index + 1}</b>
                <span>{item.timeRange}</span>
              </button>
            ))}
          </div>
          <span className="sovereign-film__readout">
            <span className="sovereign-film__timecode" ref={timecodeRef}>00:00:00</span>
            <span>·</span>
            <b>NOOR 03</b>
            <i>/ SIGNATURE</i>
          </span>
        </div>
        <div className="sovereign-film__progress">
          <div ref={progressBarRef} />
        </div>
      </div>
    </section>
  );
}
