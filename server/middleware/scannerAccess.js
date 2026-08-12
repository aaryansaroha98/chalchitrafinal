const db = require('../database');

const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || '2025uee0154@iitjammu.ac.in').trim().toLowerCase();

const requireScannerAccess = (req, res, next) => {
  const actor = req.user || req.session?.adminUser || req.session?.user || null;
  if (!actor) return res.status(401).json({ error: 'Authentication required' });

  const email = typeof actor.email === 'string' ? actor.email.trim().toLowerCase() : '';
  if (email === SUPER_ADMIN_EMAIL) return next();

  const actorId = Number(actor.id);
  const lookupSql = Number.isInteger(actorId) && actorId > 0
    ? 'SELECT id, email, code_scanner FROM users WHERE id = ?'
    : 'SELECT id, email, code_scanner FROM users WHERE LOWER(email) = ?';
  const lookupValue = Number.isInteger(actorId) && actorId > 0 ? actorId : email;

  db.get(lookupSql, [lookupValue], (userErr, user) => {
    if (userErr) return res.status(500).json({ error: userErr.message });
    if (!user) return res.status(403).json({ error: 'Scanner access required' });
    if (Number(user.code_scanner) === 1) return next();

    const studentId = String(user.email || '').split('@')[0].trim().toLowerCase();
    if (!studentId) return res.status(403).json({ error: 'Scanner access required' });

    db.get(
      'SELECT scanner_access FROM team WHERE LOWER(student_id) = ?',
      [studentId],
      (teamErr, teamMember) => {
        if (teamErr) return res.status(500).json({ error: teamErr.message });
        if (teamMember && Number(teamMember.scanner_access) === 1) return next();
        return res.status(403).json({ error: 'Scanner access required' });
      }
    );
  });
};

module.exports = requireScannerAccess;