import { useState, useMemo, useEffect } from 'react';
import { Game } from '../types';
import { GameCard } from './GameCard';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import './GameList.css';

interface GameListProps {
  games: Game[];
  onUpdateRating: (id: number, rating: number) => void;
  onImageError?: (gameTitle: string) => void;
  currentPage: number;
  setCurrentPage: (page: number | ((p: number) => number)) => void;
  onTotalPagesChange: (total: number) => void;
}

export function GameList({ games, onUpdateRating, onImageError, currentPage, setCurrentPage, onTotalPagesChange }: GameListProps) {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const itemsPerPage = 6;

  const platforms = useMemo(() => {
    return Array.from(new Set(games.map(g => g.platform).filter(Boolean))).sort();
  }, [games]);

  const years = useMemo(() => {
    return Array.from(new Set(games.map(g => g.year).filter(Boolean))).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (isNaN(aNum) && isNaN(bNum)) return a.localeCompare(b);
      if (isNaN(aNum)) return 1;
      if (isNaN(bNum)) return -1;
      return aNum - bNum;
    });
  }, [games]);

  const filteredGames = useMemo(() => {
    return games
      .filter(g => {
        const matchSearch = g.title.toLowerCase().includes(search.toLowerCase()) || 
                           (g.comment && g.comment.toLowerCase().includes(search.toLowerCase()));
        const matchPlatform = !platformFilter || g.platform === platformFilter;
        const matchYear = !yearFilter || g.year === yearFilter;
        return matchSearch && matchPlatform && matchYear;
      })
      .sort((a, b) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        if (yearA !== yearB) return yearB - yearA;
        return a.title.localeCompare(b.title);
      });
  }, [games, search, platformFilter, yearFilter]);

  const totalPages = Math.ceil(filteredGames.length / itemsPerPage);

  // Report totalPages to parent for keyboard navigation
  useEffect(() => {
    onTotalPagesChange(totalPages);
  }, [totalPages, onTotalPagesChange]);

  const currentGames = filteredGames.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, platformFilter, yearFilter]);

  return (
    <div className="game-list-container animate-in">
      <div className="controls-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="search-input"
            placeholder="Buscar títulos, memórias..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filters-wrapper">
          <div className="select-wrapper">
            <Filter size={14} className="select-icon" />
            <select 
              className="filter-select" 
              value={platformFilter} 
              onChange={(e) => setPlatformFilter(e.target.value)}
            >
              <option value="">Todas Plataformas</option>
              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="select-wrapper">
            <Filter size={14} className="select-icon" />
            <select 
              className="filter-select" 
              value={yearFilter} 
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="">Todos os Anos</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="results-info">
        <span>Mostrando {filteredGames.length} jogo{filteredGames.length !== 1 ? 's' : ''}</span>
      </div>

      {filteredGames.length > 0 ? (
        <div className="games-grid">
          {currentGames.map((game) => (
            <GameCard key={game.id} game={game} onUpdateRating={onUpdateRating} onImageError={onImageError} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">👾</div>
          <h3>Nenhum jogo encontrado</h3>
          <p>Tente ajustar seus filtros de busca.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="page-btn" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`page-num ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button 
            className="page-btn" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
