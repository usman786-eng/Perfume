export type SovereignFilmFrame = {
  src: string;
  alt: string;
  label: string;
  title: string;
  emphasis: string;
  copy: string;
  caption: string;
};

/** Five campaign stills form the scroll-controlled Sovereign film. */
export const sovereignFilmFrames: SovereignFilmFrame[] = [
  {
    src: '/images/sovereign-01.jpg',
    alt: 'Dark amber Sovereign perfume flacon on a black basalt plinth, surrounded by a soft veil of amber mist.',
    label: '01 / THE FORM',
    title: 'Power, kept',
    emphasis: 'quiet.',
    copy: 'A dark amber flacon, quiet in its presence. Sovereign opens with the confidence of a note already remembered.',
    caption: 'THE FORM',
  },
  {
    src: '/images/sovereign-02.jpg',
    alt: 'Close study of the Sovereign bottle, its dark glass and brushed-gold atomizer collar in warm light.',
    label: '02 / THE MATERIAL',
    title: 'Gold in',
    emphasis: 'the grain.',
    copy: 'Smoked glass catches a line of light; saffron warms the air around a deeper, resinous oud.',
    caption: 'THE MATERIAL',
  },
  {
    src: '/images/sovereign-03.jpg',
    alt: 'Sovereign perfume bottle among black oud wood and a single saffron thread on volcanic stone.',
    label: '03 / THE ORIGIN',
    title: 'Rooted in',
    emphasis: 'resin.',
    copy: 'A grounded heart of dark woods and saffron unfolds slowly, measured against the warmth of amber.',
    caption: 'THE ORIGIN',
  },
  {
    src: '/images/sovereign-05.jpg',
    alt: 'Fine amber perfume mist rises above the Sovereign bottle in a soft beam of warm light.',
    label: '04 / THE DIFFUSION',
    title: 'A breath,',
    emphasis: 'then air.',
    copy: 'A fine diffusion lifts from the atomizer, carries the spice, then opens softly into the room.',
    caption: 'THE DIFFUSION',
  },
  {
    src: '/images/sovereign-04.jpg',
    alt: 'Sovereign dark amber perfume bottle reflected in a polished black surface as bronze light settles.',
    label: '05 / THE TRACE',
    title: 'A trace',
    emphasis: 'stays.',
    copy: 'Oud, saffron and amber settle close to the skin: an unmistakable presence, never a declaration.',
    caption: 'THE TRACE',
  },
];
