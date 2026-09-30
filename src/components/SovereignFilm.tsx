import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { sovereignFilmFrames, sovereignVisualElements } from '../sovereign';

type Props = {
  galleryId?: string;
  elementsId?: string;
};

type DustMote = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
};

type MistDroplet = {
  angle: number;
  speed: number;
  spread: number;
  size: number;
  seed: number;
  twinkle: number;
  swirl: number;
};

type VortexParticle = {
  radius: number;
  angle: number;
  height: number;
  speed: number;
  color: string;
  size: number;
};

/**
 * Ten-stage locked-off cinema sequence mapping every second of the 0–10s timeline:
 * 0–1s: Frame 1A (Poised in the Obsidian Void under 3200K spotlight)
 * 1–2s: Frame 1B (Suspended Sovereign levitating & rotating with prismatic flares)
 * 2–3s: Frame 2A (Cap Release — 24k gold cap begins unscrewing in a tight spiral)
 * 3–4s: Frame 2B (Cap Release — 24k gold cap levitates high, revealing chrome atomizer)
 * 4–5s: Frame 3A (The Diffusion — Chrome atomizer depresses, explosive diamond micro-droplet burst)
 * 5–6s: Frame 3B (The Diffusion — Backlit perfume mist forms lingering volumetric swirls)
 * 6–7s: Frame 4A (The Reveal — Hyper-translucent crystal glass reveals internal botanicals in clear liquid)
 * 7–8s: Frame 4B (The Reveal — Rose, cardamom, bergamot & sandalwood swirl in a luminous vortex)
 * 8–9s: Frame 5A (Alchemical Transition — Liquid shifts to soft blushing rose gold as cap descends)
 * 9–10s: Frame 5B (Alchemical Transition — Deep rich glowing amber light-box & 24k gold cap 'click')
 */
const SEQUENCE_STAGES = [
  { src: '/images/sovereign-ref-bottle.jpg', centerSec: 0.45 },
  { src: '/images/sovereign-01.jpg', centerSec: 1.45 },
  { src: '/images/sovereign-02a.jpg', centerSec: 2.45 },
  { src: '/images/sovereign-02.jpg', centerSec: 3.45 },
  { src: '/images/sovereign-03.jpg', centerSec: 4.45 },
  { src: '/images/sovereign-03b.jpg', centerSec: 5.5 },
  { src: '/images/sovereign-04.jpg', centerSec: 6.45 },
  { src: '/images/sovereign-04c.jpg', centerSec: 7.45 },
  { src: '/images/sovereign-04b-rosegold.jpg', centerSec: 8.45 },
  { src: '/images/sovereign-05.jpg', centerSec: 9.6 },
] as const;

function computeStageWeights(tSec: number): number[] {
  const width = 0.92;
  const raw = SEQUENCE_STAGES.map((stage, idx) => {
    if (idx === 0 && tSec <= stage.centerSec) return 1;
    if (idx === SEQUENCE_STAGES.length - 1 && tSec >= stage.centerSec) return 1;
    const dist = Math.abs(tSec - stage.centerSec) / width;
    if (dist >= 1) return 0;
    const smooth = 1 - dist * dist * (3 - 2 * dist);
    return Math.pow(smooth, 1.4);
  });
  const sum = raw.reduce((a, b) => a + b, 0) || 1;
  return raw.map((v) => v / sum);
}

function formatTimecode(sec: number): string {
  const clamped = Math.max(0, Math.min(10, sec));
  const whole = Math.floor(clamped);
  const frames = Math.min(29, Math.floor((clamped - whole) * 30));
  return `00:${String(whole).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}

export default function SovereignFilm({
  galleryId = 'sovereign-gallery',
  elementsId = 'sovereign-elements',
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bottleStageRef = useRef<HTMLDivElement>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);
  const timecodeRef = useRef<HTMLElement>(null);
  const frameCounterRef = useRef<HTMLElement>(null);
  const alchemicalLabelRef = useRef<HTMLElement>(null);

  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);
  const velocityRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  // Tracks whether any part of the film section is on screen so the heavy
  // canvas FX loop can sleep while the user is elsewhere on the page.
  const visibleRef = useRef(true);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const [chapter, setChapter] = useState(0);
  const [alchemicalStage, setAlchemicalStage] = useState<'CLEAR' | 'ROSE GOLD' | 'AMBER'>('CLEAR');
  const [capClicked, setCapClicked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRefsDrawer, setShowRefsDrawer] = useState(false);

  // ScrollTrigger binding
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const prev = targetProgressRef.current;
          targetProgressRef.current = self.progress;
          velocityRef.current = Math.min(1, Math.abs(self.progress - prev) * 38);

          const tSec = self.progress * 10;
          const nextChapter = Math.min(
            sovereignFilmFrames.length - 1,
            Math.floor(self.progress * sovereignFilmFrames.length)
          );
          setChapter((current) => (current === nextChapter ? current : nextChapter));

          if (tSec < 8.15) {
            setAlchemicalStage((s) => (s === 'CLEAR' ? s : 'CLEAR'));
          } else if (tSec < 9.05) {
            setAlchemicalStage((s) => (s === 'ROSE GOLD' ? s : 'ROSE GOLD'));
          } else {
            setAlchemicalStage((s) => (s === 'AMBER' ? s : 'AMBER'));
          }

          const clicked = tSec >= 9.2;
          setCapClicked((c) => (c === clicked ? c : clicked));
        },
      });
      return () => trigger.kill();
    },
    { scope: sectionRef }
  );



  // Auto-play scroll loop when user clicks "AUTO-PLAY FILM"
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const section = sectionRef.current;
      if (!section) return;
      const distance = Math.max(1, section.offsetHeight - window.innerHeight);
      const currentScroll = window.scrollY - section.offsetTop;
      const nextProgress = Math.min(1, Math.max(0, currentScroll / distance) + dt / 10.5);
      window.scrollTo({ top: section.offsetTop + nextProgress * distance, behavior: 'auto' });
      if (nextProgress >= 0.998) {
        setIsPlaying(false);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  // High-DPI Real-Time Procedural Cinema FX Canvas + Smooth Frame Interpolation Loop
  useEffect(() => {
    const canvas = fxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale particle budgets down on narrow screens where the canvas is small
    // and mobile GPUs are fill-rate limited.
    const isSmallScreen = window.innerWidth < 720;
    const dustMotes: DustMote[] = Array.from({ length: isSmallScreen ? 70 : 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.2 + Math.random() * 0.8,
      vx: (Math.random() - 0.5) * 0.00035,
      vy: -0.00018 - Math.random() * 0.00035,
      size: 0.7 + Math.random() * 2.2,
      phase: Math.random() * Math.PI * 2,
    }));

    const mistDroplets: MistDroplet[] = Array.from({ length: isSmallScreen ? 150 : 320 }, (_, i) => ({
      angle: -Math.PI * 0.5 + (Math.random() - 0.5) * 1.95,
      speed: 0.22 + Math.random() * 0.95,
      spread: 0.05 + Math.random() * 0.36,
      size: 0.7 + (i % 7 === 0 ? 2.6 : Math.random() * 1.9),
      seed: Math.random() * 100,
      twinkle: 2 + Math.random() * 6,
      swirl: (Math.random() - 0.5) * 1.6,
    }));

    const vortexColors = ['#d6324a', '#b8253c', '#7ab85c', '#a3d977', '#d89b48', '#f5dca8'];
    const vortexCount = isSmallScreen ? 36 : 68;
    const vortexParticles: VortexParticle[] = Array.from({ length: vortexCount }, (_, i) => ({
      radius: 0.02 + Math.random() * 0.085,
      angle: (i / vortexCount) * Math.PI * 2,
      height: (Math.random() - 0.5) * 0.22,
      speed: 0.9 + Math.random() * 1.4,
      color: vortexColors[i % vortexColors.length],
      size: 1.5 + Math.random() * 3.2,
    }));

    let width = 0;
    let height = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, isSmallScreen ? 1.5 : 2);
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const onPointerMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      pointerRef.current.y = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let raf = 0;
    const startTime = performance.now();

    const drawStarFlare = (
      x: number,
      y: number,
      radius: number,
      alpha: number,
      colorCore: string,
      colorRay: string,
      rotation = 0,
      anamorphic = 1.8
    ) => {
      if (alpha <= 0.01) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.globalCompositeOperation = 'lighter';

      const radial = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      radial.addColorStop(0, colorCore);
      radial.addColorStop(0.25, colorRay);
      radial.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal anamorphic streak
      ctx.save();
      ctx.scale(anamorphic, 0.14);
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4-point prismatic rays
      ctx.rotate(rotation);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.save();
        ctx.scale(1, 0.06);
        ctx.globalAlpha = alpha * 0.55;
        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    };

    const render = (now: number) => {
      // Sleep the expensive canvas work while the film is fully off screen.
      if (!visibleRef.current) {
        raf = requestAnimationFrame(render);
        return;
      }
      const elapsed = (now - startTime) * 0.001;

      // Smoothly damp scroll progress so frames scrub like a 60fps cinema video
      const diff = targetProgressRef.current - smoothProgressRef.current;
      smoothProgressRef.current += diff * 0.16;
      velocityRef.current *= 0.92;

      const p = Math.max(0, Math.min(1, smoothProgressRef.current));
      const tSec = p * 10; // 0.00s to 10.00s

      // Update DOM readouts & multi-image blend weights
      const weights = computeStageWeights(tSec);
      imageRefs.current.forEach((img, index) => {
        if (!img) return;
        const w = weights[index] ?? 0;
        img.style.opacity = w.toFixed(4);
      });

      // Subtle 3D bottle motion & camera breathing on the image stack
      if (bottleStageRef.current) {
        // Frame 1 (0-2s): slow 360-feel horizontal rotation & suspension float
        const f1Env = Math.max(0, 1 - tSec / 2.3);
        const rotY =
          Math.sin(tSec * Math.PI * 0.85) * 5.2 * f1Env +
          pointerRef.current.x * 2.8 +
          Math.sin(elapsed * 0.7) * 0.9;
        const floatY =
          Math.sin(elapsed * 1.4 + tSec * 1.8) * (7.5 * f1Env + 2.2) -
          (tSec >= 2 && tSec <= 4 ? (tSec - 2) * 3.5 : 0);
        // Camera zoom tightens on nozzle/interior in Frames 2-4, pulls back to full view in Frame 5
        const zoomBell =
          1 +
          0.035 * Math.sin(Math.min(1, Math.max(0, (tSec - 1.5) / 6.8)) * Math.PI) +
          velocityRef.current * 0.015;
        bottleStageRef.current.style.transform = `perspective(1200px) translate3d(${(pointerRef.current.x * -6).toFixed(2)}px, ${floatY.toFixed(2)}px, 0) rotateY(${rotY.toFixed(2)}deg) scale(${zoomBell.toFixed(4)})`;
      }

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
      }
      if (timecodeRef.current) {
        timecodeRef.current.textContent = formatTimecode(tSec);
      }
      if (frameCounterRef.current) {
        const currentFrameNum = Math.min(5, Math.floor(p * 5) + 1);
        frameCounterRef.current.textContent = `0${currentFrameNum}`;
      }
      if (alchemicalLabelRef.current) {
        if (tSec < 8.0) {
          alchemicalLabelRef.current.textContent = 'CRYSTAL CLEAR BOTANICAL';
        } else if (tSec < 9.05) {
          alchemicalLabelRef.current.textContent = 'BLUSHING ROSE GOLD';
        } else {
          alchemicalLabelRef.current.textContent = 'DEEP LUXURIOUS AMBER';
        }
      }

      // Clear FX canvas
      ctx.clearRect(0, 0, width, height);
      const cx = width * 0.5;
      const cy = height * 0.52;

      // =========================================================================
      // 1. VOLUMETRIC GOLDEN LIGHT (3200K Overhead Spotlight & God Rays)
      // =========================================================================
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const rayOriginX = cx + pointerRef.current.x * 18;
      const rayOriginY = -height * 0.08;
      const rayGrad = ctx.createRadialGradient(
        rayOriginX,
        rayOriginY,
        10,
        rayOriginX,
        height * 0.55,
        Math.max(width, height) * 0.72
      );
      const lightPulse = 0.88 + 0.12 * Math.sin(elapsed * 1.3 + tSec * 0.8);
      rayGrad.addColorStop(0, `rgba(255, 224, 166, ${(0.22 * lightPulse).toFixed(3)})`);
      rayGrad.addColorStop(0.35, `rgba(230, 172, 92, ${(0.095 * lightPulse).toFixed(3)})`);
      rayGrad.addColorStop(0.75, 'rgba(180, 115, 48, 0.025)');
      rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(rayOriginX - width * 0.06, rayOriginY);
      ctx.lineTo(rayOriginX + width * 0.06, rayOriginY);
      ctx.lineTo(cx + width * 0.36, height);
      ctx.lineTo(cx - width * 0.36, height);
      ctx.closePath();
      ctx.fill();

      // Individual God-ray shafts that rotate subtly with scroll
      for (let r = 0; r < 5; r++) {
        const angleOffset = (r - 2) * 0.075 + Math.sin(elapsed * 0.45 + r + tSec * 0.5) * 0.022;
        const spreadBottom = width * (0.045 + (r % 2) * 0.025);
        const bottomX = cx + Math.sin(angleOffset) * width * 0.45;
        const shaftGrad = ctx.createLinearGradient(rayOriginX, 0, bottomX, height * 0.88);
        shaftGrad.addColorStop(0, 'rgba(255, 218, 152, 0.075)');
        shaftGrad.addColorStop(0.55, 'rgba(228, 168, 88, 0.032)');
        shaftGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shaftGrad;
        ctx.beginPath();
        ctx.moveTo(rayOriginX - 8, 0);
        ctx.lineTo(rayOriginX + 8, 0);
        ctx.lineTo(bottomX + spreadBottom, height * 0.92);
        ctx.lineTo(bottomX - spreadBottom, height * 0.92);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // =========================================================================
      // 2. MICROSCOPIC DANCING DUST MOTES IN THE VOLUMETRIC BEAM
      // =========================================================================
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < dustMotes.length; i++) {
        const m = dustMotes[i];
        m.x += m.vx + Math.sin(elapsed * 0.6 + m.phase) * 0.00015;
        m.y += m.vy - velocityRef.current * 0.0028 * m.z;
        if (m.y < -0.04) m.y = 1.04;
        if (m.x < 0.15) m.x = 0.85;
        if (m.x > 0.85) m.x = 0.15;

        const px = m.x * width;
        const py = m.y * height;
        // Cone mask: brightest inside the overhead volumetric beam
        const coneHalfWidth = width * (0.09 + m.y * 0.26);
        const distFromAxis = Math.abs(px - cx);
        const coneMask = Math.max(0, 1 - distFromAxis / coneHalfWidth);
        if (coneMask <= 0.02) continue;

        const twinkle = 0.45 + 0.55 * Math.sin(elapsed * 2.4 + m.phase + tSec * 2);
        const alpha = coneMask * twinkle * (0.25 + m.z * 0.55);
        const radius = m.size * (m.z > 0.82 ? 2.1 : 1);

        ctx.fillStyle = m.z > 0.82 ? `rgba(255, 226, 172, ${alpha * 0.38})` : `rgba(255, 236, 195, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // =========================================================================
      // 3. RAY-TRACED FLOOR CAUSTICS ON THE OBSIDIAN SURFACE
      // =========================================================================
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const floorY = height * 0.815;
      const causticCount = 12;
      for (let c = 0; c < causticCount; c++) {
        const angle = (c / causticCount) * Math.PI * 2 + tSec * 0.55 + elapsed * 0.18;
        const reach = width * (0.12 + 0.14 * Math.sin(c * 1.7 + tSec * 0.9));
        const endX = cx + Math.cos(angle) * reach;
        const endY = floorY + Math.sin(angle) * height * 0.055;

        const causticGrad = ctx.createLinearGradient(cx, floorY, endX, endY);
        causticGrad.addColorStop(0, 'rgba(255, 214, 138, 0.16)');
        causticGrad.addColorStop(0.55, 'rgba(240, 168, 75, 0.09)');
        causticGrad.addColorStop(0.85, 'rgba(135, 210, 255, 0.035)');
        causticGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = causticGrad;
        ctx.lineWidth = 2.2 + (c % 3) * 1.4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * 24, floorY + Math.sin(angle) * 6);
        ctx.quadraticCurveTo(
          cx + Math.cos(angle + 0.18) * reach * 0.55,
          floorY + Math.sin(angle + 0.18) * height * 0.03,
          endX,
          endY
        );
        ctx.stroke();
      }
      ctx.restore();

      // =========================================================================
      // 4. FRAME 1 (0–2s): PRISMATIC CRYSTAL FACET LIGHT FLARES & 360° ROTATION GLINTS
      // =========================================================================
      if (tSec < 2.6) {
        const f1Alpha = Math.min(1, Math.max(0, 1 - (tSec - 1.75) / 0.85));
        const rotPhase = tSec * Math.PI * 1.25 + elapsed * 0.9;
        const flarePositions = [
          { x: cx - width * 0.068, y: cy - height * 0.04, phase: 0 },
          { x: cx + width * 0.072, y: cy + height * 0.02, phase: 1.6 },
          { x: cx - width * 0.045, y: cy + height * 0.15, phase: 3.1 },
          { x: cx + width * 0.055, y: cy - height * 0.12, phase: 4.5 },
        ];
        flarePositions.forEach((fp, idx) => {
          const pulse = Math.pow(Math.max(0, Math.sin(rotPhase + fp.phase)), 2);
          drawStarFlare(
            fp.x + Math.cos(rotPhase + idx) * 10,
            fp.y + Math.sin(rotPhase + idx) * 6,
            42 + pulse * 58,
            f1Alpha * (0.35 + pulse * 0.65),
            'rgba(255, 250, 235, 0.95)',
            idx % 2 === 0 ? 'rgba(255, 196, 110, 0.55)' : 'rgba(165, 225, 255, 0.48)',
            rotPhase * 0.35,
            2.4
          );
        });
      }

      // =========================================================================
      // 5. FRAME 2 (2–4s): SPIRAL CAP ASCENSION HELIX & 24K GOLD / CHROME SPECULAR GLINT
      // =========================================================================
      if (tSec > 1.5 && tSec < 4.5) {
        const f2Env =
          Math.min(1, Math.max(0, (tSec - 1.5) / 0.6)) *
          Math.min(1, Math.max(0, (4.5 - tSec) / 0.6));
        const localT = Math.min(1, Math.max(0, (tSec - 2.0) / 2.0));

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const spiralTopY = height * 0.24;
        const spiralBottomY = height * 0.36;
        const turns = 2.6;
        const segments = 64;

        ctx.beginPath();
        for (let s = 0; s <= segments; s++) {
          const u = s / segments;
          const theta = u * Math.PI * 2 * turns - elapsed * 3.2 - localT * Math.PI * 2;
          const radiusX = width * (0.028 + 0.012 * Math.sin(u * Math.PI));
          const sx = cx + Math.cos(theta) * radiusX;
          const sy = spiralBottomY - u * (spiralBottomY - spiralTopY);
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = `rgba(255, 215, 132, ${(f2Env * 0.68).toFixed(3)})`;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Glint on the levitating 24k gold cap rim & exposed chrome atomizer
        drawStarFlare(
          cx + width * 0.028,
          height * (0.255 - localT * 0.02),
          64,
          f2Env * 0.88,
          'rgba(255, 252, 238, 1)',
          'rgba(255, 206, 108, 0.65)',
          elapsed * 0.5,
          2.6
        );
        drawStarFlare(
          cx - width * 0.014,
          height * 0.345,
          38,
          f2Env * 0.72,
          'rgba(240, 248, 255, 0.95)',
          'rgba(185, 220, 255, 0.5)',
          -elapsed * 0.4,
          1.9
        );
        ctx.restore();
      }

      // =========================================================================
      // 6. FRAME 3 (4–6s): EXPLOSIVE ULTRA-SLOW-MOTION DIAMOND MICRO-DROPLET MIST
      // =========================================================================
      if (tSec > 3.5 && tSec < 6.6) {
        const f3Env =
          Math.min(1, Math.max(0, (tSec - 3.5) / 0.55)) *
          Math.min(1, Math.max(0, (6.6 - tSec) / 0.65));
        const burstProgress = Math.min(1, Math.max(0.08, (tSec - 3.85) / 2.15));

        const nozzleX = cx;
        const nozzleY = height * 0.275;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Volumetric mist swirls around the bottle
        for (let m = 0; m < 6; m++) {
          const swirlAngle = elapsed * 0.35 + m * 1.05 + burstProgress * 2.2;
          const swirlDist = width * (0.06 + burstProgress * (0.12 + (m % 3) * 0.06));
          const mx = nozzleX + Math.cos(swirlAngle) * swirlDist * (m % 2 === 0 ? 1.35 : -1.25);
          const my = nozzleY + height * 0.08 + Math.sin(swirlAngle * 0.8) * height * 0.14;
          const mRadius = Math.min(width, height) * (0.14 + burstProgress * 0.12);

          const mistGrad = ctx.createRadialGradient(mx, my, 4, mx, my, mRadius);
          mistGrad.addColorStop(0, `rgba(255, 232, 188, ${(f3Env * 0.14).toFixed(3)})`);
          mistGrad.addColorStop(0.5, `rgba(224, 178, 112, ${(f3Env * 0.065).toFixed(3)})`);
          mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = mistGrad;
          ctx.beginPath();
          ctx.arc(mx, my, mRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Thousands-feel individual micro-droplets scattering light like tiny diamonds
        for (let i = 0; i < mistDroplets.length; i++) {
          const d = mistDroplets[i];
          const life = (burstProgress * d.speed + (elapsed * 0.12 + d.seed) % 0.45) % 1;
          const dist = life * Math.min(width, height) * (0.18 + d.spread * 0.95);
          const curveAngle = d.angle + life * d.swirl * 0.65;
          const dx = nozzleX + Math.cos(curveAngle) * dist * 1.25;
          const dy = nozzleY + Math.sin(curveAngle) * dist * 0.85 + life * life * height * 0.12;

          const diamondSparkle = 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(elapsed * d.twinkle + d.seed)), 3);
          const alpha = f3Env * (1 - life * 0.75) * diamondSparkle;
          if (alpha <= 0.03) continue;

          ctx.fillStyle =
            i % 5 === 0
              ? `rgba(215, 242, 255, ${(alpha * 0.95).toFixed(3)})`
              : `rgba(255, 240, 205, ${(alpha * 0.9).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(dx, dy, d.size * (0.7 + life * 0.6), 0, Math.PI * 2);
          ctx.fill();

          if (i % 14 === 0 && diamondSparkle > 0.78) {
            drawStarFlare(
              dx,
              dy,
              14,
              alpha * 0.75,
              'rgba(255,255,255,0.95)',
              'rgba(255,222,158,0.55)',
              d.seed,
              1.4
            );
          }
        }
        ctx.restore();
      }

      // =========================================================================
      // 7. FRAME 4 (6–8s): INTERNAL BOTANICAL VORTEX & HYPER-TRANSLUCENT GLOW
      // =========================================================================
      if (tSec > 5.5 && tSec < 8.45) {
        const f4Env =
          Math.min(1, Math.max(0, (tSec - 5.5) / 0.6)) *
          Math.min(1, Math.max(0, (8.45 - tSec) / 0.55));
        const bottleCoreY = height * 0.54;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Soft internal bioluminescent botanical glow inside the translucent glass
        const coreGlow = ctx.createRadialGradient(
          cx,
          bottleCoreY,
          8,
          cx,
          bottleCoreY,
          Math.min(width, height) * 0.22
        );
        coreGlow.addColorStop(0, `rgba(255, 232, 192, ${(f4Env * 0.22).toFixed(3)})`);
        coreGlow.addColorStop(0.45, `rgba(214, 92, 108, ${(f4Env * 0.12).toFixed(3)})`);
        coreGlow.addColorStop(0.75, `rgba(132, 198, 108, ${(f4Env * 0.08).toFixed(3)})`);
        coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(cx, bottleCoreY, Math.min(width, height) * 0.22, 0, Math.PI * 2);
        ctx.fill();

        // Swirling internal liquid vortex streamlines & botanical essence particles
        for (let i = 0; i < vortexParticles.length; i++) {
          const vp = vortexParticles[i];
          const theta = vp.angle + elapsed * vp.speed + tSec * 1.9;
          const rx = Math.cos(theta) * width * vp.radius;
          const ry = vp.height * height + Math.sin(theta * 2) * 10;
          const depth = 0.5 + 0.5 * Math.sin(theta);

          ctx.fillStyle = vp.color;
          ctx.globalAlpha = f4Env * (0.25 + depth * 0.55);
          ctx.beginPath();
          ctx.arc(cx + rx, bottleCoreY + ry, vp.size * (0.6 + depth * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // =========================================================================
      // 8. FRAME 5 (8–10s): ALCHEMICAL TRANSITION (CLEAR → ROSE GOLD → AMBER) & MAGNETIC 'CLICK'
      // =========================================================================
      if (tSec > 7.7) {
        const f5Env = Math.min(1, Math.max(0, (tSec - 7.7) / 0.5));
        const bottleCoreY = height * 0.54;

        // Rose-gold phase peaks around 8.45s, Amber light-box peaks 9.2–10.0s
        const roseGoldWeight = Math.max(0, 1 - Math.abs(tSec - 8.45) / 0.75);
        const amberWeight = Math.min(1, Math.max(0, (tSec - 8.75) / 0.75));

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        if (roseGoldWeight > 0.01) {
          const rgGrad = ctx.createRadialGradient(
            cx,
            bottleCoreY,
            10,
            cx,
            bottleCoreY,
            Math.min(width, height) * 0.26
          );
          rgGrad.addColorStop(0, `rgba(255, 192, 182, ${(roseGoldWeight * 0.28).toFixed(3)})`);
          rgGrad.addColorStop(0.5, `rgba(232, 134, 128, ${(roseGoldWeight * 0.16).toFixed(3)})`);
          rgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = rgGrad;
          ctx.beginPath();
          ctx.arc(cx, bottleCoreY, Math.min(width, height) * 0.26, 0, Math.PI * 2);
          ctx.fill();
        }

        if (amberWeight > 0.01) {
          // Warm golden-hour glow: amber liquid acts as a light-box glowing from within
          const amberGrad = ctx.createRadialGradient(
            cx,
            bottleCoreY,
            12,
            cx,
            bottleCoreY,
            Math.min(width, height) * 0.32
          );
          amberGrad.addColorStop(0, `rgba(255, 206, 112, ${(amberWeight * f5Env * 0.34).toFixed(3)})`);
          amberGrad.addColorStop(0.45, `rgba(235, 142, 38, ${(amberWeight * f5Env * 0.2).toFixed(3)})`);
          amberGrad.addColorStop(0.8, `rgba(175, 88, 18, ${(amberWeight * f5Env * 0.08).toFixed(3)})`);
          amberGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = amberGrad;
          ctx.beginPath();
          ctx.arc(cx, bottleCoreY, Math.min(width, height) * 0.32, 0, Math.PI * 2);
          ctx.fill();
        }

        // Satisfying visual 'CLICK' when the 24k gold cap snaps back onto the bottle (around 9.1s–9.85s)
        if (tSec >= 9.05) {
          const clickT = Math.min(1, (tSec - 9.05) / 0.75);
          const clickRingAlpha = Math.sin(clickT * Math.PI) * 0.9;
          const collarY = height * 0.315;
          const ringRadius = 14 + clickT * Math.min(width, height) * 0.16;

          ctx.strokeStyle = `rgba(255, 226, 152, ${clickRingAlpha.toFixed(3)})`;
          ctx.lineWidth = 2.4 * (1 - clickT * 0.6);
          ctx.beginPath();
          ctx.ellipse(cx, collarY, ringRadius, ringRadius * 0.28, 0, 0, Math.PI * 2);
          ctx.stroke();

          drawStarFlare(
            cx + width * 0.025,
            collarY,
            78 * (0.5 + 0.5 * Math.sin(clickT * Math.PI)),
            0.45 + 0.55 * Math.sin(clickT * Math.PI),
            'rgba(255, 252, 240, 1)',
            'rgba(255, 204, 102, 0.78)',
            0,
            3.2
          );
        }

        ctx.restore();
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  const jumpTo = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const distance = Math.max(0, section.offsetHeight - window.innerHeight);
    // Jump to the center of the selected frame's time window
    const targetProgress =
      index === sovereignFilmFrames.length - 1
        ? 0.96
        : (index + 0.35) / sovereignFilmFrames.length;
    if (distance < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targetProgressRef.current = targetProgress;
      smoothProgressRef.current = targetProgress;
      setChapter(index);
      return;
    }
    window.scrollTo({ top: section.offsetTop + distance * targetProgress, behavior: 'smooth' });
  };

  const active = sovereignFilmFrames[chapter];

  return (
    <section
      className="sovereign-film"
      ref={sectionRef}
      aria-label="DAYRAH SCENTS — The Sovereign 10-second scroll-scrubbed fragrance film"
    >
      <div className="sovereign-film__stage" ref={stageRef}>
        {/* Multi-keyframe locked-off cinema stage with 3D perspective & alchemical sub-frames */}
        <div className="sovereign-film__frames" ref={bottleStageRef} aria-hidden="true">
          {SEQUENCE_STAGES.map((stage, index) => (
            <img
              key={stage.src}
              ref={(element) => {
                imageRefs.current[index] = element;
              }}
              src={stage.src}
              alt=""
              fetchPriority={index === 0 ? 'high' : 'auto'}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              style={{ opacity: index === 0 ? 1 : 0 }}
            />
          ))}
        </div>

        {/* Real-time 60fps Volumetric Light, Dust Motes, Floor Caustics, Diamond Mist & Alchemical FX Canvas */}
        <canvas className="sovereign-film__fx-canvas" ref={fxCanvasRef} aria-hidden="true" />

        {/* Subtle obsidian edge vignette that leaves the centered DAYRAH SCENTS bottle 100% clear */}
        <div className="sovereign-film__wash" aria-hidden="true" />
        <div className="sovereign-film__grain" aria-hidden="true" />

        {/* Top Director's Header Bar */}
        <div className="sovereign-film__topline">
          <div className="sovereign-film__topline-left">
            <span className="sovereign-film__brand-pill">DAYRAH SCENTS</span>
            <span>THE SOVEREIGN FILM&nbsp; / &nbsp;OBSIDIAN VOID STUDIO&nbsp; · &nbsp;3200K VOLUMETRIC</span>
          </div>
          <div className="sovereign-film__topline-controls">
            <button
              type="button"
              className={`sovereign-film__ctrl-btn ${showRefsDrawer ? 'is-on' : ''}`}
              onClick={() => setShowRefsDrawer((v) => !v)}
            >
              VISUAL ELEMENTS ({sovereignVisualElements.length})
            </button>
            <button
              type="button"
              className={`sovereign-film__ctrl-btn ${isPlaying ? 'is-on' : ''}`}
              onClick={() => setIsPlaying((v) => !v)}
            >
              {isPlaying ? '❚❚ PAUSE FILM' : '▶ AUTO-PLAY 10S FILM'}
            </button>

          </div>
        </div>

        {/* Optional floating drawer previewing the 4 Established Reference Visual Elements */}
        <AnimatePresence>
          {showRefsDrawer && (
            <motion.div
              className="sovereign-film__refs-drawer"
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
            >
              <div className="sovereign-film__refs-head">
                <span>ESTABLISHED REFERENCE VISUAL ELEMENTS (LOCATIONS · PROPS · 3200K SET LIGHTING)</span>
                <button type="button" onClick={() => setShowRefsDrawer(false)}>
                  CLOSE ×
                </button>
              </div>
              <div className="sovereign-film__refs-grid">
                {sovereignVisualElements.map((el) => (
                  <a key={el.id} href={`#${elementsId}`} className="sovereign-film__ref-card" onClick={() => setShowRefsDrawer(false)}>
                    <img src={el.src} alt={el.alt} />
                    <div>
                      <small>{el.category.toUpperCase()}</small>
                      <b>{el.name}</b>
                      <p>{el.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Left + Right Cinema HUD flanking the centered DAYRAH SCENTS bottle */}
        <div className="sovereign-film__layout">
          {/* Left Column: Context, Narration & Action */}
          <div className="sovereign-film__copy" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={chapter}
                initial={{ opacity: 0, y: 18, filter: 'blur(7px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(5px)' }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="sovereign-film__kicker">{active.label}</p>
                <p className="sovereign-film__context">{active.context}</p>
                <h1>
                  {active.title}
                  <br />
                  <em>{active.emphasis}</em>
                </h1>
                <p className="sovereign-film__description">{active.action}</p>
                <div className="sovereign-film__fx-pills">
                  {active.fxBadges.map((badge) => (
                    <span key={badge}>{badge}</span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="sovereign-film__actions">
              <a className="sovereign-film__link" href={`#${elementsId}`}>
                EXPLORE VISUAL ELEMENTS & STORYBOARD <span>↓</span>
              </a>
              <span className="sovereign-film__hint">SCROLL DOWN TO SCRUB THE 10-SECOND FILM</span>
            </div>
          </div>

          {/* Right Column: Camera Angle, Lighting & Frame-Specific Live Monitors */}
          <aside className="sovereign-film__specs" aria-label="Scene camera and lighting telemetry">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={chapter}
                className="sovereign-film__specs-card"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="sovereign-film__spec-row">
                  <span>TIME WINDOW</span>
                  <b>{active.timeRange.toUpperCase()} · LOCKED-OFF TRIPOD</b>
                </div>
                <div className="sovereign-film__spec-row">
                  <span>CAMERA ANGLE</span>
                  <p>{active.cameraAngle}</p>
                </div>
                <div className="sovereign-film__spec-row">
                  <span>LIGHTING RIG</span>
                  <p>{active.lighting}</p>
                </div>
                <div className="sovereign-film__spec-row">
                  <span>BOTTLE INSCRIPTION</span>
                  <b>DAYRAH SCENTS — THE SOVEREIGN</b>
                </div>

                {/* Frame 4 (6-8s): Live Macro Loupe showing internal botanicals close-up */}
                {active.macroSrc && (
                  <div className="sovereign-film__macro-pip">
                    <img src={active.macroSrc} alt="Macro interior study of rose petals, cardamom pods, bergamot slices, and sandalwood chips inside the bottle" />
                    <div>
                      <span>MACRO INTERIOR LOUPE</span>
                      <b>Rose · Cardamom · Bergamot · Sandalwood</b>
                    </div>
                  </div>
                )}

                {/* Frame 5 (8-10s): Live Alchemical Color Transition & Magnetic Click Telemetry */}
                {active.frameNumber === 5 && (
                  <div className="sovereign-film__alchemy-meter">
                    <span>ALCHEMICAL LIQUID STATE</span>
                    <b ref={alchemicalLabelRef}>{alchemicalStage}</b>
                    <div className="sovereign-film__alchemy-swatches">
                      <i className={alchemicalStage === 'CLEAR' ? 'is-current' : ''} title="Crystal Clear">
                        CLEAR
                      </i>
                      <i className={alchemicalStage === 'ROSE GOLD' ? 'is-current' : ''} title="Blushing Rose Gold">
                        ROSE GOLD
                      </i>
                      <i className={alchemicalStage === 'AMBER' ? 'is-current' : ''} title="Deep Luxurious Amber">
                        AMBER
                      </i>
                    </div>
                    <div className={`sovereign-film__click-badge ${capClicked ? 'is-clicked' : ''}`}>
                      {capClicked ? "● 24K GOLD CAP: MAGNETIC 'CLICK' SEALED" : '○ 24K GOLD CAP: DESCENDING'}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </aside>
        </div>

        {/* Right-edge Chapter Rail */}
        <div className="sovereign-film__chapters" aria-label="Film frames">
          {sovereignFilmFrames.map((frame, index) => (
            <button
              key={frame.label}
              type="button"
              className={chapter === index ? 'is-active' : ''}
              onClick={() => jumpTo(index)}
              aria-label={`Jump to Frame ${frame.frameNumber}: ${frame.context}`}
              aria-current={chapter === index ? 'step' : undefined}
            >
              <span>0{index + 1}</span>
              <i />
            </button>
          ))}
        </div>

        <div className="sovereign-film__bottom">
          <a href={`#${galleryId}`} className="sovereign-film__scroll-mark" aria-label="Scroll to storyboard">
            ↓
          </a>
          <div className="sovereign-film__timeline-stops" role="group" aria-label="Scrub to scene frame">
            {sovereignFilmFrames.map((frame, index) => (
              <button
                key={frame.frameNumber}
                type="button"
                className={chapter === index ? 'is-active' : ''}
                onClick={() => jumpTo(index)}
              >
                <b>F0{frame.frameNumber}</b>
                <span>{frame.timeRange}</span>
              </button>
            ))}
          </div>
          <span className="sovereign-film__readout">
            <span className="sovereign-film__timecode" ref={timecodeRef}>00:00:00</span>
            <span>·</span>
            <b ref={frameCounterRef}>01</b>
            <i>/ 05 FRAMES (10.0S)</i>
          </span>
        </div>
        <div className="sovereign-film__progress">
          <div ref={progressRef} />
        </div>
      </div>
    </section>
  );
}
