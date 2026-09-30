import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import BlurText from './components/BlurText';
import { CanvasBoundary } from './components/CanvasBoundary';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { AtelierPage, CollectionPage, ContactPage, JournalPage, SifrPage, SovereignPage, SovereignVisualElementsSection, StoryPage } from './pages';
import SovereignFilm from './components/SovereignFilm';
import EssenceFilm from './components/EssenceFilm';
import { ProductPage, CheckoutPage } from './pages-commerce';
import { CartProvider, useCart } from './shop/CartContext';
import { products } from './shop/products';
import { ReviewsStrip, ShopGrid } from './shop/ShopSections';
import CartDrawer from './components/CartDrawer';
const PerfumeScene = lazy(() => import('./components/PerfumeScene'));

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Note = 'oud' | 'rose' | 'amber';
type QuizQuestion = { prompt: string; choices: { title: string; detail: string; note?: Note }[] };
const stories = [
  { eyebrow: '01 / THE FIRST BREATH', lineOne: 'An oud at', lineTwo: 'the heart.', copy: 'A familiar depth, made personal. Resinous wood opens the story with warmth and quiet confidence.' },
  { eyebrow: '02 / THE BLOOM', lineOne: 'Petals take', lineTwo: 'flight.', copy: 'Rose unfurls through the composition. A vivid, delicate moment—caught in a cloud of drifting petals.' },
  { eyebrow: '03 / THE LASTING NOTE', lineOne: 'A memory,', lineTwo: 'in amber.', copy: 'The final warmth settles close to the skin, lingering long after the first impression.' },
];
const notes: Record<Note, { title: string; subtitle: string; copy: string; number: string }> = {
  oud: { title: 'Oud', subtitle: 'THE FOUNDATION', copy: 'Dark, resinous and full of texture. Oud gives the fragrance its grounding, unmistakable depth.', number: '01' },
  rose: { title: 'Rose', subtitle: 'THE HEART', copy: 'A petal-soft floral note with a bright, modern lift—never too sweet, always in motion.', number: '02' },
  amber: { title: 'Amber', subtitle: 'THE TRACE', copy: 'Golden warmth that rests close to the skin and draws the composition into a long, soft finish.', number: '03' },
};

/* Cinematic boot veil: counts in, then lifts to reveal the scene. */
function Preloader({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(100);
      const timer = window.setTimeout(() => { setDone(true); onDone(); }, 250);
      return () => window.clearTimeout(timer);
    }
    let raf = 0;
    let finish: number | undefined;
    const started = performance.now();
    const duration = 1450;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      setCount(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) { raf = requestAnimationFrame(tick); return; }
      finish = window.setTimeout(() => { setDone(true); onDone(); }, 140);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); if (finish) window.clearTimeout(finish); };
  }, [onDone]);
  return (
    <AnimatePresence>
      {!done && (
        <motion.div className="preloader" aria-hidden="true"
          initial={false}
          exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: .95, ease: [0.76, 0, 0.24, 1] } }}>
          <div className="preloader__grain" />
          <div className="preloader__top"><span>DAYRAH SCENTS&nbsp; / &nbsp;FRAGRANCE HOUSE</span><span>THE SOVEREIGN — EAU DE PARFUM</span></div>
          <div className="preloader__brand">
            <motion.b initial={{ opacity: 0, y: 22, filter: 'blur(9px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: .8, ease: [0.22, 1, 0.36, 1], delay: .12 }}>DAYRAH SCENTS</motion.b>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .7, delay: .42 }}>THE SOVEREIGN · OBSIDIAN VOID</motion.span>
          </div>
          <div className="preloader__bottom">
            <span>OUD&nbsp; · &nbsp;ROSE&nbsp; · &nbsp;AMBER</span>
            <span className="preloader__count">{String(count).padStart(3, '0')}</span>
          </div>
          <div className="preloader__line" style={{ transform: `scaleX(${count / 100})` }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Trailing cursor: a dot with a lagging ring that expands over interactive elements. */
function CursorFX() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;
    const pointer = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let raf = 0;
    let visible = false;
    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (!visible) { visible = true; dot.style.opacity = '1'; ring.style.opacity = '1'; ringPos.x = pointer.x; ringPos.y = pointer.y; }
      const interactive = (event.target as HTMLElement | null)?.closest('a,button,[role="tab"],input,textarea');
      ring.classList.toggle('is-active', Boolean(interactive));
    };
    const tick = () => {
      ringPos.x += (pointer.x - ringPos.x) * 0.14;
      ringPos.y += (pointer.y - ringPos.y) * 0.14;
      dot.style.transform = `translate3d(${pointer.x}px,${pointer.y}px,0)`;
      ring.style.transform = `translate3d(${ringPos.x}px,${ringPos.y}px,0)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  }, []);
  return (<><div className="cursor-dot" ref={dotRef} aria-hidden="true" /><div className="cursor-ring" ref={ringRef} aria-hidden="true" /></>);
}

/* Magnetic hover: children gently lean toward the pointer with GSAP inertia. */
function Magnetic({ children, strength = 0.38, className = '' }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const xTo = gsap.quickTo(element, 'x', { duration: .45, ease: 'power3' });
    const yTo = gsap.quickTo(element, 'y', { duration: .45, ease: 'power3' });
    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      xTo((event.clientX - (rect.left + rect.width / 2)) * strength);
      yTo((event.clientY - (rect.top + rect.height / 2)) * strength);
    };
    const onLeave = () => { xTo(0); yTo(0); };
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerleave', onLeave);
    return () => { element.removeEventListener('pointermove', onMove); element.removeEventListener('pointerleave', onLeave); gsap.set(element, { x: 0, y: 0 }); };
  }, [strength]);
  return <div ref={ref} className={`magnetic ${className}`}>{children}</div>;
}

/* Endless olfactory ribbon that separates the story from the finale. */
function ScentMarquee() {
  const phrase = 'OUD \u00b7 ROSE \u00b7 AMBER \u00b7 SIFR / 01 \u00b7 DAYRAH \u00b7 A MODERN RITUAL \u00b7 ';
  return (
    <div className="scent-marquee" aria-hidden="true">
      <div className="scent-marquee__track">{Array.from({ length: 4 }, (_, index) => <span key={index}>{phrase}</span>)}</div>
    </div>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, openBag } = useCart();
  const close = () => setMenuOpen(false);
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Dayrah Scents home" onClick={close}><span>DAYRAH SCENTS</span><small>FRAGRANCE HOUSE</small></Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        <NavLink to="/sovereign">SOVEREIGN</NavLink>
        <NavLink to="/collection">COLLECTION</NavLink>
        <NavLink to="/story">THE HOUSE</NavLink>
        <NavLink to="/atelier">ATELIER</NavLink>
        <NavLink to="/journal">JOURNAL</NavLink>
      </nav>
      <div className="header-actions">
        <Magnetic strength={0.32}><Link className="header-cta" to="/contact">CONTACT THE HOUSE <span>↗</span></Link></Magnetic>
        <button className="bag-button" onClick={openBag} aria-label={count > 0 ? `Open bag, ${count} item${count === 1 ? '' : 's'}` : 'Open bag'}>
          BAG
          <motion.span key={count} className="bag-count" initial={{ scale: .5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}>{count}</motion.span>
        </button>
      </div>
      <button className="menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><i /><i /></button>
      <AnimatePresence>{menuOpen && <motion.nav className="mobile-nav" aria-label="Mobile navigation" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .22 }}>
        <Link to="/sovereign" onClick={close}>SOVEREIGN / NEW</Link><Link to="/collection" onClick={close}>THE COLLECTION</Link><Link to="/story" onClick={close}>THE HOUSE</Link><Link to="/atelier" onClick={close}>THE ATELIER</Link><Link to="/journal" onClick={close}>JOURNAL</Link><Link to="/contact" onClick={close}>CONTACT ↗</Link>
      </motion.nav>}</AnimatePresence>
    </header>
  );
}

function ScentExperience({ note, onOpenDetails, booted }: { note: Note; onOpenDetails: () => void; booted: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const frameCounterRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progressRef.current = self.progress;
        if (progressBarRef.current) progressBarRef.current.style.transform = `scaleX(${self.progress})`;
        if (frameCounterRef.current) frameCounterRef.current.textContent = String(Math.round(self.progress * 179)).padStart(3, '0');
        const next = Math.min(stories.length - 1, Math.floor(self.progress * stories.length));
        setStep((current) => current === next ? current : next);
      },
    });
    return () => trigger.kill();
  }, { scope: sectionRef });

  const jumpTo = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const range = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: section.offsetTop + Math.max(0, range) * (index / stories.length), behavior: 'smooth' });
  };

  const active = stories[step];
  return (
    <section className="scent-experience" id="story" ref={sectionRef}>
      <div className="experience-sticky">
        <div className="experience-glow" />
        <div className="cinema-vignette" aria-hidden="true" />
        <div className="experience-grain" />
        <CanvasBoundary fallback={<div className="scene-loading" aria-hidden="true" />}>
          <Suspense fallback={<div className="scene-loading" aria-hidden="true" />}><PerfumeScene progress={progressRef} note={note} /></Suspense>
        </CanvasBoundary>
        <div className="experience-topline"><span>DAYRAH&nbsp; / &nbsp;THE ART OF PERFUMERY</span><span>OUD&nbsp; · &nbsp;ROSE&nbsp; · &nbsp;AMBER</span></div>
        <div className="experience-layout">
          <div className="experience-copy" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div className="chapter-copy" key={step} initial={{ opacity: 0, y: 18, filter: 'blur(7px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -12, filter: 'blur(5px)' }} transition={{ duration: .55, ease: [0.22, 1, 0.36, 1], delay: booted ? 0 : 1.5 }}>
                <p className="chapter-kicker">{active.eyebrow}</p>
                <h1><span><BlurText text={active.lineOne} startDelay={booted ? 0 : 1.55} /></span><em><BlurText text={active.lineTwo} delay={.12} startDelay={booted ? 0 : 1.55} /></em></h1>
                <p className="chapter-copy-text">{active.copy}</p>
              </motion.div>
            </AnimatePresence>
            <div className="story-actions"><Magnetic strength={0.42}><motion.button className="discover-button" onClick={onOpenDetails} whileHover={{ x: 4 }} whileTap={{ scale: .98 }}>EXPLORE THE FRAGRANCE <span>↗</span></motion.button></Magnetic><span className="drag-note">DRAG THE BOTTLE TO TURN</span></div>
          </div>
          <div className="scene-side-copy"><span className="scene-rule" /><p>SCENT AS<br />A SENSORY<br />MEMORY</p></div>
        </div>
        <div className="chapter-nav" aria-label="Fragrance story chapters">{stories.map((item, index) => <button key={item.eyebrow} className={step === index ? 'chapter-dot active' : 'chapter-dot'} onClick={() => jumpTo(index)} aria-label={`Go to ${item.eyebrow.toLowerCase()}`}><span>0{index + 1}</span><i /></button>)}</div>
        <div className="experience-bottom"><a href="#notes" aria-label="Scroll to the notes"><span className="scroll-ring">↓</span></a><span className="scroll-prompt">SCROLL TO REVEAL</span><span className="frame-readout" aria-label="Scroll-scrubbed fragrance film frame"><b ref={frameCounterRef}>000</b><i>/ 180 FRAMES</i></span><span className="experience-count">0{step + 1}<i />03</span></div>
        <div className="experience-progress"><div ref={progressBarRef} /></div>
      </div>
    </section>
  );
}

function NoteExplorer({ note, setNote }: { note: Note; setNote: (value: Note) => void }) {
  const active = notes[note];
  return (
    <section className="notes-section" id="notes">
      <div className="notes-intro" data-gsap-reveal>
        <p className="eyebrow"><span /> THE OLFACTIVE PALETTE</p>
        <h2>Three notes.<br /><em>One lasting feeling.</em></h2>
        <p>Tap a note to feel its place in the composition. The bottle’s colour shifts with the accord.</p>
        <div className="note-tabs" role="tablist" aria-label="Choose a fragrance note">{(Object.keys(notes) as Note[]).map((key) => <motion.button key={key} role="tab" aria-selected={note === key} className={note === key ? 'note-tab active' : 'note-tab'} onClick={() => setNote(key)} whileTap={{ scale: .97 }}><span>{notes[key].number}</span>{notes[key].title}</motion.button>)}</div>
        <AnimatePresence mode="wait" initial={false}><motion.div className="selected-note" key={note} initial={{ opacity: 0, y: 11 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }} transition={{ duration: .28 }}><span>{active.subtitle}</span><h3>{active.title}</h3><p>{active.copy}</p></motion.div></AnimatePresence>
      </div>
      <figure className="notes-image" data-gsap-reveal><div className="notes-image-frame"><img src="/images/dayrah-cinematic-campaign.webp" alt="Conceptual Dayrah campaign image of a glass bottle, amber liquid, and rose petals" loading="lazy" /></div><figcaption><span>THE MATERIAL</span><span>AMBER GLASS / STUDY 01</span></figcaption><span className="image-index">01</span></figure>
    </section>
  );
}

const quizQuestions: QuizQuestion[] = [
  { prompt: 'What do you want to feel first?', choices: [
    { title: 'Deep & grounded', detail: 'Resinous woods with a little mystery.', note: 'oud' as Note },
    { title: 'Soft & in bloom', detail: 'A petal-bright floral heart.', note: 'rose' as Note },
    { title: 'Warm & golden', detail: 'A close, amber glow.', note: 'amber' as Note },
  ] },
  { prompt: 'How should it wear?', choices: [
    { title: 'Close to the skin', detail: 'A private, personal trail.' },
    { title: 'Softly present', detail: 'A balanced everyday presence.' },
    { title: 'Leave a trace', detail: 'A little more room to linger.' },
  ] },
  { prompt: 'When will you reach for it?', choices: [
    { title: 'The everyday ritual', detail: 'A familiar moment, made yours.' },
    { title: 'After sunset', detail: 'A slower, more atmospheric mood.' },
    { title: 'Whenever it feels right', detail: 'No occasion required.' },
  ] },
];

function ScentFinder({ onChooseNote }: { onChooseNote: (note: Note) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [recommendation, setRecommendation] = useState<Note | null>(null);
  const selected = answers[step];
  const question = quizQuestions[step];
  const profile = recommendation ? `${quizQuestions[1].choices[answers[1] ?? 0].title}  /  ${quizQuestions[2].choices[answers[2] ?? 0].title}` : '';

  const choose = (index: number) => setAnswers((current) => current.map((value, i) => i === step ? index : value).concat(current.length <= step ? [index] : []));
  const continueQuiz = () => {
    if (selected === undefined) return;
    if (step === quizQuestions.length - 1) {
      const firstAnswer = answers[0] ?? selected;
      setRecommendation(quizQuestions[0].choices[firstAnswer].note ?? 'amber');
    } else {
      setStep((current) => current + 1);
    }
  };
  const restart = () => { setStep(0); setAnswers([]); setRecommendation(null); };
  const viewNote = () => {
    if (!recommendation) return;
    onChooseNote(recommendation);
    document.getElementById('notes')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="finder-section" id="finder">
      <div className="finder-heading" data-gsap-reveal><p className="eyebrow"><span /> A SMALL SCENT CONSULTATION</p><h2>Begin with<br /><em>a feeling.</em></h2><p>Three quick choices. A note to start with. Let your instinct lead.</p></div>
      <div className="finder-panel" data-gsap-reveal>
        <div className="finder-panel-top"><span>FIND YOUR NOTE</span><span>{recommendation ? 'YOUR RESULT' : `0${step + 1} / 03`}</span></div>
        <div className="finder-progress"><span style={{ width: recommendation ? '100%' : `${((step + 1) / quizQuestions.length) * 100}%` }} /></div>
        <AnimatePresence mode="wait" initial={false}>
          {recommendation ? (
            <motion.div className="finder-result" key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .3 }}>
              <span className="finder-result-label">YOUR FIRST NOTE</span><h3>{notes[recommendation].title}</h3><p>{notes[recommendation].copy}</p><p className="finder-profile">YOUR PROFILE&nbsp; / &nbsp;{profile.toUpperCase()}</p>
              <div className="finder-result-actions"><motion.button className="finder-primary" onClick={viewNote} whileHover={{ x: 4 }}>EXPLORE {notes[recommendation].title.toUpperCase()} <span>↗</span></motion.button><button className="finder-reset" onClick={restart}>START AGAIN</button></div>
            </motion.div>
          ) : (
            <motion.div className="finder-question" key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .28 }}>
              <h3>{question.prompt}</h3>
              <div className="finder-options" role="group" aria-label={question.prompt}>{question.choices.map((choice, index) => <motion.button key={choice.title} className={selected === index ? 'finder-option selected' : 'finder-option'} onClick={() => choose(index)} whileHover={{ y: -2 }} whileTap={{ scale: .985 }}><span className="option-number">0{index + 1}</span><span className="option-copy"><b>{choice.title}</b><small>{choice.detail}</small></span><i>{selected === index ? '✓' : '↗'}</i></motion.button>)}</div>
              <div className="finder-controls"><button className="finder-back" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>← BACK</button><motion.button className="finder-next" onClick={continueQuiz} disabled={selected === undefined} whileHover={selected !== undefined ? { x: 3 } : undefined}>CONTINUE <span>→</span></motion.button></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

const ritualSteps = [
  { title: 'Begin close.', copy: 'Start with one light mist on clean skin. Warmth helps a fragrance unfold at its own pace.', note: 'THE FIRST MOMENT' },
  { title: 'Give it a little space.', copy: 'Try a pulse point, then let the fragrance settle naturally. There is no need to rub it in.', note: 'THE UNFOLDING' },
  { title: 'Make it your ritual.', copy: 'Wear it alone or alongside your usual routine. The best way is the one that feels like you.', note: 'THE PERSONAL TRACE' },
];

function RitualGuide() {
  const [active, setActive] = useState(0);
  const step = ritualSteps[active];
  return (
    <section className="ritual-section" id="ritual">
      <div className="ritual-heading" data-gsap-reveal><p className="eyebrow"><span /> THE RITUAL</p><h2>Let the notes<br /><em>take their time.</em></h2><p>Fragrance is not a race to the last note. Give it a moment, and make the moment your own.</p></div>
      <div className="ritual-card" data-gsap-reveal>
        <div className="ritual-card-top"><span>HOW TO WEAR</span><span>0{active + 1} / 03</span></div>
        <AnimatePresence mode="wait" initial={false}><motion.div className="ritual-content" key={active} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: .3 }}><span>{step.note}</span><h3>{step.title}</h3><p>{step.copy}</p></motion.div></AnimatePresence>
        <div className="ritual-bottom"><div className="ritual-step-buttons" aria-label="Ritual steps">{ritualSteps.map((item, index) => <button key={item.note} className={active === index ? 'ritual-step active' : 'ritual-step'} onClick={() => setActive(index)} aria-label={`Show step ${index + 1}: ${item.title}`}><span>0{index + 1}</span><i /></button>)}</div><div className="ritual-arrows"><button onClick={() => setActive((current) => Math.max(0, current - 1))} disabled={active === 0} aria-label="Previous ritual step">←</button><button onClick={() => setActive((current) => Math.min(ritualSteps.length - 1, current + 1))} disabled={active === ritualSteps.length - 1} aria-label="Next ritual step">→</button></div></div>
      </div>
    </section>
  );
}

function Atelier() {
  return (
    <section className="atelier-section" id="atelier">
      <figure className="atelier-image" data-gsap-reveal><div className="atelier-frame"><img src="/images/perfumer-at-work.jpg" alt="A perfumer working among glass bottles and fragrance materials" loading="lazy" /></div><figcaption>THE PERFUMER'S TABLE&nbsp; / &nbsp;A STUDY IN MAKING</figcaption></figure>
      <div className="atelier-copy" data-gsap-reveal><p className="eyebrow"><span /> THE ATELIER</p><h2>Made with<br />patience.<br /><em>Worn your way.</em></h2><p>In perfumery, a small adjustment can change everything. Materials are tested, balanced and given room to become something personal.</p><a className="atelier-link" href="mailto:hello@dayrah.com">A NOTE TO THE HOUSE <span>↗</span></a></div>
    </section>
  );
}

function DetailsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  return <AnimatePresence>{open && <motion.div className="modal-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="fragrance-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()} initial={{ y: 28, opacity: 0, scale: .98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 18, opacity: 0, scale: .985 }} transition={{ duration: .3, ease: [0.22, 1, 0.36, 1] }}><button className="modal-close" onClick={onClose} aria-label="Close fragrance details">×</button><p className="eyebrow"><span /> DAYRAH / SIGNATURE SCENT</p><h2 id="modal-title">Sifr<sup>01</sup></h2><p className="modal-subtitle">A memory, held in glass.</p><div className="modal-notes"><span>OUD <i /> ROSE <i /> AMBER</span></div><p className="modal-copy">A warm, floral-woody composition, inspired by the scents that turn a moment into a place you remember.</p><a className="modal-contact" href="mailto:hello@dayrah.com">ASK THE ATELIER <span>↗</span></a><p className="modal-foot">CONTACT DETAILS AND PRODUCT INFORMATION ARE PLACEHOLDERS.</p></motion.div></motion.div>}</AnimatePresence>;
}

function SovereignFeature() {
  return (
    <section className="sovereign-feature" id="sovereign-feature-section" aria-labelledby="sovereign-feature-title">
      <Link to="/sovereign" className="sovereign-feature__visual" aria-label="Enter the Sovereign film">
        <img src="/images/sovereign-05.jpg" alt="DAYRAH SCENTS The Sovereign geometric crystal perfume flacon glowing with amber liquid in the Obsidian Void" loading="lazy" />
        <span>DAYRAH SCENTS&nbsp; / &nbsp;THE SOVEREIGN (0–10S FILM)</span>
      </Link>
      <div className="sovereign-feature__copy" data-gsap-reveal>
        <p className="eyebrow"><span /> THE SOVEREIGN / ETERNAL. REFINED.</p>
        <h2 id="sovereign-feature-title">Experience the<br /><em>weight of light.</em></h2>
        <p>Suspended in the Obsidian Void under a 3200K volumetric beam, velvet-red rose petals, green cardamom, bergamot slices, and sandalwood shift from crystal clear to blushing rose gold and deep luxurious amber.</p>
        <Link to="/sovereign" className="text-link">OPEN FULL SOVEREIGN STORYBOARD &amp; SHOP <span>↗</span></Link>
      </div>
    </section>
  );
}

function HomePage({ note, setNote, onOpenDetails, booted }: { note: Note; setNote: (note: Note) => void; onOpenDetails: () => void; booted: boolean }) {
  return (
    <main className="home-page">
      <SovereignFilm galleryId="sovereign-feature-section" elementsId="sovereign-elements-home" />
      <SovereignVisualElementsSection id="sovereign-elements-home" />
      <SovereignFeature />
      <EssenceFilm scrollTo="#notes" preload="metadata" />
      <NoteExplorer note={note} setNote={setNote} />
      <section className="home-signature">
        <div className="home-signature__copy"><p className="eyebrow"><span /> THE HOUSE SIGNATURE</p><h2>Sifr<sup>01</sup><br /><em>A memory in motion.</em></h2><p>Oud at the foundation. Rose at the heart. Amber in the trace. Meet the full composition behind Dayrah's signature fragrance.</p><Link to="/sifr-01" className="text-link">ENTER THE FRAGRANCE <span>↗</span></Link></div>
        <Link to="/sifr-01" className="home-signature__image" aria-label="Discover Sifr 01"><img src="/images/dayrah-cinematic-campaign.webp" alt="Conceptual Dayrah campaign image: an amber perfume bottle amid rose petals and golden light" loading="lazy" /><span>01 / SIFR — THE SIGNATURE</span></Link>
      </section>
      <section className="shelf-section">
        <div className="shelf-section__head" data-gsap-reveal>
          <p className="eyebrow"><span /> THE ATELIER SHELF</p>
          <h2>Wear the house.<br /><em>Choose your note.</em></h2>
          <Link className="text-link" to="/collection">VIEW THE FULL COLLECTION <span>↗</span></Link>
        </div>
        <ShopGrid items={products} />
      </section>
      <ScentExperience note={note} onOpenDetails={onOpenDetails} booted={booted} />
      <ReviewsStrip />
      <ScentFinder onChooseNote={setNote} />
      <RitualGuide />
      <Atelier />
      <section className="home-pages"><p className="eyebrow"><span /> CONTINUE EXPLORING</p><div><Link to="/collection">THE COLLECTION <span>↗</span></Link><Link to="/story">THE HOUSE <span>↗</span></Link><Link to="/journal">FIELD NOTES <span>↗</span></Link></div></section>
      <ScentMarquee />
      <section className="closing-section"><p className="eyebrow"><span /> DAYRAH&nbsp; / &nbsp;FRAGRANCE HOUSE</p><h2>Let the scent<br /><em>say the rest.</em></h2><Magnetic strength={0.4}><Link to="/contact">CONTACT THE HOUSE <span>↗</span></Link></Magnetic></section>
    </main>
  );
}

function SiteFooter() {
  return <footer className="site-footer"><Link className="footer-brand" to="/">DAYRAH</Link><span>ARABIAN PERFUMERY&nbsp; / &nbsp;A MODERN RITUAL</span><Link to="/sovereign">SOVEREIGN</Link><Link to="/collection">COLLECTION</Link><Link to="/story">THE HOUSE</Link><Link to="/atelier">ATELIER</Link><Link to="/contact">CONTACT ↗</Link></footer>;
}

function NotFoundPage() {
  return <main className="not-found"><p className="eyebrow"><span /> DAYRAH / 404</p><h1>This note<br /><em>hasn't arrived.</em></h1><Link to="/">RETURN TO THE HOUSE <span>↗</span></Link></main>;
}

function SiteLayout() {
  const location = useLocation();
  const [note, setNote] = useState<Note>('amber');
  const [modalOpen, setModalOpen] = useState(false);
  const [booted, setBooted] = useState(false);
  const appRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true, touchMultiplier: 1.12 });
    lenisRef.current = lenis;
    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);
    lenis.on('scroll', ScrollTrigger.update);
    return () => { gsap.ticker.remove(onTick); lenis.destroy(); lenisRef.current = null; };
  }, []);

  useEffect(() => {
    const pageMeta: Record<string, { title: string; description: string }> = {
      '/': { title: 'Dayrah — The Art of Perfumery', description: 'Discover Dayrah through the Sifr 01 3D fragrance film, the new Sovereign campaign, and the rituals of scent.' },
      '/collection': { title: 'The Collection — Dayrah', description: 'Explore Dayrah fragrances, including the new Sovereign composition and the Sifr 01 signature.' },
      '/sovereign': { title: 'Sovereign — Dayrah', description: 'Enter Sovereign, a new Dayrah eau de parfum, through a five-scene cinematic fragrance film with diffused amber mist.' },
      '/sifr-01': { title: 'Sifr 01 — Dayrah', description: 'Experience Sifr 01 through a scroll-controlled 3D fragrance film and an interactive accord palette.' },
      '/story': { title: 'The House — Dayrah', description: 'Discover the Dayrah point of view: memory, Arabic perfumery, and scent worn personally.' },
      '/atelier': { title: 'The Atelier — Dayrah', description: 'Explore the materials, ideas, and deliberate gestures behind the Dayrah fragrance house.' },
      '/journal': { title: 'Field Notes — Dayrah', description: 'Short reflections on material, memory, and the rituals that give fragrance its place.' },
      '/contact': { title: 'Correspondence — Dayrah', description: 'Write to the Dayrah fragrance house about Sifr 01, the house, or the ritual of scent.' },
      '/checkout': { title: 'Checkout — Dayrah', description: 'Complete your Dayrah order with complimentary shipping over $250 and two samples of the house.' },
    };
    const productSlug = location.pathname.startsWith('/product/') ? location.pathname.split('/')[2] : '';
    const productMeta = productSlug ? { title: `${products.find((item) => item.slug === productSlug)?.name ?? 'Fragrance'} — Dayrah`, description: 'Shop Dayrah eau de parfum: choose your size, add to bag, and check out with cash on delivery.' } : undefined;
    const meta = productMeta ?? pageMeta[location.pathname] ?? { title: 'Page not found — Dayrah', description: 'Return to Dayrah, the fragrance house.' };
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
    const hash = location.hash.slice(1);
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }));
    } else {
      lenisRef.current?.scrollTo(0, { immediate: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [location.pathname, location.hash]);

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.utils.toArray<HTMLElement>('[data-gsap-reveal]').forEach((element) => {
      gsap.fromTo(element, { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .9, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 85%', once: true } });
    });
    gsap.utils.toArray<HTMLElement>('.note-tab').forEach((tab, index) => {
      gsap.fromTo(tab, { y: 13, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .55, delay: index * .07, ease: 'power2.out', scrollTrigger: { trigger: tab, start: 'top 90%', once: true } });
    });
    gsap.utils.toArray<HTMLElement>('.notes-image-frame,.atelier-frame,.story-image-band,.journal-card__image').forEach((frame) => {
      gsap.fromTo(frame, { clipPath: 'inset(9% 7% 9% 7%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'power3.out', scrollTrigger: { trigger: frame, start: 'top 82%', once: true } });
    });
    gsap.utils.toArray<HTMLElement>('.notes-image-frame img,.atelier-frame img,.story-image-band img,.journal-card__image img').forEach((image) => {
      gsap.fromTo(image, { scale: 1.12, yPercent: -4 }, { scale: 1, yPercent: 4, ease: 'none', scrollTrigger: { trigger: image, start: 'top bottom', end: 'bottom top', scrub: .7 } });
    });
    gsap.utils.toArray<HTMLElement>('[data-reveal-up]').forEach((element) => {
      gsap.fromTo(element, { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .85, ease: 'power2.out', stagger: .1, scrollTrigger: { trigger: element, start: 'top 86%', once: true } });
    });
  }, { scope: appRef, dependencies: [location.pathname], revertOnUpdate: true });

  return (
    <div className="app-shell" ref={appRef}>
      <Header />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div className="route-stage" key={location.pathname} initial={{ opacity: 0, y: 13, filter: 'blur(3px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }} transition={{ duration: .42, ease: [0.22, 1, .36, 1], delay: booted ? 0 : 1.42 }}>
          <Routes location={location}>
            <Route path="/" element={<HomePage note={note} setNote={setNote} onOpenDetails={() => setModalOpen(true)} booted={booted} />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/sovereign" element={<SovereignPage />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/sifr-01" element={<SifrPage note={note} setNote={setNote} />} />
            <Route path="/story" element={<StoryPage />} />
            <Route path="/atelier" element={<AtelierPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      <SiteFooter />
      <DetailsModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <CartDrawer />
      <Preloader onDone={() => setBooted(true)} />
      <CursorFX />
    </div>
  );
}

function App() {
  return <BrowserRouter><CartProvider><SiteLayout /></CartProvider></BrowserRouter>;
}

export default App;
