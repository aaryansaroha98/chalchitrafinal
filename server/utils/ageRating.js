// Age certification for a screening.
//
// One vocabulary, shared by the admin form, the booking gate and the API.
// The client mirrors this file at client/src/utils/ageRating.js — keep the
// codes in both places identical, they travel over the wire.

const AGE_RATINGS = [
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

const DEFAULT_AGE_RATING = 'U';
// A gate switched on for an unrated screening still has to name an age.
const FALLBACK_GATE_AGE = 18;

const AGE_RATING_CODES = AGE_RATINGS.map((rating) => rating.code);

// Accepts the stored code, the badge text, or loose admin input ("18+", "u/a 13+").
const normalizeAgeRating = (value) => {
  if (value === null || value === undefined) return DEFAULT_AGE_RATING;
  const raw = String(value).trim().toUpperCase().replace(/[\s/_-]/g, '');
  if (!raw) return DEFAULT_AGE_RATING;
  if (raw === '18+' || raw === '18') return 'A';
  const match = AGE_RATINGS.find((rating) =>
    rating.code === raw || rating.badge.toUpperCase().replace(/[\s/_-]/g, '') === raw
  );
  return match ? match.code : DEFAULT_AGE_RATING;
};

const getAgeRating = (value) => {
  const code = normalizeAgeRating(value);
  return AGE_RATINGS.find((rating) => rating.code === code) || AGE_RATINGS[0];
};

const isTruthyFlag = (value) =>
  value === 1 || value === true || value === '1' || value === 'true' || value === 'on' || value === 'yes';

// The gate is on when the certificate demands it, or when an admin asked for it.
const requiresAgeGate = (movie) => {
  if (!movie) return false;
  const rating = getAgeRating(movie.age_rating);
  return rating.alwaysGated || isTruthyFlag(movie.age_gate_enabled);
};

const getRequiredAge = (movie) => {
  if (!requiresAgeGate(movie)) return 0;
  const rating = getAgeRating(movie && movie.age_rating);
  return rating.minAge > 0 ? rating.minAge : FALLBACK_GATE_AGE;
};

module.exports = {
  AGE_RATINGS,
  AGE_RATING_CODES,
  DEFAULT_AGE_RATING,
  FALLBACK_GATE_AGE,
  normalizeAgeRating,
  getAgeRating,
  requiresAgeGate,
  getRequiredAge,
  isTruthyFlag
};
