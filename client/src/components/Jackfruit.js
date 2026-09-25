import React, { useEffect, useMemo, useState } from 'react';
import '../jackfruit.css';

/* Everything for the Kathal run is drawn inline: no asset to ship, nothing
   that can 404, and the fruit scales cleanly at 14px or 96px. */

// The animation belongs to one film. Matching the title means it appears
// while that film is being booked and disappears for the next one on its own.
export const isJackfruitMovie = (title) => /kathal|jackfruit|कटहल/i.test(String(title || ''));

const rand = (lo, hi) => lo + Math.random() * (hi - lo);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* One set of symbols per layer; every fruit and piece is a <use> of these. */
const JackfruitDefs = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="jf-skin" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#d6e05c" />
        <stop offset="55%" stopColor="#8fb83a" />
        <stop offset="100%" stopColor="#4f8420" />
      </linearGradient>
      <pattern id="jf-bumps" width="9" height="9" patternUnits="userSpaceOnUse">
        <circle cx="4.5" cy="4.5" r="2.4" fill="#35601a" opacity="0.5" />
        <circle cx="4.5" cy="4.5" r="1" fill="#e4ec7a" opacity="0.35" />
      </pattern>
      {/* the whole fruit: stem, bumpy green body, a soft highlight */}
      <symbol id="jf-fruit" viewBox="0 0 64 80">
        <path d="M29 0 q3 -1 6 0 l2 10 h-10 z" fill="#6e4a20" />
        <path d="M32 8 C50 8 60 26 60 46 C60 66 48 79 32 79 C16 79 4 66 4 46 C4 26 14 8 32 8 Z"
              fill="url(#jf-skin)" stroke="#456f1a" strokeWidth="2" />
        <path d="M32 8 C50 8 60 26 60 46 C60 66 48 79 32 79 C16 79 4 66 4 46 C4 26 14 8 32 8 Z"
              fill="url(#jf-bumps)" />
        <ellipse cx="22" cy="30" rx="6" ry="11" fill="#ffffff" opacity="0.16" />
      </symbol>
      {/* what it bursts into: golden bulbs, rind chunks, brown seeds */}
      <symbol id="jf-bulb" viewBox="0 0 24 24">
        <path d="M12 2 C19 2 22 8 22 13 C22 19 17 22 12 22 C7 22 2 19 2 13 C2 8 5 2 12 2 Z"
              fill="#f4b731" stroke="#d48f12" strokeWidth="1.5" />
        <ellipse cx="12" cy="13" rx="3.5" ry="5" fill="#c88b25" opacity="0.55" />
      </symbol>
      <symbol id="jf-rind" viewBox="0 0 24 24">
        <path d="M3 4 L21 2 L22 16 L10 22 L2 16 Z" fill="url(#jf-skin)" stroke="#456f1a" strokeWidth="1.5" />
        <path d="M3 4 L21 2 L22 16 L10 22 L2 16 Z" fill="url(#jf-bumps)" />
      </symbol>
      <symbol id="jf-seed" viewBox="0 0 24 24">
        <ellipse cx="12" cy="12" rx="6" ry="9" fill="#8a5a2b" stroke="#5e3a16" strokeWidth="1.5" />
      </symbol>
    </defs>
  </svg>
);

/* Booking page: small jackfruits drifting down, each on its own path. */
export const JackfruitRain = ({ count = 16 }) => {
  const [reduced] = useState(prefersReducedMotion);
  const fruits = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      key: i,
      style: {
        '--jf-x': `${rand(-3, 101).toFixed(1)}%`,
        '--jf-size': `${rand(18, 34).toFixed(1)}px`,
        '--jf-dur': `${rand(9, 18).toFixed(1)}s`,
        '--jf-delay': `${rand(-18, 0).toFixed(1)}s`,
        '--jf-drift': `${rand(-140, 140).toFixed(0)}px`,
        '--jf-spin': `${rand(-260, 260).toFixed(0)}deg`,
      },
    })),
    [count]
  );

  if (reduced) return null;

  return (
    <div className="jf-rain" aria-hidden="true">
      <JackfruitDefs />
      {fruits.map(({ key, style }) => (
        <svg key={key} className="jf-fruit" style={style} viewBox="0 0 64 80">
          <use href="#jf-fruit" />
        </svg>
      ))}
    </div>
  );
};

/* Payment success: one jackfruit drops onto the confirmation mark and bursts.
   targetRef is the element it lands on; onLanded fires at the moment of
   impact so the page can reveal what was underneath. */
const FALL_MS = 1050;
const BURST_MS = 1400;
const PIECE_KINDS = ['jf-bulb', 'jf-bulb', 'jf-bulb', 'jf-rind', 'jf-rind', 'jf-seed'];

export const JackfruitBurst = ({ targetRef, onLanded }) => {
  const [phase, setPhase] = useState('idle'); // idle | falling | burst | done
  const [target, setTarget] = useState(null);

  const pieces = useMemo(
    () => Array.from({ length: 26 }, (_, i) => {
      const angle = rand(0, Math.PI * 2);
      const dist = rand(70, 250);
      return {
        key: i,
        kind: PIECE_KINDS[i % PIECE_KINDS.length],
        style: {
          '--jf-dx': `${(Math.cos(angle) * dist).toFixed(0)}px`,
          '--jf-dy': `${(Math.sin(angle) * dist * 0.8 - 40).toFixed(0)}px`,
          '--jf-rot': `${rand(-420, 420).toFixed(0)}deg`,
          '--jf-ps': `${rand(12, 26).toFixed(0)}px`,
          '--jf-pd': `${rand(0, 90).toFixed(0)}ms`,
        },
      };
    }),
    []
  );

  useEffect(() => {
    if (prefersReducedMotion()) {
      setPhase('done');
      if (onLanded) onLanded();
      return undefined;
    }
    const measure = () => {
      const el = targetRef && targetRef.current;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      setTarget({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      return true;
    };
    const timers = [];
    timers.push(setTimeout(() => {
      if (!measure()) {
        // nothing to land on: just show the page
        setPhase('done');
        if (onLanded) onLanded();
        return;
      }
      setPhase('falling');
      timers.push(setTimeout(() => {
        measure();
        setPhase('burst');
        if (onLanded) onLanded();
        timers.push(setTimeout(() => setPhase('done'), BURST_MS));
      }, FALL_MS));
    }, 250));
    window.addEventListener('resize', measure);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', measure);
    };
    // runs once per mount by design
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'idle' || phase === 'done' || !target) return null;

  const at = { '--jf-x': `${target.x.toFixed(0)}px`, '--jf-y': `${target.y.toFixed(0)}px` };

  return (
    <div className="jf-burst" aria-hidden="true">
      <JackfruitDefs />
      {phase === 'falling' && (
        <svg className="jf-drop" style={at} viewBox="0 0 64 80">
          <use href="#jf-fruit" />
        </svg>
      )}
      {phase === 'burst' && (
        <>
          <span className="jf-puff" style={at} />
          <span className="jf-splat" style={at} />
          {pieces.map(({ key, kind, style }) => (
            <svg key={key} className="jf-piece" style={{ ...at, ...style }} viewBox="0 0 24 24">
              <use href={`#${kind}`} />
            </svg>
          ))}
        </>
      )}
    </div>
  );
};
