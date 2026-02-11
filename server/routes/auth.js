// Initialize Google OAuth strategy
const express = require('express');
const passport = require('passport');
const router = express.Router();
const db = require('../database');

function initializeGoogleStrategy() {
  const passport = require('passport');
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  const db = require('../database');

  const port = process.env.PORT || 3000;
  // Use BACKEND_URL for production, otherwise localhost
  const baseUrl = process.env.BACKEND_URL || `http://localhost:${port}`;

  console.log('=== AUTH.JS ENVIRONMENT VARIABLES ===');
  console.log('GOOGLE_CLIENT_ID in auth.js:', process.env.GOOGLE_CLIENT_ID);
  console.log('GOOGLE_CLIENT_SECRET in auth.js:', process.env.GOOGLE_CLIENT_SECRET ? '[SET]' : '[NOT SET]');
  console.log('BACKEND_URL:', baseUrl);
  console.log('=====================================');

  const clientId = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret';

  console.log('=== USING VALUES ===');
  console.log('clientId:', clientId);
  console.log('clientSecret length:', clientSecret.length);
  console.log('===================');

  // Verify that we have valid credentials
  if (clientId === 'your-google-client-id' || !process.env.GOOGLE_CLIENT_ID) {
    console.error('❌ ERROR: Invalid Google OAuth credentials!');
    console.error('Please check your .env file and ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set correctly.');
    return;
  }

  // Clear any existing Google strategy
  passport.unuse('google');

  // Super admin email that gets full access
  const SUPER_ADMIN_EMAIL = '2025uee0154@iitjammu.ac.in';

  passport.use(new GoogleStrategy({
    clientID: clientId,
    clientSecret: clientSecret,
    callbackURL: `${baseUrl}/api/auth/google/callback`
  }, (accessToken, refreshToken, profile, done) => {
    // Restrict to IIT Jammu student emails only
    const email = profile.emails[0].value;
    console.log('OAuth login attempt with email:', email); // Debug log

    // Only allow IIT Jammu student emails
    if (!email.endsWith('@iitjammu.ac.in')) {
      console.log('❌ Login denied: Email domain not allowed:', email);
      return done(new Error('Only IIT Jammu student emails (@iitjammu.ac.in) are allowed to login.'));
    }

    // Check if this is the super admin
    const isSuperAdmin = email === SUPER_ADMIN_EMAIL;

    // Find or create user
    db.get('SELECT * FROM users WHERE google_id = ?', [profile.id], (err, user) => {
      if (err) return done(err);
      if (user) {
        // Update user info and grant admin privileges if super admin
        if (isSuperAdmin) {
          db.run('UPDATE users SET name = ?, email = ?, is_admin = 1, code_scanner = 1 WHERE google_id = ?',
            [profile.displayName, email, profile.id], function(err) {
              if (err) return done(err);
              console.log('✅ Super admin privileges granted via OAuth:', email);
              return done(null, { ...user, is_admin: 1, code_scanner: 1 });
            });
        } else {
          db.run('UPDATE users SET name = ?, email = ? WHERE google_id = ?',
            [profile.displayName, email, profile.id], function(err) {
              if (err) return done(err);
              return done(null, user);
            });
        }
      } else {
        // Check if email already exists (from manual admin creation)
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, existingUser) => {
          if (err) return done(err);
          if (existingUser) {
            // Update existing user with Google ID and grant admin privileges if super admin
            if (isSuperAdmin) {
              db.run('UPDATE users SET google_id = ?, name = ?, is_admin = 1, code_scanner = 1 WHERE email = ?',
                [profile.id, profile.displayName, email], function(err) {
                  if (err) return done(err);
                  console.log('✅ Super admin privileges granted via OAuth:', email);
                  return done(null, { ...existingUser, is_admin: 1, code_scanner: 1 });
                });
            } else {
              db.run('UPDATE users SET google_id = ?, name = ? WHERE email = ?',
                [profile.id, profile.displayName, email], function(err) {
                  if (err) return done(err);
                  return done(null, existingUser);
                });
            }
          } else {
            // Create new user with admin privileges if super admin
            const isAdmin = isSuperAdmin ? 1 : 0;
            const codeScanner = isSuperAdmin ? 1 : 0;
            db.run('INSERT INTO users (google_id, email, name, is_admin, code_scanner) VALUES (?, ?, ?, ?, ?)',
              [profile.id, email, profile.displayName, isAdmin, codeScanner], function(err) {
                if (err) return done(err);
                if (isSuperAdmin) {
                  console.log('✅ Super admin user created via OAuth:', email);
                }
                db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
                  return done(null, newUser);
                });
              });
          }
        });
      }
    });
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
      done(err, user);
    });
  });
}

// TEMPORARY LOGIN: Allow admin login without OAuth for testing (restricted to IIT Jammu emails)
router.post('/login', (req, res) => {
  const { email } = req.body;

  // Super admin email that gets full access
  const SUPER_ADMIN_EMAIL = '2025uee0154@iitjammu.ac.in';

  // Only allow IIT Jammu student emails
  if (email && email.endsWith('@iitjammu.ac.in')) {
    // First, find or create the user in the database with admin privileges
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, existingUser) => {
      if (err) {
        console.error('Error finding user:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      let userId;
      let userName;

      if (existingUser) {
        // Update existing user with admin privileges
        userId = existingUser.id;
        userName = existingUser.name;

        // Grant admin privileges if user is super admin
        if (email === SUPER_ADMIN_EMAIL) {
          db.run('UPDATE users SET is_admin = 1, code_scanner = 1 WHERE id = ?', [userId], (updateErr) => {
            if (updateErr) console.error('Error granting admin privileges:', updateErr);
            console.log('✅ Admin privileges granted to super admin:', email);
          });
        }
      } else {
        // Create new user with admin privileges for super admin
        userId = Math.floor(Math.random() * 1000000);
        userName = email.split('@')[0]; // Use part of email as name

        db.run(`INSERT INTO users (id, google_id, email, name, is_admin, code_scanner)
                VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, 'admin-test-user', email, userName, email === SUPER_ADMIN_EMAIL ? 1 : 0, email === SUPER_ADMIN_EMAIL ? 1 : 0],
          (insertErr) => {
            if (insertErr) {
              console.error('Error creating user:', insertErr);
              return res.status(500).json({ error: 'Database error' });
            }
            console.log('✅ New user created with admin privileges:', email);
          });
      }

      // Set admin user in session
      const adminUser = {
        id: userId,
        google_id: 'admin-test-user',
        email: email,
        name: userName,
        is_admin: email === SUPER_ADMIN_EMAIL ? 1 : 0,
        code_scanner: email === SUPER_ADMIN_EMAIL ? 1 : 0,
        team_scanner: true
      };

      req.session.adminUser = adminUser;
      console.log('✅ IIT Jammu admin user logged in via temporary login:', email);
      res.json({ success: true, user: adminUser });
    });
  } else {
    console.log('❌ Login denied: Email domain not allowed:', email);
    res.status(401).json({
      error: 'Access denied. Only IIT Jammu student emails (@iitjammu.ac.in) are allowed to login.'
    });
  }
});

// Routes
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id';
  const port = process.env.PORT || 3000;
  
  // Always use localhost for OAuth callback (Google allows localhost, not private IPs)
  const baseUrl = `http://localhost:${port}`;

  console.log('=== GOOGLE LOGIN ROUTE EXECUTED AT', new Date().toISOString(), '===');
  console.log('Using clientId:', clientId);
  console.log('Base URL:', baseUrl);
  console.log('Callback URL:', `${baseUrl}/api/auth/google/callback`);
  console.log('============================================================');

  // Manual redirect to Google OAuth
  const callbackUrl = `${baseUrl}/api/auth/google/callback`;
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=profile%20email&client_id=${clientId}`;

  console.log('=== FINAL GOOGLE AUTH URL ===');
  console.log('URL:', googleAuthUrl);
  console.log('============================');

  res.redirect(googleAuthUrl);
});

router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ error: 'OAuth not configured for local development' });
  }
  next();
}, passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  // Use FRONTEND_URL for production, otherwise use request host
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    res.redirect(frontendUrl);
  } else {
    const frontendHost = req.get('host') || 'localhost:3000';
    const frontendProtocol = req.protocol || 'http';
    res.redirect(`${frontendProtocol}://${frontendHost}/`);
  }
});

router.get('/logout', (req, res) => {
  req.logout(() => {
    // Clear temporary admin session
    if (req.session) {
      req.session.adminUser = null;
    }
    // Use FRONTEND_URL for production, otherwise use request host
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl) {
      res.redirect(frontendUrl);
    } else {
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol;
      res.redirect(`${protocol}://${host}`);
    }
  });
});

router.get('/current_user', (req, res) => {
  // Super admin email that gets full access
  const SUPER_ADMIN_EMAIL = '2025uee0154@iitjammu.ac.in';

  // TEMPORARY BYPASS: Check if user is logged in via session first
  if (req.user) {
    // Ensure super admin has is_admin = 1
    if (req.user.email === SUPER_ADMIN_EMAIL) {
      db.run('UPDATE users SET is_admin = 1, code_scanner = 1 WHERE id = ?', [req.user.id], (err) => {
        if (err) console.error('Error granting super admin privileges:', err);
      });
    }

    // Fetch the latest user data including admin_tag from database
    db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, freshUser) => {
      if (err) {
        console.error('Error fetching fresh user data:', err);
        return res.json(req.user);
      }

      // Check if user is a team leader with scanner access
      const emailParts = freshUser.email.split('@');
      const studentId = emailParts[0];

      db.get('SELECT scanner_access FROM team WHERE student_id = ?', [studentId], (teamErr, teamMember) => {
        if (teamErr) {
          console.error('Error checking team scanner access:', teamErr);
        }

        const userWithTeamAccess = {
          ...freshUser,
          team_scanner: teamMember && teamMember.scanner_access === 1
        };

        res.json(userWithTeamAccess);
      });
    });
  } else {
    // TEMPORARY: Allow admin user to login without OAuth for testing
    if (req.session && req.session.adminUser) {
      // Ensure super admin has is_admin = 1 in session
      if (req.session.adminUser.email === SUPER_ADMIN_EMAIL) {
        req.session.adminUser.is_admin = 1;
        req.session.adminUser.code_scanner = 1;
      }
      
      // Fetch fresh user data including admin_tag
      db.get('SELECT * FROM users WHERE email = ?', [req.session.adminUser.email], (err, freshUser) => {
        if (err || !freshUser) {
          return res.json(req.session.adminUser);
        }
        
        // Check team scanner access
        const emailParts = freshUser.email.split('@');
        const studentId = emailParts[0];
        
        db.get('SELECT scanner_access FROM team WHERE student_id = ?', [studentId], (teamErr, teamMember) => {
          if (teamErr) {
            console.error('Error checking team scanner access:', teamErr);
          }
          
          const userWithData = {
            ...freshUser,
            team_scanner: teamMember && teamMember.scanner_access === 1
          };
          
          // Update session with fresh data including admin_tag
          req.session.adminUser = userWithData;
          res.json(userWithData);
        });
      });
    } else {
      return res.status(401).json({ error: 'Not authenticated. Please login with Google.' });
    }
  }
});

module.exports = router;
module.exports.initializeGoogleStrategy = initializeGoogleStrategy;
