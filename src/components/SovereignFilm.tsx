import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { sovereignFilmFrames } from '../sovereign';

type Props = { galleryId: string };

const FRAME_COUNT = sovereignFilmFrames.length;
const FILM_SECONDS = 10;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * The Sovereign film — a ten-second, scroll-controlled movie in five scenes.
 *
 * Scrolling scrubs the timeline: scene stills dissolve with a continuous
 * push-in/pan (locked-off camera feel), a volumetric god-ray beam and floor
 * caustics breathe over the obsidian void, a prismatic flare sweeps the lens
 * during the suspension, an atomizer burst throws diamond droplets in the
 * diffusion, botanicals glow within the crystal, and the amber light-box
 * blooms for the alchemical finale. A canvas particle engine renders the
 * drifting dust motes, spray droplets and rising embers in real time.
 */
export default function SovereignFilm({ galleryId }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);
  const timecodeRef = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState(0);

  // Continuous timeline position (0..5) and discrete scene, readable by the
  // particle engine without re-rendering React on every scroll frame.
  const segmentRef = useRef(0);
  const frameRef = useRef(0);

  const applyProgress = (progress: number) => {
    const segment = Math.min(FRAME_COUNT - 1e-4, Math.max(0, progress * FRAME_COUNT));
    const frame = Math.min(FRAME_COUNT - 1, Math.floor(segment));
    const local = segment - frame;
    // Each scene holds, then dissolves into the next over its final third.
    const blend = frame === FRAME_COUNT - 1 ? 0 : clamp01((local - 0.66) / 0.34);

    segmentRef.current = segment;
    frameRef.current = frame;

    imageRefs.current.forEach((image, index) => {
      if (!image) return;
      const t = segment - index;
      const tc = Math.min(1.4, Math.max(-0.5, t));
      const opacity = index === frame ? 1 - blend : index === frame + 1 ? blend : 0;
      // Continuous locked-off push-in with a slow lateral drift, so each
      // scene behaves like a moving shot scrubbed by scroll rather than a slide.
      const scale = 1.028 + 0.05 * tc;
      const panX = -tc * (index === 0 ? 3.1 : 1.75);
      const panY = -tc * 0.55;
      image.style.opacity = String(opacity);
      image.style.transform = `scale(${scale.toFixed(4)}) translate3d(${panX.toFixed(3)}%, ${panY.toFixed(3)}%, 0)`;
    });

    const stage = stageRef.current;
    if (stage) {
      const localNow = segment - Math.floor(segment);
      // Prismatic flare: a full sweep during scene one, quick flashes on each dissolve.
      const sweepO = segment < 1 ? Math.sin(segment * Math.PI) * 0.95 : 0;
      const flash = localNow > 0.62 && segment < FRAME_COUNT - 1 ? Math.sin(((localNow - 0.62) / 0.38) * Math.PI) : 0;
      const flashO = flash * 0.5;
      const flareO = Math.max(sweepO, flashO);
      const flareX = sweepO >= flashO ? -72 + clamp01(segment) * 135 : -14 + localNow * 42;
      stage.style.setProperty('--film-p', String(progress));
      stage.style.setProperty('--frame-p', String(local));
      stage.style.setProperty('--mist-energy', String(0.3 + Math.sin(progress * Math.PI) * 0.48));
      stage.style.setProperty('--flare-x', `${flareX.toFixed(2)}%`);
      stage.style.setProperty('--flare-o', flareO.toFixed(3));
      stage.style.setProperty('--spray', String(clamp01(1 - Math.abs(segment - 2.5) / 0.8)));
      stage.style.setProperty('--glow', String(clamp01(1 - Math.abs(segment - 3.5) / 0.75)));
      stage.style.setProperty('--amber', String(clamp01((segment - 3.9) / 0.8)));
    }

    if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
    if (timecodeRef.current) {
      const seconds = progress * FILM_SECONDS;
      const ss = String(Math.min(10, Math.floor(seconds))).padStart(2, '0');
      const tenths = seconds >= FILM_SECONDS ? 0 : Math.floor((seconds % 1) * 10);
      timecodeRef.current.textContent = `00:${ss}.${tenths}`;
    }

    setChapter((current) => (current === frame ? current : frame));
  };

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => applyProgress(self.progress),
    });
    applyProgress(trigger.progress || 0);
    return () => trigger.kill();
  }, { scope: sectionRef });

  // Real-time optical particle engine: dust motes caught in the beam,
  // diamond droplets from the atomizer, embers rising through the amber finale.
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    type Mote = {
      kind: 0 | 1 | 2; // dust | droplet | ember
      x: number; y: number; vx: number; vy: number;
      r: number; life: number; max: number; phase: number; speed: number; alpha: number;
    };

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = false;
    let seeded = false;
    let tick = 0;
    const motes: Mote[] = [];

    const spawnDust = (initial = false): Mote => {
      const beam = width * 0.62;
      return {
        kind: 0,
        x: beam + (Math.random() - 0.5) * width * 0.5,
        y: initial ? Math.random() * height : -6 - Math.random() * 26,
        vx: (Math.random() - 0.5) * 0.1,
        vy: 0.04 + Math.random() * 0.14,
        r: 0.5 + Math.random() * 1.5,
        life: 0, max: 1,
        phase: Math.random() * Math.PI * 2,
        speed: 0.007 + Math.random() * 0.019,
        alpha: 0.14 + Math.random() * 0.48,
      };
    };

    const spawnDroplet = (): Mote => ({
      kind: 1,
      x: width * 0.69 + Math.random() * 6,
      y: height * 0.33 + (Math.random() - 0.5) * 8,
      vx: -(0.9 + Math.random() * 2.6),
      vy: (Math.random() - 0.5) * 0.85 - 0.12,
      r: 0.55 + Math.random() * 1.35,
      life: 0,
      max: 70 + Math.random() * 70,
      phase: Math.random() * Math.PI * 2,
      speed: 0.05,
      alpha: 0.35 + Math.random() * 0.55,
    });

    const spawnEmber = (): Mote => ({
      kind: 2,
      x: width * (0.45 + Math.random() * 0.45),
      y: height * (0.82 + Math.random() * 0.2),
      vx: (Math.random() - 0.5) * 0.16,
      vy: -(0.14 + Math.random() * 0.34),
      r: 0.55 + Math.random() * 1.15,
      life: 0,
      max: 110 + Math.random() * 90,
      phase: Math.random() * Math.PI * 2,
      speed: 0.03 + Math.random() * 0.03,
      alpha: 0.18 + Math.random() * 0.4,
    });

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = stage.clientWidth;
      height = stage.clientHeight;
      if (!width || !height) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!seeded) {
        seeded = true;
        for (let i = 0; i < 110; i += 1) motes.push(spawnDust(true));
      }
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);

    const draw = () => {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      if (!width || !height) return;
      tick += 1;

      const scene = frameRef.current;
      if (scene === 2 && motes.length < 330) {
        motes.push(spawnDroplet(), spawnDroplet());
      }
      if (scene === 4 && motes.length < 370 && tick % 3 === 0) motes.push(spawnEmber());

      ctx.clearRect(0, 0, width, height);

      for (let i = motes.length - 1; i >= 0; i -= 1) {
        const mote = motes[i];
        if (mote.kind === 0) {
          mote.phase += mote.speed;
          mote.x += mote.vx + Math.sin(mote.phase) * 0.15;
          mote.y += mote.vy;
          if (mote.y > height + 8) Object.assign(mote, spawnDust());
          if (mote.x < -10) mote.x = width + 10;
          else if (mote.x > width + 10) mote.x = -10;
          const twinkle = 0.55 + 0.45 * Math.sin(mote.phase * 2.3);
          ctx.globalAlpha = mote.alpha * twinkle;
          ctx.fillStyle = '#ffe7c2';
          ctx.beginPath();
          ctx.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        mote.life += 1;
        if (mote.life > mote.max || mote.y < -14 || mote.x < -14 || mote.x > width + 14) {
          motes.splice(i, 1);
          continue;
        }
        if (mote.kind === 1) {
          mote.vy += 0.013; // droplets arc and settle
        } else {
          mote.phase += mote.speed;
          mote.vx = Math.sin(mote.phase) * 0.24; // embers sway as they rise
        }
        mote.x += mote.vx;
        mote.y += mote.vy;

        const ratio = mote.life / mote.max;
        const fade = mote.kind === 1
          ? ratio < 0.12 ? ratio / 0.12 : 1 - Math.max(0, (ratio - 0.55) / 0.45)
          : Math.sin(ratio * Math.PI);
        ctx.globalAlpha = Math.max(0, mote.alpha * fade);
        ctx.fillStyle = mote.kind === 1 ? '#fff3d9' : '#ffcf8a';
        ctx.beginPath();
        ctx.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
        ctx.fill();
        if (mote.kind === 1) {
          // soft halo so each droplet scatters the backlight like a diamond
          ctx.globalAlpha *= 0.22;
          ctx.beginPath();
          ctx.arc(mote.x, mote.y, mote.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const intersection = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!running) {
          running = true;
          raf = requestAnimationFrame(draw);
        }
      } else {
        running = false;
        cancelAnimationFrame(raf);
      }
    }, { threshold: 0 });
    intersection.observe(stage);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      intersection.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  const jumpTo = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const distance = Math.max(0, section.offsetHeight - window.innerHeight);
    // Land a quarter into the scene so it reads mid-shot.
    const progress = (index + 0.25) / FRAME_COUNT;
    if (distance < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyProgress(progress);
      return;
    }
    window.scrollTo({ top: sectionTop + distance * progress, behavior: 'smooth' });
  };

  const active = sovereignFilmFrames[chapter];
  return (
    <section className="sovereign-film" ref={sectionRef} aria-label="Sovereign fragrance film">
      <div className="sovereign-film__stage" ref={stageRef} data-frame={chapter}>
        <div className="sovereign-film__frames" aria-hidden="true">
          {sovereignFilmFrames.map((frame, index) => (
            <img
              key={frame.src}
              ref={(element) => { imageRefs.current[index] = element; }}
              src={frame.src}
              alt=""
              fetchPriority={index === 0 ? 'high' : 'auto'}
              style={{ opacity: index === 0 ? 1 : 0 }}
            />
          ))}
        </div>

        {/* Volumetric golden beam — one 3200K spotlight with drifting god rays */}
        <div className="sovereign-film__beam" aria-hidden="true" />
        <div className="sovereign-film__wash" aria-hidden="true" />
        {/* Ray-traced caustics dancing across the obsidian floor */}
        <div className="sovereign-film__caustics" aria-hidden="true" />
        <div className="sovereign-film__diffusion" aria-hidden="true"><i /><i /><i /></div>
        {/* Prismatic lens flare — scene one sweep + flash on every dissolve */}
        <div className="sovereign-film__flare" aria-hidden="true" />
        {/* Frame 3: backlit spray bloom around the nozzle */}
        <div className="sovereign-film__spray" aria-hidden="true" />
        {/* Frame 4: soft internal glow revealing the botanicals */}
        <div className="sovereign-film__internal" aria-hidden="true" />
        {/* Frame 5: the amber light-box finale */}
        <div className="sovereign-film__amber" aria-hidden="true" />
        <div className="sovereign-film__grain" aria-hidden="true" />
        <canvas className="sovereign-film__particles" ref={canvasRef} aria-hidden="true" />

        <div className="sovereign-film__topline"><span>DAYRAH&nbsp; / &nbsp;THE SOVEREIGN</span><span>EAU DE PARFUM&nbsp; / &nbsp;NO. 04</span></div>
        <div className="sovereign-film__layout">
          <div className="sovereign-film__copy" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={chapter}
                initial={{ opacity: 0, y: 18, filter: 'blur(7px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(5px)' }}
                transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="sovereign-film__kicker">{active.label}<i>{active.timecode}</i></p>
                <h1>{active.title}<br /><em>{active.emphasis}</em></h1>
                <p className="sovereign-film__description">{active.copy}</p>
              </motion.div>
            </AnimatePresence>
            <div className="sovereign-film__actions">
              <a className="sovereign-film__link" href={`#${galleryId}`}>DISCOVER THE FRAGRANCE <span>↓</span></a>
              <span className="sovereign-film__hint">SCROLL TO PLAY THE FILM</span>
            </div>
          </div>
        </div>

        {/* Narration subtitle — the film's voice, scrubbed scene by scene */}
        <div className="sovereign-film__narration" aria-hidden="true">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={chapter}
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
              transition={{ duration: .45, ease: [0.22, 1, 0.36, 1] }}
            >
              <span>NARRATION</span>
              “{active.narration}”
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="sovereign-film__chapters" aria-label="Film chapters">
          {sovereignFilmFrames.map((frame, index) => (
            <button
              key={frame.label}
              className={chapter === index ? 'is-active' : ''}
              onClick={() => jumpTo(index)}
              title={`${frame.label} · ${frame.timecode}`}
              aria-label={`Go to ${frame.label.toLowerCase()}`}
              aria-current={chapter === index ? 'step' : undefined}
            >
              <span>0{index + 1}</span><i />
            </button>
          ))}
        </div>
        <div className="sovereign-film__bottom">
          <span className="sovereign-film__scroll-mark" aria-hidden="true">↓</span>
          <span>OUD&nbsp; · &nbsp;SAFFRON&nbsp; · &nbsp;AMBER</span>
          <span className="sovereign-film__readout"><b ref={timecodeRef}>00:00.0</b><i>/ 00:10.0&nbsp; · &nbsp;FIVE SCENES</i></span>
        </div>
        <div className="sovereign-film__progress"><div ref={progressRef} /></div>
      </div>
    </section>
  );
}
