const session = require('express-session');

class DatabaseSessionStore extends session.Store {
  constructor(db, options = {}) {
    super();
    this.db = db;
    this.ttlMs = Number(options.ttlMs) || (30 * 24 * 60 * 60 * 1000);
    this.cleanupIntervalMs = Number(options.cleanupIntervalMs) || (15 * 60 * 1000);
    this.cleanupTimer = null;

    this.initialize();
  }

  initialize() {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sid TEXT NOT NULL UNIQUE,
        sess TEXT NOT NULL,
        expire DATETIME NOT NULL
      )
    `;

    this.db.run(createTableSql, [], (tableErr) => {
      if (tableErr) {
        console.error('Session store table init error:', tableErr.message || tableErr);
        return;
      }

      this.db.run('CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire)', [], (indexErr) => {
        if (indexErr) {
          console.error('Session store index init warning:', indexErr.message || indexErr);
        }
      });

      this.pruneExpired(() => {});
      this.cleanupTimer = setInterval(() => {
        this.pruneExpired(() => {});
      }, this.cleanupIntervalMs);

      if (typeof this.cleanupTimer.unref === 'function') {
        this.cleanupTimer.unref();
      }
    });
  }

  getExpiration(sessionData) {
    if (sessionData && sessionData.cookie) {
      if (sessionData.cookie.expires) {
        const explicitExpires = new Date(sessionData.cookie.expires);
        if (!Number.isNaN(explicitExpires.getTime())) {
          return explicitExpires.toISOString();
        }
      }

      if (typeof sessionData.cookie.maxAge === 'number') {
        return new Date(Date.now() + sessionData.cookie.maxAge).toISOString();
      }
    }

    return new Date(Date.now() + this.ttlMs).toISOString();
  }

  get(sid, callback) {
    this.db.get('SELECT sess, expire FROM sessions WHERE sid = ?', [sid], (err, row) => {
      if (err) {
        return callback(err);
      }

      if (!row) {
        return callback(null, null);
      }

      const expiresAt = new Date(row.expire);
      if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now()) {
        return this.destroy(sid, () => callback(null, null));
      }

      try {
        const sessionData = JSON.parse(row.sess);
        return callback(null, sessionData);
      } catch (parseErr) {
        return callback(parseErr);
      }
    });
  }

  set(sid, sessionData, callback = () => {}) {
    const store = this;
    const expiresAt = this.getExpiration(sessionData);
    let serializedSession;

    try {
      serializedSession = JSON.stringify(sessionData);
    } catch (serializeErr) {
      return callback(serializeErr);
    }

    this.db.run(
      'UPDATE sessions SET sess = ?, expire = ? WHERE sid = ?',
      [serializedSession, expiresAt, sid],
      function onUpdate(updateErr) {
        if (updateErr) {
          return callback(updateErr);
        }

        if (this && this.changes > 0) {
          return callback(null);
        }

        store.db.run(
          'INSERT INTO sessions (sid, sess, expire) VALUES (?, ?, ?)',
          [sid, serializedSession, expiresAt],
          function onInsert(insertErr) {
            if (insertErr) {
              const message = String(insertErr.message || '');
              if (/unique|duplicate/i.test(message)) {
                return store.db.run(
                  'UPDATE sessions SET sess = ?, expire = ? WHERE sid = ?',
                  [serializedSession, expiresAt, sid],
                  (retryErr) => callback(retryErr || null)
                );
              }
              return callback(insertErr);
            }
            return callback(null);
          }
        );
      }
    );
  }

  touch(sid, sessionData, callback = () => {}) {
    const expiresAt = this.getExpiration(sessionData);
    this.db.run(
      'UPDATE sessions SET expire = ? WHERE sid = ?',
      [expiresAt, sid],
      (err) => callback(err || null)
    );
  }

  destroy(sid, callback = () => {}) {
    this.db.run('DELETE FROM sessions WHERE sid = ?', [sid], (err) => callback(err || null));
  }

  clear(callback = () => {}) {
    this.db.run('DELETE FROM sessions', [], (err) => callback(err || null));
  }

  length(callback) {
    this.db.get('SELECT COUNT(*) AS count FROM sessions', [], (err, row) => {
      if (err) {
        return callback(err);
      }
      return callback(null, Number(row?.count || row?.['COUNT(*)'] || 0));
    });
  }

  pruneExpired(callback = () => {}) {
    this.db.run(
      'DELETE FROM sessions WHERE expire <= ?',
      [new Date().toISOString()],
      (err) => callback(err || null)
    );
  }
}

module.exports = DatabaseSessionStore;
