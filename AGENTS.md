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

SPA de coleção pessoal de jogos, **Vite + React 19 + TypeScript + three.js**
(`@react-three/fiber`, `drei`, `postprocessing`), sem backend. Os dados são um JSON
versionado — não há API em runtime.

A interface é uma cena WebGL em tela cheia (synthwave) com dois modos: **Biblioteca**
(carrossel 3D das capas) e **Mapa** (constelação 3D jogos ↔ plataformas ↔ gêneros, no céu
acima da biblioteca). Todo texto e controle fica num HUD em DOM por cima do canvas.

```
src/main.tsx            ponto de entrada
src/App.tsx             estado global: modo, jogos, filtros, seleção, detalhe, toasts, teclado
src/types.ts            contrato Game
src/data/games.json     a coleção (fonte única de verdade dos dados)
src/lib/collection.ts   filtro/ordenação, listas únicas, gêneros ("FPS / Ação" → 2 tags)
src/lib/graph.ts        nós/arestas do mapa + layout de forças 3D determinístico
src/three/              cena (chunk lazy): Experience (Canvas, câmera, bloom), Gallery,
                        Constellation, Synthwave (chão/sol em shader), covers (texturas)
src/components/         HUD em DOM: Hud, FilterBar, CarouselNav, GameDetail, StarRating,
                        StatsPanel, GameIndex, BootScreen, Toast
vite.config.ts          config do Vite (sem `base` — o app vive na raiz do domínio)
eslint.config.js        flat config: js.recommended + typescript-eslint + react-hooks
```

## Onde mexer

- **Estado da aplicação**: tudo relevante mora em `src/App.tsx`. A cena 3D e o HUD recebem
  dados por props e não fazem fetch. O jogo selecionado é guardado por `id`; o índice no
  carrossel é derivado da lista filtrada (sem efeito sincronizando estado).
- **Coleção**: edite `src/data/games.json`, nunca o array dentro do componente. Antes de
  adicionar um jogo, confira se ele já está cadastrado (incluindo título alternativo) para
  evitar duplicatas. `node extract-games.js` regrava o JSON a partir do HTML legado; não
  rode esse utilitário para uma inclusão manual.
- **Mapa (grafo 3D)**: dados e layout em `src/lib/graph.ts` (`buildGraph`); visual
  (`COLORS`, geometrias, escala dos nós) no topo de `src/three/Constellation.tsx`.
- **Carrossel**: pose de cada caixa (coverflow, detalhe aberto, fora do filtro) é calculada
  no `useFrame` de `GameCase` em `src/three/Gallery.tsx`. Todas as caixas ficam montadas;
  filtrar só muda o slot e a animação reposiciona.
- **Câmera**: `CameraRig` em `Experience.tsx` anima entre modos; no Mapa, ao chegar, passa
  o controle para o `OrbitControls`.
- **Visual**: as cores e espaçamentos saem das custom properties do CSS. Cada componente
  tem o seu `*.css` ao lado; alterar valor ali propaga só para aquele componente.

## Cadastro de jogos (obrigatório)

Para cada jogo novo, cumpra todos os itens abaixo antes de considerar a entrada pronta:

1. Use um `id` numérico único e preencha todos os campos do contrato `Game`, incluindo
   `youtubeId`. Se o jogo tiver abreviações ou nomes alternativos comuns, registre-os em
   `aliases` para que também possam ser encontrados pela busca. Não cadastre novamente um
   jogo já presente com título alternativo.
2. Obtenha a capa correspondente ao jogo e grave o arquivo localmente como
   `public/covers/{id}.webp`. Converta para WebP, limite a largura a 500 px sem ampliar
   imagens menores e preserve a proporção. Em `games.json`, use `cover: "/covers/{id}.webp"`;
   não deixe URL externa nem caminho de arquivo inexistente.
3. Registre a origem e a transformação em `src/data/cover-sources.json`, com o título, URL
   original e página-fonte, bytes/dimensões originais, caminho local e bytes/dimensões após
   conversão, além do método de aquisição. Confirme que o arquivo existe e que é WebP real.
   **`fetch-covers.js` só reaplica URLs de correção no JSON; ele não baixa nem converte capas.**
4. Encontre um vídeo público de gameplay/walkthrough do jogo exato (não trailer/review quando
   houver gameplay). Pesquise pelo título, plataforma e ano; valide o candidato por oEmbed do
   YouTube e exija HTTP 200, `type: "video"` e título/canal compatíveis. Grave somente o ID
   de 11 caracteres em `youtubeId`; esse ID é usado por `GameVideo` para montar o iframe.
   Nunca invente IDs nem deixe o campo vazio. Se não houver candidato verificável, não conclua
   a inclusão até localizar um vídeo adequado.
5. Antes de finalizar, valide JSON, IDs únicos, capa local/WebP e metadados da capa para cada
   registro; valide também cada `youtubeId` por oEmbed. Rode os comandos de typecheck, lint e
   build abaixo. Não substitua entradas preexistentes ao regenerar o arquivo legado.

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
   navegação com nome acessível e foco visível. Navegação por teclado é requisito
   (←/→ jogo, ↑/↓ modo, Enter detalhe, Esc fecha, `/` busca). O canvas é `aria-hidden`:
   toda informação da cena precisa existir também no HUD/DOM (região `aria-live`, Índice).
   Sem WebGL, o Índice vira a página.
6. **three.js com react-hooks v7**: não mute objetos vindos de `useMemo`/`useState` dentro
   de `useFrame` (regra `react-hooks/immutability`). Mute via `ref` do mesh/material ou use
   material declarativo em JSX. Evite `<Html>` do drei: ele cria um React root por rótulo e
   o `unmount` síncrono gera erro no console — rótulos do mapa são DOM imperativo projetado
   por frame.
7. **Idioma**: interface em português brasileiro; código e comentários em português.

## Como verificar

```bash
npm run typecheck
npm run lint
npm run build
```

- Ao mexer na cena ou em CSS de layout, valide no navegador em largura de desktop **e**
  mobile (retrato): a câmera recua e o detalhe vira bottom sheet conforme o aspecto.
  Teste também com `prefers-reduced-motion: reduce` (sem animações automáticas).
- Erro silencioso em `useEffect` derruba a página sem mensagem útil: rode o console.

## Deploy

Cloudflare Pages conectado ao GitHub, branch de produção `main`, build `npm run build` e
saída em `dist/`. Push em `main` publica. **Não** existe branch `gh-pages` nem
`git subtree` — deploy é do Pages, não do repositório. `dist/` é ignorado pelo git.

O domínio custom (`acervo.lagrimante.com.br`) aponta por CNAME para o `*.pages.dev`
do projeto, com `proxied: false`.