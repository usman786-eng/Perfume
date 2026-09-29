import { useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, MeshTransmissionMaterial, OrbitControls, RoundedBox, Sparkles } from '@react-three/drei';
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

type Note = 'oud' | 'rose' | 'amber';
type SceneProps = { progress: MutableRefObject<number>; note: Note };
type MotionSceneProps = SceneProps & { reducedMotion: boolean };

const petalShape = new THREE.Shape();
petalShape.moveTo(0, -0.48);
petalShape.bezierCurveTo(-0.43, -0.18, -0.47, 0.38, 0, 0.54);
petalShape.bezierCurveTo(0.48, 0.32, 0.4, -0.18, 0, -0.48);
const petalGeometry = new THREE.ShapeGeometry(petalShape, 18);
const petalColors = ['#c45d79', '#d99595', '#ead1b4', '#ad6e4f', '#d4b17e', '#f0dfcf'];
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

function makeLabelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Texture();
  context.fillStyle = '#e9dfcd';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#ad8a5c';
  context.lineWidth = 3;
  context.strokeRect(20, 20, 472, 344);
  context.textAlign = 'center';
  context.fillStyle = '#322920';
  context.font = '500 49px Georgia';
  context.letterSpacing = '9px';
  context.fillText('DAYRAH', 256, 160);
  context.fillStyle = '#866d52';
  context.font = '22px Arial';
  context.letterSpacing = '6px';
  context.fillText('SIFR   /   01', 256, 215);
  context.font = '15px Arial';
  context.letterSpacing = '3px';
  context.fillText('OUD  ·  ROSE  ·  AMBER', 256, 284);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function GlassBottle({ progress, note, reducedMotion }: MotionSceneProps) {
  const bottle = useRef<THREE.Group>(null);
  const cap = useRef<THREE.Group>(null);
  const liquidMaterial = useRef<THREE.MeshPhysicalMaterial>(null);
  const labelTexture = useMemo(makeLabelTexture, []);
  const { size } = useThree();
  const transmissionResolution = size.width < 720 ? 384 : 768;
  const transmissionSamples = size.width < 720 ? 4 : 8;
  const liquidColor = note === 'rose' ? '#9e4654' : note === 'oud' ? '#693d26' : '#bd762f';
  const targetLiquidColor = useMemo(() => new THREE.Color(liquidColor), [liquidColor]);

  useFrame((state, delta) => {
    const p = reducedMotion ? 0 : progress.current;
    const idle = reducedMotion ? 0 : 1;
    if (bottle.current) {
      bottle.current.rotation.y = sampleTrack(p, bottleRotation) + state.pointer.x * 0.18 + Math.sin(state.clock.elapsedTime * 0.16) * 0.025 * idle;
      bottle.current.rotation.x = -state.pointer.y * 0.07 - p * 0.035;
      bottle.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.25) * 0.012 * idle;
      bottle.current.scale.setScalar(sampleTrack(p, bottleScale));
      bottle.current.position.y = sampleTrack(p, bottleLift) + Math.sin(state.clock.elapsedTime * 0.6) * 0.035 * idle;
    }
    if (liquidMaterial.current) liquidMaterial.current.color.lerp(targetLiquidColor, 1 - Math.exp(-delta * 3.5));
    if (cap.current) {
      const lift = sampleTrack(p, capLift);
      cap.current.position.y = 1.47 + lift;
      cap.current.rotation.z = lift * 0.13;
    }
  });

  return (
    <group ref={bottle}>
      {/* Tripo gallery reference: clear amber rectangular bottle with a dark cap. */}
      <RoundedBox args={[1.34, 1.9, 0.66]} radius={0.16} smoothness={8} castShadow receiveShadow>
        <MeshTransmissionMaterial transmission={0.98} thickness={0.52} roughness={0.045} ior={1.48} chromaticAberration={0.012} anisotropicBlur={0.035} color="#fff5e8" resolution={transmissionResolution} samples={transmissionSamples} />
      </RoundedBox>
      <RoundedBox args={[1.04, 1.58, 0.43]} position={[0, -0.1, 0]} radius={0.12} smoothness={7}>
        <meshPhysicalMaterial ref={liquidMaterial} color={liquidColor} roughness={0.14} metalness={0.05} transmission={0.18} thickness={0.62} clearcoat={0.8} />
      </RoundedBox>
      <mesh position={[0, 1.03, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.24, 0.2, 48]} />
        <meshPhysicalMaterial color="#e7c994" metalness={0.75} roughness={0.21} clearcoat={0.9} />
      </mesh>
      <mesh position={[0, 1.16, 0]}>
        <cylinderGeometry args={[0.135, 0.15, 0.12, 40]} />
        <meshStandardMaterial color="#32241b" roughness={0.32} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.245, 0]}>
        <cylinderGeometry args={[0.065, 0.08, 0.09, 32]} />
        <meshStandardMaterial color="#d2b37f" metalness={0.8} roughness={0.19} />
      </mesh>
      <group ref={cap} position={[0, 1.47, 0]}>
        <RoundedBox args={[0.48, 0.48, 0.48]} radius={0.075} smoothness={6} castShadow>
          <meshStandardMaterial color="#211a18" roughness={0.24} metalness={0.34} />
        </RoundedBox>
        <mesh position={[0, -0.225, 0]}>
          <cylinderGeometry args={[0.15, 0.16, 0.05, 36]} />
          <meshStandardMaterial color="#c4a06c" roughness={0.24} metalness={0.8} />
        </mesh>
      </group>
      <RoundedBox args={[0.88, 0.68, 0.035]} position={[0, -0.08, 0.343]} radius={0.025} smoothness={4}>
        <meshStandardMaterial color="#a8895a" metalness={0.45} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.82, 0.62, 0.027]} position={[0, -0.08, 0.366]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color="#e9dfcd" roughness={0.75} />
      </RoundedBox>
      <mesh position={[0, -0.08, 0.383]}>
        <planeGeometry args={[0.78, 0.58]} />
        <meshBasicMaterial map={labelTexture} toneMapped={false} />
      </mesh>
      <mesh position={[0, -1.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.62, 48]} />
        <meshStandardMaterial color="#b8793f" roughness={0.4} metalness={0.2} />
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
    material.opacity = eased * (0.9 - THREE.MathUtils.smoothstep(frame, 0.87, 1) * 0.38);
  });
  return (
    <mesh ref={petal} geometry={petalGeometry}>
      <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.53} metalness={0.02} transparent opacity={0} depthWrite={false} />
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
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 180, 0.012, 7, false);
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
    material.current.opacity = reveal * settle * 0.46;
  });
  return <group ref={ribbon}><mesh geometry={geometry}><meshBasicMaterial ref={material} color="#e5b27d" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh></group>;
}

function LensSweep({ progress, reducedMotion }: { progress: MutableRefObject<number>; reducedMotion: boolean }) {
  const sweep = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!sweep.current) return;
    const t = reducedMotion ? 0 : THREE.MathUtils.clamp((progress.current - 0.08) / 0.84, 0, 1);
    sweep.current.position.x = -3.2 + t * 6.4;
    const material = sweep.current.material as THREE.MeshBasicMaterial;
    material.opacity = Math.sin(t * Math.PI) * 0.19;
  });
  return <mesh ref={sweep} position={[-3.2, 0.1, 1.2]} rotation={[0, 0, -0.13]}><planeGeometry args={[0.18, 4.7]} /><meshBasicMaterial color="#f6c39f" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>;
}

function Scene({ progress, note, reducedMotion }: MotionSceneProps) {
  const { size } = useThree();
  const offset = size.width < 720 ? 0 : 0.78;
  return (
    <>
      <ambientLight intensity={0.48} color="#ffe7cf" />
      <spotLight position={[2.6, 4.2, 4.5]} intensity={27} angle={0.42} penumbra={0.82} color="#fff0db" castShadow shadow-mapSize-width={size.width < 720 ? 1024 : 2048} shadow-mapSize-height={size.width < 720 ? 1024 : 2048} shadow-bias={-0.0001} />
      <pointLight position={[-3, 1.1, 1.7]} intensity={10} color="#d27d91" />
      <pointLight position={[2.7, -0.9, -2.2]} intensity={12} color="#dfa45c" />
      <directionalLight position={[0, -1, 3]} intensity={1.6} color="#fff2df" />
      <Environment resolution={size.width < 720 ? 256 : 512}>
        <Lightformer form="rect" intensity={4.2} color="#fff0dc" position={[0, 4.5, 1.5]} rotation={[Math.PI / 2.8, 0, 0]} scale={[5, 2.5, 1]} />
        <Lightformer form="rect" intensity={5} color="#f0bf8a" position={[-4, 0.4, 1.5]} rotation={[0, Math.PI / 3, 0]} scale={[1.1, 4.5, 1]} />
        <Lightformer form="rect" intensity={3.4} color="#fff7ec" position={[4, 0.8, 0.2]} rotation={[0, -Math.PI / 3, 0]} scale={[0.7, 3.8, 1]} />
      </Environment>
      <group position={[offset, 0, 0]}>
        <GlassBottle progress={progress} note={note} reducedMotion={reducedMotion} />
        {Array.from({ length: 24 }, (_, index) => <FloatingPetal key={index} index={index} progress={progress} reducedMotion={reducedMotion} />)}
        <LensSweep progress={progress} reducedMotion={reducedMotion} />
        <ScentRibbon progress={progress} reducedMotion={reducedMotion} />
        <ContactShadows position={[0, -1.38, 0]} scale={4.4} resolution={size.width < 720 ? 512 : 1024} blur={2.2} opacity={0.52} far={2.6} color="#090609" />
      </group>
      <Sparkles count={reducedMotion ? 0 : 54} scale={[4.7, 4.9, 3]} size={2} speed={reducedMotion ? 0 : 0.14} opacity={0.4} color="#f4d7bd" position={[offset, 0, 0]} />
      <OrbitControls target={[offset, 0, 0]} enablePan={false} enableZoom={false} enableDamping dampingFactor={0.08} minPolarAngle={Math.PI / 2 - 0.25} maxPolarAngle={Math.PI / 2 + 0.25} />
      <EffectComposer multisampling={size.width < 720 ? 0 : 8}>
        <Bloom luminanceThreshold={0.32} luminanceSmoothing={0.34} intensity={0.52} mipmapBlur />
        <ChromaticAberration offset={chromaticOffset} radialModulation={false} />
        <Vignette eskil={false} offset={0.18} darkness={0.54} />
        <Noise opacity={0.025} />
      </EffectComposer>
    </>
  );
}

export default function PerfumeScene({ progress, note }: SceneProps) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <Canvas className="perfume-canvas" dpr={window.innerWidth < 720 ? [1, 1.5] : [1.5, 2]} shadows gl={{ alpha: true, antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }} camera={{ position: [0, 0, 6.3], fov: 33 }}>
      <Scene progress={progress} note={note} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
