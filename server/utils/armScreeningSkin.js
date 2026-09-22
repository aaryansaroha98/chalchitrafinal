// Turn the Obsession screening skin on, once.
//
// The skin ships behind a switch in Admin → Settings, and that switch is the
// thing that decides. This exists only because it was asked for while it was
// still off, and there is no way to reach the production database from a
// deploy other than through code. It flips the switch on a single time and
// records that it has done so, so that afterwards turning the skin off in the
// admin panel stays off — a boot step that re-enabled the skin every restart
// would be worse than not having one.

const db = require('../database');

const armOnce = (done = () => {}) => {
  db.get('SELECT COALESCE(horror_theme, 0) AS on_now, COALESCE(horror_theme_armed, 0) AS armed FROM settings WHERE id = 1',
    [], (err, row) => {
      if (err) {
        // The column may not exist yet on a very old database; not fatal.
        console.log('ℹ️  Screening skin: could not read settings —', err.message);
        return done();
      }
      if (!row) return done();

      if (Number(row.armed) === 1) {
        console.log(`ℹ️  Screening skin already armed once; leaving it ${Number(row.on_now) === 1 ? 'on' : 'off'} as set in the admin panel`);
        return done();
      }

      db.run('UPDATE settings SET horror_theme = 1, horror_theme_armed = 1 WHERE id = 1', [], (updErr) => {
        if (updErr) {
          console.log('⚠️  Could not turn the screening skin on:', updErr.message);
          return done();
        }
        console.log('🕯️  Screening skin turned ON for the Obsession run (one time only — the admin switch is in charge from here)');
        done();
      });
    });
};

module.exports = { armOnce };
