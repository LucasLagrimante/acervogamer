import { useEffect, useMemo, useRef, useState } from 'react';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import {
  BufferAttribute, BufferGeometry, Color, IcosahedronGeometry, LineBasicMaterial,
  Mesh, OctahedronGeometry, PlaneGeometry, Vector3,
} from 'three';
import { Game } from '../types';
import { GraphData, GraphNode, NodeType } from '../lib/graph';
import { CASE_ASPECT, useCoverTexture } from './covers';

export const COLORS: Record<NodeType, string> = {
  game: '#ff2a6d',
  platform: '#05d9e8',
  genre: '#fcee0a',
};

const GAME_PLANE = new PlaneGeometry(0.62 * CASE_ASPECT * 1.4, 0.62 * 1.4);
const PLATFORM_GEOMETRY = new IcosahedronGeometry(1, 1);
const GENRE_GEOMETRY = new OctahedronGeometry(1, 0);
const HUB_COLORS: Record<NodeType, Color> = {
  game: new Color(COLORS.game),
  platform: new Color(COLORS.platform).multiplyScalar(1.8),
  genre: new Color(COLORS.genre).multiplyScalar(1.8),
};
const LINK_BASE = new Color('#6a5cff');
const projected = new Vector3();
const LINK_HOT = new Color('#ff2a6d').multiplyScalar(1.8);

function nodeScale(node: GraphNode) {
  if (node.type === 'game') return 1;
  return node.type === 'platform' ? 0.35 + Math.sqrt(node.weight) * 0.1 : 0.22 + Math.sqrt(node.weight) * 0.08;
}

// rótulo logo acima do nó, fora da esfera
function labelPosition(node: GraphNode, origin: [number, number, number], extra = 0) {
  const [x, y, z] = node.position;
  const half = node.type === 'game' ? 0.45 : nodeScale(node);
  return new Vector3(x + origin[0], y + half + 0.35 + extra + origin[1], z + origin[2]);
}

interface ScreenLabel {
  el: HTMLSpanElement;
  world: Vector3;
}

function makeLabel(className: string) {
  const el = document.createElement('span');
  el.className = `node-label ${className}`;
  return el;
}

export interface ConstellationProps {
  graph: GraphData;
  position: [number, number, number];
  active: boolean;
  reducedMotion: boolean;
  onPickGame: (game: Game) => void;
  onPickHub: (type: Exclude<NodeType, 'game'>, name: string) => void;
  onImageError: (title: string) => void;
}

export function Constellation({ graph, position, active, reducedMotion, onPickGame, onPickHub, onImageError }: ConstellationProps) {
  const [hoverState, setHovered] = useState<number | null>(null);
  // fora do modo mapa nada fica destacado
  const hovered = active ? hoverState : null;
  const nodeRefs = useRef<(Mesh | null)[]>([]);
  const gl = useThree(s => s.gl);
  const layer = useRef<HTMLDivElement | null>(null);
  const labels = useRef<ScreenLabel[]>([]);
  const hoverLabel = useRef<ScreenLabel | null>(null);

  const highlight = useMemo(
    () => hovered === null ? null : new Set([hovered, ...graph.neighbors[hovered]]),
    [hovered, graph],
  );

  // Arestas em uma única geometria; cor por vértice destaca a vizinhança
  const lines = useMemo(() => {
    const pos = new Float32Array(graph.links.length * 6);
    graph.links.forEach(({ source, target }, i) => {
      pos.set(graph.nodes[source].position, i * 6);
      pos.set(graph.nodes[target].position, i * 6 + 3);
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(pos, 3));
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(pos.length), 3));
    const material = new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, toneMapped: false, fog: false });
    return { geometry, material };
  }, [graph]);

  useEffect(() => () => {
    lines.geometry.dispose();
    lines.material.dispose();
  }, [lines]);

  useEffect(() => {
    const colors = lines.geometry.getAttribute('color') as BufferAttribute;
    const dim = LINK_BASE.clone().multiplyScalar(highlight ? 0.25 : 0.7);
    graph.links.forEach(({ source, target }, i) => {
      const hot = hovered !== null && (source === hovered || target === hovered);
      const c = hot ? LINK_HOT : dim;
      colors.setXYZ(i * 2, c.r, c.g, c.b);
      colors.setXYZ(i * 2 + 1, c.r, c.g, c.b);
    });
    colors.needsUpdate = true;
  }, [lines, graph, hovered, highlight]);

  // Rótulos em DOM puro sobre o canvas, projetados a cada frame
  // (sem um React root por rótulo, como faria o <Html> do drei)
  useEffect(() => {
    const div = document.createElement('div');
    div.className = 'node-labels';
    gl.domElement.parentElement?.appendChild(div);
    layer.current = div;
    labels.current = graph.nodes
      .filter(node => node.type === 'platform' && node.weight > 1)
      .map(node => {
        const el = makeLabel('node-label-platform');
        el.textContent = node.name;
        div.appendChild(el);
        return { el, world: labelPosition(node, position) };
      });
    const hover = makeLabel('node-label-hover');
    hover.hidden = true;
    div.appendChild(hover);
    hoverLabel.current = { el: hover, world: new Vector3() };
    return () => {
      div.remove();
      layer.current = null;
      labels.current = [];
      hoverLabel.current = null;
    };
  }, [gl, graph, position]);

  useEffect(() => {
    if (layer.current) layer.current.hidden = !active;
  }, [active]);

  useEffect(() => {
    const label = hoverLabel.current;
    if (!label) return;
    const node = hovered !== null ? graph.nodes[hovered] : null;
    label.el.hidden = !node;
    if (!node) return;
    label.el.className = `node-label node-label-hover node-label-${node.type}`;
    label.el.textContent = node.name;
    if (node.type !== 'game') {
      const small = document.createElement('small');
      small.textContent = `${node.weight} jogo${node.weight > 1 ? 's' : ''}`;
      label.el.appendChild(small);
    }
    label.world.copy(labelPosition(node, position, 0.5));
  }, [hovered, graph, position]);

  useFrame((state, delta) => {
    // capas sempre de frente para a câmera
    nodeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      if (graph.nodes[i].type === 'game') mesh.quaternion.copy(state.camera.quaternion);
      else if (!reducedMotion) mesh.rotation.y += delta * 0.4;
    });

    if (!active) return;
    const { width, height } = state.size;
    const all = hoverLabel.current ? [...labels.current, hoverLabel.current] : labels.current;
    all.forEach(({ el, world }) => {
      projected.copy(world).project(state.camera);
      const behind = projected.z > 1;
      el.style.visibility = behind ? 'hidden' : '';
      if (behind) return;
      const x = (projected.x + 1) / 2 * width;
      const y = (1 - projected.y) / 2 * height;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    });
  });

  return (
    <group position={position} visible={active}>
      <lineSegments geometry={lines.geometry} material={lines.material} />
      {graph.nodes.map((node, i) => (
        <GraphNodeMesh
          key={node.id}
          node={node}
          dimmed={highlight !== null && !highlight.has(i)}
          hovered={hovered === i}
          active={active}
          meshRef={m => { nodeRefs.current[i] = m; }}
          onHover={on => setHovered(prev => on ? i : prev === i ? null : prev)}
          onPick={() => {
            if (node.type === 'game' && node.game) onPickGame(node.game);
            else if (node.type !== 'game') onPickHub(node.type, node.name);
          }}
          onImageError={onImageError}
        />
      ))}
    </group>
  );
}

interface GraphNodeMeshProps {
  node: GraphNode;
  dimmed: boolean;
  hovered: boolean;
  active: boolean;
  meshRef: (m: Mesh | null) => void;
  onHover: (on: boolean) => void;
  onPick: () => void;
  onImageError: (title: string) => void;
}

function GraphNodeMesh({ node, dimmed, hovered, active, meshRef, onHover, onPick, onImageError }: GraphNodeMeshProps) {
  const isGame = node.type === 'game';
  const texture = useCoverTexture(node.game?.cover ?? '', node.name, isGame && active, onImageError);


  const scale = nodeScale(node) * (hovered ? 1.6 : 1);
  const geometry = isGame ? GAME_PLANE : node.type === 'platform' ? PLATFORM_GEOMETRY : GENRE_GEOMETRY;

  return (
    <mesh
      ref={meshRef}
      position={node.position}
      scale={scale}
      geometry={geometry}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        if (!active) return;
        e.stopPropagation();
        onHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        onHover(false);
        document.body.style.cursor = '';
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!active || e.delta > 6) return;
        e.stopPropagation();
        onPick();
      }}
    >
      {isGame ? (
        <meshBasicMaterial key={texture ? 'cover' : 'empty'} map={texture} color={texture ? '#ffffff' : COLORS.game} transparent opacity={dimmed ? 0.15 : 1} fog={false} />
      ) : (
        <meshBasicMaterial color={HUB_COLORS[node.type]} transparent opacity={dimmed ? 0.15 : 1} toneMapped={false} fog={false} />
      )}
    </mesh>
  );
}
