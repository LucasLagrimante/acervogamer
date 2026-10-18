import { useState } from 'react';
import { Star } from 'lucide-react';
import { formatRating } from '../lib/collection';
import './StarRating.css';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

const clamp = (v: number) => Math.max(0, Math.min(5, v));

// Slider acessível de 0 a 5 em passos de meia estrela (mouse, toque e teclado)
export function StarRating({ value, onChange, label }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;

  const pick = (e: React.MouseEvent<HTMLSpanElement>, star: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return star - (e.clientX - rect.left < rect.width / 2 ? 0.5 : 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const next = {
      ArrowRight: value + 0.5,
      ArrowUp: value + 0.5,
      ArrowLeft: value - 0.5,
      ArrowDown: value - 0.5,
      Home: 0,
      End: 5,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    onChange(clamp(next));
  };

  return (
    <div
      className="star-rating"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value}
      aria-valuetext={value ? `${formatRating(value)} de 5 estrelas` : 'Sem nota'}
      data-own-keys
      onKeyDown={onKeyDown}
      onPointerLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map(star => {
        const full = shown >= star;
        const half = !full && shown >= star - 0.5;
        return (
          <span
            key={star}
            className="star-slot"
            onPointerMove={e => setHover(pick(e, star))}
            onClick={e => onChange(pick(e, star))}
          >
            <Star size={26} className={`star-icon ${full || half ? 'on' : ''}`} fill={full ? 'currentColor' : 'transparent'} aria-hidden="true" />
            {half && (
              <span className="star-half">
                <Star size={26} className="star-icon on" fill="currentColor" aria-hidden="true" />
              </span>
            )}
          </span>
        );
      })}
      <span className="star-value" aria-hidden="true">{shown ? formatRating(shown) : '—'}</span>
    </div>
  );
}
