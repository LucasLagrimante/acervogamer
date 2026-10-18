import { X } from 'lucide-react';
import { Game } from '../types';
import './GameIndex.css';

interface GameIndexProps {
  games: Game[];
  selectedId: number | null;
  /** Sem WebGL o índice vira a própria página da biblioteca */
  standalone: boolean;
  onPick: (game: Game) => void;
  onClose: () => void;
  onImageError: (title: string) => void;
}

export function GameIndex({ games, selectedId, standalone, onPick, onClose, onImageError }: GameIndexProps) {
  return (
    <nav className={`game-index ${standalone ? 'standalone' : ''}`} aria-label="Índice de jogos" data-own-keys>
      <div className="index-head">
        <h2 className="index-title">Índice <span>{games.length}</span></h2>
        {!standalone && (
          <button className="detail-close" onClick={onClose} aria-label="Fechar índice">
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      {standalone && (
        <p className="index-note">Seu navegador não suporta WebGL — exibindo a versão em lista.</p>
      )}
      <ul className="index-list">
        {games.map(game => (
          <li key={game.id}>
            <button
              className={`index-item ${game.id === selectedId ? 'current' : ''}`}
              aria-current={game.id === selectedId || undefined}
              onClick={() => onPick(game)}
            >
              <img src={game.cover} alt="" loading="lazy" width="36" height="50" onError={() => onImageError(game.title)} />
              <span className="index-text">
                <span className="index-name">{game.title}</span>
                <span className="index-meta">{game.platform} · {game.year}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
