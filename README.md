# Dayrah — scent in motion

A multi-page fragrance-house **e-commerce experience** with a live, scroll-scrubbed Three.js film on the home page and Sifr 01 detail page, plus a five-still Sovereign campaign film. The glass scene uses high-DPI rendering, higher-resolution transmission, shadow maps, procedural studio-light reflections, cinematic color grading, a petal burst, scent ribbon, and light sweep. The 3D films are rendered live in the browser rather than played from pre-recorded video; Sovereign's five campaign stills cross-fade with scroll.

### The store

- **Catalog** (`src/shop/products.ts`): four fragrances — Sifr 01 (the signature), Layl 02, Noor 03, and Sovereign — plus The Trilogy discovery set, each with editorial copy, composition notes, sizes, and pricing.
- **Sovereign film** (`/` header hero and `/sovereign`): a 10-second (`0–10s`) scroll-scrubbed cinema film in **The Obsidian Void** under a **3200K Volumetric Golden Light** rig, featuring reference visual elements (**The Obsidian Void**, **The Sovereign Bottle** inscribed with `DAYRAH SCENTS — THE SOVEREIGN`, **Botanical Infusions** of velvet-red rose petals, green cardamom pods, translucent green bergamot slices, and raw sandalwood chips, and **Volumetric Golden Light**) and all five scene frames (`0–2s` Suspended Sovereign, `2–4s` Cap Release Ascension, `4–6s` Explosive Micro-Droplet Mist Diffusion, `6–8s` Hyper-Translucent Internal Ingredients Reveal, and `8–10s` Alchemical Transition from Clear → Blushing Rose Gold → Deep Luxurious Amber with a final magnetic 24k gold cap 'click'), rendered with a real-time 60fps HTML5 Canvas optical/particle FX engine and optional Web Audio + spoken narration.
- **Shopping bag**: slide-in drawer with quantity steppers, remove, live subtotal, free-shipping progress bar ($250 threshold), and localStorage persistence across visits.
- **Product pages** (`/product/:slug`): generated DAYRAH campaign photography, size + quantity selection, composition/shipping/house-promise accordions, reviews, and "you may also wear" cross-sells.
- **Checkout** (`/checkout`): contact, delivery, and payment sections (cash/card on delivery), sticky order summary with editable quantities, and an order-confirmation flow with a generated order number. Demo storefront — no payment is processed.
- **Quick add** on every product card, cart badge in the header, and a "Wear the house" shelf section plus reviews strip on the home page.

### Real effects, rendered in the browser

- **Atomizer mist plume** — a GPU particle shader (custom GLSL point sprites) that breathes out above the bottle as the cap lifts.
- **Sovereign diffusion mist** — soft, layered amber haze that drifts across the five-frame campaign film and swells with scroll progress.
- **Volumetric light shafts** — additive shader planes with drifting internal light bands, scrubbed by scroll.
- **Note-reactive atmosphere** — accent lights and a bloom-feeding halo glow cross-fade toward oud / rose / amber as you switch accords.
- **Liquid slosh** — the liquid mass lags and wobbles in response to scroll velocity.
- **Depth of field + camera breathing** — a physical DoF pass and a scroll-driven FOV pull tighten the frame mid-film (desktop).
- **Cinematic boot veil** — a counting preloader whose clip-path lift is synced with the hero's blur-in typography.
- **Custom trailing cursor** (difference-blend dot + lagging ring), **magnetic buttons** with GSAP inertia, and an **endless scent marquee** ribbon.

## Run locally

```bash
npm install
npm run dev
```

## Interactions

- Scroll or use the chapter rail to move through the pinned 3D fragrance story; drag the bottle to rotate it.
- Choose Oud, Rose, or Amber to update the bottle's liquid tint and explore the accord.
- Complete the three-step scent finder for a note recommendation.
- Use the ritual guide's stepper to browse application suggestions.
- Open fragrance details from the hero for the Sifr story panel.
- Navigate the separate Collection, Sifr 01, House Story, Atelier, Journal, and Contact routes; route changes include a soft cinematic transition.
- Visit `/sifr-01` for a dedicated 240-frame scroll-controlled bottle film and interactive accord palette.
- Visit `/sovereign` to scrub through the five-scene Sovereign film, explore its campaign stills, and shop the new composition.

## 3D and sources

The local glass-and-amber bottle mesh follows the shape of Tripo's [amber rectangular perfume-bottle gallery model](https://studio.tripo3d.ai/3d-model/perfume-bottle-with-amber-liquid-clear-glass-black-cap-rectangular-828837c2-6332-40e1-94e1-22716b7e03c8). It is implemented locally so the bottle's liquid, label, cap lift, note tint, and scroll response can be tuned for Dayrah. `src/components/BlurText.tsx` adapts React Bits' [BlurText component](https://reactbits.dev/text-animations/blur-text) for this project.

Supporting photographs in `public/images/` are stock references, not images of Dayrah's actual products or atelier. `dayrah-cinematic-campaign.webp`, `layl-02.jpg`, `noor-03.jpg`, `discovery-trilogy.jpg`, `sovereign-ref-void.jpg`, `sovereign-ref-bottle.jpg`, `sovereign-ref-botanicals.jpg`, and `sovereign-01.jpg` through `sovereign-05.jpg` (plus `sovereign-04b-rosegold.jpg` and `sovereign-04-macro.jpg`) are generated campaign artwork inscribed with `DAYRAH SCENTS — THE SOVEREIGN`. The interactive Sifr bottle remains a custom procedural mesh inspired by the linked Tripo reference; it is not an imported Tripo asset. Brand copy and the contact email are placeholders pending approved brand assets and details.
