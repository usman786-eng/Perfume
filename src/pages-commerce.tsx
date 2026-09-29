import { useState, type CSSProperties, type FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProduct, products, formatPrice, FREE_SHIPPING_THRESHOLD } from './shop/products';
import { useCart } from './shop/CartContext';
import { BuyPanel, ProductCard, ReviewsStrip } from './shop/ShopSections';

/* ---------- Individual fragrance page ---------- */
export function ProductPage() {
  const { slug = '' } = useParams();
  const product = getProduct(slug);
  if (!product) return <Navigate to="/collection" replace />;
  const others = products.filter((item) => item.slug !== product.slug);

  return (
    <motion.div className="editorial-page product-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, ease: [0.22, 1, 0.36, 1] }}>
      <div className="page-breadcrumb"><Link to="/collection">THE COLLECTION</Link><span>/</span><span>{product.name.toUpperCase()}</span></div>
      <section className="product-hero">
        <figure className="product-hero__media" style={{ '--accent': product.accent } as CSSProperties}>
          <img src={product.image} alt={product.imageAlt} />
          <figcaption>OBJECT STUDY / {product.name.toUpperCase()}</figcaption>
          {product.badge && <span className="product-hero__badge">{product.badge}</span>}
        </figure>
        <BuyPanel product={product} />
      </section>
      <ReviewsStrip />
      <section className="also-like">
        <div className="also-like__head"><p className="eyebrow"><span /> CONTINUE THE WARDROBE</p><h2>You may<br /><em>also wear.</em></h2></div>
        <div className="shop-grid">{others.map((item) => <ProductCard key={item.slug} product={item} />)}</div>
      </section>
    </motion.div>
  );
}

/* ---------- Checkout ---------- */
type FieldProps = { label: string; name: string; type?: string; placeholder?: string; autoComplete?: string; span?: boolean };

function Field({ label, name, type = 'text', placeholder, autoComplete, span }: FieldProps) {
  return (
    <label className={span ? 'checkout-field checkout-field--span' : 'checkout-field'}>
      {label}
      <input name={name} type={type} required placeholder={placeholder} autoComplete={autoComplete} />
    </label>
  );
}

export function CheckoutPage() {
  const { items, count, subtotal, setQty, removeItem, clear } = useCart();
  const [placed, setPlaced] = useState<string | null>(null);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 18;
  const total = subtotal + shipping;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const number = `DYR-${Math.floor(1000 + Math.random() * 9000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    setPlaced(number);
    clear();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (placed) {
    return (
      <motion.div className="editorial-page checkout-done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
        <p className="eyebrow"><span /> DAYRAH / ORDER CONFIRMED</p>
        <h1>With gratitude,<br /><em>it's on its way.</em></h1>
        <div className="checkout-done__card">
          <span>ORDER NUMBER</span>
          <b>{placed}</b>
          <p>A confirmation has been prepared for your address. Your fragrances leave the atelier within 48 hours, wrapped in tissue and wax-sealed by hand. Two samples of the house travel with every order.</p>
        </div>
        <div className="checkout-done__actions">
          <Link to="/collection" className="button-outline">CONTINUE EXPLORING <span>↗</span></Link>
          <Link to="/" className="text-link">RETURN TO THE BEGINNING <span>→</span></Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="editorial-page checkout-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
      <div className="page-breadcrumb"><Link to="/collection">THE COLLECTION</Link><span>/</span><span>CHECKOUT</span></div>
      <section className="checkout-grid">
        <div className="checkout-form-wrap">
          <div className="checkout-head">
            <p className="eyebrow"><span /> DAYRAH / SECURE CHECKOUT</p>
            <h1>The final<br /><em>gesture.</em></h1>
          </div>
          {items.length === 0 ? (
            <div className="checkout-empty">
              <p>Your bag is empty — begin with the collection.</p>
              <Link to="/collection" className="button-outline">EXPLORE THE COLLECTION <span>↗</span></Link>
            </div>
          ) : (
            <form className="checkout-form" onSubmit={submit}>
              <p className="checkout-form__section">01 / CONTACT</p>
              <div className="checkout-form__row">
                <Field label="Full name" name="name" placeholder="Your name" autoComplete="name" span />
                <Field label="Email address" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
                <Field label="Phone" name="phone" type="tel" placeholder="+965 ···· ····" autoComplete="tel" />
              </div>
              <p className="checkout-form__section">02 / DELIVERY</p>
              <div className="checkout-form__row">
                <Field label="Street address" name="address" placeholder="Street, building, apartment" autoComplete="street-address" span />
                <Field label="City" name="city" placeholder="City" autoComplete="address-level2" />
                <Field label="Country" name="country" placeholder="Country" autoComplete="country-name" />
              </div>
              <p className="checkout-form__section">03 / PAYMENT</p>
              <div className="checkout-payment" role="radiogroup" aria-label="Payment method">
                <label className="payment-option"><input type="radio" name="payment" value="cod" defaultChecked /><span><b>Cash on delivery</b><small>Pay the courier when your parcel arrives.</small></span><i>RECOMMENDED</i></label>
                <label className="payment-option"><input type="radio" name="payment" value="card" /><span><b>Card on delivery</b><small>Card terminal presented at your door.</small></span><i /></label>
              </div>
              <button type="submit" className="buy-add checkout-submit">PLACE ORDER — {formatPrice(total)} <span>→</span></button>
              <p className="checkout-fine">This is a demonstration storefront — no payment is processed and no details are stored.</p>
            </form>
          )}
        </div>

        <aside className="checkout-summary">
          <div className="checkout-summary__head"><span>YOUR ORDER</span><span>{String(count).padStart(2, '0')} ITEM{count === 1 ? '' : 'S'}</span></div>
          {items.map((item) => (
            <div key={item.key} className="summary-item">
              <img src={item.image} alt={item.name} />
              <div className="summary-item__info">
                <div><b>{item.name}</b><span>{formatPrice(item.price * item.qty)}</span></div>
                <small>EAU DE PARFUM / {item.ml} ML</small>
                <div className="summary-item__controls">
                  <div className="qty-stepper"><button type="button" onClick={() => setQty(item.key, item.qty - 1)} aria-label="Decrease quantity">−</button><span>{item.qty}</span><button type="button" onClick={() => setQty(item.key, item.qty + 1)} aria-label="Increase quantity">+</button></div>
                  <button type="button" className="bag-item__remove" onClick={() => removeItem(item.key)}>REMOVE</button>
                </div>
              </div>
            </div>
          ))}
          <div className="summary-lines">
            <div><span>SUBTOTAL</span><b>{formatPrice(subtotal)}</b></div>
            <div><span>SHIPPING</span><b>{shipping === 0 ? 'COMPLIMENTARY' : formatPrice(shipping)}</b></div>
            <div><span>SAMPLES</span><b>2 — WITH THE HOUSE'S COMPLIMENTS</b></div>
            <div className="summary-total"><span>TOTAL</span><b>{formatPrice(total)}</b></div>
          </div>
        </aside>
      </section>
    </motion.div>
  );
}
