import { List, Orbit, Library, Move3D } from 'lucide-react';
import type { Mode } from '../three/Experience';
import type { DeviceOrientationStatus } from '../hooks/useDeviceOrientation';
import './Hud.css';

interface HudProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  totalGames: number;
  indexOpen: boolean;
  onToggleIndex: () => void;
  showMotionControl: boolean;
  motionStatus: DeviceOrientationStatus;
  motionDisabled: boolean;
  onToggleMotion: () => void;
}

export function Hud({
  mode, onModeChange, totalGames, indexOpen, onToggleIndex,
  showMotionControl, motionStatus, motionDisabled, onToggleMotion,
}: HudProps) {
  const motionLabel = motionDisabled
    ? 'Parallax por inclinação desativado pela preferência de reduzir movimento'
    : motionStatus === 'on'
      ? 'Desativar parallax por inclinação'
      : motionStatus === 'requesting'
        ? 'Aguardando o sensor de movimento'
        : motionStatus === 'denied'
          ? 'Tentar ativar o movimento novamente'
          : motionStatus === 'unavailable'
            ? 'Tentar novamente: sensor sem resposta'
            : motionStatus === 'unsupported'
              ? 'Sensor de orientação não suportado neste navegador'
              : 'Ativar parallax inclinando o celular';

  const motionActive = motionStatus === 'on' && !motionDisabled;
  const motionAnnouncement = motionDisabled
    ? 'Parallax por inclinação desativado pela preferência de reduzir movimento.'
    : motionActive
      ? 'Parallax por inclinação ativado. Incline o celular levemente para mover a cena.'
    : motionStatus === 'requesting'
      ? 'Aguardando permissão e leitura do sensor de movimento.'
      : motionStatus === 'denied'
        ? 'Permissão de movimento negada. Tente novamente após liberar o acesso no navegador.'
        : motionStatus === 'unavailable'
          ? 'O sensor de movimento não respondeu. Confira o suporte do aparelho e do navegador.'
          : motionStatus === 'unsupported'
            ? 'Este navegador não oferece sensor de orientação.'
            : '';

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
          aria-label="Biblioteca"
          title="Biblioteca"
          onClick={() => onModeChange('library')}
        >
          <Library size={16} aria-hidden="true" />
          <span>Biblioteca</span>
        </button>
        <button
          className={`hud-mode ${mode === 'map' ? 'active' : ''}`}
          aria-pressed={mode === 'map'}
          aria-label="Mapa"
          title="Mapa"
          onClick={() => onModeChange('map')}
        >
          <Orbit size={16} aria-hidden="true" />
          <span>Mapa</span>
        </button>
      </nav>

      <div className="hud-right">
        {showMotionControl && (
          <>
            <button
              className={`hud-icon-btn hud-motion-btn ${motionActive ? 'active' : ''}`}
              aria-label={motionLabel}
              aria-pressed={motionActive}
              aria-busy={motionStatus === 'requesting'}
              title={motionActive ? 'Incline o celular para mover a cena. Toque para desativar.' : motionLabel}
              onClick={onToggleMotion}
              disabled={motionDisabled || motionStatus === 'requesting' || motionStatus === 'unsupported'}
            >
              <Move3D size={18} aria-hidden="true" />
            </button>
            <span className="sr-only" role="status" aria-live="polite">{motionAnnouncement}</span>
          </>
        )}
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
