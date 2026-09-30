export type Size = { ml: number; price: number };
export type Product = {
  slug: string;
  name: string;
  index: string;
  tagline: string;
  notes: [string, string, string];
  description: string;
  composition: string;
  image: string;
  imageAlt: string;
  accent: string;
  sizes: Size[];
  badge?: string;
};

export const FREE_SHIPPING_THRESHOLD = 250;

export function formatPrice(value: number): string {
  return `$${value.toFixed(0)}`;
}

export const products: Product[] = [
  {
    slug: 'sifr-01',
    name: 'Sifr 01',
    index: '01',
    tagline: 'A memory, held in glass.',
    notes: ['Oud', 'Rose', 'Amber'],
    description: 'The house signature. A warm, floral-woody composition built on a resinous oud foundation, a lifted rose heart, and a long amber trace that stays close to the skin.',
    composition: 'Top: saffron thread, dried rose. Heart: resinous oud, damask rose. Base: amber, warm woods, soft musk. Eau de parfum, 18% concentration.',
    image: '/images/dayrah-cinematic-campaign.webp',
    imageAlt: 'Sifr 01 amber glass perfume bottle surrounded by rose petals and golden light',
    accent: '#b2763a',
    sizes: [{ ml: 50, price: 185 }, { ml: 100, price: 265 }],
    badge: 'THE SIGNATURE',
  },
  {
    slug: 'layl-02',
    name: 'Layl 02',
    index: '02',
    tagline: 'The night, distilled.',
    notes: ['Smoked Oud', 'Leather', 'Vanilla'],
    description: 'A slow-burning evening scent. Smoked oud and supple leather settle into a dark vanilla warmth — composed for after sunset, worn without explanation.',
    composition: 'Top: incense smoke, black pepper. Heart: smoked oud, worn leather. Base: dark vanilla, amber resin. Eau de parfum, 20% concentration.',
    image: '/images/layl-02.jpg',
    imageAlt: 'Layl 02 smoked glass bottle on charcoal stone amid oud wood and incense smoke',
    accent: '#7a4a2f',
    sizes: [{ ml: 50, price: 195 }, { ml: 100, price: 285 }],
  },
  {
    slug: 'noor-03',
    name: 'Noor 03',
    index: '03',
    tagline: 'Light in liquid form.',
    notes: ['Taif Rose', 'Saffron', 'White Musk'],
    description: 'A luminous floral with a gilded edge. Taif rose and saffron rest on a clean white-musk base — radiant by day, quietly magnetic by night.',
    composition: 'Top: saffron, bergamot zest. Heart: taif rose, peony. Base: white musk, blond woods. Eau de parfum, 17% concentration.',
    image: '/images/noor-03.jpg',
    imageAlt: 'Noor 03 rose-gold perfume bottle on silk with rose petals and saffron threads',
    accent: '#a95d6f',
    sizes: [{ ml: 50, price: 175 }, { ml: 100, price: 255 }],
  },
  {
    slug: 'sovereign',
    name: 'Sovereign',
    index: '04',
    tagline: 'Power, kept quiet.',
    notes: ['Black Oud', 'Saffron', 'Amber'],
    description: 'A composed, quietly commanding fragrance. Dark oud and warm saffron open into an amber finish that lingers close to the skin — present without ever needing to announce itself.',
    composition: 'Top: saffron, black pepper. Heart: smoked oud, labdanum. Base: amber resin, cedar, soft musk. Eau de parfum, 21% concentration.',
    image: '/images/sovereign-01.jpg',
    imageAlt: 'Sovereign dark amber perfume bottle on black basalt with a veil of warm mist',
    accent: '#8d633e',
    sizes: [{ ml: 50, price: 215 }, { ml: 100, price: 305 }],
    badge: 'NEW / THE SOVEREIGN',
  },
  {
    slug: 'discovery-trilogy',
    name: 'The Trilogy',
    index: '05',
    tagline: 'Three scents. One case.',
    notes: ['Sifr 01', 'Layl 02', 'Noor 03'],
    description: 'A three-scent introduction to the Dayrah wardrobe: three 10 ml vials of the signature compositions, with a refill credit toward any full bottle.',
    composition: '3 × 10 ml eau de parfum vials in a walnut travel case. Includes a $40 credit toward any 50 ml or 100 ml bottle within six months.',
    image: '/images/discovery-trilogy.jpg',
    imageAlt: 'Three small Dayrah perfume vials in a row on dark stone with warm side light',
    accent: '#8f6a3f',
    sizes: [{ ml: 30, price: 95 }],
    badge: 'GIFTABLE',
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}
