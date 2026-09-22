import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import CoinIcon from './CoinIcon';

/**
 * "Aaryan Saroha sent you 500 coins."
 *
 * An admin grant is recorded with the sender's name and no announced_at. The
 * first time the recipient opens the site after that, this tells them once and
 * marks it told, so it never greets them a second time. Several gifts sent
 * before they next visit are shown one after another rather than collapsed,
 * because each one came from someone.
 */
const CoinGiftModal = () => {
  const { isAuthenticated, user, fetchCoinBalance } = useAuth();
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const askedFor = useRef(null);
  const dismissRef = useRef(null);

  // Ask once per signed-in user, after auth has settled.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    if (askedFor.current === user.id) return;
    askedFor.current = user.id;

    let cancelled = false;
    api.get('/api/coins/announcements')
      .then((res) => {
        const list = Array.isArray(res.data?.announcements) ? res.data.announcements : [];
        if (!cancelled && list.length) {
          setQueue(list);
          setIndex(0);
        }
      })
      .catch(() => { /* a missed greeting must never break the page */ });

    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  const current = queue[index] || null;

  const close = useCallback(() => {
    const shown = queue[index];
    setIndex((i) => i + 1);

    if (!shown) return;
    // Told once: close it out server-side, then refresh the header balance so
    // the new total is visible the moment the sheet goes.
    api.post('/api/coins/announcements/seen', { ids: [shown.id] })
      .then(() => { if (fetchCoinBalance) fetchCoinBalance(); })
      .catch(() => { /* it will simply be offered again next visit */ });
  }, [queue, index, fetchCoinBalance]);

  useEffect(() => {
    if (!current) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [current, close]);

  useEffect(() => {
    if (!current) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [current]);

  useEffect(() => {
    if (!current) return undefined;
    const t = setTimeout(() => dismissRef.current && dismissRef.current.focus(), 60);
    return () => clearTimeout(t);
  }, [current]);

  const remaining = queue.length - index - 1;

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          className="coin-gift-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={close}
        >
          <motion.div
            className="coin-gift-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coin-gift-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="coin-gift-head">
              <span className="coin-gift-kicker">Coins received</span>
              <button type="button" className="coin-gift-close" onClick={close} aria-label="Close">×</button>
            </div>

            <div className="coin-gift-body">
              <motion.div
                className="coin-gift-mark"
                aria-hidden="true"
                initial={{ scale: 0.6, rotate: -18, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ delay: 0.06, duration: 0.42, ease: [0.2, 0.9, 0.2, 1] }}
              >
                <CoinIcon size={54} />
              </motion.div>

              <h2 id="coin-gift-title" className="coin-gift-title">
                {current.from} sent you{' '}
                <span className="coin-gift-amount">
                  {current.amount.toLocaleString('en-IN')}
                </span>{' '}
                {current.amount === 1 ? 'coin' : 'coins'}
              </h2>

              {current.message ? (
                <blockquote className="coin-gift-message">
                  {current.message}
                </blockquote>
              ) : null}

              <p className="coin-gift-text">
                They are already in your balance and can be spent on any screening.
              </p>
            </div>

            <div className="coin-gift-foot">
              <button type="button" className="btn btn-primary coin-gift-action" ref={dismissRef} onClick={close}>
                {remaining > 0 ? `Next (${remaining} more)` : 'Thanks'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CoinGiftModal;
