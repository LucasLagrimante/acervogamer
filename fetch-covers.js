import fs from 'node:fs'

const path = './src/data/games.json'

const MANUAL_FIXES = {
  2: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/HappyLand_Adventures_cover.jpg/220px-HappyLand_Adventures_cover.jpg',
  37: 'https://upload.wikimedia.org/wikipedia/en/c/ce/Vice-city-cover.jpg',
  39: 'https://upload.wikimedia.org/wikipedia/en/d/da/The_Sims_Coverart.png',
  48: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Game_Cover_THPS3_PS2.jpg',
  53: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Unreal_Tournament_2004_cover.jpg',
  59: 'https://archive.org/download/lierodos/liero.png',
  60: 'https://cdn.mobygames.com/covers/2547141-liero-x-windows-front-cover.jpg',
  63: 'https://upload.wikimedia.org/wikipedia/en/2/29/Age_of_Mythology_Box_Art.png',
  68: 'https://upload.wikimedia.org/wikipedia/en/6/6f/Crossfire_poster.jpg',
  69: 'https://upload.wikimedia.org/wikipedia/en/b/bd/Point_Blank_online_game_cover.jpg',
  74: 'https://m.media-amazon.com/images/I/51A0TX8VJFL._AC_UF1000,1000_QL80_.jpg',
}

const games = JSON.parse(fs.readFileSync(path, 'utf8'))
let changed = 0

for (const game of games) {
  const fix = MANUAL_FIXES[game.id]
  if (!fix || game.cover === fix) continue
  game.cover = fix
  changed++
  console.log(`[${game.id}] ${game.title}`)
}

fs.writeFileSync(path, JSON.stringify(games, null, 2))
console.log(`${changed} capa(s) atualizada(s).`)