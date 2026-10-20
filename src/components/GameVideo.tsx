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

  // Não reserva espaço nem exibe um estado de vídeo para jogos sem vídeo cadastrado.
  if (!videoId) return null;

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
