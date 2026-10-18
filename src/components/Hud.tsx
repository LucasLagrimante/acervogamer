import { List, Orbit, Library } from 'lucide-react';
import type { Mode } from '../three/Experience';
import './Hud.css';

interface HudProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  totalGames: number;
  indexOpen: boolean;
  onToggleIndex: () => void;
}

export function Hud({ mode, onModeChange, totalGames, indexOpen, onToggleIndex }: HudProps) {
  return (
    <header className="hud">
      <div className="hud-brand">
        <img src="/favicon.png" alt="" width="36" height="36" className="hud-logo" />
        <div>
          <h1 className="hud-title">ACERVO</h1>
          <p className="hud-sub">GAMER</p>
        </div>
      </div>

      <nav className="hud-modes" aria-label="Modo de visualização">
        <button
          className={`hud-mode ${mode === 'library' ? 'active' : ''}`}
          aria-pressed={mode === 'library'}
          onClick={() => onModeChange('library')}
        >
          <Library size={16} aria-hidden="true" />
          <span>Biblioteca</span>
        </button>
        <button
          className={`hud-mode ${mode === 'map' ? 'active' : ''}`}
          aria-pressed={mode === 'map'}
          onClick={() => onModeChange('map')}
        >
          <Orbit size={16} aria-hidden="true" />
          <span>Mapa</span>
        </button>
      </nav>

      <div className="hud-right">
        <button
          className={`hud-icon-btn ${indexOpen ? 'active' : ''}`}
          aria-pressed={indexOpen}
          aria-label="Índice de jogos"
          title="Índice de jogos"
          onClick={onToggleIndex}
        >
          <List size={18} aria-hidden="true" />
        </button>
        <div className="hud-save" aria-label={`${totalGames} jogos no acervo`}>
          <span className="hud-save-label" aria-hidden="true">TOTAL SAVE</span>
          <span className="hud-save-value" aria-hidden="true">{String(totalGames).padStart(3, '0')}</span>
        </div>
      </div>
    </header>
  );
}
