import { Game } from '../types';

export interface Filters {
  search: string;
  platform: string;
  year: string;
  genre: string;
}

export const EMPTY_FILTERS: Filters = { search: '', platform: '', year: '', genre: '' };

// "FPS / Ação" vira ["FPS", "Ação"]: cada parte é um gênero navegável
export function genreTags(genre: string): string[] {
  return genre.split('/').map(s => s.trim()).filter(Boolean);
}

export function hasActiveFilters(f: Filters): boolean {
  return Boolean(f.search || f.platform || f.year || f.genre);
}

export function filterGames(games: Game[], f: Filters): Game[] {
  const term = f.search.trim().toLowerCase();
  return games
    .filter(g => {
      const matchSearch = !term
        || [g.title, g.comment, ...(g.aliases ?? [])].some(text => text.toLowerCase().includes(term));
      const matchPlatform = !f.platform || g.platform === f.platform;
      const matchYear = !f.year || g.year === f.year;
      const matchGenre = !f.genre || genreTags(g.genre).includes(f.genre);
      return matchSearch && matchPlatform && matchYear && matchGenre;
    })
    .sort((a, b) => {
      const yearA = parseInt(a.year) || 0;
      const yearB = parseInt(b.year) || 0;
      if (yearA !== yearB) return yearB - yearA;
      return a.title.localeCompare(b.title);
    });
}

export function uniquePlatforms(games: Game[]): string[] {
  return Array.from(new Set(games.map(g => g.platform).filter(Boolean))).sort();
}

export function uniqueGenres(games: Game[]): string[] {
  return Array.from(new Set(games.flatMap(g => genreTags(g.genre)))).sort((a, b) => a.localeCompare(b));
}

export function uniqueYears(games: Game[]): string[] {
  return Array.from(new Set(games.map(g => g.year).filter(Boolean))).sort((a, b) => {
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    if (isNaN(aNum) && isNaN(bNum)) return a.localeCompare(b);
    if (isNaN(aNum)) return 1;
    if (isNaN(bNum)) return -1;
    return aNum - bNum;
  });
}

export function averageRating(games: Game[]): number | null {
  const rated = games.filter(g => g.rating > 0);
  if (!rated.length) return null;
  return rated.reduce((acc, g) => acc + g.rating, 0) / rated.length;
}

export function countBy(games: Game[], key: (g: Game) => string[]): [string, number][] {
  const counts = new Map<string, number>();
  games.forEach(g => key(g).forEach(k => counts.set(k, (counts.get(k) ?? 0) + 1)));
  return Array.from(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export const formatRating = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
