import { useMemo, useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Game } from '../types';
import './Dashboard.css';

interface DashboardProps {
  games: Game[];
}

const COLORS = {
  game: '#ff2a6d', // var(--neon-pink)
  platform: '#05d9e8', // var(--neon-blue)
  genre: '#fcee0a' // var(--neon-yellow)
};

export function Dashboard({ games }: DashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    // Initial dimensions
    updateDimensions();
    
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [games]);

  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const addedPlats = new Set<string>();
    const addedGenres = new Set<string>();

    games.forEach(game => {
      // Game Node
      nodes.push({ id: `game-${game.id}`, name: game.title, type: 'game', val: 3 });

      // Platform Node & Link
      if (game.platform) {
        if (!addedPlats.has(game.platform)) {
          addedPlats.add(game.platform);
          nodes.push({ id: `plat-${game.platform}`, name: game.platform, type: 'platform', val: 8 });
        }
        links.push({ source: `game-${game.id}`, target: `plat-${game.platform}` });
      }

      // Genre Node & Link
      if (game.genre) {
        if (!addedGenres.has(game.genre)) {
          addedGenres.add(game.genre);
          nodes.push({ id: `genre-${game.genre}`, name: game.genre, type: 'genre', val: 8 });
        }
        links.push({ source: `game-${game.id}`, target: `genre-${game.genre}` });
      }
    });

    return { nodes, links };
  }, [games]);

  const averageRating = useMemo(() => {
    const rated = games.filter(g => g.rating > 0);
    if (!rated.length) return 0;
    return (rated.reduce((acc, g) => acc + g.rating, 0) / rated.length).toFixed(1);
  }, [games]);

  const platformCount = useMemo(() => {
    return new Set(games.map(g => g.platform).filter(Boolean)).size;
  }, [games]);

  return (
    <div className="dashboard-container animate-in">
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-value neon-text-pink">{games.length}</div>
          <div className="kpi-label">Total de Jogos</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value neon-text-yellow">{averageRating}</div>
          <div className="kpi-label">Nota Média</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value neon-text-blue">{platformCount}</div>
          <div className="kpi-label">Plataformas</div>
        </div>
      </div>

      <div className="chart-card col-span-full force-graph-card">
        <h3 className="chart-title" style={{ marginBottom: '0.5rem' }}>Mapa do Acervo</h3>
        <p className="chart-subtitle">Grafo dinâmico interativo conectando Jogos (Rosa), Plataformas (Azul) e Gêneros (Amarelo). Use o scroll para zoom e arraste os nós.</p>
        <div className="chart-wrapper force-wrapper" ref={containerRef}>
          {dimensions.width > 0 && dimensions.height > 0 && (
            <ForceGraph2D
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeLabel="name"
              nodeColor={(node: any) => COLORS[node.type as keyof typeof COLORS] || '#ffffff'}
              linkColor={() => 'rgba(255, 255, 255, 0.15)'}
              backgroundColor="transparent"
              nodeRelSize={4}
              linkWidth={1}
              linkDirectionalParticles={1}
              linkDirectionalParticleWidth={1.5}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
            />
          )}
        </div>
      </div>
    </div>
  );
}
