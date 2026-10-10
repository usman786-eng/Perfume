import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { AtelierPage, CollectionPage, ContactPage, JournalPage, SifrPage, SovereignPage, SovereignVisualElementsSection, StoryPage } from './pages';
import SovereignFilm from './components/SovereignFilm';
import EssenceFilm from './components/EssenceFilm';
import { ProductPage, CheckoutPage } from './pages-commerce';
import { CartProvider, useCart } from './shop/CartContext';
import { products } from './shop/products';
import { ReviewsStrip, ShopGrid } from './shop/ShopSections';
import CartDrawer from './components/CartDrawer';
import MotionPlate from './components/MotionPlate';

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Note = 'cardamom' | 'lime' | 'rose' | 'sandalwood';
type QuizQuestion = { prompt: string; choices: { title: string; detail: string; note?: Note }[] };
const notes: Record<Note, { title: string; subtitle: string; copy: string; number: string }> = {
  cardamom: { title: 'Cardamom', subtitle: 'TOP', copy: 'A crisp, commanding opener. Green cardamom cuts through a room before a single word is spoken.', number: '01' },
  lime: { title: 'Lime', subtitle: 'TOP', copy: 'Cold lime keeps the opening bright and decisive: it wakes the air without raising its voice.', number: '02' },
  rose: { title: 'Rose', subtitle: 'HEART', copy: 'A structured rose heart carries the composition — grown for command, never for sweetness.', number: '03' },
  sandalwood: { title: 'Sandalwood', subtitle: 'BASE', copy: 'Dry, polished sandalwood settles last and stays longest. The part your decisions linger on.', number: '04' },
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
          <div className="preloader__top"><span>DAYRAH&nbsp; / &nbsp;FRAGRANCE HOUSE</span><span>DAYRAH NOOR 03 — EAU DE PARFUM</span></div>
          <div className="preloader__brand">
            <motion.b initial={{ opacity: 0, y: 22, filter: 'blur(9px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: .8, ease: [0.22, 1, 0.36, 1], delay: .12 }}>DAYRAH NOOR 03</motion.b>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .7, delay: .42 }}>QUIET POWER · BUILT FOR BOARDROOM PRESENCE</motion.span>
          </div>
          <div className="preloader__bottom">
            <span>CARDAMOM&nbsp; · &nbsp;LIME&nbsp; · &nbsp;ROSE&nbsp; · &nbsp;SANDALWOOD</span>
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
  const phrase = 'CARDAMOM \u00b7 LIME \u00b7 ROSE \u00b7 SANDALWOOD \u00b7 DAYRAH NOOR 03 \u00b7 QUIET POWER \u00b7 ';
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
    <header className={`site-header ${menuOpen ? 'is-nav-open' : ''}`}>
      <Link className="brand" to="/" aria-label="Dayrah home" onClick={close}><span>DAYRAH</span><small>FRAGRANCE HOUSE</small></Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        <NavLink to="/sovereign">SOVEREIGN</NavLink>
        <NavLink to="/collection">COLLECTION</NavLink>
        <NavLink to="/story">THE HOUSE</NavLink>
        <NavLink to="/atelier">ATELIER</NavLink>
        <NavLink to="/journal">JOURNAL</NavLink>
      </nav>
      <div className="header-actions">
        <Magnetic strength={0.32}><Link className="header-cta" to="/contact">ENQUIRE <span>↗</span></Link></Magnetic>
        <button className="bag-button" onClick={openBag} aria-label={count > 0 ? `Open bag, ${count} item${count === 1 ? '' : 's'}` : 'Open bag'}>
          BAG
          <motion.span key={count} className="bag-count" initial={{ scale: .5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}>{count}</motion.span>
        </button>
      </div>
      <button className="menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><i /><i /><i /></button>
      <AnimatePresence>{menuOpen && <motion.nav className="mobile-nav" aria-label="Mobile navigation" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .22 }}>
        <Link to="/sovereign" onClick={close}>SOVEREIGN / NEW</Link><Link to="/collection" onClick={close}>THE COLLECTION</Link><Link to="/story" onClick={close}>THE HOUSE</Link><Link to="/atelier" onClick={close}>THE ATELIER</Link><Link to="/journal" onClick={close}>JOURNAL</Link><Link to="/contact" onClick={close}>CONTACT ↗</Link>
      </motion.nav>}</AnimatePresence>
    </header>
  );
}


function NoteExplorer({ note, setNote }: { note: Note; setNote: (value: Note) => void }) {
  const active = notes[note];
  return (
    <section className="notes-section" id="notes">
      <div className="notes-intro" data-gsap-reveal>
        <p className="eyebrow"><span /> SCENT PROFILE</p>
        <h2>Four notes.<br /><em>One executive signature.</em></h2>
        <p>Tap a note to see where it sits in the composition. Four accords, one executive signature.</p>
        <div className="note-tabs" role="tablist" aria-label="Choose a fragrance note">{(Object.keys(notes) as Note[]).map((key) => <motion.button key={key} role="tab" aria-selected={note === key} className={note === key ? 'note-tab active' : 'note-tab'} onClick={() => setNote(key)} whileTap={{ scale: .97 }}><span>{notes[key].number}</span>{notes[key].title}</motion.button>)}</div>
        <AnimatePresence mode="wait" initial={false}><motion.div className="selected-note" key={note} initial={{ opacity: 0, y: 11 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }} transition={{ duration: .28 }}><span>{active.subtitle}</span><h3>{active.title}</h3><p>{active.copy}</p></motion.div></AnimatePresence>
      </div>
      <figure className="notes-image" data-gsap-reveal><div className="notes-image-frame"><img src="/images/decanter-levitating.jpg" alt="Dayrah Noor 03 crystal decanter levitating, held in golden light" loading="lazy" /></div><figcaption><span>THE MATERIAL</span><span>CRYSTAL / STUDY 01</span></figcaption><span className="image-index">01</span></figure>
    </section>
  );
}

const quizQuestions: QuizQuestion[] = [
  { prompt: 'How should it open?', choices: [
    { title: 'Crisp & decisive', detail: 'Green cardamom with a cold lime edge.', note: 'cardamom' as Note },
    { title: 'Structured & in command', detail: 'A lifted rose heart, held in balance.', note: 'rose' as Note },
    { title: 'Dry & enduring', detail: 'Polished sandalwood that lingers.', note: 'sandalwood' as Note },
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
      setRecommendation(quizQuestions[0].choices[firstAnswer].note ?? 'cardamom');
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
    <section className="finder-section lux-light" id="finder">
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
      <div className="ritual-heading" data-gsap-reveal><p className="eyebrow"><span /> RITUAL</p><h2>Disciplined<br /><em>application.</em></h2><p>Applied with intent. For moments that require control.</p></div>
      <div className="ritual-card" data-gsap-reveal>
        <div className="ritual-card-top"><span>HOW TO WEAR IT</span><span>0{active + 1} / 03</span></div>
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
  return <AnimatePresence>{open && <motion.div className="modal-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="fragrance-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()} initial={{ y: 28, opacity: 0, scale: .98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 18, opacity: 0, scale: .985 }} transition={{ duration: .3, ease: [0.22, 1, 0.36, 1] }}><button className="modal-close" onClick={onClose} aria-label="Close fragrance details">×</button><p className="eyebrow"><span /> DAYRAH / SIGNATURE SCENT</p><h2 id="modal-title">Sifr<sup>01</sup></h2><p className="modal-subtitle">A memory, held in glass.</p><div className="modal-notes"><span>OUD <i /> ROSE <i /> AMBER</span></div><p className="modal-copy">A warm, floral-woody composition, inspired by the scents that turn a moment into a place you remember.</p><a className="modal-contact" href="mailto:hello@dayrah.com">ASK THE ATELIER <span>↗</span></a></motion.div></motion.div>}</AnimatePresence>;
}

function LiquidStudies() {
  return (
    <section className="studies-section" id="studies" data-gsap-reveal>
      <div className="studies-heading">
        <p className="eyebrow"><span /> THE LIQUID STUDIES</p>
        <h2>Liquid in<br /><em>crystal.</em></h2>
        <p>A study set of the house decanter — ingredients suspended in golden liquid, light caught in the facets, and the signature still at rest.</p>
      </div>
      <figure className="studies-feature" data-gsap-reveal>
        <div className="studies-feature__frame">
          <MotionPlate src="/videos/bottle-void.mp4" poster="/images/decanter-levitating.jpg" ariaLabel="The Dayrah Noor 03 decanter rotating in darkness" />
          <img className="studies-feature__fallback" src="/images/decanter-levitating.jpg" alt="" aria-hidden="true" loading="lazy" />
        </div>
        <figcaption><span>00 / THE MUSE</span><b>The decanter, unsupported and weightless</b><p>The object around which everything else settles — turning, unhurried, in the dark.</p></figcaption>
      </figure>
      <div className="studies-motion">
        <p className="studies-motion__label">MOTION PLATES</p>
        <div className="studies-motion__row">
          {[
            { src: '/videos/stopper-unscrew.mp4', title: 'The Opening', frame: 'STOPPER · RELEASED' },
            { src: '/videos/metallic-cap.mp4', title: 'The Fitting', frame: 'COLLAR · SETTLING' },
            { src: '/videos/decanter-glow-01.mp4', title: 'The Glow', frame: 'LIQUID · AGLOW' },
            { src: '/videos/perfume-bursts.mp4', title: 'The Release', frame: 'FIVE MOVEMENTS · UNCORKED' },
          ].map((plate) => (
            <figure className="studies-motion__plate" key={plate.src}>
              <MotionPlate src={plate.src} poster="/images/decanter-glowing.jpg" ariaLabel={`Motion study of the decanter: ${plate.title}`} />
              <figcaption><b>{plate.title}</b><i>{plate.frame}</i></figcaption>
            </figure>
          ))}
        </div>
      </div>
      <div className="studies-grid" data-gsap-reveal>
        {[
          { n: '01', src: '/images/botanicals-in-liquid.jpg', title: 'The Infusion', copy: 'Rose petals, lime wheels, cardamom pods, and sandalwood shards — suspended, never lost.', frame: 'BOTANICALS IN GOLDEN LIQUID' },
          { n: '02', src: '/images/botanicals-swirl.jpg', title: 'The Swirl', copy: 'The ingredients in patient motion through the heart of the composition.', frame: 'CARDAMOM · ROSE · SANDALWOOD' },
          { n: '03', src: '/images/bottle-suspended.jpg', title: 'The Suspension', copy: 'Held between air and surface, exactly where attention is meant to rest.', frame: 'CRYSTAL · AIR · GOLD' },
          { n: '04', src: '/images/perfume-burst.jpg', title: 'The Release', copy: 'The notes escaping the decanter — weight, then air.', frame: 'THE SIGNATURE UNCORKED' },
          { n: '05', src: '/images/bottle-floor.jpg', title: 'The Quiet', copy: 'At rest on the studio floor, still the centre of the room.', frame: 'THE DECANTER AT REST' },
          { n: '06', src: '/images/sovereign-04-macro.jpg', title: 'The Macro', copy: 'Real glass in real light — refraction without render.', frame: 'REAL LIGHT STUDY' },
        ].map((study) => (
          <figure className="studies-card" key={study.n}>
            <div className="studies-card__frame"><img src={study.src} alt={`Dayrah Noor 03 study ${study.n}: ${study.title}`} loading="lazy" /><span>{study.frame}</span></div>
            <figcaption><b>{study.title}</b><p>{study.copy}</p><i>STUDY {study.n}</i></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* Noor Essence — full-bleed cinematic interlude on the noor-essence film.
   Scroll choreography lives in the global useGSAP block below (clip reveal,
   video parallax scrub, gold progress hairline), so this stays declarative. */
function NoorEssence() {
  return (
    <section className="essence-cine" id="essence-cine" aria-label="Noor, the essence">
      <div className="essence-cine__media" aria-hidden="true">
        <div className="essence-cine__frame">
          <MotionPlate className="essence-cine__video" src="/videos/noor-essence.mp4" poster="/images/noor-03.jpg" ariaLabel="Noor essence — golden perfume in slow motion" />
        </div>
        <span className="essence-cine__veil" />
        <span className="essence-cine__grain" />
      </div>
      <div className="essence-cine__copy" data-gsap-reveal>
        <p className="eyebrow"><span /> NOOR — THE ESSENCE</p>
        <h2>Wear the light<br /><em>you carry.</em></h2>
        <p>Noor is the house study of radiance — cold lime and green cardamom folded into a structured rose, set down softly on dry sandalwood. It does not project across the room. It changes the air around the wrist.</p>
      </div>
      <div className="essence-cine__movements">
        {[
          { n: 'I', title: 'THE ARRIVAL', copy: 'Cardamom and lime strike first — bright, deliberate, gone before they are named.', tag: 'TOP · 0–20 MIN' },
          { n: 'II', title: 'THE BLOOM', copy: 'Rose opens at the heart, petal by petal, warmed from beneath by the spice it follows.', tag: 'HEART · 20 MIN – 4 HRS' },
          { n: 'III', title: 'THE STAY', copy: 'Dry sandalwood holds the trace for hours — a quiet signature on skin, cloth, and collar.', tag: 'BASE · 4–10 HRS' },
        ].map((movement) => (
          <article className="essence-cine__movement" key={movement.n} data-reveal-up>
            <span>{movement.n}</span>
            <b>{movement.title}</b>
            <p>{movement.copy}</p>
            <i>{movement.tag}</i>
          </article>
        ))}
      </div>
      <div className="essence-cine__foot" data-gsap-reveal>
        <Link className="text-link" to="/sovereign">ENTER THE FILM <span>→</span></Link>
        <p className="essence-cine__spec">EAU DE PARFUM · 100 ML · 21% PARFUM</p>
        <div className="essence-cine__progress" aria-hidden="true"><i /></div>
      </div>
    </section>
  );
}

function SovereignFeature() {
  return (
    <section className="sovereign-feature" id="sovereign-feature-section" aria-labelledby="sovereign-feature-title">
<Link to="/sovereign" className="sovereign-feature__visual" aria-label="Discover DAYRAH NOOR 03">
        <img src="/images/sovereign-05.jpg" alt="DAYRAH NOOR 03 crystal decanter with gold collar and golden liquid" loading="lazy" />
        <span>DAYRAH NOOR 03&nbsp; / &nbsp;EAU DE PARFUM · 100 ML</span>
      </Link>
      <div className="sovereign-feature__copy" data-gsap-reveal>
        <p className="eyebrow"><span /> DAYRAH NOOR 03</p>
        <h2 id="sovereign-feature-title">Quiet Power<br /><em>Built for boardroom presence.</em></h2>
        <p>Engineered for quiet command. Measured restraint. Unrivalled precision.</p>
        <Link to="/sovereign" className="text-link">DISCOVER THE COMPOSITION <span>→</span></Link>
      </div>
    </section>
  );
}

function HomePage({ note, setNote }: { note: Note; setNote: (note: Note) => void; onOpenDetails: () => void; booted: boolean }) {
  return (
    <main className="home-page">
      <SovereignFilm galleryId="sovereign-feature-section" elementsId="sovereign-elements-home" />
      <SovereignVisualElementsSection id="sovereign-elements-home" />
      <SovereignFeature />
      <EssenceFilm scrollTo="#notes" preload="metadata" />
      <NoteExplorer note={note} setNote={setNote} />
      <LiquidStudies />
      <NoorEssence />
      <section className="home-signature lux-light">
        <div className="home-signature__copy"><p className="eyebrow"><span /> THE HOUSE SIGNATURE</p><h2>Noor<sup>03</sup><br /><em>Presence, measured.</em></h2><p>Cardamom at the top. Rose at the heart. Sandalwood in the trace. The executive composition behind Dayrah's house signature.</p><Link to="/sovereign" className="text-link">DISCOVER NOOR 03 <span>→</span></Link></div>
        <Link to="/sovereign" className="home-signature__image" aria-label="Discover Noor 03"><img src="/images/decanter-studio.jpg" alt="Dayrah Noor 03 crystal decanter rotating in the studio, golden liquid" loading="lazy" /><span>03 / NOOR — THE SIGNATURE</span></Link>
      </section>
      <section className="shelf-section">
        <div className="shelf-section__head" data-gsap-reveal>
          <p className="eyebrow"><span /> THE ATELIER SHELF</p>
          <h2>DAYRAH NOOR 03<br /><em>EAU DE PARFUM 100ML.</em></h2>
          <Link className="text-link" to="/collection">ADD TO COLLECTION <span>↗</span></Link>
        </div>
        <ShopGrid items={products} carousel />
      </section>
      
      <ReviewsStrip />
      <ScentFinder onChooseNote={setNote} />
      <RitualGuide />
      <Atelier />
      <section className="home-pages lux-light"><p className="eyebrow"><span /> CONTINUE EXPLORING</p><div><Link to="/collection">THE COLLECTION <span>↗</span></Link><Link to="/story">THE HOUSE <span>↗</span></Link><Link to="/journal">FIELD NOTES <span>↗</span></Link></div></section>
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
  const [note, setNote] = useState<Note>('cardamom');
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
      '/': { title: 'Dayrah — The Art of Perfumery', description: 'DAYRAH NOOR 03 Eau de Parfum 100ml — cardamom, lime, rose and sandalwood. An executive composition for boardroom presence and quiet power.' },
      '/collection': { title: 'The Collection — Dayrah', description: 'Explore Dayrah fragrances, including the new Sovereign composition and the Sifr 01 signature.' },
      '/sovereign': { title: 'Dayrah Noor 03 — Dayrah', description: 'Explore Dayrah Noor 03, a new Dayrah eau de parfum for boardroom presence and quiet power.' },
      '/sifr-01': { title: 'Sifr 01 — Dayrah', description: 'Sifr 01 — a memory, held in glass. Oud, rose and amber in the house signature composition.' },
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
    gsap.utils.toArray<HTMLElement>('.notes-image-frame,.atelier-frame,.story-image-band,.journal-card__image,.essence-cine__frame').forEach((frame) => {
      gsap.fromTo(frame, { clipPath: 'inset(9% 7% 9% 7%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'power3.out', scrollTrigger: { trigger: frame, start: 'top 82%', once: true } });
    });
    gsap.utils.toArray<HTMLElement>('.notes-image-frame img,.atelier-frame img,.story-image-band img,.journal-card__image img,.essence-cine__video').forEach((image) => {
      gsap.fromTo(image, { scale: 1.12, yPercent: -4 }, { scale: 1, yPercent: 4, ease: 'none', scrollTrigger: { trigger: image, start: 'top bottom', end: 'bottom top', scrub: .7 } });
    });
    /* Noor Essence progress hairline — fills as the interlude scrolls through. */
    gsap.utils.toArray<HTMLElement>('.essence-cine__progress i').forEach((bar) => {
      gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.essence-cine', start: 'top 65%', end: 'bottom 75%', scrub: .5 } });
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
            <Route path="/sifr-01" element={<SifrPage />} />
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
