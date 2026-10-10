export type SovereignVisualElement = {
  id: string;
  category: 'Locations' | 'Props' | 'Set/Environment Elements';
  name: string;
  subtitle: string;
  description: string;
  src: string;
  alt: string;
  specs: string[];
};

export type SovereignFilmFrame = {
  frameNumber: number;
  src: string;
  transitionSrc?: string;
  macroSrc?: string;
  alt: string;
  label: string;
  timeRange: string;
  startSec: number;
  endSec: number;
  context: string;
  title: string;
  emphasis: string;
  action: string;
  cameraAngle: string;
  lighting: string;
  narration: string;
  copy: string;
  caption: string;
  fxBadges: string[];
};

export const sovereignVisualElements: SovereignVisualElement[] = [
  {
    id: 'crystal-decanter',
    category: 'Props',
    name: 'Crystal Decanter',
    subtitle: 'ARTIFACT STUDY',
    description: 'A faceted crystal decanter with a diamond-cut stopper and gold collar, holding rose petals, lime wheels, cardamom pods, and sandalwood shards in golden liquid.',
    src: '/images/sovereign-ref-bottle.jpg',
    alt: 'Dayrah Noor 03 faceted crystal decanter against a dark ground',
    specs: ['Faceted crystal', 'Diamond-cut stopper', 'Brushed gold collar'],
  },
];

export const sovereignFilmFrames: SovereignFilmFrame[] = [
  {
    frameNumber: 1,
    src: '/images/sovereign-01.jpg',
    alt: '',
    label: '',
    timeRange: '',
    startSec: 0,
    endSec: 2,
    context: '',
    title: 'Quiet Power',
    emphasis: 'Built for boardroom presence.',
    action: '',
    cameraAngle: '',
    lighting: '',
    narration: '',
    copy: '',
    caption: '',
    fxBadges: [],
  },
  {
    frameNumber: 2,
    src: '/images/sovereign-02.jpg',
    alt: '',
    label: '',
    timeRange: '',
    startSec: 2,
    endSec: 4,
    context: '',
    title: 'Quiet Power',
    emphasis: 'Built for boardroom presence.',
    action: '',
    cameraAngle: '',
    lighting: '',
    narration: '',
    copy: '',
    caption: '',
    fxBadges: [],
  },
  {
    frameNumber: 3,
    src: '/images/sovereign-03.jpg',
    alt: '',
    label: '',
    timeRange: '',
    startSec: 4,
    endSec: 6,
    context: '',
    title: 'Quiet Power',
    emphasis: 'Built for boardroom presence.',
    action: '',
    cameraAngle: '',
    lighting: '',
    narration: '',
    copy: '',
    caption: '',
    fxBadges: [],
  },
  {
    frameNumber: 4,
    src: '/images/sovereign-04.jpg',
    alt: '',
    label: '',
    timeRange: '',
    startSec: 6,
    endSec: 8,
    context: '',
    title: 'Quiet Power',
    emphasis: 'Built for boardroom presence.',
    action: '',
    cameraAngle: '',
    lighting: '',
    narration: '',
    copy: '',
    caption: '',
    fxBadges: [],
  },
  {
    frameNumber: 5,
    src: '/images/sovereign-05.jpg',
    transitionSrc: '/images/sovereign-04b-rosegold.jpg',
    alt: '',
    label: '',
    timeRange: '',
    startSec: 8,
    endSec: 10,
    context: '',
    title: 'Quiet Power',
    emphasis: 'Built for boardroom presence.',
    action: '',
    cameraAngle: '',
    lighting: '',
    narration: '',
    copy: '',
    caption: '',
    fxBadges: [],
  },
];
