import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from './CartContext';
import { formatPrice, type Product } from './products';

/* ---------- Product card with quick-add ---------- */
export function ProductCard({ product, reveal = true }: { product: Product; reveal?: boolean }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const from = formatPrice(product.sizes[0].price);
  const quickAdd = () => {
    addItem(product, product.sizes[0]);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };
  return (
    <article className="product-card" {...(reveal ? { 'data-gsap-reveal': true } : {})}>
      <Link to={`/product/${product.slug}`} className="product-card__frame" aria-label={`Discover ${product.name}`}>
        <img src={product.image} alt={product.imageAlt} loading="lazy" />
        <span className="product-card__shade" aria-hidden="true" />
        {product.badge && <span className="product-card__badge">{product.badge}</span>}
        <span className="product-card__index">{product.index} / DAYRAH</span>
        <span className="product-card__cta">DISCOVER <i>↗</i></span>
      </Link>
      <div className="product-card__meta">
        <div className="product-card__name">
          <h3><Link to={`/product/${product.slug}`}>{product.name}</Link></h3>
          <span className="product-card__price">EAU DE PARFUM / FROM {from}</span>
        </div>
        <p className="product-card__notes">{product.notes.join(' · ')}</p>
        <button className="product-card__add" onClick={quickAdd} aria-live="polite">{added ? 'ADDED TO BAG ✓' : 'QUICK ADD'}</button>
      </div>
    </article>
  );
}

/* ---------- Dayrah ring carousel (home shelf) ----------
   Our products on a 3D rotating ring in the spirit of the classic CSS-only
   carousel: auto-rotation, hover glow + pop-forward, floor reflection and a
   ground shadow — with our names, notes, prices, quick-add and arrows. */
function DayrahCarousel({ items }: { items: Product[] }) {
  const { addItem } = useCart();
  const [frontIdx, setFrontIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const pauseRef = useRef(false);
  const inViewRef = useRef(true);
  const kickRef = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const targetRef = useRef(0);
  const n = items.length;
  const step = 360 / n;
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Low-power mode (phones): the GPU can't sustain a 60fps 3D scene with
  // fifteen live-blurred reflections — that combination kills old phone tabs
  // right on this section. Phones get stepped rotation (static between
  // steps) with reflections removed by CSS below.
  const lowPower =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse) and (max-width: 760px)').matches;

  const syncFront = (value: number) => {
    const idx = ((-Math.round(value / step)) % n + n) % n;
    setFrontIdx((prev) => (prev === idx ? prev : idx));
  };
  const applyTransform = (value: number) => {
    const ring = ringRef.current;
    if (ring) ring.style.transform = `rotateY(${value}deg)`;
  };

  /* Continuous glide: the target drifts at a slow constant rate and the ring
     eases toward it every frame — one full revolution per ~45 seconds.
     Freezes while hovered, touched, tabbed-through, hidden, or offscreen.
     Low-power phones instead step one cell per tick (the GPU idles between
     steps) with a CSS transition smoothing each step. */
  useEffect(() => {
    if (reduceMotion) return;
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => { inViewRef.current = entry.isIntersecting; }, { threshold: 0.1 });
    observer.observe(el);
    if (lowPower) {
      const id = window.setInterval(() => {
        if (pauseRef.current || document.hidden || !inViewRef.current) return;
        targetRef.current -= step;
        offsetRef.current = targetRef.current;
        applyTransform(offsetRef.current);
        syncFront(offsetRef.current);
      }, 3200);
      return () => { window.clearInterval(id); observer.disconnect(); };
    }
    const SPEED = 360 / 45000; // degrees per millisecond
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      const kicked = now < kickRef.current;
      if ((!pauseRef.current || kicked) && !document.hidden && inViewRef.current) {
        targetRef.current -= SPEED * dt;
        offsetRef.current += (targetRef.current - offsetRef.current) * 0.12;
        if (Math.abs(targetRef.current - offsetRef.current) < 0.01) offsetRef.current = targetRef.current;
        applyTransform(offsetRef.current);
        syncFront(offsetRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); };
  }, [reduceMotion, step, n, lowPower]);

  const go = (direction: 1 | -1) => {
    targetRef.current = Math.round(targetRef.current / step) * step - direction * step;
    // A deliberate tap always animates, even mid-hover-pause.
    kickRef.current = performance.now() + 1500;
    if (reduceMotion || lowPower) {
      offsetRef.current = targetRef.current;
      applyTransform(offsetRef.current);
      syncFront(offsetRef.current);
    }
  };
  const front = items[frontIdx];
  const quickAdd = () => {
    addItem(front, front.sizes[0]);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };
  return (
    <div
      className="dayrah-carousel"
      ref={wrapRef}
      style={{ '--dc-n': n } as CSSProperties}
      onPointerEnter={() => { pauseRef.current = true; }}
      onPointerLeave={() => { pauseRef.current = false; }}
      onPointerDown={() => { pauseRef.current = true; }}
      onPointerUp={() => { pauseRef.current = false; }}
      onFocus={() => { pauseRef.current = true; }}
      onBlur={() => { pauseRef.current = false; }}
    >
      <div className="dayrah-carousel__stage" data-gsap-reveal>
        <ul className="dayrah-carousel__ring" ref={ringRef}>
          {items.map((product, index) => (
            <li
              key={product.slug}
              className="dayrah-carousel__cell"
              style={{ '--dc-index': index, '--_image-url': `url("${product.image}")` } as CSSProperties}
            >
              <Link to={`/product/${product.slug}`} className="dayrah-carousel__card" aria-label={`Discover ${product.name}`}>
                <img src={product.image} alt={product.imageAlt} loading="lazy" decoding="async" />
                {product.badge && <span className="dayrah-carousel__badge">{product.badge}</span>}
                <span className="dayrah-carousel__num">{product.index}</span>
                <span className="sr-only">{product.name} — eau de parfum, from {formatPrice(product.sizes[0].price)}</span>
              </Link>
            </li>
          ))}
          <li className="dayrah-carousel__ground" aria-hidden="true" />
        </ul>
      </div>
      <div className="dayrah-carousel__readout" key={front.slug} data-gsap-reveal>
        <p className="dayrah-carousel__kicker">{front.index} / {String(n).padStart(2, '0')} — DAYRAH</p>
        <h3><Link to={`/product/${front.slug}`}>{front.name}</Link></h3>
        <p className="dayrah-carousel__notes">{front.notes.join(' · ')}</p>
        <p className="dayrah-carousel__price">EAU DE PARFUM / FROM {formatPrice(front.sizes[0].price)}</p>
        <div className="dayrah-carousel__actions">
          <button type="button" className="product-card__add" onClick={quickAdd} aria-live="polite">{added ? 'ADDED TO BAG ✓' : 'QUICK ADD'}</button>
          <Link className="text-link" to={`/product/${front.slug}`}>DISCOVER <span>↗</span></Link>
        </div>
      </div>
      <div className="shop-carousel__nav">
        <button type="button" className="shop-carousel__arrow" onClick={() => go(-1)} aria-label="Rotate products backward">←</button>
        <span>{n} COMPOSITIONS — AUTO-SCROLL</span>
        <button type="button" className="shop-carousel__arrow" onClick={() => go(1)} aria-label="Rotate products forward">→</button>
      </div>
    </div>
  );
}

export function ShopGrid({ items, carousel = false }: { items: Product[]; carousel?: boolean }) {
  if (!carousel) {
    return (
      <div className="shop-grid">
        {items.map((product) => <ProductCard key={product.slug} product={product} />)}
      </div>
    );
  }
  return <DayrahCarousel items={items} />;
}

/* ---------- Accordion ---------- */
function Accordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`accordion ${open ? 'is-open' : ''}`}>
      <button className="accordion__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{title}</span><motion.i animate={{ rotate: open ? 45 : 0 }} transition={{ duration: .2 }}>+</motion.i>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="accordion__body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .32, ease: [0.22, 1, 0.36, 1] }}>
            <div className="accordion__inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Purchase panel: size, quantity, bag ---------- */
export function BuyPanel({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addItem } = useCart();
  const [sizeIndex, setSizeIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const size = product.sizes[sizeIndex];
  const multi = product.sizes.length > 1;

  return (
    <div className={`buy-panel ${compact ? 'buy-panel--compact' : ''}`}>
      <p className="eyebrow"><span /> DAYRAH / {product.notes.join(' · ').toUpperCase()}</p>
      <h2 className="buy-panel__name">{product.name.replace(/ (\d+)$/, '')}<sup>{product.index}</sup></h2>
      <p className="buy-panel__tagline">{product.tagline}</p>
      <p className="buy-panel__description">{product.description}</p>

      <div className="buy-panel__options">
        {multi && (
          <div className="buy-sizes" role="radiogroup" aria-label="Choose a size">
            {product.sizes.map((option, index) => (
              <button key={option.ml} role="radio" aria-checked={index === sizeIndex}
                className={index === sizeIndex ? 'buy-size is-active' : 'buy-size'}
                onClick={() => setSizeIndex(index)}>
                <b>{option.ml} ML</b><span>{formatPrice(option.price)}</span>
              </button>
            ))}
          </div>
        )}
        <div className="buy-row">
          <div className="qty-stepper qty-stepper--large" aria-label="Quantity">
            <button onClick={() => setQty((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">−</button>
            <span>{qty}</span>
            <button onClick={() => setQty((value) => Math.min(9, value + 1))} aria-label="Increase quantity">+</button>
          </div>
          <motion.button className="buy-add" whileTap={{ scale: .97 }} onClick={() => { addItem(product, size, qty); setQty(1); }}>
            ADD TO BAG — {formatPrice(size.price * qty)} <span>↗</span>
          </motion.button>
        </div>
      </div>

      <div className="buy-panel__accordions">
        <Accordion title="THE COMPOSITION" defaultOpen>{product.composition}</Accordion>
        <Accordion title="SHIPPING & RETURNS">Complimentary shipping on orders over $250, with two samples in every parcel. Unopened bottles may be returned within 30 days — the house covers the return journey.</Accordion>
        <Accordion title="THE HOUSE PROMISE">Composed in small batches. If a note doesn't feel like yours after the first wear, write to the atelier and we will help you find the one that does.</Accordion>
      </div>
    </div>
  );
}

/* ---------- Social proof ---------- */
type Review = { slug: string; quote: string; name: string; detail: string };

/**
 * Reviews are keyed to a product slug so a fragrance page can lead with its own
 * social proof instead of borrowing another composition's.
 */
const reviews: Review[] = [
  { slug: 'sifr-01', quote: 'The oud opens like a room you remember. Two hours in, it becomes something close and entirely yours.', name: 'Amira K.', detail: 'SIFR 01 / 100 ML' },
  { slug: 'layl-02', quote: 'Layl is the first evening scent I finish to the last drop. The smoke never overwhelms — it settles.', name: 'Yusuf R.', detail: 'LAYL 02 / 50 ML' },
  { slug: 'noor-03', quote: 'Noor wears like morning light. People lean in to ask what it is, and I never tell them straight away.', name: 'Leena S.', detail: 'NOOR 03 / 100 ML' },
  { slug: 'sovereign', quote: 'Sovereign never announces itself. An hour in it is simply there — a weight at the collar, a thread of saffron still holding the oud.', name: 'Khalid A.', detail: 'SOVEREIGN / 100 ML' },
  { slug: 'sovereign', quote: 'I wore it to a wedding and three people asked, quietly, at the end of the night. That is exactly the register I wanted.', name: 'Noura H.', detail: 'SOVEREIGN / 50 ML' },
  { slug: 'discovery-trilogy', quote: 'Three vials and a decision I still have not made. The walnut case has outlasted my indecision.', name: 'Sara M.', detail: 'THE TRILOGY / 3 × 10 ML' },
];

/** The house trio shown on the home page, where no single fragrance is in focus. */
const houseReviewSlugs = ['sifr-01', 'layl-02', 'noor-03'];

const REVIEW_COLUMNS = 3;

/**
 * Orders reviews for the strip. With a product in focus its own reviews come
 * first, then the rest of the house fills the grid up to three columns.
 * Without one, the house trio is shown.
 */
function reviewsFor(product?: Product): Review[] {
  if (!product) return reviews.filter((review) => houseReviewSlugs.includes(review.slug)).slice(0, REVIEW_COLUMNS);
  const own = reviews.filter((review) => review.slug === product.slug);
  const rest = reviews.filter((review) => review.slug !== product.slug);
  return [...own, ...rest].slice(0, REVIEW_COLUMNS);
}

export function ReviewsStrip({ product }: { product?: Product } = {}) {
  const shown = reviewsFor(product);
  if (shown.length === 0) return null;

  return (
    <section className="reviews-strip lux-light" data-gsap-reveal aria-label={product ? `${product.name} reviews` : 'Dayrah reviews'}>
      <div className="reviews-strip__head">
        <p className="eyebrow"><span /> WORN & REMEMBERED{product ? ` / ${product.name.toUpperCase()}` : ''}</p>
        <h2>From those<br /><em>who wear it.</em></h2>
      </div>
      <div className="reviews-strip__grid">
        {shown.map((review) => (
          <blockquote key={`${review.slug}-${review.name}`} className="review-card">
            <p>“{review.quote}”</p>
            <footer><b>{review.name}</b><span>{review.detail}</span></footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
