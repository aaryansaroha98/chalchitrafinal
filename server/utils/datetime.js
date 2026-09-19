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

module.exports = { parseAppDateTime, normalizeAppDateTime, isUpcomingDate };
