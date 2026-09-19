import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHorrorTheme } from '../contexts/HorrorThemeContext';

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (_err) {
    return false;
  }
};

/* A weeping willow branch, drawn rather than shipped as an image so it stays
   crisp at any size and costs no request. Tendrils are generated so the two
   corners never look like copies of each other. */
const WillowBranch = ({ seed = 0, className }) => {
  const tendrils = useMemo(() => {
    // Deterministic pseudo-random, so the branch is stable across re-renders.
    let state = seed * 9301 + 49297;
    const rand = () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
    return Array.from({ length: 14 }, (_, i) => {
      const x = 12 + i * 20 + rand() * 10;
      const length = 60 + rand() * 150;
      const bow = 14 + rand() * 26;
      return {
        d: `M ${x} ${18 + rand() * 26} q ${bow} ${length * 0.5} ${bow * 0.3} ${length}`,
        width: 1 + rand() * 1.6,
        leaves: Array.from({ length: 3 + Math.floor(rand() * 4) }, () => rand()),
        x,
        length,
        bow,
      };
    });
  }, [seed]);

  return (
    <svg className={className} viewBox="0 0 300 240" fill="none" aria-hidden="true" focusable="false">
      {/* the bough */}
      <path d="M -10 14 q 120 26 320 4" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
      {tendrils.map((t, i) => (
        <g key={i}>
          <path d={t.d} stroke="currentColor" strokeWidth={t.width} strokeLinecap="round" />
          {t.leaves.map((p, j) => (
            <ellipse
              key={j}
              cx={t.x + t.bow * (0.3 + 0.7 * p)}
              cy={20 + t.length * p}
              rx="2.4"
              ry="5.6"
              fill="currentColor"
              transform={`rotate(${-20 + p * 40} ${t.x + t.bow * (0.3 + 0.7 * p)} ${20 + t.length * p})`}
            />
          ))}
        </g>
      ))}
    </svg>
  );
};

/* The wishing stick itself — forked, gnarled, bound with twine. */
const WishingStick = () => (
  <svg className="h-scare-figure" viewBox="0 0 220 320" fill="none" aria-hidden="true" focusable="false">
    <path
      d="M110 318 L104 236 Q100 196 86 168 Q70 136 44 108 Q28 90 18 62"
      stroke="currentColor" strokeWidth="11" strokeLinecap="round"
    />
    <path
      d="M104 236 Q112 194 132 166 Q154 134 178 112 Q194 96 202 70"
      stroke="currentColor" strokeWidth="9" strokeLinecap="round"
    />
    <path d="M96 196 Q76 182 58 180" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    <path d="M122 186 Q142 170 160 168" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    <path d="M104 262 Q88 254 76 244" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    {/* twine binding the fork */}
    {[0, 1, 2, 3, 4].map((i) => (
      <path
        key={i}
        d={`M${92 - i} ${226 + i * 9} q 14 ${-4 - i} 26 ${1 + i}`}
        stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity={0.85}
      />
    ))}
  </svg>
);

/* A short, sharp stinger built in the browser. Shipping an mp3 for one
   moment is not worth the payload, and this cannot 404. */
const playStinger = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    // Autoplay policy: without a prior gesture this stays suspended and the
    // scare simply plays silent, which is the acceptable failure.
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.5, now + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    master.connect(ctx.destination);

    // noise burst — the hit
    const frames = Math.floor(ctx.sampleRate * 0.9);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2.2;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1500, now);
    bandpass.frequency.exponentialRampToValueAtTime(180, now + 0.85);
    noise.connect(bandpass).connect(master);
    noise.start(now);

    // descending tone underneath — the drop
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 1.0);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.32, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
    osc.connect(oscGain).connect(master);
    osc.start(now);
    osc.stop(now + 1.15);

    window.setTimeout(() => ctx.close().catch(() => {}), 1600);
  } catch (_err) {
    /* no sound is fine; the visual carries it */
  }
};

const SCARE_SESSION_KEY = 'chalchitra-willow-seen';

const HorrorAtmosphere = () => {
  const { enabled } = useHorrorTheme();
  const [scaring, setScaring] = useState(false);
  const lanternRef = useRef(null);
  const reduced = useMemo(prefersReducedMotion, []);

  // Lantern follows the pointer via custom properties, written on an rAF so a
  // fast mouse cannot queue up a paint per event.
  useEffect(() => {
    if (!enabled || reduced) return undefined;
    let frame = 0;
    let pending = null;
    const onMove = (event) => {
      pending = event;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const node = lanternRef.current;
        if (!node || !pending) return;
        node.style.setProperty('--h-mx', `${pending.clientX}px`);
        node.style.setProperty('--h-my', `${pending.clientY}px`);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [enabled, reduced]);

  // The scare: once per browser session, on the seat-selection screen, and
  // never for anyone who asked their system for reduced motion.
  useEffect(() => {
    if (!enabled || reduced) return undefined;
    if (!/^\/booking\//.test(window.location.pathname)) return undefined;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SCARE_SESSION_KEY) === '1';
    } catch (_err) {
      seen = false;
    }
    if (seen) return undefined;

    const start = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SCARE_SESSION_KEY, '1');
      } catch (_err) { /* still only fires once per mount */ }
      setScaring(true);
      playStinger();
    }, 2600);
    return () => window.clearTimeout(start);
  }, [enabled, reduced]);

  useEffect(() => {
    if (!scaring) return undefined;
    const end = window.setTimeout(() => setScaring(false), 900);
    return () => window.clearTimeout(end);
  }, [scaring]);

  if (!enabled) return null;

  return (
    <>
      <div className="h-atmos" aria-hidden="true">
        <div className="h-vignette" />
        <div className="h-fog h-fog-low" />
        <div className="h-fog h-fog-high" />
        <WillowBranch seed={3} className="h-willow-branch h-willow-left" />
        <WillowBranch seed={11} className="h-willow-branch h-willow-right" />
        {!reduced && <div className="h-lantern" ref={lanternRef} />}
        <div className="h-grain" />
      </div>
      {scaring && (
        <div className="h-scare" aria-hidden="true">
          <WishingStick />
        </div>
      )}
    </>
  );
};

export default HorrorAtmosphere;
