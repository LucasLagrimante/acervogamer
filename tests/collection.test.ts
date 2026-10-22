import assert from 'node:assert/strict';
import test from 'node:test';
import { EMPTY_FILTERS, filterGames } from '../src/lib/collection.ts';

const game = (id: number, title: string, year: string, currentlyPlaying = false) => ({
  id,
  title,
  aliases: [],
  platform: 'PC',
  year,
  genre: 'FPS / Ação',
  cover: '/covers/test.webp',
  comment: '',
  youtubeId: '',
  currentlyPlaying,
});

test('prioriza o jogo que Lucas está jogando sobre o ano de lançamento', () => {
  const games = [
    game(1, 'skate.', '2025'),
    game(2, 'Destiny 2', '2017', true),
  ];

  assert.equal(filterGames(games, EMPTY_FILTERS)[0].title, 'Destiny 2');
});
