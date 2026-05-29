import React, { useState } from 'react';

export default function StarRating({ 
  value = 0, 
  ratingCount = null, 
  interactive = false, 
  onChange = null 
}) {
  const [hoverValue, setHoverValue] = useState(0);

  const displayValue = hoverValue || value;

  const renderStars = () => {
    const stars = [];
    
    if (interactive) {
      // Interactive Mode
      for (let i = 1; i <= 5; i++) {
        const isFilled = i <= displayValue;
        stars.push(
          <span
            key={i}
            className={`interactive-star ${isFilled ? 'filled' : ''}`}
            onMouseEnter={() => setHoverValue(i)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => onChange && onChange(i)}
          >
            ★
          </span>
        );
      }
    } else {
      // Static Display Mode
      for (let i = 1; i <= 5; i++) {
        if (i <= value) {
          stars.push(<span key={i} className="star filled">★</span>);
        } else if (i - 0.5 <= value) {
          stars.push(<span key={i} className="star half-filled">★</span>);
        } else {
          stars.push(<span key={i} className="star">★</span>);
        }
      }
    }

    return stars;
  };

  return (
    <div className={interactive ? 'rating-input-container' : 'stars-display'}>
      {renderStars()}
      {!interactive && value > 0 && (
        <span className="rating-number">
          {Number(value).toFixed(1)}
          {ratingCount !== null && (
            <span className="rating-count">({ratingCount})</span>
          )}
        </span>
      )}
      {!interactive && value === 0 && (
        <span className="rating-number" style={{ color: 'var(--color-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>
          No ratings yet
        </span>
      )}
    </div>
  );
}
