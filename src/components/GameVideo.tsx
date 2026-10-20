import { useState } from 'react';
import { Play, X } from 'lucide-react';
import { Game } from '../types';
import './GameVideo.css';

interface GameVideoProps {
  game: Game;
}

export function GameVideo({ game }: GameVideoProps) {
  const [open, setOpen] = useState(false);
  const videoId = game.youtubeId;

  if (!videoId) {
    const terms = [game.title, game.platform, game.year, game.genre, 'gameplay vídeo'].filter(Boolean);
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(terms.join(' '))}`;
    return (
      <section className="game-video game-video-unavailable" aria-label={`Gameplay de ${game.title}`}>
        <span className="game-video-kicker">Gameplay</span>
        <p>Vídeo ainda não cadastrado para este jogo.</p>
        <a className="game-video-search" href={searchUrl} target="_blank" rel="noopener noreferrer">
          Buscar gameplay no Google ↗
        </a>
      </section>
    );
  }

  return (
    <section className={`game-video ${open ? 'is-open' : ''}`} aria-label={`Gameplay de ${game.title}`}>
      {!open ? (
        <button className="game-video-launch" onClick={() => setOpen(true)} aria-label={`Assistir gameplay de ${game.title}`}>
          <span className="game-video-play"><Play size={18} fill="currentColor" aria-hidden="true" /></span>
          <span className="game-video-launch-copy">
            <span className="game-video-kicker">Gameplay</span>
            <span className="game-video-launch-title">Assistir ao vídeo</span>
            <span className="game-video-caption">A capa continua em destaque no acervo</span>
          </span>
        </button>
      ) : (
        <div className="game-video-player">
          <div className="game-video-player-head">
            <span className="game-video-kicker">Gameplay · YouTube</span>
            <button className="game-video-close" onClick={() => setOpen(false)} aria-label="Fechar vídeo">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <iframe
            key={videoId}
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=1&playsinline=1&rel=0`}
            title={`Gameplay de ${game.title}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      )}
    </section>
  );
}
