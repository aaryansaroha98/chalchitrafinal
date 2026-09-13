import React from 'react';
import { getAgeRating, hasVisibleAgeRating, requiresAgeGate } from '../utils/ageRating';

/**
 * The certificate chip. Silent for a 'U' screening — it only appears when the
 * rating actually restricts who may come in.
 *
 * variant="poster" pins it to the top-right corner of a poster container
 * (the container needs position: relative, which the movie cards already have).
 */
const AgeRatingBadge = ({ movie, variant = 'inline', className = '', style }) => {
  if (!hasVisibleAgeRating(movie)) return null;

  const rating = getAgeRating(movie.age_rating);
  const restricted = requiresAgeGate(movie);
  const classes = [
    'age-rating-chip',
    restricted ? 'age-rating-chip-restricted' : '',
    variant === 'poster' ? 'age-rating-chip-poster' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      style={style}
      title={`${rating.label} · ${rating.audience}`}
      aria-label={`Certificate ${rating.badge}. ${rating.audience}`}
    >
      {rating.badge}
    </span>
  );
};

export default AgeRatingBadge;
