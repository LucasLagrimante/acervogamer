---
name: drei-html-unmount-error
description: <Html> do drei gera "Attempted to synchronously unmount a root" com React 19; rótulos 3D devem ser DOM imperativo
module: three
metadata:
  type: project
---
`<Html>` do `@react-three/drei` cria um React root por instância e chama `root.unmount()` dentro de `useLayoutEffect`; com React 19 isso loga "Attempted to synchronously unmount a root while React was already rendering" (StrictMode e a cada troca de rótulo de hover).
**Why:** console precisa ficar limpo — erro em efeito é a principal pista de quebra silenciosa neste projeto.
**How to apply:** rótulos sobre a cena = camada `<div>` imperativa anexada a `gl.domElement.parentElement`, posição via `Vector3.project(camera)` no `useFrame` (ver `src/three/Constellation.tsx`). Não reintroduzir `<Html>`.
