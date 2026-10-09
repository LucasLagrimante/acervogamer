# Acervo Gamer

Coleção pessoal de jogos em **Vite + React 19 + TypeScript**. Duas visões:

- **Biblioteca** — grade paginada com busca, filtro por plataforma e por ano, capa e nota editável.
- **Dashboard** — KPIs (total, nota média, plataformas) e um grafo de força que liga cada jogo à sua plataforma e ao seu gênero.

## Rodar localmente

```bash
npm install
npm run dev
```

## Scripts

| script | o que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento do Vite |
| `npm run build` | typecheck (`tsc -b`) + build de produção em `dist/` |
| `npm run preview` | serve o build de produção localmente |
| `npm run typecheck` | só o typecheck |
| `npm run lint` | ESLint sobre `src/` |

## Dados

A coleção vive em `src/data/games.json` (um objeto por jogo). Dois utilitários na raiz ajudam a mantê-la:

- `node extract-games.js` — reextrai o array `games` de `acervo-gamer-legacy.html` para o JSON.
- `node fetch-covers.js` — reaplica as correções manuais de capa que estão no próprio script.

Nenhum dado vem de API em runtime: tudo é estático e versionado.

## Publicar

Cloudflare Pages, conectado ao GitHub. Push em `main` dispara o build (`npm run build` → `dist/`) e publica em <https://acervo.lagrimante.com.br>.

---

Instruções para agentes de IA que trabalham neste repositório estão em
[AGENTS.md](AGENTS.md).