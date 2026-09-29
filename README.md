# Dayrah — scent in motion

A multi-page fragrance-house experience with a live, scroll-scrubbed Three.js film on the home page and Sifr 01 detail page. The glass scene uses high-DPI rendering, higher-resolution transmission, shadow maps, procedural studio-light reflections, cinematic color grading, a petal burst, scent ribbon, and light sweep. The films are rendered live in the browser rather than played from pre-recorded video.

### Real effects, rendered in the browser

- **Atomizer mist plume** — a GPU particle shader (custom GLSL point sprites) that breathes out above the bottle as the cap lifts.
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

## 3D and sources

The local glass-and-amber bottle mesh follows the shape of Tripo's [amber rectangular perfume-bottle gallery model](https://studio.tripo3d.ai/3d-model/perfume-bottle-with-amber-liquid-clear-glass-black-cap-rectangular-828837c2-6332-40e1-94e1-22716b7e03c8). It is implemented locally so the bottle's liquid, label, cap lift, note tint, and scroll response can be tuned for Dayrah. `src/components/BlurText.tsx` adapts React Bits' [BlurText component](https://reactbits.dev/text-animations/blur-text) for this project.

Supporting photographs in `public/images/` are stock references, not images of Dayrah's actual products or atelier. `dayrah-cinematic-campaign.webp` is conceptual generated campaign artwork, not a photograph of a real Dayrah bottle. The interactive bottle remains a custom procedural mesh inspired by the linked Tripo reference; it is not an imported Tripo asset. Brand copy and the contact email are placeholders pending approved brand assets and details.
