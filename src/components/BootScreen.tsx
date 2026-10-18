import { useEffect, useState } from 'react';
import './BootScreen.css';

interface BootScreenProps {
  ready: boolean;
  reducedMotion: boolean;
}

// Tela de "boot" enquanto o chunk do three.js carrega; some sozinha
export function BootScreen({ ready, reducedMotion }: BootScreenProps) {
  const [minElapsed, setMinElapsed] = useState(reducedMotion);
  const [gone, setGone] = useState(false);
  const leaving = ready && minElapsed;

  useEffect(() => {
    if (minElapsed) return;
    const t = setTimeout(() => setMinElapsed(true), 900);
    return () => clearTimeout(t);
  }, [minElapsed]);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setGone(true), reducedMotion ? 0 : 700);
    return () => clearTimeout(t);
  }, [leaving, reducedMotion]);

  if (gone) return null;

  return (
    <div className={`boot ${leaving ? 'boot-leaving' : ''}`} aria-hidden="true">
      <img src="/favicon.png" alt="" width="72" height="72" className="boot-logo" />
      <p className="boot-title">ACERVO GAMER</p>
      <p className="boot-press">{ready ? 'PRESS START' : 'LOADING…'}</p>
    </div>
  );
}
