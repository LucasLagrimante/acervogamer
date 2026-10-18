import { useMemo } from 'react';
import { Game } from '../types';
import { averageRating, countBy, formatRating, genreTags } from '../lib/collection';
import './StatsPanel.css';

interface StatsPanelProps {
  games: Game[];
}

export function StatsPanel({ games }: StatsPanelProps) {
  const stats = useMemo(() => {
    const platforms = countBy(games, g => g.platform ? [g.platform] : []);
    const genres = countBy(games, g => genreTags(g.genre));
    const rated = games.filter(g => g.rating > 0).length;
    return { platforms, genres, rated, avg: averageRating(games) };
  }, [games]);

  const topPlatforms = stats.platforms.slice(0, 5);
  const max = topPlatforms[0]?.[1] ?? 1;

  return (
    <section className="stats-panel" aria-labelledby="stats-title">
      <h2 id="stats-title" className="stats-title">Mapa do Acervo</h2>

      <dl className="stats-kpis">
        <div className="stats-kpi">
          <dt>Jogos</dt>
          <dd className="neon-text-pink">{games.length}</dd>
        </div>
        <div className="stats-kpi">
          <dt>Nota média</dt>
          <dd className="neon-text-yellow">{stats.avg === null ? '—' : formatRating(stats.avg)}</dd>
          <span className="stats-foot">{stats.rated} avaliado{stats.rated !== 1 ? 's' : ''}</span>
        </div>
        <div className="stats-kpi">
          <dt>Plataformas</dt>
          <dd className="neon-text-blue">{stats.platforms.length}</dd>
        </div>
        <div className="stats-kpi">
          <dt>Gêneros</dt>
          <dd className="neon-text-yellow">{stats.genres.length}</dd>
        </div>
      </dl>

      <div className="stats-block">
        <h3 className="stats-subtitle">Plataformas mais jogadas</h3>
        <ul className="stats-bars">
          {topPlatforms.map(([name, count]) => (
            <li key={name} className="stats-bar">
              <span className="stats-bar-name">{name}</span>
              <span className="stats-bar-track" aria-hidden="true">
                <span className="stats-bar-fill" style={{ width: `${(count / max) * 100}%` }} />
              </span>
              <span className="stats-bar-value">{count}</span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="stats-legend" aria-label="Legenda do mapa">
        <li><span className="dot dot-game" aria-hidden="true" />Jogos</li>
        <li><span className="dot dot-platform" aria-hidden="true" />Plataformas</li>
        <li><span className="dot dot-genre" aria-hidden="true" />Gêneros</li>
      </ul>
      <p className="stats-hint">
        Arraste para orbitar, role para zoom. Clique numa capa para abrir o jogo, ou numa plataforma/gênero para filtrar a biblioteca.
      </p>
    </section>
  );
}
