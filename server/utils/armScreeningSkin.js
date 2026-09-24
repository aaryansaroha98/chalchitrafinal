// Retire the Obsession screening skin.
//
// The run is over and the site is back to its permanent light design. The
// skin was switched on from a boot step because a deploy cannot reach the
// production database any other way, so switching it off has to happen the
// same way. This runs a single time and records that it has, which means
// someone turning the skin back on in Admin → Settings afterwards stays on —
// a boot step that forced it off on every restart would be worse than none.

const db = require('../database');

const standDownOnce = (done = () => {}) => {
  db.get(
    `SELECT COALESCE(horror_theme, 0) AS on_now,
            COALESCE(horror_theme_retired, 0) AS retired
     FROM settings WHERE id = 1`,
    [],
    (err, row) => {
      if (err) {
        // The column may not exist yet on an older database; not fatal.
        console.log('ℹ️  Screening skin: could not read settings —', err.message);
        return done();
      }
      if (!row) return done();

      if (Number(row.retired) === 1) {
        console.log(`ℹ️  Screening skin already retired; leaving it ${Number(row.on_now) === 1 ? 'on' : 'off'} as set in the admin panel`);
        return done();
      }

      db.run('UPDATE settings SET horror_theme = 0, horror_theme_retired = 1 WHERE id = 1', [], (updErr) => {
        if (updErr) {
          console.log('⚠️  Could not retire the screening skin:', updErr.message);
          return done();
        }
        console.log('🤍 Screening skin retired — back to the permanent light design (the admin switch is in charge from here)');
        done();
      });
    }
  );
};

module.exports = { standDownOnce };
