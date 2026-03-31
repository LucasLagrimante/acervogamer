const fs = require('fs');
const googleIt = require('google-it');
const path = './src/data/games.json';

async function searchImage(query) {
  try {
    const results = await googleIt({ 
      query: `${query} site:wikipedia.org OR site:ign.com OR site:gamespot.com`,
      'no-display': true 
    });
    return results.map(r => ({ url: r.link, title: r.title }));
  } catch (err) {
    console.error("Search error:", err.message);
    return [];
  }
}

async function fetchCovers() {
  const targetArg = process.argv[2]; 
  
  console.log("Loading games.json...");
  let games = [];
  try {
    games = JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (err) {
    console.error("Error reading games.json:", err.message);
    process.exit(1);
  }

  const gamesToUpdate = targetArg 
    ? games.filter(g => g.id.toString() === targetArg || g.title.toLowerCase().includes(targetArg.toLowerCase()))
    : games;

  if (targetArg && gamesToUpdate.length === 0) {
    console.log(`No games found matching: ${targetArg}`);
    return;
  }

  console.log(`Targeting ${gamesToUpdate.length} games. Starting fetch...`);

  for (let i = 0; i < gamesToUpdate.length; i++) {
    const game = gamesToUpdate[i];
    const query = `${game.title} ${game.platform ? game.platform + ' ' : ''}official box art`;
    console.log(`Searching [${game.id}]: ${query}...`);
    
    try {
      const results = await searchImage(query);
      
      // Since we are searching on game sites, the first image-like link or just the link might be better
      // But we need actual image URLs. google-it returns page links.
      // This approach is harder without a direct image API.
      // Let's fallback to a simpler query with 'g-i-s' but with ZERO filtering for now.
    } catch (err) {
      console.log(`  -> Error: ${err.message}`);
    }
  }

  console.log("This script version is being simplified for raw results.");
}

// Special case: Manual fix for the most problematic ones
const MANUAL_FIXES = {
  2: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/HappyLand_Adventures_cover.jpg/220px-HappyLand_Adventures_cover.jpg",
  37: "https://upload.wikimedia.org/wikipedia/en/c/ce/Vice-city-cover.jpg",
  39: "https://upload.wikimedia.org/wikipedia/en/d/da/The_Sims_Coverart.png",
  48: "https://upload.wikimedia.org/wikipedia/en/b/ba/Game_Cover_THPS3_PS2.jpg",
  53: "https://upload.wikimedia.org/wikipedia/en/a/a2/Unreal_Tournament_2004_cover.jpg",
  59: "https://archive.org/download/lierodos/liero.png",
  60: "https://cdn.mobygames.com/covers/2547141-liero-x-windows-front-cover.jpg",
  63: "https://upload.wikimedia.org/wikipedia/en/2/29/Age_of_Mythology_Box_Art.png",
  68: "https://upload.wikimedia.org/wikipedia/en/6/6f/Crossfire_poster.jpg",
  69: "https://upload.wikimedia.org/wikipedia/en/b/bd/Point_Blank_online_game_cover.jpg",
  74: "https://m.media-amazon.com/images/I/51A0TX8VJFL._AC_UF1000,1000_QL80_.jpg"
};

async function runManualFix() {
    console.log("Applying manual fixes for problematic games...");
    let games = JSON.parse(fs.readFileSync(path, 'utf8'));
    
    games.forEach(g => {
        if (MANUAL_FIXES[g.id]) {
            console.log(`  Updating [${g.id}] ${g.title}...`);
            g.cover = MANUAL_FIXES[g.id];
        }
    });
    
    fs.writeFileSync(path, JSON.stringify(games, null, 2));
    console.log("Manual fixes applied!");
}

runManualFix();
