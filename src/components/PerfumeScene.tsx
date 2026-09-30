import { useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, MeshTransmissionMaterial, OrbitControls, RoundedBox, Sparkles } from '@react-three/drei';
import { Bloom, ChromaticAberration, DepthOfField, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

type Note = 'oud' | 'rose' | 'amber';
type SceneProps = { progress: MutableRefObject<number>; note: Note };
type MotionSceneProps = SceneProps & { reducedMotion: boolean };

const petalShape = new THREE.Shape();
petalShape.moveTo(0, -0.48);
petalShape.bezierCurveTo(-0.43, -0.18, -0.47, 0.38, 0, 0.54);
petalShape.bezierCurveTo(0.48, 0.32, 0.4, -0.18, 0, -0.48);
const petalGeometry = new THREE.ShapeGeometry(petalShape, 18);
/* Muted, naturally toned petal palette (no candy brights). */
const petalColors = ['#a8435c', '#c08383', '#dfc1a1', '#995c40', '#c59e69', '#e4d2bd'];
const chromaticOffset = new THREE.Vector2(0.00022, 0.00022);

type Keyframe = readonly [number, number];
function sampleTrack(progress: number, frames: readonly Keyframe[]) {
  if (progress <= frames[0][0]) return frames[0][1];
  for (let index = 1; index < frames.length; index += 1) {
    const [end, value] = frames[index];
    if (progress <= end) {
      const [start, from] = frames[index - 1];
      const raw = THREE.MathUtils.clamp((progress - start) / (end - start), 0, 1);
      const eased = raw * raw * (3 - 2 * raw);
      return THREE.MathUtils.lerp(from, value, eased);
    }
  }
  return frames[frames.length - 1][1];
}

const bottleRotation: readonly Keyframe[] = [[0, -0.16], [0.18, 0.05], [0.4, 0.48], [0.62, 1.72], [0.83, 3.95], [1, Math.PI * 2]];
const bottleScale: readonly Keyframe[] = [[0, 0.94], [0.18, 0.98], [0.42, 1.06], [0.66, 1.16], [0.84, 1.23], [1, 1.08]];
const bottleLift: readonly Keyframe[] = [[0, -0.08], [0.24, -0.03], [0.52, -0.15], [0.76, 0.02], [1, -0.04]];
const capLift: readonly Keyframe[] = [[0, 0], [0.38, 0], [0.52, 0.24], [0.7, 0.98], [0.88, 1.08], [1, 0.72]];

/* Deep, grown-up accent tones: scene lighting and the halo cross-fade with the accord. */
const noteAccents: Record<Note, { fill: string; rim: string; halo: string }> = {
  oud: { fill: '#a85a2a', rim: '#63321a', halo: '#6f3016' },
  rose: { fill: '#a95a6c', rim: '#7c3a4b', halo: '#7e2f45' },
  amber: { fill: '#c78a3c', rim: '#8f5c20', halo: '#8f5a1e' },
};
/* Liquid: luminous surface tint + dark absorption depth per accord. */
const liquidTones: Record<Note, { base: string; deep: string }> = {
  oud: { base: '#96602f', deep: '#3f2110' },
  rose: { base: '#c06678', deep: '#772d3d' },
  amber: { base: '#d59a4f', deep: '#6d380f' },
};

/* Refined paper label: hairline double frame, wide-tracked serif, generous negative space. */
function makeLabelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();
  ctx.fillStyle = '#f3ecdc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#a5855c';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(44, 44, 936, 680);
  ctx.lineWidth = 1;
  ctx.strokeRect(60, 60, 904, 648);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2f2720';
  ctx.font = '500 68px Georgia';
  ctx.letterSpacing = '18px';
  ctx.fillText('DAYRAH SCENTS', 512, 310);
  ctx.strokeStyle = '#a5855c';
  ctx.beginPath();
  ctx.moveTo(442, 368);
  ctx.lineTo(582, 368);
  ctx.stroke();
  ctx.fillStyle = '#7c6239';
  ctx.font = '34px Georgia';
  ctx.letterSpacing = '16px';
  ctx.fillText('SIFR / 01', 512, 448);
  ctx.fillStyle = '#9c8468';
  ctx.font = '21px Georgia';
  ctx.letterSpacing = '11px';
  ctx.fillText('EAU DE PARFUM', 512, 516);
  ctx.font = '19px Georgia';
  ctx.letterSpacing = '9px';
  ctx.fillText('OUD · ROSE · AMBER', 512, 624);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

function GlassBottle({ progress, note, reducedMotion }: MotionSceneProps) {
  const bottle = useRef<THREE.Group>(null);
  const cap = useRef<THREE.Group>(null);
  const liquidMesh = useRef<THREE.Mesh>(null);
  const liquidMaterial = useRef<THREE.MeshPhysicalMaterial>(null);
  const lastProgress = useRef(0);
  const slosh = useRef(0);
  const labelTexture = useMemo(makeLabelTexture, []);
  const { size } = useThree();
  const transmissionResolution = size.width < 720 ? 384 : 768;
  const transmissionSamples = size.width < 720 ? 4 : 8;
  const tone = liquidTones[note];
  const targetBase = useMemo(() => new THREE.Color(tone.base), [tone]);
  const targetDeep = useMemo(() => new THREE.Color(tone.deep), [tone]);

  useFrame((state, delta) => {
    const p = reducedMotion ? 0 : progress.current;
    const idle = reducedMotion ? 0 : 1;
    if (bottle.current) {
      bottle.current.rotation.y = sampleTrack(p, bottleRotation) + state.pointer.x * 0.14 + Math.sin(state.clock.elapsedTime * 0.16) * 0.018 * idle;
      bottle.current.rotation.x = -state.pointer.y * 0.06 - p * 0.035;
      bottle.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.25) * 0.009 * idle;
      bottle.current.scale.setScalar(sampleTrack(p, bottleScale));
      bottle.current.position.y = sampleTrack(p, bottleLift) + Math.sin(state.clock.elapsedTime * 0.6) * 0.026 * idle;
    }
    if (liquidMaterial.current) {
      const ease = 1 - Math.exp(-delta * 3.2);
      liquidMaterial.current.color.lerp(targetBase, ease);
      liquidMaterial.current.attenuationColor.lerp(targetDeep, ease);
    }
    /* Liquid slosh: the liquid mass lags and wobbles while the scroll scrubs the film. */
    const velocity = Math.abs(p - lastProgress.current);
    lastProgress.current = p;
    slosh.current = THREE.MathUtils.damp(slosh.current, Math.min(1, velocity * 42), velocity > 0.0004 ? 9 : 1.6, delta);
    if (liquidMesh.current) {
      const t = state.clock.elapsedTime;
      const s = slosh.current;
      liquidMesh.current.rotation.z = Math.sin(t * 9.0) * 0.026 * s + Math.sin(t * 1.6) * 0.006 * idle;
      liquidMesh.current.rotation.x = Math.cos(t * 7.3) * 0.018 * s;
      liquidMesh.current.scale.y = 1 + Math.sin(t * 8.2) * 0.018 * s;
      liquidMesh.current.position.y = -0.14 + Math.sin(t * 8.2) * 0.01 * s;
    }
    if (cap.current) {
      const lift = sampleTrack(p, capLift);
      cap.current.position.y = 1.5 + lift;
      cap.current.rotation.z = lift * 0.13;
      cap.current.rotation.y = lift * 0.55;
    }
  });

  return (
    <group ref={bottle}>
      {/* Crystal flacon: sharp edges, true glass refraction. */}
      <RoundedBox args={[1.24, 1.8, 0.6]} radius={0.038} smoothness={6} castShadow receiveShadow>
        <MeshTransmissionMaterial transmission={1} thickness={0.75} roughness={0.025} ior={1.5} chromaticAberration={0.02} anisotropicBlur={0.02} color="#fdf8f0" resolution={transmissionResolution} samples={transmissionSamples} />
      </RoundedBox>
      {/* Liquid with depth-based color absorption (Beer-Lambert attenuation). */}
      <RoundedBox ref={liquidMesh} args={[1.0, 1.46, 0.42]} position={[0, -0.14, 0]} radius={0.03} smoothness={4}>
        <meshPhysicalMaterial ref={liquidMaterial} color={tone.base} attenuationColor={tone.deep} attenuationDistance={0.85} roughness={0.09} metalness={0.02} transmission={0.35} thickness={0.9} ior={1.36} clearcoat={0.3} clearcoatRoughness={0.2} />
      </RoundedBox>
      {/* Glass shoulder and neck */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.17, 0.23, 0.2, 48]} />
        <meshPhysicalMaterial transmission={0.92} roughness={0.08} thickness={0.3} ior={1.5} color="#f6efe2" />
      </mesh>
      {/* Polished gold collar and atomizer stem */}
      <mesh position={[0, 1.11, 0]} castShadow>
        <cylinderGeometry args={[0.185, 0.2, 0.12, 48]} />
        <meshPhysicalMaterial color="#d8b285" metalness={1} roughness={0.13} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, 1.195, 0]}>
        <cylinderGeometry args={[0.1, 0.115, 0.1, 40]} />
        <meshPhysicalMaterial color="#b99767" metalness={1} roughness={0.18} />
      </mesh>
      {/* Lacquered cap with a gold band; lifts and twists clear of the neck */}
      <group ref={cap} position={[0, 1.5, 0]}>
        <RoundedBox args={[0.46, 0.56, 0.46]} radius={0.032} smoothness={4} castShadow>
          <meshPhysicalMaterial color="#181112" metalness={0.85} roughness={0.22} clearcoat={0.6} clearcoatRoughness={0.25} />
        </RoundedBox>
        <mesh position={[0, -0.265, 0]}>
          <boxGeometry args={[0.468, 0.055, 0.468]} />
          <meshPhysicalMaterial color="#d8b285" metalness={1} roughness={0.14} />
        </mesh>
      </group>
      {/* Slim gold foil plate, paper label, printed face */}
      <mesh position={[0, -0.06, 0.307]} castShadow>
        <boxGeometry args={[0.94, 0.74, 0.012]} />
        <meshPhysicalMaterial color="#c9a06f" metalness={0.95} roughness={0.28} />
      </mesh>
      <mesh position={[0, -0.06, 0.318]}>
        <boxGeometry args={[0.9, 0.7, 0.008]} />
        <meshStandardMaterial color="#f2ead9" roughness={0.62} />
      </mesh>
      <mesh position={[0, -0.06, 0.325]}>
        <planeGeometry args={[0.86, 0.645]} />
        <meshBasicMaterial map={labelTexture} toneMapped={false} />
      </mesh>
      {/* Dark stone plinth with a gold rim */}
      <mesh position={[0, -0.945, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.82, 0.86, 0.09, 64]} />
        <meshStandardMaterial color="#1d1517" roughness={0.38} metalness={0.22} />
      </mesh>
      <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.83, 0.013, 12, 72]} />
        <meshPhysicalMaterial color="#c9a06f" metalness={1} roughness={0.2} />
      </mesh>
    </group>
  );
}

function FloatingPetal({ index, progress, reducedMotion }: { index: number; progress: MutableRefObject<number>; reducedMotion: boolean }) {
  const petal = useRef<THREE.Mesh>(null);
  const angle = index / 24 * Math.PI * 2;
  const color = petalColors[index % petalColors.length];
  const seed = index * 0.67;
  useFrame(() => {
    if (!petal.current) return;
    const frame = reducedMotion ? 0 : progress.current;
    const start = 0.11 + (index % 6) * 0.014;
    const p = THREE.MathUtils.clamp((frame - start) / (0.78 - start), 0, 1);
    const eased = p * p * (3 - 2 * p);
    const radius = 0.28 + eased * (2.05 + (index % 5) * 0.14);
    const orbit = frame * 5.8 + seed;
    const flutter = Math.sin(orbit * 1.7) * 0.16;
    petal.current.position.set(Math.cos(angle + orbit) * radius, Math.sin(angle + orbit) * radius * 0.62 + flutter, Math.sin(angle + orbit) * 0.76);
    petal.current.rotation.set(0.3 + Math.sin(orbit + seed) * 0.55, angle + Math.cos(orbit) * 0.4, angle + orbit * 0.36 + eased * (index % 2 ? 2.4 : -2.2));
    const scale = 0.001 + eased * (0.11 + (index % 4) * 0.014);
    petal.current.scale.setScalar(scale);
    const material = petal.current.material as THREE.MeshStandardMaterial;
    material.opacity = eased * (0.88 - THREE.MathUtils.smoothstep(frame, 0.87, 1) * 0.36);
  });
  return (
    <mesh ref={petal} geometry={petalGeometry}>
      <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.62} metalness={0} transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function ScentRibbon({ progress, reducedMotion }: { progress: MutableRefObject<number>; reducedMotion: boolean }) {
  const ribbon = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const geometry = useMemo(() => {
    const points = Array.from({ length: 100 }, (_, index) => {
      const t = index / 99;
      const angle = t * Math.PI * 4.2;
      const radius = 0.58 + t * 0.16;
      return new THREE.Vector3(Math.sin(angle) * radius, -1.52 + t * 3.08, Math.cos(angle) * radius * 0.72);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 180, 0.009, 7, false);
  }, []);
  useFrame(() => {
    if (!ribbon.current || !material.current) return;
    const p = reducedMotion ? 0 : progress.current;
    const reveal = THREE.MathUtils.smoothstep(p, 0.16, 0.47);
    const settle = 1 - THREE.MathUtils.smoothstep(p, 0.83, 1) * 0.28;
    ribbon.current.rotation.y = p * Math.PI * 0.66;
    ribbon.current.rotation.x = Math.sin(p * Math.PI) * 0.1;
    ribbon.current.position.y = (p - 0.5) * 0.22;
    ribbon.current.scale.setScalar(0.9 + p * 0.12);
    material.current.opacity = reveal * settle * 0.3;
  });
  return <group ref={ribbon}><mesh geometry={geometry}><meshBasicMaterial ref={material} color="#ddb489" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh></group>;
}

function LensSweep({ progress, reducedMotion }: { progress: MutableRefObject<number>; reducedMotion: boolean }) {
  const sweep = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!sweep.current) return;
    const t = reducedMotion ? 0 : THREE.MathUtils.clamp((progress.current - 0.08) / 0.84, 0, 1);
    sweep.current.position.x = -3.2 + t * 6.4;
    const material = sweep.current.material as THREE.MeshBasicMaterial;
    material.opacity = Math.sin(t * Math.PI) * 0.16;
  });
  return <mesh ref={sweep} position={[-3.2, 0.1, 1.2]} rotation={[0, 0, -0.13]}><planeGeometry args={[0.18, 4.7]} /><meshBasicMaterial color="#f3bd96" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>;
}

/* Atomizer mist: a fine, faint spray that breathes out as the cap lifts. */
const mistVertex = /* glsl */ `
  attribute float aSeed;
  attribute float aSpeed;
  attribute float aSize;
  uniform float uTime;
  uniform float uBurst;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying float vTint;
  float hash(float n) { return fract(sin(n) * 43758.5453123); }
  void main() {
    float t = uTime * 0.16 * aSpeed + aSeed * 10.0;
    float life = fract(t);
    float angle = aSeed * 6.28318 + uTime * 0.06;
    float spread = 0.16 + life * (1.05 + hash(aSeed * 5.0) * 0.75);
    vec3 pos;
    pos.x = cos(angle + life * 2.4) * spread;
    pos.z = sin(angle * 1.3 + life * 2.0) * spread * 0.55;
    pos.y = 1.18 + life * (0.75 + hash(aSeed * 7.0) * 1.55) + sin(life * 9.0 + aSeed * 20.0) * 0.05;
    pos.x += sin(uTime * 0.45 + aSeed * 12.0) * 0.07 * life;
    pos.z += cos(uTime * 0.38 + aSeed * 15.0) * 0.06 * life;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float size = aSize * (0.65 + life * 2.1);
    gl_PointSize = min(size * uPixelRatio * (150.0 / -mvPosition.z), 84.0 * uPixelRatio);
    vAlpha = smoothstep(0.0, 0.14, life) * (1.0 - smoothstep(0.38, 1.0, life));
    vAlpha *= mix(0.08, 1.0, uBurst);
    vTint = hash(aSeed * 3.0);
  }
`;
const mistFragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vTint;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float soft = smoothstep(0.5, 0.04, d);
    soft *= soft;
    vec3 col = mix(uColorA, uColorB, vTint);
    gl_FragColor = vec4(col, soft * vAlpha * uOpacity);
  }
`;

function MistPlume({ progress, reducedMotion }: { progress: MutableRefObject<number>; reducedMotion: boolean }) {
  const { size } = useThree();
  const count = size.width < 720 ? 140 : 300;
  const { positions, seeds, speeds, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const speeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      seeds[i] = Math.random();
      speeds[i] = 0.6 + Math.random() * 0.9;
      sizes[i] = 1.4 + Math.random() * 2.8;
    }
    return { positions, seeds, speeds, sizes };
  }, [count]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uBurst: { value: 0 },
    uOpacity: { value: 0 },
    uPixelRatio: { value: 1 },
    uColorA: { value: new THREE.Color('#eed6c2') },
    uColorB: { value: new THREE.Color('#c4938b') },
  }), []);
  useFrame((state, delta) => {
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    if (!reducedMotion) uniforms.uTime.value = state.clock.elapsedTime;
    const p = reducedMotion ? 0 : progress.current;
    const envelope = THREE.MathUtils.smoothstep(p, 0.42, 0.55) * (1 - THREE.MathUtils.smoothstep(p, 0.88, 0.99));
    const wobble = 0.9 + Math.sin(state.clock.elapsedTime * 1.35) * 0.1;
    uniforms.uBurst.value = THREE.MathUtils.damp(uniforms.uBurst.value, envelope * wobble, 4.5, delta);
    const targetOpacity = reducedMotion ? 0 : size.width < 720 ? 0.26 : 0.32;
    uniforms.uOpacity.value = THREE.MathUtils.damp(uniforms.uOpacity.value, targetOpacity, 2.2, delta);
  });
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial args={[{ uniforms, vertexShader: mistVertex, fragmentShader: mistFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }]} />
    </points>
  );
}

/* Volumetric shafts: quiet cones of light, not stage beams. */
const shaftVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const shaftFragment = /* glsl */ `
  uniform float uTime;
  uniform float uStrength;
  uniform float uShift;
  varying vec2 vUv;
  void main() {
    float across = smoothstep(0.0, 0.42, vUv.x) * smoothstep(1.0, 0.58, vUv.x);
    float along = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
    float bands = 0.78 + 0.22 * sin((vUv.x * 9.0 + uShift) + uTime * 0.4);
    float flicker = 0.88 + 0.12 * sin(uTime * 0.55 + vUv.y * 5.0 + uShift);
    float alpha = across * along * bands * flicker * uStrength;
    gl_FragColor = vec4(vec3(1.0, 0.86, 0.7), alpha);
  }
`;

function LightShafts({ progress, reducedMotion }: { progress: MutableRefObject<number>; reducedMotion: boolean }) {
  const { size } = useThree();
  const sharedStrength = useMemo(() => ({ value: 0 }), []);
  const materialConfigs = useMemo(() => [
    { position: [1.75, 1.5, -1.35] as const, rotation: [0, 0.14, -0.44] as const, width: 1.5, shift: 0.0 },
    { position: [0.35, 1.7, -1.7] as const, rotation: [0, -0.06, -0.52] as const, width: 2.6, shift: 2.4 },
    { position: [2.7, 1.2, -2.0] as const, rotation: [0, 0.2, -0.38] as const, width: 0.95, shift: 4.1 },
  ], []);
  const uniformsList = useMemo(() => materialConfigs.map((cfg) => ({
    uTime: { value: 0 },
    uStrength: sharedStrength,
    uShift: { value: cfg.shift },
  })), [materialConfigs, sharedStrength]);
  useFrame((state) => {
    if (!reducedMotion) uniformsList.forEach((u) => { u.uTime.value = state.clock.elapsedTime; });
    const p = reducedMotion ? 0.34 : progress.current;
    const target = THREE.MathUtils.smoothstep(p, 0.04, 0.3) * (1 - THREE.MathUtils.smoothstep(p, 0.86, 1) * 0.45);
    sharedStrength.value += (target * (size.width < 720 ? 0.13 : 0.19) - sharedStrength.value) * 0.05;
  });
  return (
    <group>
      {materialConfigs.map((cfg, index) => (
        <mesh key={cfg.shift} position={[cfg.position[0], cfg.position[1], cfg.position[2]]} rotation={[cfg.rotation[0], cfg.rotation[1], cfg.rotation[2]]}>
          <planeGeometry args={[cfg.width, 7.4]} />
          <shaderMaterial args={[{ uniforms: uniformsList[index], vertexShader: shaftVertex, fragmentShader: shaftFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }]} />
        </mesh>
      ))}
    </group>
  );
}

/* Halo: a dim, note-tinted aura behind the glass that just kisses the bloom pass. */
const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    vec2 centered = vUv - 0.5;
    float r = length(centered) * 2.0;
    float core = smoothstep(1.0, 0.12, r);
    float ring = smoothstep(0.72, 0.3, r) * (1.0 - smoothstep(0.3, 0.06, r)) * 0.35;
    float breathe = 0.92 + 0.08 * sin(uTime * 0.4);
    float alpha = (core * 0.8 + ring) * uIntensity * breathe;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function HaloGlow({ progress, note, reducedMotion }: MotionSceneProps) {
  const targetColor = useMemo(() => new THREE.Color(noteAccents[note].halo), [note]);
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(noteAccents.amber.halo) },
    uTime: { value: 0 },
    uIntensity: { value: 0 },
  }), []);
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!reducedMotion) uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uColor.value.lerp(targetColor, 1 - Math.exp(-delta * 2.6));
    const p = reducedMotion ? 0.4 : progress.current;
    const swell = 0.3 + THREE.MathUtils.smoothstep(p, 0.1, 0.6) * 0.16;
    uniforms.uIntensity.value = THREE.MathUtils.damp(uniforms.uIntensity.value, swell, 2.4, delta);
    if (meshRef.current) meshRef.current.scale.setScalar(7 + Math.sin(p * Math.PI) * 1.6);
  });
  return (
    <mesh ref={meshRef} position={[0.3, 0.35, -2.6]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial args={[{ uniforms, vertexShader: shaftVertex, fragmentShader: haloFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }]} />
    </mesh>
  );
}

/* Accent lights cross-fade toward the selected accord. */
function NoteAccentLights({ note }: { note: Note }) {
  const fill = useRef<THREE.PointLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  const targetFill = useMemo(() => new THREE.Color(noteAccents[note].fill), [note]);
  const targetRim = useMemo(() => new THREE.Color(noteAccents[note].rim), [note]);
  useFrame((_, delta) => {
    const ease = 1 - Math.exp(-delta * 2.4);
    if (fill.current) fill.current.color.lerp(targetFill, ease);
    if (rim.current) rim.current.color.lerp(targetRim, ease);
  });
  return (
    <>
      <pointLight ref={fill} position={[-3, 1.1, 1.7]} intensity={8} color="#a95a6c" />
      <pointLight ref={rim} position={[2.7, -0.9, -2.2]} intensity={11} color="#c78a3c" />
    </>
  );
}

/* Scroll-scrubbed camera breathing: the frame tightens through the middle chapters. */
function CameraBreath({ progress, reducedMotion }: { progress: MutableRefObject<number>; reducedMotion: boolean }) {
  const { size } = useThree();
  const fov = useRef(33);
  useFrame(({ camera }, delta) => {
    if (size.width < 720) return;
    const p = reducedMotion ? 0 : progress.current;
    const target = 33 - Math.sin(p * Math.PI) * 2.5;
    fov.current = THREE.MathUtils.damp(fov.current, target, 5, delta);
    const perspective = camera as THREE.PerspectiveCamera;
    if (Math.abs(perspective.fov - fov.current) > 0.001) {
      perspective.fov = fov.current;
      perspective.updateProjectionMatrix();
    }
  });
  return null;
}

function Scene({ progress, note, reducedMotion }: MotionSceneProps) {
  const { size } = useThree();
  const isMobile = size.width < 720;
  const offset = isMobile ? 0 : 0.78;
  return (
    <>
      <ambientLight intensity={0.34} color="#ffe9d6" />
      <spotLight position={[2.6, 4.2, 4.5]} intensity={24} angle={0.42} penumbra={0.82} color="#fff1e0" castShadow shadow-mapSize-width={isMobile ? 1024 : 2048} shadow-mapSize-height={isMobile ? 1024 : 2048} shadow-bias={-0.0001} />
      <NoteAccentLights note={note} />
      <pointLight position={[-1.6, 2.4, 2.6]} intensity={4} color="#ffecd8" />
      <directionalLight position={[0, -1, 3]} intensity={1.1} color="#fff2df" />
      <Environment resolution={isMobile ? 256 : 512}>
        <Lightformer form="rect" intensity={5.4} color="#fff4e6" position={[0, 4.5, 1.5]} rotation={[Math.PI / 2.8, 0, 0]} scale={[4.5, 2.2, 1]} />
        <Lightformer form="rect" intensity={4.6} color="#f0c690" position={[-4, 0.4, 1.5]} rotation={[0, Math.PI / 3, 0]} scale={[0.9, 4.5, 1]} />
        <Lightformer form="rect" intensity={3.8} color="#fffaf2" position={[4, 0.8, 0.2]} rotation={[0, -Math.PI / 3, 0]} scale={[0.55, 3.8, 1]} />
      </Environment>
      <group position={[offset, 0, 0]}>
        <HaloGlow progress={progress} note={note} reducedMotion={reducedMotion} />
        <LightShafts progress={progress} reducedMotion={reducedMotion} />
        <GlassBottle progress={progress} note={note} reducedMotion={reducedMotion} />
        {Array.from({ length: 24 }, (_, index) => <FloatingPetal key={index} index={index} progress={progress} reducedMotion={reducedMotion} />)}
        <MistPlume progress={progress} reducedMotion={reducedMotion} />
        <LensSweep progress={progress} reducedMotion={reducedMotion} />
        <ScentRibbon progress={progress} reducedMotion={reducedMotion} />
        <ContactShadows position={[0, -1.38, 0]} scale={4.4} resolution={isMobile ? 512 : 1024} blur={2.6} opacity={0.6} far={2.6} color="#050404" />
      </group>
      <Sparkles count={reducedMotion ? 0 : 42} scale={[4.7, 4.9, 3]} size={1.4} speed={reducedMotion ? 0 : 0.12} opacity={0.22} color="#e6d5c4" position={[offset, 0, 0]} />
      <OrbitControls target={[offset, 0, 0]} enablePan={false} enableZoom={false} enableDamping dampingFactor={0.08} minPolarAngle={Math.PI / 2 - 0.25} maxPolarAngle={Math.PI / 2 + 0.25} />
      <CameraBreath progress={progress} reducedMotion={reducedMotion} />
      <EffectComposer multisampling={isMobile ? 0 : 4}>
        {!isMobile && !reducedMotion && <DepthOfField worldFocusDistance={6.3} worldFocusRange={3.6} focalLength={0.028} bokehScale={1.5} />}
        <Bloom luminanceThreshold={0.38} luminanceSmoothing={0.3} intensity={0.42} mipmapBlur />
        <ChromaticAberration offset={chromaticOffset} radialModulation={false} />
        <Vignette eskil={false} offset={0.22} darkness={0.62} />
        <Noise opacity={0.028} />
      </EffectComposer>
    </>
  );
}

export default function PerfumeScene({ progress, note }: SceneProps) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <Canvas className="perfume-canvas" dpr={window.innerWidth < 720 ? [1, 1.5] : [1, 1.5]} shadows gl={{ alpha: true, antialias: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.04 }} camera={{ position: [0, 0, 6.3], fov: 33 }}>
      <Scene progress={progress} note={note} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
