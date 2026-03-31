import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { GameList } from './components/GameList';
import { Dashboard } from './components/Dashboard';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Game } from './types';
import './App.css';

// Using raw import for local JSON to avoid TS errors without extra config
import gamesData from './data/games.json';

const TABS = ['library', 'dashboard'] as const;

function App() {
  const [currentTab, setCurrentTab] = useState('library');
  const [games, setGames] = useState<Game[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, text }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleImageError = useCallback((gameTitle: string) => {
    addToast(`⚠ Imagem quebrada: "${gameTitle}"`);
  }, [addToast]);

  useEffect(() => {
    // Simulated load to fetch the extracted games
    setGames(gamesData as unknown as Game[]);
  }, []);

  const updateGameRating = (id: number, newRating: number) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, rating: newRating } : g));
  };

  const handleTotalPagesChange = useCallback((total: number) => {
    setTotalPages(total);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown': {
          e.preventDefault();
          const currentIndex = TABS.indexOf(currentTab as typeof TABS[number]);
          const nextIndex = e.key === 'ArrowDown'
            ? Math.min(currentIndex + 1, TABS.length - 1)
            : Math.max(currentIndex - 1, 0);
          setCurrentTab(TABS[nextIndex]);
          break;
        }
        case 'ArrowLeft':
          if (currentTab === 'library') {
            e.preventDefault();
            setCurrentPage(p => Math.max(1, p - 1));
          }
          break;
        case 'ArrowRight':
          if (currentTab === 'library') {
            e.preventDefault();
            setCurrentPage(p => Math.min(totalPages, p + 1));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, totalPages]);

  return (
    <div className="app-container">
      <Sidebar 
        currentTab={currentTab} 
        setTab={setCurrentTab} 
        totalGames={games.length}
      />
      
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-content">
            <h2 className="page-title">
              {currentTab === 'library' ? 'Minha Biblioteca' : 'Estatísticas do Acervo'}
            </h2>
            <div className="user-profile">
              <div className="avatar">P1</div>
            </div>
          </div>
        </header>

        <div className="content-area">
          {currentTab === 'library' && (
            <GameList
              games={games}
              onUpdateRating={updateGameRating}
              onImageError={handleImageError}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              onTotalPagesChange={handleTotalPagesChange}
            />
          )}
          {currentTab === 'dashboard' && <Dashboard games={games} />}
        </div>
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
