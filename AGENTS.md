# AGENTS.md

Orientações para agentes de IA trabalhando neste repositório.

## Arquivo canônico de instruções (leia antes de criar qualquer outro)

**`AGENTS.md` é o único arquivo de instrução de agente deste repositório.**

Proibido criar `CLAUDE.md`, `GEMINI.md` ou `AGENTS.local.md` aqui, e **proibido symlink**
apontando para o `AGENTS.md`. As ferramentas legem `AGENTS.md` nativamente, então o alias
só geraria edição no arquivo errado.

- Regra de agente nova → edite o `AGENTS.md`. Só ele.
- `README.md` é descrição do projeto **para humanos** (o que é, como rodar, como publicar).
  Não é lugar de instrução de agente.

---

## O que é este repositório

SPA de coleção pessoal de jogos, **Vite + React 19 + TypeScript**, sem backend. Os dados
são um JSON versionado — não há API em runtime.

```
src/main.tsx            ponto de entrada
src/App.tsx             estado global: aba ativa, jogos, paginação, toasts, teclado
src/types.ts            contrato Game
src/data/games.json     a coleção (fonte única de verdade dos dados)
src/components/         Sidebar, GameList, GameCard, Dashboard, Toast
vite.config.ts          config do Vite (sem `base` — o app vive na raiz do domínio)
eslint.config.js        flat config: js.recommended + typescript-eslint + react-hooks
```

## Onde mexer

- **Estado da aplicação**: tudo relevante mora em `src/App.tsx`. `Dashboard` e `GameList`
  recebem dados por props e não fazem fetch.
- **Coleção**:_edite `src/data/games.json`_, nunca o array dentro do componente. Para
  regerar a partir do HTML legado use `node extract-games.js`.
- **Grafo do dashboard**: nós e arestas são derivados de `games` em `Dashboard.tsx`
  (`graphData`). Os tipos `GraphNode`/`GraphLink` e `COLORS` estão no topo do arquivo —
  mexer no visual do grafo começa por ali, não por literais espalhados no JSX.
- **Visual**: as cores e espaçamentos saem das custom properties do CSS. Cada componente
  tem o seu `*.css` ao lado; alterar valor ali propaga só para aquele componente.

## Regras

1. **TypeScript strict, sem `any`.** `npm run typecheck` (`tsc -b`) e `npm run lint`
   (`eslint src`) têm que passar com zero erro antes de commit. Se um tipo externo não
   serve, importe o tipo real do pacote em vez de usar `any`.
2. **Sem setState dentro de `useEffect`.** O `eslint-plugin-react-hooks` com
   `recommended` reprova isso: inicialize com `useState(() => valor)` em vez de popular
   o estado a partir de um efeito.
3. **Não introduza dependência sem uso.** O bundle é client-side; cada dependência entra
   no que o navegador baixa. Antes de adicionar, confirme que o import realmente existe em `src/`.
4. **`vite.config.ts` não define `base`.** O app é servido na raiz de `acervo.lagrimante.com.br`;
   um `base` de subpath quebraria todos os assets.
5. **Acessibilidade**: campos de busca/filtro precisam de rótulo associável, botões de
   paginação com nome acessível e foco visível. Navegação por teclado é requisito.
6. **Idioma**: interface em português brasileiro; código e comentários em português.

## Como verificar

```bash
npm run typecheck
npm run lint
npm run build
```

- Ao mexer no grafo ou em CSS de layout, valide no navegador em largura de desktop **e**
  mobile — o `ForceGraph2D` depende de `clientWidth`/`clientHeight` do container, então
  depende do CSS estar certo para calcular as dimensões.
- Erro silencioso em `useEffect` derruba a página sem mensagem útil: rode o console.

## Deploy

Cloudflare Pages conectado ao GitHub, branch de produção `main`, build `npm run build` e
saída em `dist/`. Push em `main` publica. **Não** existe branch `gh-pages` nem
`git subtree` — deploy é do Pages, não do repositório. `dist/` é ignorado pelo git.

O domínio custom (`acervo.lagrimante.com.br`) aponta por CNAME para o `*.pages.dev`
do projeto, com `proxied: false`.