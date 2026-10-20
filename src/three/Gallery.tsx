import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { BoxGeometry, Color, Group, Material, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three';
import { Game } from '../types';
import { CASE_ASPECT, useCoverTexture } from './covers';

const H = 1.4;
const W = H * CASE_ASPECT;
const D = 0.12;
const FLOOR_Y = H / 2 + 0.02;
/** Distância (em slots) a partir da qual a caixa sai de cena */
const VISIBLE_RANGE = 13;
/** Capas carregadas antes de entrarem no campo de visão */
const PRELOAD_RANGE = 16;

const CASE_GEOMETRY = new BoxGeometry(W, H, D);
const GLOW_GEOMETRY = new BoxGeometry(W + 0.08, H + 0.08, D * 0.5);
const BACK_MATERIAL = new MeshStandardMaterial({ color: '#0d0b1f', roughness: 0.6 });
const GLOW_COLOR = new Color('#05d9e8').multiplyScalar(2.2);
const LOADING_MATERIAL = new MeshStandardMaterial({ color: '#1c1640', roughness: 0.4, emissive: '#2a1660', emissiveIntensity: 0.4 });

// Lombada com a cor da família da plataforma
const SPINE_HUES: [RegExp, string][] = [
  [/playstation/i, '#2f6bff'],
  [/nintendo|game boy|super/i, '#ff3b3b'],
  [/sega|master/i, '#1fb0ff'],
  [/browser|mobile/i, '#fcee0a'],
  [/pc|dos/i, '#b300ff'],
];
const spineCache = new Map<string, MeshStandardMaterial>();
function spineMaterial(platform: string) {
  let m = spineCache.get(platform);
  if (!m) {
    const hex = SPINE_HUES.find(([re]) => re.test(platform))?.[1] ?? '#ff2a6d';
    m = new MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.35, roughness: 0.35 });
    spineCache.set(platform, m);
  }
  return m;
}

export interface GalleryProps {
  games: Game[];
  /** id do jogo → posição na lista filtrada */
  slots: Map<number, number>;
  selectedIndex: number;
  detailOpen: boolean;
  active: boolean;
  reducedMotion: boolean;
  onSelect: (index: number) => void;
  onOpen: () => void;
  onImageError: (title: string) => void;
}

export function Gallery({ games, slots, selectedIndex, detailOpen, active, reducedMotion, onSelect, onOpen, onImageError }: GalleryProps) {
  const scroll = useRef(selectedIndex);
  const dragMoved = useRef(false);
  const gl = useThree(s => s.gl);

  // posição contínua do carrossel persegue o índice selecionado
  useFrame((_, delta) => {
    scroll.current = reducedMotion
      ? selectedIndex
      : MathUtils.damp(scroll.current, selectedIndex, 6, delta);
  });

  // Roda do mouse e arraste horizontal navegam entre jogos
  const indexRef = useRef(selectedIndex);
  const selectRef = useRef(onSelect);
  useEffect(() => {
    indexRef.current = selectedIndex;
    selectRef.current = onSelect;
  });

  useEffect(() => {
    if (!active) return;
    const el = gl.domElement;
    let wheelAcc = 0;
    let dragStart: number | null = null;
    let dragAcc = 0;

    const step = (dir: number) => selectRef.current(indexRef.current + dir);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelAcc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(wheelAcc) > 70) {
        step(Math.sign(wheelAcc));
        wheelAcc = 0;
      }
    };
    const onDown = (e: PointerEvent) => {
      dragStart = e.clientX;
      dragAcc = 0;
      dragMoved.current = false;
    };
    const onMove = (e: PointerEvent) => {
      if (dragStart === null) return;
      const dx = e.clientX - dragStart;
      if (Math.abs(dx) > 6) dragMoved.current = true;
      const steps = Math.trunc((dx - dragAcc) / 60);
      if (steps !== 0) {
        dragAcc += steps * 60;
        step(-steps);
      }
    };
    const onUp = () => { dragStart = null; };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [active, gl]);

  const handleClick = useCallback((slot: number) => {
    if (!active || dragMoved.current) return;
    if (slot === selectedIndex) onOpen();
    else onSelect(slot);
  }, [active, selectedIndex, onOpen, onSelect]);

  return (
    <group>
      {games.map(game => {
        const slot = slots.get(game.id);
        return (
          <GameCase
            key={game.id}
            game={game}
            slot={slot ?? null}
            scroll={scroll}
            selected={slot === selectedIndex}
            detailOpen={detailOpen && slot === selectedIndex}
            receded={detailOpen && slot !== selectedIndex}
            load={slot !== undefined && Math.abs(slot - selectedIndex) < PRELOAD_RANGE}
            interactive={active}
            reducedMotion={reducedMotion}
            onClick={handleClick}
            onImageError={onImageError}
          />
        );
      })}
    </group>
  );
}

interface GameCaseProps {
  game: Game;
  slot: number | null;
  scroll: { current: number };
  selected: boolean;
  detailOpen: boolean;
  receded: boolean;
  load: boolean;
  interactive: boolean;
  reducedMotion: boolean;
  onClick: (slot: number) => void;
  onImageError: (title: string) => void;
}

function GameCase({ game, slot, scroll, selected, detailOpen, receded, load, interactive, reducedMotion, onClick, onImageError }: GameCaseProps) {
  const group = useRef<Group>(null);
  const glow = useRef<Mesh>(null);
  const glowMaterial = useRef<MeshBasicMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const texture = useCoverTexture(game.cover, game.title, load, onImageError);

  const front = useMemo(
    () => texture ? new MeshStandardMaterial({ map: texture, roughness: 0.32, metalness: 0.05 }) : null,
    [texture],
  );
  useEffect(() => () => front?.dispose(), [front]);

  const materials = useMemo<Material[]>(() => {
    const spine = spineMaterial(game.platform);
    // ordem do BoxGeometry: +x, -x, +y, -y, +z (frente), -z (verso)
    return [BACK_MATERIAL, spine, BACK_MATERIAL, BACK_MATERIAL, front ?? LOADING_MATERIAL, BACK_MATERIAL];
  }, [front, game.platform]);


  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const lambda = reducedMotion ? 1000 : 7;
    const wide = state.size.width / state.size.height > 1;

    let x: number, y: number, z: number, ry: number, rx = 0, s = 1;
    if (slot === null) {
      // fora do filtro: afunda no chão
      x = g.position.x; y = -2.2; z = g.position.z; ry = g.rotation.y; s = 0.6;
    } else if (detailOpen) {
      const t = state.clock.elapsedTime;
      // Detalhe aberto: deslocamento contido para manter a capa na cena.
      // Em retrato, sobe só um pouco acima da posição normal do carrossel.
      x = wide ? -1.05 : 0;
      // Mantém o centro da capa acima do plano do chão também em widescreen.
      y = FLOOR_Y + 0.18;
      z = wide ? 0.7 : 0.9;
      ry = (wide ? 0.32 : 0) + (reducedMotion ? 0 : Math.sin(t * 0.6) * 0.12);
      rx = reducedMotion ? 0 : Math.sin(t * 0.8) * 0.03;
    } else {
      const d = slot - scroll.current;
      const a = Math.abs(d);
      const sgn = Math.sign(d);
      const near = Math.min(a, 1);
      x = sgn * (near * 1.35 + Math.max(a - 1, 0) * 0.55);
      z = -near * 1.1 - Math.max(a - 1, 0) * 0.32;
      y = FLOOR_Y + (selected && hovered ? 0.08 : 0);
      ry = -sgn * near * 1.05;
      s = selected ? 1.12 : 1;
    }
    // demais caixas recuam quando o detalhe está aberto
    if (receded) z -= 1.6;

    g.position.x = MathUtils.damp(g.position.x, x, lambda, delta);
    g.position.y = MathUtils.damp(g.position.y, y, lambda, delta);
    g.position.z = MathUtils.damp(g.position.z, z, lambda, delta);
    g.rotation.y = MathUtils.damp(g.rotation.y, ry, lambda, delta);
    g.rotation.x = MathUtils.damp(g.rotation.x, rx, lambda, delta);
    g.scale.setScalar(MathUtils.damp(g.scale.x, s, lambda, delta));

    const inRange = slot !== null && Math.abs(slot - scroll.current) < VISIBLE_RANGE;
    g.visible = inRange || g.position.y > -2;

    const gm = glowMaterial.current;
    if (glow.current && gm) {
      const target = selected ? (hovered ? 1 : 0.75) : 0;
      gm.opacity = MathUtils.damp(gm.opacity, target, 8, delta);
      glow.current.visible = gm.opacity > 0.01;
    }
  });

  return (
    <group ref={group} position={[0, -2.2, 0]}>
      <mesh
        geometry={CASE_GEOMETRY}
        material={materials}
        dispose={null}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (slot === null || !interactive) return;
          e.stopPropagation();
          onClick(slot);
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          if (slot === null || !interactive) return;
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = '';
        }}
      />
      <mesh ref={glow} geometry={GLOW_GEOMETRY} position-z={-D * 0.4} visible={false}>
        <meshBasicMaterial ref={glowMaterial} color={GLOW_COLOR} transparent opacity={0} toneMapped={false} />
      </mesh>
    </group>
  );
}
