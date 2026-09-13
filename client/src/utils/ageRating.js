// Age certification for a screening — client mirror of server/utils/ageRating.js.
// The codes travel over the wire, so keep the two files in step.

export const AGE_RATINGS = [
  {
    code: 'U',
    badge: 'U',
    label: 'U — Universal',
    audience: 'Suitable for everyone',
    minAge: 0,
    alwaysGated: false
  },
  {
    code: 'UA7',
    badge: 'U/A 7+',
    label: 'U/A 7+ — Parental guidance',
    audience: 'Viewers below 7 need a guardian',
    minAge: 7,
    alwaysGated: false
  },
  {
    code: 'UA13',
    badge: 'U/A 13+',
    label: 'U/A 13+ — Parental guidance',
    audience: 'Viewers below 13 need a guardian',
    minAge: 13,
    alwaysGated: false
  },
  {
    code: 'UA16',
    badge: 'U/A 16+',
    label: 'U/A 16+ — Parental guidance',
    audience: 'Viewers below 16 need a guardian',
    minAge: 16,
    alwaysGated: false
  },
  {
    code: 'A',
    badge: 'A',
    label: 'A — Adults only',
    audience: 'Only viewers aged 18 and above',
    minAge: 18,
    alwaysGated: true
  }
];

export const DEFAULT_AGE_RATING = 'U';
// A gate switched on for an unrated screening still has to name an age.
export const FALLBACK_GATE_AGE = 18;

export const normalizeAgeRating = (value) => {
  if (value === null || value === undefined) return DEFAULT_AGE_RATING;
  const raw = String(value).trim().toUpperCase().replace(/[\s/_-]/g, '');
  if (!raw) return DEFAULT_AGE_RATING;
  if (raw === '18+' || raw === '18') return 'A';
  const match = AGE_RATINGS.find((rating) =>
    rating.code === raw || rating.badge.toUpperCase().replace(/[\s/_-]/g, '') === raw
  );
  return match ? match.code : DEFAULT_AGE_RATING;
};

export const getAgeRating = (value) => {
  const code = normalizeAgeRating(value);
  return AGE_RATINGS.find((rating) => rating.code === code) || AGE_RATINGS[0];
};

const isTruthyFlag = (value) =>
  value === 1 || value === true || value === '1' || value === 'true' || value === 'on' || value === 'yes';

// The gate is on when the certificate demands it, or when an admin asked for it.
export const requiresAgeGate = (movie) => {
  if (!movie) return false;
  const rating = getAgeRating(movie.age_rating);
  return rating.alwaysGated || isTruthyFlag(movie.age_gate_enabled);
};

export const getRequiredAge = (movie) => {
  if (!requiresAgeGate(movie)) return 0;
  const rating = getAgeRating(movie && movie.age_rating);
  return rating.minAge > 0 ? rating.minAge : FALLBACK_GATE_AGE;
};

// Show the certificate chip whenever it says something — 'U' is the silent default.
export const hasVisibleAgeRating = (movie) =>
  !!movie && normalizeAgeRating(movie.age_rating) !== DEFAULT_AGE_RATING;

// ---------------------------------------------------------------------------
// Remembering a confirmation.
//
// Scoped to the browsing session and to one movie: a viewer who confirms on the
// home page is not asked again on the booking page or at payment, but a new tab
// tomorrow starts clean. Storage can throw (private windows, blocked site data),
// so every access is guarded and failure just means "ask again".
// ---------------------------------------------------------------------------

const ACK_STORAGE_KEY = 'chalchitra-age-ack';

const readAcks = () => {
  try {
    const raw = window.sessionStorage.getItem(ACK_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (err) {
    return [];
  }
};

export const hasAgeAck = (movieId) => {
  if (movieId === null || movieId === undefined) return false;
  return readAcks().includes(String(movieId));
};

export const rememberAgeAck = (movieId) => {
  if (movieId === null || movieId === undefined) return;
  try {
    const acks = readAcks();
    const key = String(movieId);
    if (!acks.includes(key)) acks.push(key);
    window.sessionStorage.setItem(ACK_STORAGE_KEY, JSON.stringify(acks));
  } catch (err) {
    // No storage: the viewer simply gets asked again at the next step.
  }
};

export const clearAgeAck = (movieId) => {
  try {
    if (movieId === null || movieId === undefined) {
      window.sessionStorage.removeItem(ACK_STORAGE_KEY);
      return;
    }
    const key = String(movieId);
    window.sessionStorage.setItem(ACK_STORAGE_KEY, JSON.stringify(readAcks().filter((id) => id !== key)));
  } catch (err) {
    // Nothing to clear.
  }
};

// True when this viewer still has to pass the gate for this movie.
export const needsAgeConfirmation = (movie) =>
  requiresAgeGate(movie) && !hasAgeAck(movie && movie.id);
