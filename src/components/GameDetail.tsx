import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Game } from '../types';
import { genreTags } from '../lib/collection';
import { StarRating } from './StarRating';
import './GameDetail.css';

interface GameDetailProps {
  game: Game;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onUpdateRating: (id: number, rating: number) => void;
  onFilter: (type: 'platform' | 'genre', value: string) => void;
}

export function GameDetail({ game, index, total, onClose, onPrev, onNext, onUpdateRating, onFilter }: GameDetailProps) {
  const heading = useRef<HTMLHeadingElement>(null);

  // foco vai para o título ao abrir: leitor de tela anuncia o jogo
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <aside className="game-detail" role="dialog" aria-modal="false" aria-labelledby="detail-title">
      <div className="detail-top">
        <span className="detail-counter">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
        <button className="detail-close" onClick={onClose} aria-label="Fechar detalhes (Esc)">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="detail-body" key={game.id}>
        <h2 id="detail-title" className="detail-title" ref={heading} tabIndex={-1}>{game.title}</h2>

        <div className="detail-tags">
          {game.platform && (
            <button className="tag tag-platform" onClick={() => onFilter('platform', game.platform)} title="Filtrar por plataforma">
              {game.platform}
            </button>
          )}
          {game.year && <span className="tag tag-year">{game.year}</span>}
          {genreTags(game.genre).map(tag => (
            <button key={tag} className="tag tag-genre" onClick={() => onFilter('genre', tag)} title="Filtrar por gênero">
              {tag}
            </button>
          ))}
        </div>

        <div className="detail-rating">
          <span className="detail-label">Sua nota</span>
          <StarRating value={game.rating} onChange={r => onUpdateRating(game.id, r)} label={`Nota para ${game.title}`} />
        </div>

        {game.comment && (
          <figure className="detail-memory">
            <figcaption className="detail-label">Memória</figcaption>
            <blockquote>{game.comment}</blockquote>
          </figure>
        )}
      </div>

      <div className="detail-nav">
        <button className="carousel-btn" onClick={onPrev} disabled={index === 0} aria-label="Jogo anterior">
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <span className="detail-hint" aria-hidden="true">← → trocar · Esc fechar</span>
        <button className="carousel-btn" onClick={onNext} disabled={index === total - 1} aria-label="Próximo jogo">
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
