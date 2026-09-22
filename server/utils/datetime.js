// Screening datetimes are authored in IIT Jammu local time (IST) via
// datetime-local inputs. Attach the offset explicitly so the production
// server's own timezone cannot shift a screening by 5.5 hours.

const parseAppDateTime = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const raw = String(value).trim();
  const localDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;
  const parsed = new Date(localDateTime.test(raw) ? `${raw}+05:30` : raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeAppDateTime = (value) => {
  const parsed = parseAppDateTime(value);
  return parsed ? parsed.toISOString() : null;
};

// The screening date is the source of truth. `is_upcoming` is only written at
// create/edit time, so it goes stale the moment a screening passes — it is a
// fallback for rows whose date cannot be parsed, never the primary answer.
const isUpcomingDate = (date, isUpcomingFlag, now = new Date()) => {
  const parsed = parseAppDateTime(date);
  if (parsed) return parsed >= now;
  return Number(isUpcomingFlag) === 1;
};

const APP_TIME_ZONE = 'Asia/Kolkata';

// Every screening time the server prints — emails, generated PDFs, exports —
// has to be read and written in IIT Jammu time.
//
// Both halves matter. A stored value may be naive ("2026-10-31T21:00", meaning
// 9pm IST) or absolute ("2026-10-31T15:30:00.000Z", the same moment), and the
// admin panel has written both over time. parseAppDateTime resolves either to
// the right instant; without timeZone below, Node then formats that instant in
// the server's own zone, which on Render is UTC — so a 9pm screening went out
// in email as 3:30pm.
const formatAppDate = (value, { weekday = false } = {}) => {
  const parsed = parseAppDateTime(value);
  if (!parsed) return 'N/A';
  return parsed.toLocaleDateString('en-IN', {
    timeZone: APP_TIME_ZONE,
    ...(weekday ? { weekday: 'long' } : {}),
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatAppTime = (value) => {
  const parsed = parseAppDateTime(value);
  if (!parsed) return 'N/A';
  return parsed.toLocaleTimeString('en-IN', {
    timeZone: APP_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatAppDateTime = (value) => {
  const parsed = parseAppDateTime(value);
  if (!parsed) return 'N/A';
  return parsed.toLocaleString('en-IN', {
    timeZone: APP_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

// For "generated on" stamps, which are a real instant rather than a stored one.
const formatAppNow = (now = new Date()) => now.toLocaleString('en-IN', {
  timeZone: APP_TIME_ZONE,
  dateStyle: 'medium',
  timeStyle: 'short',
});

module.exports = {
  parseAppDateTime,
  normalizeAppDateTime,
  isUpcomingDate,
  APP_TIME_ZONE,
  formatAppDate,
  formatAppTime,
  formatAppDateTime,
  formatAppNow,
};
