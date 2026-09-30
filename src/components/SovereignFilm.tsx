import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { sovereignFilmFrames } from '../sovereign';

type Props = { galleryId: string };

/** A five-still, scroll-scrubbed campaign film for the Sovereign composition. */
export default function SovereignFilm({ galleryId }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);
  const frameCounterRef = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState(0);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const progress = self.progress;
        const position = progress * (sovereignFilmFrames.length - 1);
        const frame = Math.min(sovereignFilmFrames.length - 1, Math.floor(position));
        const blend = frame === sovereignFilmFrames.length - 1 ? 0 : position - frame;

        imageRefs.current.forEach((image, index) => {
          if (!image) return;
          const opacity = index === frame ? 1 - blend : index === frame + 1 ? blend : 0;
          image.style.opacity = String(opacity);
        });
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
        if (frameCounterRef.current) frameCounterRef.current.textContent = String(frame + 1).padStart(2, '0');
        if (stageRef.current) {
          const diffusion = 0.3 + Math.sin(progress * Math.PI) * 0.48;
          stageRef.current.style.setProperty('--mist-energy', String(diffusion));
        }

        const next = Math.min(sovereignFilmFrames.length - 1, Math.floor(progress * sovereignFilmFrames.length));
        setChapter((current) => current === next ? current : next);
      },
    });
    return () => trigger.kill();
  }, { scope: sectionRef });

  const jumpTo = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const distance = Math.max(0, section.offsetHeight - window.innerHeight);
    const progress = index / (sovereignFilmFrames.length - 1);
    if (distance < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setChapter(index);
      imageRefs.current.forEach((image, imageIndex) => {
        if (image) image.style.opacity = imageIndex === index ? '1' : '0';
      });
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
      if (frameCounterRef.current) frameCounterRef.current.textContent = String(index + 1).padStart(2, '0');
      if (stageRef.current) stageRef.current.style.setProperty('--mist-energy', String(0.3 + Math.sin(progress * Math.PI) * 0.48));
      return;
    }
    window.scrollTo({ top: section.offsetTop + distance * progress, behavior: 'smooth' });
  };

  const active = sovereignFilmFrames[chapter];
  return (
    <section className="sovereign-film" ref={sectionRef} aria-label="Sovereign fragrance film">
      <div className="sovereign-film__stage" ref={stageRef}>
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
        <div className="sovereign-film__wash" aria-hidden="true" />
        <div className="sovereign-film__diffusion" aria-hidden="true"><i /><i /><i /></div>
        <div className="sovereign-film__grain" aria-hidden="true" />

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
                <p className="sovereign-film__kicker">{active.label}</p>
                <h1>{active.title}<br /><em>{active.emphasis}</em></h1>
                <p className="sovereign-film__description">{active.copy}</p>
              </motion.div>
            </AnimatePresence>
            <div className="sovereign-film__actions">
              <a className="sovereign-film__link" href={`#${galleryId}`}>DISCOVER THE FRAGRANCE <span>↓</span></a>
              <span className="sovereign-film__hint">SCROLL TO FOLLOW THE TRACE</span>
            </div>
          </div>
        </div>

        <div className="sovereign-film__chapters" aria-label="Film chapters">
          {sovereignFilmFrames.map((frame, index) => (
            <button
              key={frame.label}
              className={chapter === index ? 'is-active' : ''}
              onClick={() => jumpTo(index)}
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
          <span className="sovereign-film__readout"><b ref={frameCounterRef}>01</b><i>/ 05 STUDIES</i></span>
        </div>
        <div className="sovereign-film__progress"><div ref={progressRef} /></div>
      </div>
    </section>
  );
}
