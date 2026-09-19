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

/* ---- the things that move ---------------------------------------- */

const rand = (min, max) => min + Math.random() * (max - min);

/* Leaves come off the branches and never stop. Mounted once; the drift,
   spin, size and delay are per-leaf custom properties so sixteen elements
   never fall in step with each other. */
const WillowLeaves = () => {
  const leaves = useMemo(
    () => Array.from({ length: 16 }, (_, i) => ({
      key: i,
      '--h-leaf-x': `${rand(-4, 102).toFixed(1)}%`,
      '--h-leaf-size': `${rand(7, 14).toFixed(1)}px`,
      '--h-leaf-dur': `${rand(11, 22).toFixed(1)}s`,
      '--h-leaf-delay': `${rand(-20, 0).toFixed(1)}s`,
      '--h-leaf-drift': `${rand(-170, 170).toFixed(0)}px`,
      '--h-leaf-spin': `${rand(-900, 900).toFixed(0)}deg`,
    })),
    []
  );
  return leaves.map(({ key, ...style }) => <i key={key} className="h-leaf" style={style} />);
};

/* Not round, not bright: narrow and hooded, a dim sickly iris with a heavy
   lid over it. Round whites with a catchlight read as a cartoon. */
const Eyes = ({ x, y }) => (
  <svg className="h-eyes" style={{ '--h-eye-x': x, '--h-eye-y': y }}
       viewBox="0 0 92 26" fill="none" aria-hidden="true">
    <defs>
      <radialGradient id="h-iris" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stopColor="#cbb377" />
        <stop offset="62%" stopColor="#8e7b45" />
        <stop offset="100%" stopColor="#3a3220" />
      </radialGradient>
    </defs>
    {[20, 72].map((cx) => (
      <g key={cx}>
        {/* socket */}
        <path d={`M${cx - 20} 13 Q${cx} 2 ${cx + 20} 13 Q${cx} 24 ${cx - 20} 13 Z`} fill="#07070b" />
        <g className="h-pupil" style={{ transformOrigin: `${cx}px 13px` }}>
          <path d={`M${cx - 17} 13 Q${cx} 4.5 ${cx + 17} 13 Q${cx} 21.5 ${cx - 17} 13 Z`} fill="url(#h-iris)" />
          {/* vertical slit, like something that hunts */}
          <ellipse cx={cx} cy="13" rx="2.1" ry="6.2" fill="#0a0203" />
        </g>
        {/* heavy lid, cast over the top third */}
        <path d={`M${cx - 20} 13 Q${cx} 2 ${cx + 20} 13 Q${cx} 8 ${cx - 20} 13 Z`} fill="#05050a" opacity="0.85" />
      </g>
    ))}
  </svg>
);

/* A gnarled hand — long fingers, knuckles, no palm detail. Reads as a
   silhouette at any size, which is all it ever is. */
const Hand = ({ delay, tilt }) => (
  <svg className="h-hand" style={{ '--h-hand-delay': delay, '--h-hand-tilt': tilt }}
       viewBox="0 0 100 190" fill="none" aria-hidden="true">
    <path d="M30 190 Q26 140 30 112 Q34 92 46 84 Q60 76 70 84 Q80 92 82 112 Q86 142 82 190 Z" fill="currentColor" />
    {[[34, 78, -10], [48, 56, -4], [62, 52, 3], [74, 70, 11]].map(([x, len, rot], i) => (
      <g key={i} transform={`rotate(${rot} ${x} 96)`}>
        <rect x={x - 6} y={96 - len} width="12.5" height={len + 16} rx="6" fill="currentColor" />
        <circle cx={x} cy={96 - len} r="6.2" fill="currentColor" />
      </g>
    ))}
    <g transform="rotate(-38 28 122)">
      <rect x="20" y="82" width="12" height="52" rx="6" fill="currentColor" />
      <circle cx="26" cy="84" r="6" fill="currentColor" />
    </g>
  </svg>
);

const Passerby = () => (
  <svg className="h-passerby" viewBox="0 0 150 400" fill="none" aria-hidden="true">
    <ellipse cx="75" cy="44" rx="27" ry="32" fill="currentColor" />
    <path d="M75 72 Q40 86 34 150 Q30 212 40 300 L52 400 L98 400 L110 300 Q120 212 116 150 Q110 86 75 72 Z" fill="currentColor" />
    <path d="M40 120 Q18 176 24 246" stroke="currentColor" strokeWidth="17" strokeLinecap="round" />
    <path d="M110 120 Q132 176 126 246" stroke="currentColor" strokeWidth="17" strokeLinecap="round" />
  </svg>
);

/* Three gashes, each a slightly different thickness, angle and height so
   they read as one swipe of a hand rather than three parallel rules. */
const CLAWS = [
  { top: '26%', h: '7px', rot: '-14deg', delay: '0ms' },
  { top: '38%', h: '10px', rot: '-12deg', delay: '80ms' },
  { top: '51%', h: '6px', rot: '-15.5deg', delay: '150ms' },
];

const Claw = () => (
  <div className="h-claw" aria-hidden="true">
    {CLAWS.map((c, i) => (
      <span key={i} style={{
        '--h-claw-top': c.top, '--h-claw-h': c.h,
        '--h-claw-rot': c.rot, '--h-claw-delay': c.delay,
      }} />
    ))}
  </div>
);

const WHISPERS = [
  'make a wish',
  'one wish',
  'it is listening',
  'say it out loud',
  'the willow remembers',
  'something answered',
  'you already asked',
];

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

/* Each event: how long it stays up, and the gap before the next one of its
   kind. Independent timers rather than one queue, so the page gets an
   irregular rhythm instead of a metronome — but `cooldown` keeps any two
   heavy events from landing together. */
const EVENTS = {
  eyes:     { life: 4400, gap: [11000, 24000] },
  whisper:  { life: 5400, gap: [9000,  19000] },
  hands:    { life: 5200, gap: [21000, 42000] },
  claw:     { life: 1600, gap: [26000, 55000] },
  passerby: { life: 7500, gap: [34000, 70000] },
  shudder:  { life: 460,  gap: [24000, 52000] },
};

const HorrorAtmosphere = () => {
  const { enabled } = useHorrorTheme();
  const [scaring, setScaring] = useState(false);
  const [events, setEvents] = useState({});
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

  // Event scheduler. Every timer is tracked and cleared on unmount, and each
  // event re-arms only after it has finished, so nothing can pile up.
  useEffect(() => {
    if (!enabled || reduced) return undefined;
    const timers = new Set();
    let stopped = false;
    const busyUntil = { at: 0 };

    const after = (ms, fn) => {
      const id = window.setTimeout(() => { timers.delete(id); if (!stopped) fn(); }, ms);
      timers.add(id);
      return id;
    };

    Object.entries(EVENTS).forEach(([name, cfg]) => {
      const arm = (delay) => after(delay, () => {
        const now = Date.now();
        // something heavy is already on screen — wait it out rather than stack
        if (now < busyUntil.at) { arm(1500); return; }
        busyUntil.at = now + cfg.life;

        // a key on each mount restarts the CSS animation from the top
        setEvents((prev) => ({ ...prev, [name]: { id: now, seed: Math.random() } }));
        after(cfg.life, () => {
          setEvents((prev) => { const next = { ...prev }; delete next[name]; return next; });
          arm(rand(...cfg.gap));
        });
      });
      arm(rand(2500, cfg.gap[1]));
    });

    return () => {
      stopped = true;
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
    };
  }, [enabled, reduced]);

  // The shudder moves the page itself, so it is driven by an attribute on
  // <html> and never runs while someone is picking seats — a 5px jolt
  // mid-tap is a wrong seat, not a scare.
  useEffect(() => {
    const root = document.documentElement;
    const onSeatPage = /^\/booking\//.test(window.location.pathname);
    if (events.shudder && !onSeatPage) {
      root.setAttribute('data-horror-shudder', '1');
    } else {
      root.removeAttribute('data-horror-shudder');
    }
    return () => root.removeAttribute('data-horror-shudder');
  }, [events.shudder]);

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
        {!reduced && <WillowLeaves />}

        {events.eyes && (
          <Eyes
            key={events.eyes.id}
            x={`${(8 + events.eyes.seed * 78).toFixed(1)}%`}
            y={`${(14 + ((events.eyes.seed * 7) % 1) * 62).toFixed(1)}%`}
          />
        )}

        {events.whisper && (
          <div
            key={events.whisper.id}
            className="h-whisper"
            style={{
              '--h-wh-x': `${(6 + events.whisper.seed * 52).toFixed(1)}%`,
              '--h-wh-y': `${(18 + ((events.whisper.seed * 13) % 1) * 62).toFixed(1)}%`,
            }}
          >
            {WHISPERS[Math.floor(events.whisper.seed * WHISPERS.length) % WHISPERS.length]}
          </div>
        )}

        {events.hands && (
          <div className="h-hands" key={events.hands.id}>
            {Array.from({ length: 5 }, (_, i) => (
              <Hand key={i} delay={`${(i * 190 + events.hands.seed * 260).toFixed(0)}ms`}
                    tilt={`${(-14 + i * 7).toFixed(0)}deg`} />
            ))}
          </div>
        )}

        {events.claw && <Claw key={events.claw.id} />}
        {events.passerby && <Passerby key={events.passerby.id} />}

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
