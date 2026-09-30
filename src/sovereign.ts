export type SovereignFilmFrame = {
  src: string;
  alt: string;
  label: string;
  title: string;
  emphasis: string;
  copy: string;
  caption: string;
  narration: string;
  timecode: string;
};

/**
 * The five-scene Sovereign film. Each still is a frame of a ten-second,
 * scroll-controlled movie: 0-2s suspension, 2-4s cap release, 4-6s diffusion,
 * 6-8s the reveal, 8-10s the alchemical transition.
 */
export const sovereignFilmFrames: SovereignFilmFrame[] = [
  {
    src: '/images/sovereign-film-01.jpg',
    alt: 'The faceted crystal Sovereign bottle engraved DAYRAH SCENTS suspended in a pitch-black void, golden god rays, drifting dust and prismatic flares above a sharp obsidian reflection.',
    label: '01 / THE SUSPENSION',
    title: 'Suspended,',
    emphasis: 'sovereign.',
    copy: 'A slow, majestic 360° turn through the obsidian void — crystal facets fire prismatic flares across the lens while dust drifts through the golden beam.',
    caption: 'THE SUSPENSION',
    narration: 'Experience the weight of light.',
    timecode: '0:00 — 0:02',
  },
  {
    src: '/images/sovereign-film-02.jpg',
    alt: 'The brushed 24k gold cap of the DAYRAH SCENTS bottle levitating in ultra-slow motion toward the overhead beam, revealing the polished chrome atomizer.',
    label: '02 / THE ASCENSION',
    title: 'The cap',
    emphasis: 'ascends.',
    copy: 'In ultra-slow motion the brushed-gold cap unscrews itself and levitates toward the light, glinting as it reveals the precision chrome atomizer.',
    caption: 'THE ASCENSION',
    narration: 'Unveiling the essence of gravity.',
    timecode: '0:02 — 0:04',
  },
  {
    src: '/images/sovereign-film-03.jpg',
    alt: 'Macro backlit study of the chrome atomizer of the DAYRAH SCENTS bottle releasing an explosive slow-motion mist of thousands of diamond-bright micro-droplets.',
    label: '03 / THE DIFFUSION',
    title: 'The mist',
    emphasis: 'unbound.',
    copy: 'The nozzle depresses under an invisible finger — thousands of micro-droplets scatter the backlight like tiny diamonds and swirl, lingering in the air.',
    caption: 'THE DIFFUSION',
    narration: 'A symphony of molecules.',
    timecode: '0:04 — 0:06',
  },
  {
    src: '/images/sovereign-film-04.jpg',
    alt: 'The hyper-translucent DAYRAH SCENTS crystal glowing from within, revealing velvet-red rose petals, green cardamom, bergamot slices and sandalwood swirling in a gentle vortex.',
    label: '04 / THE REVEAL',
    title: 'Held in',
    emphasis: 'crystal.',
    copy: 'The crystal turns hyper-translucent — velvet rose, green cardamom, bergamot and raw sandalwood swirl slowly within, lit by a soft internal glow.',
    caption: 'THE REVEAL',
    narration: 'Nature, captured in crystal.',
    timecode: '0:06 — 0:08',
  },
  {
    src: '/images/sovereign-film-05.jpg',
    alt: 'Full view of the DAYRAH SCENTS bottle as its liquid settles into deep luminous amber glowing like a light-box, the gold cap snapping home in a warm golden-hour glow.',
    label: '05 / THE ALCHEMY',
    title: 'Turned to',
    emphasis: 'amber.',
    copy: 'The liquid blushes rose-gold, then deepens to luminous amber as the botanicals fade away and the gold cap descends with a final, satisfying click.',
    caption: 'THE ALCHEMY',
    narration: 'The Sovereign. Eternal. Refined.',
    timecode: '0:08 — 0:10',
  },
];
