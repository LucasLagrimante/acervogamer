const fs = require('fs');

const file = fs.readFileSync('acervo-gamer-legacy.html', 'utf-8');

const regex = /let games = \[\s*([\s\S]*?)\];/;
const match = file.match(regex);

if (match) {
  const gamesArrayString = '[' + match[1] + ']';
  try {
     const fn = new Function('return ' + gamesArrayString);
     const games = fn();
     fs.writeFileSync('src/data/games.json', JSON.stringify(games, null, 2));
     console.log('Successfully extracted games.json');
  } catch (e) {
     console.error('Failed to parse games', e)
  }
} else {
  console.log('Could not find games array in file');
}
