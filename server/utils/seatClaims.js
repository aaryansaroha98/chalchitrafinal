// Seat claims — the single source of truth for "this seat is taken".
//
// Booking used to read the taken seats, then make five more database
// round-trips (movie, user, food cost, coin balance, coin deduction) before
// inserting. Two people confirming the same seats inside that window both
// passed the check and both got a ticket. A unique index on (movie_id, seat)
// moves the decision into the database, where it is atomic.

const db = require('../database');

const parseSeats = (raw) => {
  if (!raw) return [];
  try {
    const seats = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(seats) ? seats.map(String).filter(Boolean) : [];
  } catch (_err) {
    return [];
  }
};

/**
 * Claim every seat in one statement. A single multi-row INSERT is atomic in
 * both Postgres and SQLite, so either this request takes all of the seats or
 * it takes none of them and the unique index rejects it.
 */
const claimSeats = (movieId, seats, userId) => new Promise((resolve) => {
  const list = seats.map(String).filter(Boolean);
  if (!list.length) return resolve({ ok: false, reason: 'no seats' });

  const values = list.map(() => '(?, ?, ?)').join(', ');
  const params = list.flatMap((seat) => [movieId, seat, userId]);
  db.run(`INSERT INTO seat_claims (movie_id, seat, user_id) VALUES ${values}`, params, function (err) {
    if (err) return resolve({ ok: false, reason: 'taken', error: err.message });
    resolve({ ok: true });
  });
});

/** Give the seats back — used on every failure after a successful claim. */
const releaseSeats = (movieId, seats, done = () => {}) => {
  const list = seats.map(String).filter(Boolean);
  if (!list.length) return done();
  const holes = list.map(() => '?').join(', ');
  db.run(
    `DELETE FROM seat_claims WHERE movie_id = ? AND booking_id IS NULL AND seat IN (${holes})`,
    [movieId, ...list],
    () => done()
  );
};

/** Attach the booking once it exists, so the claim is no longer an orphan. */
const attachBooking = (movieId, seats, bookingId, done = () => {}) => {
  const list = seats.map(String).filter(Boolean);
  if (!list.length) return done();
  const holes = list.map(() => '?').join(', ');
  db.run(
    `UPDATE seat_claims SET booking_id = ? WHERE movie_id = ? AND seat IN (${holes})`,
    [bookingId, movieId, ...list],
    () => done()
  );
};

/** Free a deleted booking's seats so they can be sold again. */
const releaseForBooking = (bookingId, done = () => {}) => {
  db.run('DELETE FROM seat_claims WHERE booking_id = ?', [bookingId], () => done());
};

const releaseForMovie = (movieId, done = () => {}) => {
  if (movieId) db.run('DELETE FROM seat_claims WHERE movie_id = ?', [movieId], () => done());
  else db.run('DELETE FROM seat_claims', [], () => done());
};

/**
 * Drop claims that were taken but never became a booking — the request failed
 * after claiming, or the process died mid-flight. Without this a crash would
 * hold a seat out of sale permanently.
 */
const sweepOrphans = (done = () => {}) => {
  db.run(
    `DELETE FROM seat_claims WHERE booking_id IS NULL AND created_at < datetime("now", "-10 minutes")`,
    [],
    () => done()
  );
};

/** Mirror the seats of existing bookings so old bookings stay blocked. */
const backfillFromBookings = (done = () => {}) => {
  db.all('SELECT id, movie_id, selected_seats FROM bookings WHERE selected_seats IS NOT NULL', [], (err, rows) => {
    if (err) {
      console.log('⚠️  Could not backfill seat claims:', err.message);
      return done();
    }

    // Report any seat already held by more than one booking. These predate the
    // unique index, so they have to be found and fixed by hand.
    const holders = new Map();
    const pending = [];
    (rows || []).forEach((row) => {
      parseSeats(row.selected_seats).forEach((seat) => {
        const key = `${row.movie_id}|${seat}`;
        if (!holders.has(key)) holders.set(key, []);
        holders.get(key).push(row.id);
        pending.push([row.movie_id, seat, row.id]);
      });
    });

    const conflicts = [...holders.entries()].filter(([, ids]) => ids.length > 1);
    if (conflicts.length) {
      console.log(`🚨 ${conflicts.length} seat(s) are held by more than one booking:`);
      conflicts.slice(0, 40).forEach(([key, ids]) => {
        const [movieId, seat] = key.split('|');
        console.log(`   movie ${movieId} seat ${seat} -> bookings ${ids.join(', ')}`);
      });
      if (conflicts.length > 40) console.log(`   ...and ${conflicts.length - 40} more`);
    } else {
      console.log('✅ No duplicate seat bookings found');
    }

    if (!pending.length) return done();

    // INSERT OR IGNORE so the first holder of a contested seat wins and the
    // backfill does not fail on pre-existing duplicates. The db layer rewrites
    // this to ON CONFLICT DO NOTHING for Postgres.
    let i = 0;
    const CHUNK = 100;
    const step = () => {
      if (i >= pending.length) {
        console.log(`✅ Seat claims backfilled (${pending.length} seat rows)`);
        return done();
      }
      const slice = pending.slice(i, i + CHUNK);
      i += CHUNK;
      const values = slice.map(() => '(?, ?, ?)').join(', ');
      db.run(
        `INSERT OR IGNORE INTO seat_claims (movie_id, seat, booking_id) VALUES ${values}`,
        slice.flat(),
        (insErr) => {
          if (insErr) console.log('⚠️  Seat claim backfill chunk failed:', insErr.message);
          step();
        }
      );
    };
    step();
  });
};

module.exports = {
  parseSeats,
  claimSeats,
  releaseSeats,
  attachBooking,
  releaseForBooking,
  releaseForMovie,
  sweepOrphans,
  backfillFromBookings,
};
