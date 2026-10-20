import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Hud } from './components/Hud';
import { FilterBar } from './components/FilterBar';
import { CarouselNav } from './components/CarouselNav';
import { GameDetail } from './components/GameDetail';
import { GameVideo } from './components/GameVideo';
import { GameIndex } from './components/GameIndex';
import { StatsPanel } from './components/StatsPanel';
import { BootScreen } from './components/BootScreen';
import { ToastContainer, ToastMessage } from './components/Toast';
import { useMediaQuery } from './hooks/useMediaQuery';
import { EMPTY_FILTERS, Filters, filterGames } from './lib/collection';
import type { Mode } from './three/Experience';
import type { NodeType } from './lib/graph';
import { Game } from './types';
import './App.css';

import gamesData from './data/games.json';

// three.js chega em chunk separado: o HUD pinta antes do WebGL
const Experience = lazy(() => import('./three/Experience'));

const MODES: Mode[] = ['library', 'map'];

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) || Boolean(el.closest('[data-own-keys]'));
}

function App() {
  const [webgl] = useState(hasWebGL);
  const [mode, setModeState] = useState<Mode>('library');
  const [mapVisited, setMapVisited] = useState(false);
  const [games, setGames] = useState<Game[]>(() => gamesData satisfies Game[]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(!webgl);
  const [sceneReady, setSceneReady] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const toastedImages = useRef(new Set<string>());

  const filtered = useMemo(() => filterGames(games, filters), [games, filters]);
  const slots = useMemo(() => new Map(filtered.map((g, i) => [g.id, i])), [filtered]);
  // jogo selecionado que saiu do filtro cai para o primeiro da lista
  const selectedIndex = selectedId !== null && slots.has(selectedId) ? slots.get(selectedId)! : 0;
  const selectedGame = filtered[selectedIndex] ?? null;

  const addToast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, text }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // galeria e mapa carregam a mesma capa: avisa uma vez por jogo
  const handleImageError = useCallback((title: string) => {
    if (toastedImages.current.has(title)) return;
    toastedImages.current.add(title);
    addToast(`⚠ Imagem quebrada: "${title}"`);
  }, [addToast]);

  const updateGameRating = useCallback((id: number, rating: number) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, rating } : g));
  }, []);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    if (next === 'map') {
      setMapVisited(true);
      setDetailOpen(false);
    }
  }, []);

  const selectIndex = useCallback((index: number) => {
    const game = filtered[Math.max(0, Math.min(filtered.length - 1, index))];
    if (game) setSelectedId(game.id);
  }, [filtered]);

  const changeFilters = useCallback((next: Filters) => {
    setFilters(next);
    setDetailOpen(false);
  }, []);

  const openGame = useCallback((game: Game) => {
    // jogo escondido pelo filtro: limpa filtros para ele aparecer no carrossel
    if (!slots.has(game.id)) setFilters(EMPTY_FILTERS);
    setSelectedId(game.id);
    setModeState('library');
    setDetailOpen(true);
    setIndexOpen(!webgl);
  }, [slots, webgl]);

  const pickHub = useCallback((type: Exclude<NodeType, 'game'>, name: string) => {
    setFilters({ ...EMPTY_FILTERS, [type]: name });
    setSelectedId(null);
    setModeState('library');
    setDetailOpen(false);
  }, []);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (detailOpen) setDetailOpen(false);
        else if (indexOpen && webgl) setIndexOpen(false);
        return;
      }
      if (isTypingTarget(e.target)) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown': {
          e.preventDefault();
          const current = MODES.indexOf(mode);
          setMode(MODES[Math.max(0, Math.min(MODES.length - 1, current + (e.key === 'ArrowDown' ? 1 : -1)))]);
          break;
        }
        case 'ArrowLeft':
        case 'ArrowRight':
          if (mode === 'library') {
            e.preventDefault();
            selectIndex(selectedIndex + (e.key === 'ArrowRight' ? 1 : -1));
          }
          break;
        case 'Enter':
          // Enter em botão/link mantém o comportamento nativo
          if (mode === 'library' && selectedGame && !(e.target as HTMLElement).closest('button, a')) {
            e.preventDefault();
            setDetailOpen(true);
          }
          break;
        case '/':
          e.preventDefault();
          document.getElementById('search-input')?.focus();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, setMode, selectIndex, selectedIndex, selectedGame, detailOpen, indexOpen, webgl]);

  return (
    <div className={`app mode-${mode}`} data-detail={detailOpen || undefined}>
      {webgl && (
        <Suspense fallback={null}>
          <Experience
            mode={mode}
            games={games}
            slots={slots}
            selectedIndex={selectedIndex}
            detailOpen={detailOpen}
            mapVisited={mapVisited}
            reducedMotion={reducedMotion}
            onSelect={selectIndex}
            onOpen={() => setDetailOpen(true)}
            onPickGame={openGame}
            onPickHub={pickHub}
            onImageError={handleImageError}
            onReady={() => setSceneReady(true)}
          />
        </Suspense>
      )}

      <Hud
        mode={mode}
        onModeChange={setMode}
        totalGames={games.length}
        indexOpen={indexOpen}
        onToggleIndex={() => setIndexOpen(o => !o)}
      />

      {mode === 'library' && (
        <>
          <FilterBar games={games} filters={filters} onChange={changeFilters} resultCount={filtered.length} />
          {filtered.length === 0 ? (
            <div className="empty-state" role="status">
              <div className="empty-icon" aria-hidden="true">👾</div>
              <h3>Nenhum jogo encontrado</h3>
              <p>Tente ajustar seus filtros de busca.</p>
              <button className="neon-btn" onClick={() => changeFilters(EMPTY_FILTERS)}>Limpar filtros</button>
            </div>
          ) : webgl && selectedGame && !detailOpen && (
            <CarouselNav
              game={selectedGame}
              index={selectedIndex}
              total={filtered.length}
              onPrev={() => selectIndex(selectedIndex - 1)}
              onNext={() => selectIndex(selectedIndex + 1)}
              onOpen={() => setDetailOpen(true)}
            />
          )}
          {detailOpen && selectedGame && (
            <>
              <GameVideo key={selectedGame.id} game={selectedGame} />
              <GameDetail
                game={selectedGame}
                index={selectedIndex}
                total={filtered.length}
                onClose={() => setDetailOpen(false)}
                onPrev={() => selectIndex(selectedIndex - 1)}
                onNext={() => selectIndex(selectedIndex + 1)}
                onUpdateRating={updateGameRating}
                onFilter={pickHub}
              />
            </>
          )}
        </>
      )}

      {mode === 'map' && <StatsPanel games={games} />}

      {indexOpen && (
        <GameIndex
          games={filtered}
          selectedId={selectedGame?.id ?? null}
          standalone={!webgl}
          onPick={openGame}
          onClose={() => setIndexOpen(false)}
          onImageError={handleImageError}
        />
      )}

      <p className="sr-only" aria-live="polite">
        {mode === 'library' && selectedGame
          ? `Jogo ${selectedIndex + 1} de ${filtered.length}: ${selectedGame.title}, ${selectedGame.platform}, ${selectedGame.year}`
          : mode === 'map' ? 'Mapa do acervo' : ''}
      </p>

      {webgl && <BootScreen ready={sceneReady} reducedMotion={reducedMotion} />}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
