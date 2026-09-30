import { lazy, Suspense, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import SovereignFilm from './components/SovereignFilm';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { CanvasBoundary } from './components/CanvasBoundary';
import { products } from './shop/products';
import { BuyPanel, ProductCard, ReviewsStrip, ShopGrid } from './shop/ShopSections';
import { sovereignFilmFrames, sovereignVisualElements } from './sovereign';

const PerfumeScene = lazy(() => import('./components/PerfumeScene'));
type Note = 'oud' | 'rose' | 'amber';
const noteCopy: Record<Note, { title: string; role: string; body: string; color: string }> = {
  oud: { title: 'Oud', role: 'THE FOUNDATION', body: 'Dark, resinous and textured. The grounded opening gives the composition its quiet depth.', color: '#79513c' },
  rose: { title: 'Rose', role: 'THE HEART', body: 'A petal-bright floral heart brings contrast and lift, held in balance rather than sweetness.', color: '#a95d6f' },
  amber: { title: 'Amber', role: 'THE TRACE', body: 'A warm, golden finish settles close to the skin and gives the scent its lingering softness.', color: '#b88045' },
};

const filmBeats = [
  { title: 'A form in shadow.', label: '01 / THE OBJECT', copy: 'A clear silhouette emerges slowly. Light finds the glass before the fragrance reveals itself.' },
  { title: 'The material, held.', label: '02 / THE MATERIAL', copy: 'Amber warmth, a considered label, and the precise weight of a cap. Every detail begins with touch.' },
  { title: 'A bloom in motion.', label: '03 / THE RELEASE', copy: 'The cap lifts. Petals move into the air. The still object becomes a memory in motion.' },
  { title: 'What remains.', label: '04 / THE TRACE', copy: 'The movement settles into a quiet warmth: oud, rose, and amber, held close.' },
];

export function ProductFilm({ note }: { note: Note }) {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const fillRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLElement>(null);
  const [beat, setBeat] = useState(0);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progress.current = self.progress;
        if (fillRef.current) fillRef.current.style.transform = `scaleX(${self.progress})`;
        if (frameRef.current) frameRef.current.textContent = String(Math.round(self.progress * 239)).padStart(3, '0');
        const next = Math.min(filmBeats.length - 1, Math.floor(self.progress * filmBeats.length));
        setBeat((current) => current === next ? current : next);
      },
    });
    return () => trigger.kill();
  }, { scope: sectionRef });

  const jumpTo = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const distance = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top + distance * index / (filmBeats.length - 1), behavior: 'smooth' });
  };

  const active = filmBeats[beat];
  return (
    <section className="product-film" ref={sectionRef} aria-label="Scroll-controlled fragrance film">
      <div className="product-film__stage">
        <div className="product-film__wash" />
        <div className="product-film__grain" />
        <CanvasBoundary fallback={<div className="product-film__loading" />}>
          <Suspense fallback={<div className="product-film__loading" />}><PerfumeScene progress={progress} note={note} /></Suspense>
        </CanvasBoundary>
        <div className="product-film__top"><span>DAYRAH / SIFR 01</span><span>SCROLL-SCRUBBED 3D FILM</span></div>
        <div className="product-film__layout">
          <div className="product-film__copy" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={beat} initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0)' }} exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }} transition={{ duration: .5, ease: [0.22, 1, .36, 1] }}>
                <p className="product-film__kicker">{active.label}</p>
                <h1>{active.title.split(' ').slice(0, -1).join(' ')}<br /><em>{active.title.split(' ').slice(-1)}</em></h1>
                <p className="product-film__description">{active.copy}</p>
              </motion.div>
            </AnimatePresence>
            <Link className="product-film__link" to="/contact">ASK THE HOUSE <span>↗</span></Link>
          </div>
          <div className="product-film__index"><span>FRAME <b ref={frameRef}>000</b> / 240</span><span className="product-film__line" /><span>DRAG TO TURN THE BOTTLE</span></div>
        </div>
        <div className="product-film__chapters" aria-label="Film chapters">{filmBeats.map((item, index) => <button key={item.label} className={beat === index ? 'is-active' : ''} onClick={() => jumpTo(index)} aria-label={`Go to ${item.label.toLowerCase()}`}><span>0{index + 1}</span><i /></button>)}</div>
        <div className="product-film__progress"><div ref={fillRef} /></div>
      </div>
    </section>
  );
}

export function CollectionPage() {
  return (
    <motion.div className="editorial-page collection-page" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: [0.22, 1, .36, 1] }}>
      <section className="collection-hero">
        <div className="collection-hero__copy"><p className="eyebrow"><span /> THE DAYRAH COLLECTION</p><h1>One scent.<br /><em>Many ways to feel.</em></h1><p>A single signature composition, explored through its three defining notes: oud, rose, and amber.</p><Link className="text-link" to="/sifr-01">DISCOVER SIFR 01 <span>↗</span></Link></div>
        <figure className="collection-hero__image"><img src="/images/dayrah-cinematic-campaign.webp" alt="Conceptual Dayrah campaign image with an amber glass bottle and drifting rose petals" /><figcaption>STUDY 01&nbsp; / &nbsp;THE SIGNATURE</figcaption><span className="collection-hero__seal">D<br /><i>01</i></span></figure>
        <div className="collection-hero__side">A MODERN RITUAL<br />ROOTED IN PERFUMERY</div>
      </section>
      <section className="collection-shelf" id="shop">
        <div className="collection-shelf__head" data-gsap-reveal>
          <p className="eyebrow"><span /> THE SHELF / THE DAYRAH WARDROBE</p>
          <h2>Choose your<br /><em>signature.</em></h2>
          <p>Five compositions, one point of view. Every bottle ships with two samples of the house — complimentary over $250.</p>
        </div>
        <ShopGrid items={products} />
      </section>
      <section className="accord-collection" id="accords">
        <div className="accord-collection__heading"><p className="eyebrow"><span /> THE OLFACTIVE PALETTE</p><h2>Three notes.<br /><em>One composition.</em></h2><p>Each accord has its own character. Together, they create the arc of Sifr 01.</p></div>
        <div className="accord-grid">{(Object.keys(noteCopy) as Note[]).map((key, index) => <Link to={`/sifr-01#${key}`} className={`accord-card accord-card--${key}`} key={key}><div className="accord-card__art" style={{ '--accord-color': noteCopy[key].color } as CSSProperties}><span className="accord-card__number">0{index + 1}</span><div className="accord-card__orb" /><span className="accord-card__vertical">DAYRAH / OLFACTIVE STUDY</span></div><div className="accord-card__text"><span>{noteCopy[key].role}</span><h3>{noteCopy[key].title}</h3><p>{noteCopy[key].body}</p><i>EXPLORE NOTE&nbsp; ↗</i></div></Link>)}</div>
      </section>
      <section className="collection-foot"><p>THE HOUSE SIGNATURE</p><h2>Sifr<sup>01</sup></h2><p>Oud at the foundation. Rose at the heart. Amber in the trace.</p><Link to="/sifr-01" className="button-outline">ENTER THE FRAGRANCE <span>↗</span></Link></section>
    </motion.div>
  );
}

export function SovereignVisualElementsSection({ id = 'sovereign-elements' }: { id?: string }) {
  return (
    <section className="sovereign-elements" id={id} aria-labelledby="sovereign-elements-title">
      <div className="sovereign-elements__head" data-gsap-reveal>
        <p className="eyebrow"><span /> VISUAL ELEMENTS ESTABLISHED FIRST</p>
        <h2 id="sovereign-elements-title">The Obsidian Void &amp;<br /><em>Sovereign Architecture.</em></h2>
        <p>Before generating the five scene frames, reference studies establish the location, the faceted DAYRAH SCENTS crystal flacon, the hyper-realistic botanical infusions, and the 3200K overhead volumetric lighting rig.</p>
      </div>
      <div className="sovereign-elements__grid">
        {sovereignVisualElements.map((element) => (
          <article className="sovereign-element-card" key={element.id} data-gsap-reveal>
            <div className="sovereign-element-card__media">
              <img src={element.src} alt={element.alt} loading="lazy" />
              <span className="sovereign-element-card__badge">{element.category}</span>
            </div>
            <div className="sovereign-element-card__body">
              <span className="sovereign-element-card__subtitle">{element.subtitle}</span>
              <h3>{element.name}</h3>
              <p>{element.description}</p>
              <div className="sovereign-element-card__specs">
                {element.specs.map((spec) => (
                  <span key={spec}>{spec}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SovereignPage() {
  const product = products.find((item) => item.slug === 'sovereign');
  if (!product) return null;
  const otherProducts = products.filter((item) => item.slug !== product.slug);

  return (
    <motion.div className="editorial-page sovereign-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .65 }}>
      <div className="page-breadcrumb"><Link to="/collection">THE COLLECTION</Link><span>/</span><span>DAYRAH SCENTS — THE SOVEREIGN FILM</span></div>
      <SovereignFilm galleryId="sovereign-gallery" elementsId="sovereign-elements" />

      <SovereignVisualElementsSection id="sovereign-elements" />

      <section className="sovereign-gallery" id="sovereign-gallery" aria-labelledby="sovereign-gallery-title">
        <div className="sovereign-gallery__head" data-gsap-reveal>
          <p className="eyebrow"><span /> SCENE FRAMES (0–10 SECONDS) / THE SOVEREIGN FILM</p>
          <h2 id="sovereign-gallery-title">Five frames,<br /><em>one alchemical arc.</em></h2>
          <p>From the suspended crystal flacon in the Obsidian Void to the final glowing amber light-box and magnetic 24k gold cap click, every scene frame is inscribed with DAYRAH SCENTS.</p>
        </div>
        <div className="sovereign-gallery__grid">
          {sovereignFilmFrames.map((frame, index) => (
            <figure className={`sovereign-gallery__figure sovereign-gallery__figure--${index + 1}`} key={frame.src} data-gsap-reveal>
              <div className="sovereign-gallery__frame"><img src={frame.src} alt={frame.alt} loading="lazy" /></div>
              <figcaption><span>FRAME 0{frame.frameNumber} / DAYRAH SCENTS</span><span>{frame.caption}</span></figcaption>
              <div className="sovereign-gallery__meta">
                <h3>{frame.context}</h3>
                <p>{frame.action}</p>
                <div className="sovereign-gallery__specs">
                  <div><b>CAMERA ANGLE</b>{frame.cameraAngle}</div>
                  <div><b>LIGHTING</b>{frame.lighting}</div>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </section>

      <section className="sovereign-composition">
        <div className="sovereign-composition__copy">
          <p className="eyebrow"><span /> BOTANICAL INFUSIONS &amp; ALCHEMY / NO. 04</p>
          <h2>Nature, captured<br /><em>in crystal.</em></h2>
          <p>Deep velvet-red rose petals, textured green cardamom pods, translucent green bergamot slices, and raw aromatic sandalwood swirl in crystal-clear liquid before shifting through blushing rose gold into a deep, glowing amber.</p>
          <Link to="#sovereign-buy" className="sovereign-composition__link">ACQUIRE THE SOVEREIGN <span>↓</span></Link>
        </div>
        <div className="sovereign-composition__notes" aria-label="Sovereign botanical infusions">
          {[
            ['01', 'VELVET-RED ROSE PETALS', 'DEEP FLORAL HEART · INTERNAL VORTEX'],
            ['02', 'GREEN CARDAMOM PODS', 'VISIBLE FIBERS · WARM AROMATIC SPICE'],
            ['03', 'GREEN BERGAMOT SLICES', 'TRANSLUCENT ZEST PORES · TOP RADIANCE'],
            ['04', 'RAW SANDALWOOD & AMBER', 'BLUSHING ROSE GOLD TO DEEP AMBER GLOW'],
          ].map(([number, note, role]) => (
            <div className="sovereign-composition__note" key={number}><span>{number}</span><b>{note}</b><i>{role}</i></div>
          ))}
        </div>
      </section>

      <section className="sovereign-buy" id="sovereign-buy">
        <figure className="sovereign-buy__image" data-gsap-reveal>
          <img src="/images/sovereign-05.jpg" alt="DAYRAH SCENTS The Sovereign glowing amber crystal bottle reflected in the polished dark obsidian floor" loading="lazy" />
          <figcaption>DAYRAH SCENTS&nbsp; / &nbsp;THE SOVEREIGN — ETERNAL. REFINED.</figcaption>
        </figure>
        <BuyPanel product={product} />
      </section>

      <ReviewsStrip product={product} />

      <section className="also-like sovereign-related">
        <div className="also-like__head"><p className="eyebrow"><span /> CONTINUE THE WARDROBE</p><h2>Another note<br /><em>to discover.</em></h2></div>
        <div className="shop-grid">{otherProducts.map((item) => <ProductCard key={item.slug} product={item} reveal={false} />)}</div>
      </section>
    </motion.div>
  );
}

export function SifrPage({ note, setNote }: { note: Note; setNote: (note: Note) => void }) {
  return (
    <motion.div className="editorial-page sifr-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .65 }}>
      <div className="page-breadcrumb"><Link to="/collection">THE COLLECTION</Link><span>/</span><span>SIFR 01</span></div>
      <ProductFilm note={note} />
      <section className="sifr-note-story">
        <div className="sifr-note-story__intro"><p className="eyebrow"><span /> THE COMPOSITION</p><h2>Follow the<br /><em>changing light.</em></h2><p>Explore the three accords and watch the liquid tint shift with your selection.</p></div>
        <div className="sifr-note-story__selector" role="tablist" aria-label="Sifr 01 accords">{(Object.keys(noteCopy) as Note[]).map((key, index) => <button id={key} role="tab" aria-selected={note === key} className={note === key ? 'sifr-note is-active' : 'sifr-note'} onClick={() => setNote(key)} key={key}><span>0{index + 1}</span><b>{noteCopy[key].title}</b><i>{noteCopy[key].role}</i></button>)}</div>
        <AnimatePresence mode="wait"><motion.div key={note} className="sifr-note-story__detail" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .3 }}><span>{noteCopy[note].role}</span><h3>{noteCopy[note].title}</h3><p>{noteCopy[note].body}</p></motion.div></AnimatePresence>
      </section>
      <section className="sifr-buy">
        <figure className="sifr-buy__media" data-gsap-reveal>
          <img src="/images/dayrah-cinematic-campaign.webp" alt="Sifr 01 amber glass bottle amid rose petals and golden light" loading="lazy" />
          <figcaption>THE SIGNATURE / SIFR 01</figcaption>
        </figure>
        <BuyPanel product={products[0]} />
      </section>
      <section className="sifr-bottle-card"><div className="sifr-bottle-card__image"><img src="/images/dayrah-cinematic-campaign.webp" alt="Conceptual Dayrah campaign image with an amber glass bottle, petals, and volumetric light" loading="lazy" /><span>OBJECT STUDY / SIFR 01</span></div><div className="sifr-bottle-card__copy"><p className="eyebrow"><span /> THE SIGNATURE</p><h2>A memory,<br /><em>held in glass.</em></h2><p>Sifr 01 is the house's point of departure: a study in contrast, with deep woods, a lifted floral heart, and a close amber finish.</p><Link to="/contact" className="text-link">ENQUIRE ABOUT SIFR 01 <span>↗</span></Link></div></section>
      <section className="sifr-final"><span>DAYRAH / SIFR 01</span><h2>Wear the<br /><em>moment.</em></h2><Link to="/contact" className="button-outline">A NOTE TO THE HOUSE <span>↗</span></Link></section>
    </motion.div>
  );
}

export function StoryPage() {
  return (
    <motion.div className="editorial-page story-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
      <section className="story-masthead"><p className="eyebrow"><span /> THE HOUSE OF DAYRAH</p><h1>Memory has<br /><em>a language.</em></h1><p>We speak it through scent: with the depth of oud, the tenderness of rose, and the warmth that lingers.</p><div className="story-masthead__stamp">A HOUSE<br />IN SCENT<br /><i>01 / 03</i></div></section>
      <section className="story-image-band"><img src="/images/perfumer-at-work.jpg" alt="A perfumer arranging materials at a work table" loading="lazy" /><div><span>THE ART OF COMPOSITION</span><p>Material, memory,<br /><em>and time.</em></p></div></section>
      <section className="story-manifesto"><p className="eyebrow"><span /> OUR POINT OF VIEW</p><blockquote>“A fragrance should not announce everything at once. It should invite you closer.”</blockquote><p className="story-manifesto__note">DAYRAH / A STUDY IN SLOW REVEAL</p></section>
      <section className="story-pillars">{[{ n: '01', title: 'Rooted in ritual', text: 'Oud, resins, smoke, and the gestures that make scent part of a day.' }, { n: '02', title: 'Made of contrast', text: 'A fragrance becomes memorable when depth and light are allowed to meet.' }, { n: '03', title: 'Worn personally', text: 'The same notes settle differently on every wearer. That is part of the story.' }].map((pillar) => <article key={pillar.n}><span>{pillar.n} / DAYRAH</span><h3>{pillar.title}</h3><p>{pillar.text}</p></article>)}</section>
      <section className="story-end"><p className="eyebrow"><span /> BEGIN WITH SIFR 01</p><h2>Let the scent<br /><em>say the rest.</em></h2><Link to="/sifr-01" className="button-outline">DISCOVER THE SIGNATURE <span>↗</span></Link></section>
    </motion.div>
  );
}

export function AtelierPage() {
  return (
    <motion.div className="editorial-page atelier-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
      <section className="atelier-masthead"><div><p className="eyebrow"><span /> THE ATELIER</p><h1>Patience is<br /><em>an ingredient.</em></h1><p>A look at the ideas, materials, and deliberate gestures behind the Dayrah point of view.</p></div><figure><img src="/images/perfumer-at-work.jpg" alt="Hands at work among glass vessels and perfumery materials" /><figcaption>THE PERFUMER'S TABLE / STUDY 01</figcaption></figure></section>
      <section className="atelier-process"><div className="atelier-process__head"><p className="eyebrow"><span /> A QUIET PROCESS</p><h2>From first thought<br /><em>to final trace.</em></h2></div><div className="atelier-process__steps">{[{n:'01',title:'Listen',text:'Begin with a memory, a place, a material, or a feeling worth returning to.'},{n:'02',title:'Compose',text:'Balance contrasts. Give each accord space to speak without overwhelming the others.'},{n:'03',title:'Wear',text:'Let skin, time, and the wearer complete the composition.'}].map((step)=><article key={step.n}><span>{step.n} / THE ATELIER</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></section>
      <section className="atelier-materials"><div className="atelier-materials__image"><img src="/images/perfume-warm-still-life.jpg" alt="Warm light falls across a perfume still life" loading="lazy" /></div><div><p className="eyebrow"><span /> MATERIAL & MEMORY</p><h2>Considered<br /><em>in every detail.</em></h2><p>Our visual language draws on the tactility of glass, the warmth of resins, and the quiet elegance of Arabic perfumery.</p><Link to="/collection" className="text-link">EXPLORE THE COLLECTION <span>↗</span></Link></div></section>
    </motion.div>
  );
}

const journalEntries = [
  { n: '01', category: 'THE RITUAL', title: 'A fragrance, worn slowly', copy: 'A note on the moments before the day begins, and why a scent ritual can be personal without being complicated.', image: '/images/perfumer-at-work.jpg' },
  { n: '02', category: 'THE MATERIAL', title: 'The warmth of amber', copy: 'Amber is less a single note than a feeling: rounded, resinous, and close to the skin.', image: '/images/dayrah-cinematic-campaign.webp' },
  { n: '03', category: 'THE PALETTE', title: 'Oud, rose, and contrast', copy: 'A study in the way a dark wood and a luminous floral can make each other more vivid.', image: '/images/perfume-warm-still-life.jpg' },
];

export function JournalPage() {
  return (
    <motion.div className="editorial-page journal-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
      <section className="journal-masthead"><p className="eyebrow"><span /> FIELD NOTES FROM DAYRAH</p><h1>Notes on<br /><em>the art of scent.</em></h1><p>Short reflections on material, memory, and the rituals that give a fragrance its place.</p></section>
      <div className="journal-grid">{journalEntries.map((entry) => <article className="journal-card" key={entry.n}><div className="journal-card__image"><img src={entry.image} alt="" loading="lazy" /><span>{entry.n} / DAYRAH JOURNAL</span></div><div className="journal-card__copy"><p>{entry.category}</p><h2>{entry.title}</h2><span>{entry.copy}</span><Link to="/story">READ THE HOUSE STORY <i>↗</i></Link></div></article>)}</div>
      <section className="journal-bottom"><span>DAYRAH / FIELD NOTES</span><p>Thoughtfully composed.<br /><em>Slowly discovered.</em></p><Link to="/collection" className="text-link">RETURN TO THE SCENT <span>↗</span></Link></section>
    </motion.div>
  );
}

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`A note to Dayrah from ${form.get('name')}`);
    const body = encodeURIComponent(`Name: ${form.get('name')}\nEmail: ${form.get('email')}\n\n${form.get('message')}`);
    setSent(true);
    window.location.href = `mailto:hello@dayrah.com?subject=${subject}&body=${body}`;
  };
  return (
    <motion.div className="editorial-page contact-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
      <section className="contact-intro"><p className="eyebrow"><span /> CORRESPONDENCE</p><h1>A conversation<br /><em>begins here.</em></h1><p>Questions about Sifr 01, the house, or the ritual of wearing fragrance? Send us a note.</p><div className="contact-detail"><span>THE HOUSE</span><a href="mailto:hello@dayrah.com">hello@dayrah.com ↗</a></div><small>Contact details are placeholders until the brand's official information is supplied.</small></section>
      <form className="contact-form" onSubmit={submit}><div className="contact-form__top"><span>WRITE TO DAYRAH</span><span>01 / 01</span></div><label>Your name<input name="name" required autoComplete="name" placeholder="Name" /></label><label>Email address<input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label><label>Your note<textarea name="message" required rows={5} placeholder="How may we help?" /></label><button type="submit" className="button-outline">{sent ? 'OPENING YOUR EMAIL' : 'PREPARE YOUR NOTE'} <span>↗</span></button><p>Your email app will open with the message prepared. No details are stored on this site.</p></form>
      <section className="contact-close"><span>DAYRAH / FRAGRANCE HOUSE</span><p>Leave room<br /><em>for the unexpected.</em></p><Link to="/">RETURN TO THE BEGINNING ↑</Link></section>
    </motion.div>
  );
}
