import fs from 'node:fs'

const file = fs.readFileSync('acervo-gamer-legacy.html', 'utf-8')

const regex = /let games = \[\s*([\s\S]*?)\];/
const match = file.match(regex)

if (!match) {
  console.error('Não foi possível localizar o array games no HTML legado')
  process.exit(1)
}

const games = new Function(`return [${match[1]}]`)()
fs.writeFileSync('src/data/games.json', JSON.stringify(games, null, 2))
console.log(`games.json regravado com ${games.length} jogos.`)