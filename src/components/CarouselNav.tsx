import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { Game } from '../types';
import './CarouselNav.css';

interface CarouselNavProps {
  game: Game;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onOpen: () => void;
}

export function CarouselNav({ game, index, total, onPrev, onNext, onOpen }: CarouselNavProps) {
  return (
    <div className="carousel-nav">
      <div className="carousel-now" key={game.id}>
        <span className="carousel-counter">
          {String(index + 1).padStart(2, '0')} <span aria-hidden="true">/</span> {String(total).padStart(2, '0')}
        </span>
        <h2 className="carousel-title">{game.title}</h2>
        <p className="carousel-meta">
          {[game.platform, game.year, game.genre].filter(Boolean).join('  ·  ')}
        </p>
      </div>

      <div className="carousel-controls">
        <button className="carousel-btn" onClick={onPrev} disabled={index === 0} aria-label="Jogo anterior">
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <button className="neon-btn carousel-open" onClick={onOpen}>
          <Maximize2 size={15} aria-hidden="true" />
          Ver detalhes
        </button>
        <button className="carousel-btn" onClick={onNext} disabled={index === total - 1} aria-label="Próximo jogo">
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>

      <p className="carousel-hint" aria-hidden="true">
        ← → navegar · Enter abrir · roda/arraste para girar · ↓ mapa
      </p>
    </div>
  );
}
