import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Game } from '../types';
import { EMPTY_FILTERS, Filters, hasActiveFilters, uniqueGenres, uniquePlatforms, uniqueYears } from '../lib/collection';
import './FilterBar.css';

interface FilterBarProps {
  games: Game[];
  filters: Filters;
  onChange: (filters: Filters) => void;
  resultCount: number;
}

export function FilterBar({ games, filters, onChange, resultCount }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const platforms = useMemo(() => uniquePlatforms(games), [games]);
  const years = useMemo(() => uniqueYears(games), [games]);
  const genres = useMemo(() => uniqueGenres(games), [games]);
  const active = hasActiveFilters(filters);

  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filters, [key]: e.target.value });

  return (
    <section className={`filter-bar ${expanded ? 'expanded' : ''}`} aria-label="Busca e filtros">
      <div className="filter-search">
        <Search size={16} className="filter-search-icon" aria-hidden="true" />
        <label htmlFor="search-input" className="sr-only">Buscar jogos</label>
        <input
          id="search-input"
          type="search"
          className="filter-input"
          placeholder="Buscar títulos, memórias…  ( / )"
          value={filters.search}
          onChange={set('search')}
          autoComplete="off"
        />
        <button
          className="filter-toggle"
          aria-expanded={expanded}
          aria-controls="filter-selects"
          aria-label="Mostrar filtros"
          onClick={() => setExpanded(e => !e)}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="filter-selects" id="filter-selects">
        <FilterSelect id="filter-platform" label="Plataforma" value={filters.platform} onChange={set('platform')} all="Todas plataformas" options={platforms} />
        <FilterSelect id="filter-genre" label="Gênero" value={filters.genre} onChange={set('genre')} all="Todos os gêneros" options={genres} />
        <FilterSelect id="filter-year" label="Ano" value={filters.year} onChange={set('year')} all="Todos os anos" options={years} />
      </div>

      <div className="filter-meta">
        <span className="filter-count" role="status">
          {resultCount} jogo{resultCount !== 1 ? 's' : ''}
        </span>
        {active && (
          <button className="filter-clear" onClick={() => onChange(EMPTY_FILTERS)}>
            <X size={12} aria-hidden="true" /> Limpar
          </button>
        )}
      </div>
    </section>
  );
}

interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  all: string;
  options: string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

function FilterSelect({ id, label, value, all, options, onChange }: FilterSelectProps) {
  return (
    <div className="filter-field">
      <label htmlFor={id} className="filter-label">{label}</label>
      <select id={id} className={`filter-select ${value ? 'has-value' : ''}`} value={value} onChange={onChange}>
        <option value="">{all}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
