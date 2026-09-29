import { useState, type ReactNode } from 'react';
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
          <span>EAU DE PARFUM / FROM {from}</span>
        </div>
        <p className="product-card__notes">{product.notes.join(' · ')}</p>
        <button className="product-card__add" onClick={quickAdd} aria-live="polite">{added ? 'ADDED TO BAG ✓' : `QUICK ADD — ${from}`}</button>
      </div>
    </article>
  );
}

export function ShopGrid({ items }: { items: Product[] }) {
  return (
    <div className="shop-grid">
      {items.map((product) => <ProductCard key={product.slug} product={product} />)}
    </div>
  );
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
const reviews = [
  { quote: 'The oud opens like a room you remember. Two hours in, it becomes something close and entirely yours.', name: 'Amira K.', detail: 'SIFR 01 / 100 ML' },
  { quote: 'Layl is the first evening scent I finish to the last drop. The smoke never overwhelms — it settles.', name: 'Yusuf R.', detail: 'LAYL 02 / 50 ML' },
  { quote: 'Noor wears like morning light. People lean in to ask what it is, and I never tell them straight away.', name: 'Leena S.', detail: 'NOOR 03 / 100 ML' },
];

export function ReviewsStrip() {
  return (
    <section className="reviews-strip" data-gsap-reveal>
      <div className="reviews-strip__head">
        <p className="eyebrow"><span /> WORN & REMEMBERED</p>
        <h2>From those<br /><em>who wear it.</em></h2>
      </div>
      <div className="reviews-strip__grid">
        {reviews.map((review) => (
          <blockquote key={review.name} className="review-card">
            <p>“{review.quote}”</p>
            <footer><b>{review.name}</b><span>{review.detail}</span></footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
