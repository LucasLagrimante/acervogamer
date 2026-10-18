import { useEffect, useState } from 'react';
import { CanvasTexture, SRGBColorSpace, Texture, TextureLoader } from 'three';

/** Proporção largura/altura da caixa do jogo (estilo estojo de DVD) */
export const CASE_ASPECT = 1 / 1.4;

const loader = new TextureLoader();
const cache = new Map<string, Promise<Texture>>();
const ready = new Map<string, Texture>();

// Recorta a imagem como `object-fit: cover` dentro da proporção da caixa
function fitCover(tex: Texture) {
  const img = tex.image as { width: number; height: number };
  const imgAspect = img.width / img.height;
  if (imgAspect > CASE_ASPECT) {
    tex.repeat.set(CASE_ASPECT / imgAspect, 1);
    tex.offset.set((1 - tex.repeat.x) / 2, 0);
  } else {
    tex.repeat.set(1, imgAspect / CASE_ASPECT);
    tex.offset.set(0, (1 - tex.repeat.y) / 2);
  }
}

function prepare(tex: Texture) {
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function loadCover(url: string): Promise<Texture> {
  let p = cache.get(url);
  if (!p) {
    p = loader.loadAsync(url).then(tex => {
      fitCover(tex);
      ready.set(url, prepare(tex));
      return tex;
    });
    cache.set(url, p);
  }
  return p;
}

// Capa substituta quando a imagem falha: título desenhado num canvas
export function fallbackCover(title: string): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = Math.round(256 / CASE_ASPECT);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#1b0f3a');
    grad.addColorStop(1, '#3a0b2c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ff2a6d';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 22px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    wrap(title.toUpperCase(), 200).forEach((line, i, all) =>
      ctx.fillText(line, canvas.width / 2, canvas.height / 2 + (i - (all.length - 1) / 2) * 28));
    ctx.fillStyle = '#05d9e8';
    ctx.font = '600 13px "Space Grotesk", sans-serif';
    ctx.fillText('SEM CAPA', canvas.width / 2, canvas.height - 34);

    function wrap(text: string, max: number) {
      const lines: string[] = [];
      let line = '';
      text.split(' ').forEach(word => {
        const next = line ? `${line} ${word}` : word;
        if (ctx && ctx.measureText(next).width > max && line) {
          lines.push(line);
          line = word;
        } else line = next;
      });
      if (line) lines.push(line);
      return lines;
    }
  }
  return prepare(new CanvasTexture(canvas));
}

/**
 * Carrega a capa sob demanda (`enabled`) e devolve `null` enquanto não chega.
 * Em falha usa a capa substituta e avisa via `onError` uma única vez.
 */
export function useCoverTexture(url: string, title: string, enabled: boolean, onError?: (title: string) => void) {
  const [tex, setTex] = useState<Texture | null>(() => ready.get(url) ?? null);

  useEffect(() => {
    if (!enabled || tex) return;
    let alive = true;
    loadCover(url).then(
      t => { if (alive) setTex(t); },
      () => {
        if (!alive) return;
        setTex(fallbackCover(title));
        onError?.(title);
      },
    );
    return () => { alive = false; };
  }, [url, title, enabled, tex, onError]);

  return tex;
}
