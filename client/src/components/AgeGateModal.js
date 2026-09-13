import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAgeRating, getRequiredAge } from '../utils/ageRating';

/**
 * The age gate.
 *
 * Shown the moment a viewer heads for an age-restricted screening — from a
 * movie card, from a direct /booking/:id link, or at payment. Confirming is a
 * deliberate act: the primary button states the claim being made, and the
 * server refuses the booking unless that confirmation comes back with it.
 */
const AgeGateModal = ({
  show,
  movie,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel = 'Go back'
}) => {
  const confirmRef = useRef(null);

  // Escape declines — the same as the backdrop and the × button.
  useEffect(() => {
    if (!show) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        if (onCancel) onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onCancel]);

  // Hold the page still behind the sheet, and restore whatever was there.
  useEffect(() => {
    if (!show) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [show]);

  // Land the keyboard on the deliberate action, not on the page behind.
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => {
      if (confirmRef.current) confirmRef.current.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, [show]);

  if (!movie) return null;

  const rating = getAgeRating(movie.age_rating);
  const requiredAge = getRequiredAge(movie) || rating.minAge || 18;
  const note = (movie.age_gate_note || '').trim();
  const isAdultsOnly = rating.code === 'A';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="age-gate-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => onCancel && onCancel()}
        >
          <motion.div
            className="age-gate-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="age-gate-title"
            aria-describedby="age-gate-text"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="age-gate-head">
              <span className="age-gate-kicker">
                <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
                Age restricted
              </span>
              <button
                type="button"
                className="age-gate-close"
                onClick={() => onCancel && onCancel()}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="age-gate-body">
              <div className="age-gate-mark" aria-hidden="true">
                <span className="age-gate-mark-age">{requiredAge}+</span>
                <span className="age-gate-mark-code">{rating.badge}</span>
              </div>

              <div className="age-gate-copy">
                <h2 id="age-gate-title" className="age-gate-title">
                  This movie is rated &ldquo;{rating.badge}&rdquo;
                </h2>
                <p id="age-gate-text" className="age-gate-text">
                  {isAdultsOnly
                    ? `This screening is only for viewers aged ${requiredAge} and above.`
                    : `This screening is meant for viewers aged ${requiredAge} and above.`}
                  {' '}Please carry a valid ID or age proof to the venue.
                </p>
                <p className="age-gate-text">
                  If you are denied entry at the door because your age cannot be verified,
                  the booking is not refunded.
                </p>
                {note && <div className="age-gate-note">{note}</div>}
              </div>
            </div>

            <div className="age-gate-movie">
              <span className="age-gate-movie-label">Screening</span>
              <span className="age-gate-movie-title">{movie.title || 'This movie'}</span>
            </div>

            <div className="age-gate-actions">
              <button
                type="button"
                className="age-gate-btn age-gate-btn-secondary"
                onClick={() => onCancel && onCancel()}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                ref={confirmRef}
                className="age-gate-btn age-gate-btn-primary"
                onClick={() => onConfirm && onConfirm()}
              >
                {confirmLabel || `I am ${requiredAge} or older · Continue`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgeGateModal;
