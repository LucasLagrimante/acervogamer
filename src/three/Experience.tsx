import { ComponentRef, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Vector3 } from 'three';
import { Game } from '../types';
import type { DeviceMotionValue } from '../hooks/useDeviceOrientation';
import { buildGraph, NodeType } from '../lib/graph';
import { Synthwave } from './Synthwave';
import { Gallery } from './Gallery';
import { Constellation } from './Constellation';

export type Mode = 'library' | 'map';

// A constelação flutua no céu, acima do acervo: trocar de modo é "subir"
const MAP_CENTER: [number, number, number] = [0, 34, -16];
const LIB_LOOK = new Vector3(0, 0.78, 0);
const MAP_LOOK = new Vector3(...MAP_CENTER);

export interface ExperienceProps {
  mode: Mode;
  games: Game[];
  slots: Map<number, number>;
  selectedIndex: number;
  detailOpen: boolean;
  mapVisited: boolean;
  reducedMotion: boolean;
  motionOffset: { current: DeviceMotionValue };
  onSelect: (index: number) => void;
  onOpen: () => void;
  onPickGame: (game: Game) => void;
  onPickHub: (type: Exclude<NodeType, 'game'>, name: string) => void;
  onImageError: (title: string) => void;
  onReady: () => void;
}

export default function Experience(props: ExperienceProps) {
  const { mode, games, reducedMotion } = props;
  const graph = useMemo(() => buildGraph(games), [games]);

  return (
    <Canvas
      className="experience-canvas"
      dpr={[1, 1.75]}
      camera={{ fov: 50, position: [0, 1.05, 4.3], near: 0.1, far: 220 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onCreated={props.onReady}
      aria-hidden="true"
    >
      <color attach="background" args={['#0b0524']} />
      <fog attach="fog" args={['#0b0524', 14, 80]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 6, 5]} intensity={0.9} />
      <pointLight position={[-5, 2.5, -1]} color="#ff2a6d" intensity={10} distance={12} />
      <pointLight position={[5, 2.5, -1]} color="#05d9e8" intensity={10} distance={12} />

      <Synthwave reducedMotion={reducedMotion} sunset={mode === 'map'} />
      <Gallery
        games={games}
        slots={props.slots}
        selectedIndex={props.selectedIndex}
        detailOpen={props.detailOpen}
        active={mode === 'library'}
        reducedMotion={reducedMotion}
        onSelect={props.onSelect}
        onOpen={props.onOpen}
        onImageError={props.onImageError}
      />
      {props.mapVisited && (
        <Constellation
          graph={graph}
          position={MAP_CENTER}
          active={mode === 'map'}
          reducedMotion={reducedMotion}
          onPickGame={props.onPickGame}
          onPickHub={props.onPickHub}
          onImageError={props.onImageError}
        />
      )}
      <CameraRig mode={mode} reducedMotion={reducedMotion} motionOffset={props.motionOffset} />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.85} />
        <Vignette offset={0.25} darkness={0.75} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}

function CameraRig({
  mode, reducedMotion, motionOffset,
}: { mode: Mode; reducedMotion: boolean; motionOffset: { current: DeviceMotionValue } }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const look = useRef(LIB_LOOK.clone());
  const goal = useRef(new Vector3());
  const settled = useRef(false);
  const lastMode = useRef(mode);
  const appliedMapOffset = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const c = controls.current;
    if (lastMode.current !== mode) {
      lastMode.current = mode;
      settled.current = false;
      appliedMapOffset.current = { x: 0, y: 0 };
    }
    // Mapa: OrbitControls navega; o sensor translada câmera/alvo como uma camada parallax.
    if (mode === 'map' && settled.current) {
      const x = reducedMotion || !motionOffset.current.active ? 0 : motionOffset.current.x;
      const y = reducedMotion || !motionOffset.current.active ? 0 : motionOffset.current.y;
      const dx = (x - appliedMapOffset.current.x) * 0.8;
      const dy = (y - appliedMapOffset.current.y) * 0.45;
      if (c) {
        state.camera.position.x += dx;
        state.camera.position.y += dy;
        c.target.x += dx;
        c.target.y += dy;
      }
      appliedMapOffset.current = { x, y };
      return;
    }
    const aspect = state.size.width / state.size.height;
    // retrato: recua a câmera para caber o carrossel
    const portrait = aspect < 1 ? (1 / aspect - 1) : 0;
    let target: Vector3;
    if (mode === 'library') {
      const x = motionOffset.current.active ? motionOffset.current.x : state.pointer.x;
      const y = motionOffset.current.active ? motionOffset.current.y : state.pointer.y;
      const px = reducedMotion ? 0 : x * 0.3;
      const py = reducedMotion ? 0 : y * 0.12;
      goal.current.set(px, 1.05 + py + portrait * 0.4, 4.3 + portrait * 2.6);
      target = LIB_LOOK;
    } else {
      // abaixo do centro, olhando para cima: fundo de estrelas, sol fora do quadro
      goal.current.set(MAP_CENTER[0], MAP_CENTER[1] - 7, MAP_CENTER[2] + 28 + portrait * 16);
      target = MAP_LOOK;
    }

    const k = reducedMotion ? 1 : 1 - Math.exp(-(mode === 'map' ? 1.9 : 2.8) * delta);
    state.camera.position.lerp(goal.current, k);
    look.current.lerp(target, k);
    state.camera.lookAt(look.current);

    if (c) {
      c.enabled = false;
      c.target.copy(look.current);
    }
    if (mode === 'map' && state.camera.position.distanceTo(goal.current) < 0.08) {
      settled.current = true;
      if (c) c.enabled = true;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      minDistance={10}
      maxDistance={60}
      autoRotate={!reducedMotion}
      autoRotateSpeed={0.45}
    />
  );
}
