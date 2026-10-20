import { useEffect, useRef, useState } from 'react';
import { Play, X } from 'lucide-react';
import { Game } from '../types';
import './GameVideo.css';

interface YouTubePlayer {
  destroy: () => void;
  getPlayerState: () => number;
}

interface YouTubeIframeApi {
  Player: new (
    iframe: HTMLIFrameElement,
    options: {
      events: {
        onReady: (event: { target: YouTubePlayer }) => void;
        onStateChange: (event: { data: number }) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: { PLAYING: number };
}

declare global {
  interface Window {
    YT?: YouTubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeIframeApi> | null = null;

function loadYouTubeIframeApi(): Promise<YouTubeIframeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  const pending = new Promise<YouTubeIframeApi>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      const api = window.YT;
      if (api?.Player) resolve(api);
      previousReady?.();
    };

    const script = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    const fail = () => reject(new Error('Não foi possível carregar a API do YouTube'));

    if (script) {
      script.addEventListener('error', fail, { once: true });
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.addEventListener('error', fail, { once: true });
      document.head.appendChild(tag);
    }
  });

  youtubeApiPromise = pending.catch(error => {
    youtubeApiPromise = null;
    throw error;
  });
  return youtubeApiPromise;
}

interface GameVideoProps {
  game: Game;
}

export function GameVideo({ game }: GameVideoProps) {
  const [open, setOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoId = game.youtubeId;

  useEffect(() => {
    if (!open || !iframeRef.current) return;

    let cancelled = false;
    let player: YouTubePlayer | null = null;

    void loadYouTubeIframeApi()
      .then(api => {
        if (cancelled || !iframeRef.current) return;
        player = new api.Player(iframeRef.current, {
          events: {
            onReady: event => {
              if (!cancelled) setIsPlaying(event.target.getPlayerState() === api.PlayerState.PLAYING);
            },
            onStateChange: event => {
              if (!cancelled) setIsPlaying(event.data === api.PlayerState.PLAYING);
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setIsPlaying(false);
      });

    return () => {
      cancelled = true;
      if (player) {
        try {
          player.destroy();
        } catch {
          // O React pode já ter removido o iframe ao fechar o painel.
        }
      }
    };
  }, [open, videoId]);

  // Não reserva espaço nem exibe um estado de vídeo para jogos sem vídeo cadastrado.
  if (!videoId) return null;

  return (
    <section className={`game-video ${open ? 'is-open' : ''} ${isPlaying ? 'is-playing' : ''}`} aria-label={`Gameplay de ${game.title}`}>
      {!open ? (
        <button className="game-video-launch" onClick={() => { setIsPlaying(false); setOpen(true); }} aria-label={`Assistir gameplay de ${game.title}`}>
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
            <button className="game-video-close" onClick={() => { setIsPlaying(false); setOpen(false); }} aria-label="Fechar vídeo">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <iframe
            ref={iframeRef}
            key={videoId}
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
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
