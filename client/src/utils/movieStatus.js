export const APP_TIME_ZONE = 'Asia/Kolkata';

const normalizeMovieDateInput = (movieDate) => {
  if (movieDate instanceof Date) return movieDate;
  if (movieDate === null || movieDate === undefined) return null;
  const raw = String(movieDate).trim();
  if (!raw) return null;
  if (raw.includes('T')) return raw;
  return raw + 'T00:00:00';
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

export const formatAppDateTime = (value) => {
  const parsed = parseMovieDate(value);
  if (!parsed) return '';
  return parsed.toLocaleString('en-IN', {
    timeZone: APP_TIME_ZONE,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const toAppDateTimeLocal = (value) => {
  const parsed = parseMovieDate(value);
  if (!parsed) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(parsed).reduce((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export const appDateTimeLocalToIso = (value) => {
  if (!value) return '';
  const raw = String(value).trim();
  const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const parsed = new Date(hasOffset ? raw : `${raw}:00+05:30`);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
};

export const getBookingAvailability = (movie, now = new Date()) => {
  if (!movie) return { status: 'unavailable' };
  if (Number(movie.booking_stopped) === 1 || movie.booking_stopped === true) {
    return { status: 'closed' };
  }

  const bookingStart = parseMovieDate(movie.booking_starts_at);
  if (bookingStart && bookingStart > now) {
    return { status: 'not_open', bookingStart };
  }

  const screeningTime = parseMovieDate(movie.date);
  if (screeningTime && screeningTime <= now) {
    return { status: 'closed' };
  }

  return { status: 'open' };
};

export const isMovieBookingOpen = (movie, now = new Date()) =>
  getBookingAvailability(movie, now).status === 'open';

export const compareMovieDatesDesc = (a, b) =>
  getMovieTimestamp(b?.date, Number.MIN_SAFE_INTEGER) -
  getMovieTimestamp(a?.date, Number.MIN_SAFE_INTEGER);
