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

/**
 * Visual Elements Established First — Reference studies created prior to scene generation.
 */
export const sovereignVisualElements: SovereignVisualElement[] = [
  {
    id: 'obsidian-void',
    category: 'Locations',
    name: 'The Obsidian Void',
    subtitle: 'LOCATION / INFINITE STUDIO ENVIRONMENT',
    description:
      'A pitch-black, infinite studio environment. The floor is a highly polished, dark obsidian surface that creates a perfect, sharp golden reflection of the object above. The air is filled with fine, dancing dust motes caught in a single, powerful overhead volumetric light source.',
    src: '/images/sovereign-ref-void.jpg',
    alt: 'The Obsidian Void: pitch-black studio with polished obsidian floor, golden reflection, and dancing dust motes in an overhead volumetric beam.',
    specs: ['PITCH-BLACK INFINITE VOID', 'POLISHED OBSIDIAN MIRROR FLOOR', 'SUSPENDED GOLDEN DUST MOTES'],
  },
  {
    id: 'sovereign-bottle',
    category: 'Props',
    name: 'The Sovereign Bottle',
    subtitle: 'PROP / DAYRAH SCENTS FLACON',
    description:
      "A heavy, oversized crystal glass perfume bottle with deep geometric facets and 'DAYRAH SCENTS — THE SOVEREIGN' inscribed on the front plaque. It features a weighted, thick glass base that catches and refracts light into prismatic 'caustics'. The cap is a brushed 24k gold metallic cylinder with a magnetic 'click' aesthetic. The atomizer underneath is polished chrome with a micro-precision nozzle.",
    src: '/images/sovereign-ref-bottle.jpg',
    alt: 'The Sovereign Bottle by DAYRAH SCENTS: heavy geometric-faceted crystal perfume flacon with brushed 24k gold cylindrical cap and prismatic floor caustics.',
    specs: ['DEEP GEOMETRIC CRYSTAL FACETS', 'BRUSHED 24K GOLD MAGNETIC CAP', 'POLISHED CHROME MICRO-ATOMIZER'],
  },
  {
    id: 'botanical-infusions',
    category: 'Props',
    name: 'Botanical Infusions',
    subtitle: 'PROP / HYPER-REALISTIC RAW INGREDIENTS',
    description:
      'Hyper-realistic ingredients: Deep velvet-red rose petals, textured green cardamom pods with visible fibers, translucent slices of green bergamot with zest pores, and raw, jagged chips of aromatic sandalwood.',
    src: '/images/sovereign-ref-botanicals.jpg',
    alt: 'Botanical Infusions: velvet-red rose petals, textured green cardamom pods, translucent green bergamot slices with zest pores, and raw sandalwood chips.',
    specs: ['VELVET-RED ROSE PETALS', 'GREEN CARDAMOM & BERGAMOT ZEST', 'RAW AROMATIC SANDALWOOD CHIPS'],
  },
  {
    id: 'volumetric-light',
    category: 'Set/Environment Elements',
    name: 'Volumetric Golden Light',
    subtitle: 'SET & ENVIRONMENT / 3200K OVERHEAD RIG',
    description:
      "A warm, 3200K cinematic spotlight positioned directly above the bottle. It creates 'God rays' through the air and sharp rim-lighting on the glass edges. Ray-traced caustics dance on the floor as the bottle rotates.",
    src: '/images/sovereign-ref-void.jpg',
    alt: 'Warm 3200K overhead volumetric spotlight casting God rays and dancing ray-traced golden caustics across the obsidian studio floor.',
    specs: ['3200K OVERHEAD SPOTLIGHT', 'VOLUMETRIC GOD RAYS', 'RAY-TRACED FLOOR CAUSTICS'],
  },
];

/**
 * Five Scene Frames forming the 10-second scroll-scrubbed Sovereign film.
 */
export const sovereignFilmFrames: SovereignFilmFrame[] = [
  {
    frameNumber: 1,
    src: '/images/sovereign-01.jpg',
    alt: 'Frame 1: The Sovereign bottle by DAYRAH SCENTS suspended in the dark Obsidian Void, rotating under a 3200K volumetric spotlight with prismatic light flares and golden floor reflections.',
    label: 'FRAME 01 / 0–2 SECONDS',
    timeRange: '0–2 seconds',
    startSec: 0,
    endSec: 2,
    context: 'Introduction: The Suspended Sovereign',
    title: 'Experience the',
    emphasis: 'weight of light.',
    action:
      'The Sovereign bottle is suspended in the center of the dark void. It performs a slow, majestic 360-degree horizontal rotation. Light hits the facets, sending sharp, prismatic light flares across the lens. Microscopic dust particles drift lazily in the volumetric beam.',
    cameraAngle: "Macro close-up, centered, locked-off tripod. Eye-level with the bottle's midsection.",
    lighting: 'Dramatic top-down volumetric spotlight, high-contrast rim lighting, golden floor reflections.',
    narration: 'Experience the weight of light.',
    copy: 'The Sovereign bottle is suspended in the center of the dark void, performing a slow, majestic 360-degree horizontal rotation as sharp prismatic light flares sweep across the crystal facets.',
    caption: 'INTRODUCTION: THE SUSPENDED SOVEREIGN (0–2S)',
    fxBadges: ['360° SUSPENDED ROTATION', 'PRISMATIC LENS FLARES', 'VOLUMETRIC DUST MOTES'],
  },
  {
    frameNumber: 2,
    src: '/images/sovereign-02.jpg',
    alt: 'Frame 2: The brushed 24k gold cap of DAYRAH SCENTS The Sovereign unscrews in a smooth spiral and levitates upward toward the light source, revealing the polished chrome atomizer.',
    label: 'FRAME 02 / 2–4 SECONDS',
    timeRange: '2–4 seconds',
    startSec: 2,
    endSec: 4,
    context: 'The Ascension: Cap Release',
    title: 'Unveiling the',
    emphasis: 'essence of gravity.',
    action:
      'In ultra-slow motion, the gold metallic cap unscrews itself with a smooth, spiraling motion. It levitates upward toward the light source, revealing the precision-engineered chrome atomizer. The cap glints as it catches the overhead beam.',
    cameraAngle: 'Locked-off, centered. Focus shifts slightly from the bottle body to the rising cap.',
    lighting: 'Highlighting the metallic sheen of the gold cap and the reflective chrome of the atomizer.',
    narration: 'Unveiling the essence of gravity.',
    copy: 'In ultra-slow motion, the brushed 24k gold cap unscrews itself with a smooth spiraling motion and levitates toward the overhead beam, revealing the precision-engineered chrome atomizer.',
    caption: 'THE ASCENSION: CAP RELEASE (2–4S)',
    fxBadges: ['SPIRAL CAP LEVITATION', '24K GOLD SPECULAR GLINT', 'CHROME ATOMIZER REVEAL'],
  },
  {
    frameNumber: 3,
    src: '/images/sovereign-03.jpg',
    alt: 'Frame 3: The polished chrome atomizer of DAYRAH SCENTS The Sovereign depresses, releasing an explosive ultra-slow-motion mist of diamond-like perfume micro-droplets.',
    label: 'FRAME 03 / 4–6 SECONDS',
    timeRange: '4–6 seconds',
    startSec: 4,
    endSec: 6,
    context: 'The Diffusion: The Mist',
    title: 'A symphony',
    emphasis: 'of molecules.',
    action:
      'The atomizer head depresses as if by an invisible finger. An explosive, ultra-slow-motion mist of perfume is released. Thousands of individual micro-droplets are visible, scattering the light like tiny diamonds. The mist forms elegant, volumetric swirls that linger in the air.',
    cameraAngle: 'Locked-off, centered. Focus is sharp on the nozzle and the immediate spray pattern.',
    lighting: 'Backlit to emphasize the translucency and scattering of the perfume droplets.',
    narration: 'A symphony of molecules.',
    copy: 'The atomizer head depresses as if by an invisible finger. Thousands of micro-droplets scatter the 3200K backlight like tiny diamonds, forming elegant volumetric swirls in the air.',
    caption: 'THE DIFFUSION: THE MIST (4–6S)',
    fxBadges: ['INVISIBLE ATOMIZER PRESS', 'DIAMOND MICRO-DROPLETS', 'VOLUMETRIC MIST SWIRLS'],
  },
  {
    frameNumber: 4,
    src: '/images/sovereign-04.jpg',
    macroSrc: '/images/sovereign-04-macro.jpg',
    alt: 'Frame 4: Hyper-translucent crystal bottle of DAYRAH SCENTS The Sovereign revealing fresh red rose petals, green cardamom pods, bergamot slices, and sandalwood chips swirling in a vortex.',
    label: 'FRAME 04 / 6–8 SECONDS',
    timeRange: '6–8 seconds',
    startSec: 6,
    endSec: 8,
    context: 'The Reveal: Internal Ingredients',
    title: 'Nature, captured',
    emphasis: 'in crystal.',
    action:
      'The crystal glass becomes hyper-translucent, revealing the interior of the bottle. Fresh red rose petals, green cardamom pods, bergamot slices, and sandalwood chips appear inside, swirling slowly within the liquid as if caught in a gentle vortex.',
    cameraAngle: 'Locked-off, centered. Macro focus on the interior of the glass bottle.',
    lighting: 'Soft internal glow to highlight the colors of the botanicals against the dark background.',
    narration: 'Nature, captured in crystal.',
    copy: 'The crystal glass becomes hyper-translucent, revealing fresh velvet-red rose petals, green cardamom pods, translucent bergamot slices, and sandalwood chips swirling in a gentle internal vortex.',
    caption: 'THE REVEAL: INTERNAL INGREDIENTS (6–8S)',
    fxBadges: ['HYPER-TRANSLUCENT GLASS', 'INTERNAL BOTANICAL VORTEX', 'BIOLUMINESCENT CORE GLOW'],
  },
  {
    frameNumber: 5,
    src: '/images/sovereign-05.jpg',
    transitionSrc: '/images/sovereign-04b-rosegold.jpg',
    alt: 'Frame 5: The Sovereign by DAYRAH SCENTS in its final alchemical state — glowing deep luxurious amber liquid after transitioning from clear and blushing rose gold, with the 24k gold cap snapped shut.',
    label: 'FRAME 05 / 8–10 SECONDS',
    timeRange: '8–10 seconds',
    startSec: 8,
    endSec: 10,
    context: 'The Alchemical Transition: Final State',
    title: 'The Sovereign.',
    emphasis: 'Eternal. Refined.',
    action:
      "The liquid inside the bottle smoothly transitions in color. It shifts from crystal clear to a soft, blushing rose gold, and finally settles into a deep, rich, luxurious amber. The ingredients fade into the liquid as it becomes opaque and glowing. The gold cap descends and snaps back onto the bottle with a final, satisfying visual 'click'.",
    cameraAngle: 'Locked-off, centered. Full bottle view.',
    lighting: 'Warm, golden-hour glow. The amber liquid acts as a light-box, glowing from within.',
    narration: 'The Sovereign. Eternal. Refined.',
    copy: "The liquid shifts from crystal clear to a soft, blushing rose gold, settling into a deep, rich, glowing amber light-box as the 24k gold cap descends and snaps shut with a final visual 'click'.",
    caption: 'THE ALCHEMICAL TRANSITION: FINAL STATE (8–10S)',
    fxBadges: ['CLEAR → ROSE GOLD → AMBER', 'AMBER LIGHT-BOX GLOW', "MAGNETIC 24K CAP 'CLICK'"],
  },
];
