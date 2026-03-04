const normalizeMovieDateInput = (movieDate) => {
  if (movieDate instanceof Date) return movieDate;
  if (movieDate === null || movieDate === undefined) return null;
  const raw = String(movieDate).trim();
  if (!raw) return null;
  if (raw.includes('T')) return raw;
  return raw.replace(' ', 'T');
};

export const parseMovieDate = (movieDate) => {
  const normalized = normalizeMovieDateInput(movieDate);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export const getMovieTimestamp = (movieDate, fallbackValue = null) => {
  const parsed = parseMovieDate(movieDate);
  if (!parsed) return fallbackValue;
  return parsed.getTime();
};

export const getMovieStatus = (movieDate, now = new Date()) => {
  const parsed = parseMovieDate(movieDate);
  if (!parsed) return 'Unknown';
  return parsed >= now ? 'Upcoming' : 'Past';
};

export const isUpcomingMovie = (movieDate, now = new Date()) =>
  getMovieStatus(movieDate, now) === 'Upcoming';

export const isPastMovie = (movieDate, now = new Date()) =>
  getMovieStatus(movieDate, now) === 'Past';

export const compareMovieDatesAsc = (a, b) =>
  getMovieTimestamp(a?.date, Number.MAX_SAFE_INTEGER) -
  getMovieTimestamp(b?.date, Number.MAX_SAFE_INTEGER);

export const compareMovieDatesDesc = (a, b) =>
  getMovieTimestamp(b?.date, Number.MIN_SAFE_INTEGER) -
  getMovieTimestamp(a?.date, Number.MIN_SAFE_INTEGER);
