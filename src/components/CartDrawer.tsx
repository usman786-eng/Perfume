import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../shop/CartContext';
import { FREE_SHIPPING_THRESHOLD, formatPrice } from '../shop/products';

export default function CartDrawer() {
  const { items, count, subtotal, isOpen, closeBag, setQty, removeItem } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeBag(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [isOpen, closeBag]);

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="bag-scrim" onClick={closeBag} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>
          <motion.aside className="bag-drawer" role="dialog" aria-modal="true" aria-label="Your shopping bag"
            onClick={(event) => event.stopPropagation()}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: .45, ease: [0.22, 1, 0.36, 1] }}>
            <header className="bag-drawer__head">
              <p>YOUR BAG<span> / {String(count).padStart(2, '0')}</span></p>
              <button onClick={closeBag} aria-label="Close bag" className="bag-drawer__close">×</button>
            </header>

            {items.length > 0 && (
              <div className="bag-shipping">
                {remaining > 0
                  ? <p><b>{formatPrice(remaining)}</b> away from complimentary shipping</p>
                  : <p><b>Complimentary shipping</b> unlocked — enjoy</p>}
                <div className="bag-shipping__track"><motion.div className="bag-shipping__fill" animate={{ width: `${progress}%` }} transition={{ duration: .5, ease: 'easeOut' }} /></div>
              </div>
            )}

            <div className="bag-drawer__body">
              {items.length === 0 ? (
                <div className="bag-empty">
                  <p className="bag-empty__title">Your bag is empty.</p>
                  <p className="bag-empty__copy">The collection is waiting: oud, rose, and amber, composed to be worn.</p>
                  <Link to="/collection" onClick={closeBag} className="text-link">EXPLORE THE COLLECTION <span>↗</span></Link>
                </div>
              ) : (
                <ul className="bag-items">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li key={item.key} className="bag-item" layout
                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 22 }}
                        transition={{ duration: .28 }}>
                        <Link to={`/product/${item.slug}`} onClick={closeBag} className="bag-item__image"><img src={item.image} alt={item.name} /></Link>
                        <div className="bag-item__info">
                          <div className="bag-item__top"><b>{item.name}</b><span>{formatPrice(item.price * item.qty)}</span></div>
                          <small>EAU DE PARFUM / {item.ml} ML</small>
                          <div className="bag-item__controls">
                            <div className="qty-stepper" aria-label={`Quantity of ${item.name}`}>
                              <button onClick={() => setQty(item.key, item.qty - 1)} aria-label="Decrease quantity">−</button>
                              <span>{item.qty}</span>
                              <button onClick={() => setQty(item.key, item.qty + 1)} aria-label="Increase quantity">+</button>
                            </div>
                            <button className="bag-item__remove" onClick={() => removeItem(item.key)}>REMOVE</button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="bag-drawer__foot">
                <div className="bag-subtotal"><span>SUBTOTAL</span><b>{formatPrice(subtotal)}</b></div>
                <p className="bag-note">Shipping and samples confirmed at checkout. Every order includes two compliments of the house.</p>
                <Link to="/checkout" onClick={closeBag} className="bag-checkout">PROCEED TO CHECKOUT <span>→</span></Link>
                <button className="bag-continue" onClick={closeBag}>CONTINUE EXPLORING</button>
              </footer>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
