import { useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { Game } from '../types';
import './GameCard.css';

interface GameCardProps {
  game: Game;
  onUpdateRating?: (id: number, rating: number) => void;
  onImageError?: (gameTitle: string) => void;
}

export function GameCard({ game, onUpdateRating, onImageError }: GameCardProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isHalf = e.clientX - rect.left < rect.width / 2;
    setHoverRating(starIndex - (isHalf ? 0.5 : 0));
  };

  const handleMouseLeave = () => {
    setHoverRating(null);
  };

  const handleClick = (rating: number) => {
    if (onUpdateRating) {
      onUpdateRating(game.id, rating);
    }
  };

  const handleImgError = useCallback(() => {
    if (!imgFailed) {
      setImgFailed(true);
      onImageError?.(game.title);
    }
  }, [imgFailed, onImageError, game.title]);

  const currentDisplayRating = hoverRating !== null ? hoverRating : game.rating;

  return (
    <div className="game-card">
      <div className="card-glint" />
      <div className="cover-wrapper">
        <img src={game.cover} alt={game.title} className="game-cover img-load" onError={handleImgError} />
        <div className="cover-overlay" />
      </div>
      
      <div className="card-content">
        <div className="card-header">
          <h3 className="game-title">{game.title}</h3>
          <div className="game-rating" onMouseLeave={handleMouseLeave}>
            {[1, 2, 3, 4, 5].map((star) => {
              const isFull = currentDisplayRating >= star;
              const isHalf = currentDisplayRating >= star - 0.5 && currentDisplayRating < star;
              const isActive = isFull || isHalf;

              return (
                <div 
                  key={star} 
                  className="rating-star-wrapper"
                  onMouseMove={(e) => handleMouseMove(e, star)}
                  onClick={() => hoverRating && handleClick(hoverRating)}
                >
                  <Star 
                    size={14} 
                    className={`star-base ${isActive ? 'active-outline' : ''}`} 
                    fill={isFull ? 'currentColor' : 'transparent'}
                  />
                  {isHalf && (
                    <div className="star-half-overlay">
                      <Star size={14} fill="currentColor" className="active-outline" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="tags-row">
          {game.platform && <span className="tag tag-platform">{game.platform}</span>}
          {game.year && <span className="tag tag-year">{game.year}</span>}
          {game.genre && <span className="tag tag-genre">{game.genre}</span>}
        </div>
        
        {game.comment && (
          <p className="game-comment">{game.comment}</p>
        )}
      </div>
    </div>
  );
}
