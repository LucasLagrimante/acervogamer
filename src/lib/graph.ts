import { Game } from '../types';
import { genreTags } from './collection';

export type NodeType = 'game' | 'platform' | 'genre';

export interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  /** Quantidade de jogos ligados (1 para nós de jogo) */
  weight: number;
  game?: Game;
  position: [number, number, number];
}

export interface GraphLink {
  source: number;
  target: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  /** Índices dos vizinhos de cada nó */
  neighbors: Set<number>[];
}

// PRNG determinístico: o mapa nasce igual em todo carregamento
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildGraph(games: Game[], radius = 13): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const index = new Map<string, number>();

  const hub = (type: NodeType, name: string) => {
    const id = `${type}-${name}`;
    let i = index.get(id);
    if (i === undefined) {
      i = nodes.push({ id, name, type, weight: 0, position: [0, 0, 0] }) - 1;
      index.set(id, i);
    }
    nodes[i].weight++;
    return i;
  };

  games.forEach(game => {
    const g = nodes.push({ id: `game-${game.id}`, name: game.title, type: 'game', weight: 1, game, position: [0, 0, 0] }) - 1;
    if (game.platform) links.push({ source: g, target: hub('platform', game.platform) });
    genreTags(game.genre).forEach(tag => links.push({ source: g, target: hub('genre', tag) }));
  });

  layout(nodes, links, radius);

  const neighbors = nodes.map(() => new Set<number>());
  links.forEach(({ source, target }) => {
    neighbors[source].add(target);
    neighbors[target].add(source);
  });

  return { nodes, links, neighbors };
}

// Simulação de forças 3D simples (repulsão + molas + gravidade), rodada uma vez
function layout(nodes: GraphNode[], links: GraphLink[], radius: number) {
  const rand = mulberry32(42);
  const n = nodes.length;
  const pos = new Float32Array(n * 3);
  const vel = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) pos[i] = (rand() - 0.5) * 20;

  const ITER = 320;
  for (let it = 0; it < ITER; it++) {
    const alpha = 1 - it / ITER;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const d2 = Math.max(dx * dx + dy * dy + dz * dz, 0.01);
        // hubs se repelem mais para abrir espaço aos satélites
        const k = (14 + Math.sqrt(nodes[i].weight * nodes[j].weight) * 2) / d2 * alpha;
        vel[i * 3] += dx * k; vel[i * 3 + 1] += dy * k; vel[i * 3 + 2] += dz * k;
        vel[j * 3] -= dx * k; vel[j * 3 + 1] -= dy * k; vel[j * 3 + 2] -= dz * k;
      }
    }

    links.forEach(({ source: a, target: b }) => {
      const dx = pos[b * 3] - pos[a * 3];
      const dy = pos[b * 3 + 1] - pos[a * 3 + 1];
      const dz = pos[b * 3 + 2] - pos[a * 3 + 2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
      const k = (d - 4) / d * 0.05 * alpha;
      vel[a * 3] += dx * k; vel[a * 3 + 1] += dy * k; vel[a * 3 + 2] += dz * k;
      vel[b * 3] -= dx * k; vel[b * 3 + 1] -= dy * k; vel[b * 3 + 2] -= dz * k;
    });

    for (let i = 0; i < n * 3; i++) {
      vel[i] -= pos[i] * 0.004 * alpha;
      vel[i] *= 0.6;
      pos[i] += vel[i];
    }
  }

  // centraliza e normaliza para caber no raio pedido
  const center = [0, 1, 2].map(axis => {
    let s = 0;
    for (let i = 0; i < n; i++) s += pos[i * 3 + axis];
    return s / n;
  });
  // percentil 90 em vez do máximo: um nó isolado não encolhe o mapa inteiro
  const radii = Array.from({ length: n }, (_, i) =>
    Math.hypot(pos[i * 3] - center[0], pos[i * 3 + 1] - center[1], pos[i * 3 + 2] - center[2])).sort((a, b) => a - b);
  const s = radius / (radii[Math.floor(n * 0.9)] || 1);
  nodes.forEach((node, i) => {
    node.position = [
      (pos[i * 3] - center[0]) * s,
      (pos[i * 3 + 1] - center[1]) * s,
      (pos[i * 3 + 2] - center[2]) * s,
    ];
  });
}
