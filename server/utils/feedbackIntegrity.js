// One review per person per movie.
//
// The submit route simply inserted, with no check of any kind, so a
// double-click, a refresh, or reopening the form all added another row. This
// removes the rows that are already duplicated and puts a unique index on
// (user_id, movie_id) so the database — not the route — is what guarantees it.

const db = require('../database');

/**
 * Keep the most recent review for each person-and-movie and drop the rest.
 *
 * Resolving toward the newest is the only sensible reading: if someone rated
 * the same film twice, the later rating is the one they meant. Everything
 * removed is named in the log so the deletion is auditable rather than silent.
 */
const dedupe = (done = () => {}) => {
  db.all(
    `SELECT id, user_id, movie_id, rating, created_at
     FROM feedback
     WHERE user_id IS NOT NULL AND movie_id IS NOT NULL
     ORDER BY user_id, movie_id, created_at DESC, id DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.log('⚠️  Could not inspect feedback for duplicates:', err.message);
        return done(false);
      }

      const keep = new Set();
      const drop = [];
      (rows || []).forEach((row) => {
        const key = `${row.user_id}|${row.movie_id}`;
        // rows arrive newest-first per key, so the first one seen is the keeper
        if (keep.has(key)) drop.push(row);
        else keep.add(key);
      });

      if (!drop.length) {
        console.log('✅ No duplicate feedback found');
        return done(true);
      }

      console.log(`🧹 Removing ${drop.length} duplicate feedback row(s), keeping each person's most recent:`);
      drop.slice(0, 40).forEach((row) => {
        console.log(`   user ${row.user_id} movie ${row.movie_id} — dropping id ${row.id} (rating ${row.rating}, ${row.created_at})`);
      });
      if (drop.length > 40) console.log(`   ...and ${drop.length - 40} more`);

      const ids = drop.map((r) => r.id);
      const holes = ids.map(() => '?').join(', ');
      db.run(`DELETE FROM feedback WHERE id IN (${holes})`, ids, (delErr) => {
        if (delErr) {
          console.log('⚠️  Could not remove duplicate feedback:', delErr.message);
          return done(false);
        }
        console.log(`✅ Removed ${ids.length} duplicate feedback row(s)`);
        done(true);
      });
    }
  );
};

/** The guarantee. Only attempted once the duplicates are gone. */
const ensureUniqueIndex = (done = () => {}) => {
  db.run(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_user_movie ON feedback (user_id, movie_id)',
    [],
    (err) => {
      if (err) console.log('⚠️  Could not create idx_feedback_user_movie:', err.message);
      else console.log('✅ idx_feedback_user_movie ready');
      done();
    }
  );
};

const enforceOnePerMovie = (done = () => {}) => dedupe(() => ensureUniqueIndex(done));

module.exports = { dedupe, ensureUniqueIndex, enforceOnePerMovie };
