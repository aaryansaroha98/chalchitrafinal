# Chalchitra Website — Full Project Status Report
**Date:** 12 February 2026  
**Purpose:** Complete handoff document for any AI assistant or developer continuing work on this project.

---

## 1. PROJECT OVERVIEW

**Chalchitra** is a full-stack movie booking & event management website for **IIT Jammu's Film Club**. Users can browse movies, select seats, order food, pay via Razorpay, receive PDF tickets via email, and submit feedback. Admins can manage movies, bookings, food, coupons, gallery, team, and send emails.

**GitHub:** `github.com/aaryansaroha98/chalchitrafinal`

---

## 2. ARCHITECTURE & HOSTING

| Layer | Technology | Hosting | URL |
|-------|-----------|---------|-----|
| Frontend | React 19 (CRA) | **Vercel** | `chalchitrafinal.vercel.app` |
| Backend | Express.js (Node) | **Render** (free tier) | `chalchitra-backend.onrender.com` |
| Database (prod) | PostgreSQL | **Neon.tech** | `ep-dawn-sea-a10vzeg8-pooler.ap-southeast-1.aws.neon.tech/neondb` |
| Database (dev) | SQLite3 | Local file | `database.db` |
| Image Storage | Cloudinary (prod) / local disk (dev) | Cloudinary | cloud_name: `dmc8r6zym` |
| Payments | Razorpay | — | Test keys in use |
| Email | Brevo HTTP API | — | REST API, no SMTP |

### How Vercel + Render Work Together
- Vercel serves the React SPA
- `vercel.json` has rewrites that proxy all `/api/*`, `/uploads/*`, `/hero/*`, `/about/*`, `/gallery/*`, `/team/*`, `/logos/*`, `/misc/*`, `/favicons/*` → `https://chalchitra-backend.onrender.com`
- Render serves the Express.js backend with PostgreSQL

---

## 3. DIRECTORY STRUCTURE (IMPORTANT — DUAL COPIES)

The project has **two copies** of server/client code:

| Path | Purpose | Used By |
|------|---------|---------|
| `server/` (root) | **Production backend** | Render (`node server/index.js`) |
| `Chalchitra Website/server/` | Local dev backend | `npm start` (uses SQLite) |
| `client/` (root) | Built React app (stale copy) | Not actively used |
| `Chalchitra Website/client/` | **Active React source** | `npm run build`, Vercel |

**CRITICAL:** When making backend changes, always edit `server/` (root) first, then sync to `Chalchitra Website/server/`:
```bash
cp server/routes/bookings.js "Chalchitra Website/server/routes/bookings.js"
cp server/routes/admin.js "Chalchitra Website/server/routes/admin.js"
cp server/database.js "Chalchitra Website/server/database.js"
```

When making frontend changes, edit `Chalchitra Website/client/src/` and rebuild:
```bash
cd "Chalchitra Website/client" && npm run build
```

---

## 4. DATABASE SCHEMA (17 Tables)

The `convertToPostgres()` function in `server/database.js` auto-converts SQLite SQL to PostgreSQL at runtime. This conversion handles:
- `?` → `$1, $2, ...` numbered params
- `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
- `DATETIME` → `TIMESTAMP`, `REAL` → `DOUBLE PRECISION`
- `datetime('now')` → `NOW()`, `datetime('now', '-N days')` → `NOW() - INTERVAL 'N days'`
- `strftime('%Y-%m', col)` → `TO_CHAR(col, 'YYYY-MM')`
- `INSERT OR IGNORE` → `INSERT INTO ... ON CONFLICT DO NOTHING`
- Auto-appends `RETURNING id` to INSERTs (for `lastID` support)

### Table Schemas

| # | Table | Key Columns | Notes |
|---|-------|-------------|-------|
| 1 | **users** | id, google_id (UNIQUE), email (UNIQUE), name, is_admin (0/1), code_scanner (0/1), admin_tag | Default admin: `2025uee0154@iitjammu.ac.in` |
| 2 | **movies** | id, title, description, poster_url, date, venue, price, category, duration, imdb_rating, language, is_upcoming (0/1) | |
| 3 | **bookings** | id, user_id, movie_id, num_people, total_price, payment_method, payment_id, payment_status, qr_code (UNIQUE), selected_seats, food_order, booking_code (UNIQUE), is_used, admitted_people, remaining_people | |
| 4 | **feedback** | id, user_id, movie_id, rating, comment | |
| 5 | **team** | id, name, student_id, photo_url, role, section (default 'current_team'), scanner_access (0/1) | |
| 6 | **gallery** | id, image_url, event_name, uploaded_at | |
| 7 | **settings** | id (not auto), tagline, hero_background, hero_background_image, hero_background_video, about_text, about_image, contact_head_name, contact_head_email | Single row, id=1 |
| 8 | **coupons** | id, code (UNIQUE), description, discount_type, discount_value, min_purchase, max_discount, usage_limit, used_count, expiry_date, is_active | |
| 9 | **foods** | id, name, description, price, category, image_url, is_available | |
| 10 | **email_history** | id, email_type, recipient_email, recipient_name, subject, message, sent_by, status, error_message | |
| 11 | **coupon_winners** | id, user_id, coupon_code, discount_amount, discount_type, max_discount, expiry_date, is_used, used_at, sent_by, shared_coupon_id | |
| 12 | **movie_foods** | id, movie_id, food_id, UNIQUE(movie_id, food_id) | Links foods to movies |
| 13 | **booking_foods** | id, booking_id, food_id, quantity | Tracks food orders per booking |
| 14 | **booking_food_status** | id, booking_id, food_id, quantity_given, given_at, given_by, UNIQUE(booking_id, food_id) | Tracks food delivery status |
| 15 | **admin_permissions** | id, admin_user_id (UNIQUE), allowed_tabs (JSON), created_by | Per-admin tab visibility |
| 16 | **mail_settings** | id, email_host, email_port, email_user, email_pass, sender_name | Legacy SMTP settings (not used anymore) |
| 17 | **razorpay_settings** | id, key_id, key_secret | Runtime Razorpay config |

---

## 5. ALL API ENDPOINTS

### Auth (`/api/auth`) — [server/routes/auth.js](server/routes/auth.js)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/login` | Manual login |
| GET | `/google` | Initiate Google OAuth |
| GET | `/google/callback` | Google OAuth callback |
| GET | `/logout` | Logout |
| GET | `/current_user` | Get logged-in user |

### Movies (`/api/movies`) — [server/routes/movies.js](server/routes/movies.js)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/upcoming` | Upcoming movies |
| GET | `/past` | Past movies |
| GET | `/all` | All movies |
| GET | `/` | Movies list |
| GET | `/:id` | Single movie |
| POST | `/` | Create movie (admin) |
| PUT | `/:id` | Update movie (admin) |
| DELETE | `/:id` | Delete movie (admin) |
| PUT | `/:id/move_to_past` | Move to past (admin) |

### Bookings (`/api/bookings`) — [server/routes/bookings.js](server/routes/bookings.js)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/occupied/:movieId` | Get occupied seats |
| POST | `/` | Create booking |
| GET | `/my` | User's bookings |
| POST | `/scan` | Scan QR for admission |
| GET | `/` | All bookings |
| POST | `/test-scan` | Test QR scan |
| PUT | `/:id/ticket-html` | Update ticket HTML |
| DELETE | `/:id` | Delete booking |
| POST | `/generate-pdf` | Generate PDF ticket |
| POST | `/send-ticket-email` | Email ticket via Brevo |
| GET | `/check/:movieId` | Check duplicate booking |
| GET | `/email-config-check` | Check Brevo email config |

### Payments (`/api/payments`) — [server/routes/payments.js](server/routes/payments.js)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/order` | Create Razorpay order |

### Foods (`/api/foods`) — [server/routes/foods.js](server/routes/foods.js)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | All foods |
| GET | `/available/:movieId` | Available foods for a movie (public) |
| GET | `/:id` | Single food |
| POST | `/` | Create food (admin) |
| PUT | `/:id` | Update food (admin) |
| DELETE | `/:id` | Delete food (admin) |
| POST | `/link/:movieId/:foodId` | Link food to movie (admin) |
| DELETE | `/link/:movieId/:foodId` | Unlink food from movie (admin) |
| GET | `/movie/:movieId` | Get foods linked to movie (admin) |
| GET | `/:id/movies` | Get movies linked to food (admin) |
| DELETE | `/:id/force` | Force delete food (admin) |
| GET | `/booking/:bookingId` | Food orders for booking |
| GET | `/status/:bookingId` | Food delivery status |
| POST | `/mark-given/:bookingId/:foodId` | Mark food as given |
| GET | `/pending/:bookingId` | Pending food items |

### Feedback (`/api/feedback`) — [server/routes/feedback.js](server/routes/feedback.js)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Submit feedback |
| GET | `/movie/:movie_id` | Feedback for movie |
| GET | `/movie/:movie_id/rating` | Average rating |
| GET | `/my` | User's feedback |

### Team (`/api/team`) — [server/routes/team.js](server/routes/team.js)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Team list (public) |

### Admin (`/api/admin`) — [server/routes/admin.js](server/routes/admin.js) — all require admin auth
| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats` | Dashboard stats |
| GET | `/revenue-stats` | Revenue analytics |
| GET | `/top-users` | Top booking users |
| GET | `/visitors/stats` | Visitor statistics |
| POST | `/track-visit` | Track page visit (public) |
| PUT | `/users/:id/make_admin` | Make user admin |
| PUT | `/users/:id/remove_admin` | Remove admin |
| PUT | `/users/:id/admin_tag` | Set admin tag |
| PUT | `/users/:id/make_scanner` | Grant scanner access |
| PUT | `/users/:id/remove_scanner` | Remove scanner |
| PUT | `/team/:id/grant_scanner` | Grant team scanner |
| PUT | `/team/:id/remove_scanner` | Remove team scanner |
| GET | `/users` | All users |
| GET | `/bookings` | All bookings (admin) |
| PUT | `/bookings/:id` | Update booking |
| GET | `/feedback` | All feedback |
| GET | `/coupons` | All coupons |
| POST | `/coupons` | Create coupon |
| DELETE | `/coupons/:id` | Delete coupon |
| PUT | `/coupons/:id` | Update coupon |
| DELETE | `/coupons` | Delete all coupons |
| POST | `/coupons/validate` | Validate coupon (public) |
| GET | `/gallery` | Gallery (public) |
| POST | `/gallery` | Upload gallery image |
| DELETE | `/gallery/:id` | Delete gallery image |
| GET | `/settings` | Site settings (public) |
| PUT | `/settings` | Update settings |
| GET | `/team` | Team list |
| POST | `/team` | Add team member |
| PUT | `/team/:id` | Update team member |
| DELETE | `/team/:id` | Delete team member |
| GET | `/email/users` | Email-able users |
| GET | `/movies-with-status` | Movies with status |
| POST | `/email/single` | Send single email |
| POST | `/email/bulk` | Send bulk email (background) |
| POST | `/email/custom` | Send custom email |
| POST | `/email/feedback-request` | Send feedback requests (background) |
| POST | `/email/all` | Send to all (DISABLED) |
| GET | `/email/history` | Email history |
| GET | `/email/stats` | Email stats |
| GET | `/coupon-winners` | Coupon winners |
| POST | `/coupon-winners/send` | Send coupon to winner |
| POST | `/validate-coupon-winner` | Validate winner coupon (public) |
| POST | `/email/ticket` | Email ticket (public) |
| GET | `/ticket-pdf/:bookingId` | Download ticket PDF |
| GET | `/permission-admins` | Admins with permissions |
| GET | `/permissions/:adminId` | Get admin permissions |
| PUT | `/permissions/:adminId` | Update admin permissions |
| GET | `/my-permissions` | Current admin's permissions |
| GET | `/available-tabs` | Available admin tabs |
| DELETE | `/coupon-winners` | Delete all winners |
| DELETE | `/permissions/:adminId` | Delete admin permissions |
| GET | `/mail-settings` | Mail config |
| PUT | `/mail-settings` | Update mail config |
| POST | `/mail-settings/test` | Test email |
| GET | `/razorpay-settings` | Razorpay config |
| PUT | `/razorpay-settings` | Update Razorpay config |

---

## 6. FRONTEND PAGES

| Page | File | Description |
|------|------|-------------|
| Home | `Chalchitra Website/client/src/pages/Home.js` | Hero section, upcoming movies, about |
| Upcoming Movies | `UpcomingMovies.js` | Movie cards with booking buttons |
| Past Movies | `PastMovies.js` | Past screenings |
| Booking | `Booking.js` | Seat selection, food ordering, payment |
| Payment | `Payment.js` | Razorpay payment integration |
| Payment Success | `PaymentSuccess.js` | Success page with ticket download |
| My Bookings | `MyBookings.js` | User's booking history, feedback |
| Gallery | `Gallery.js` | Event photo gallery |
| Contact | `Contact.js` | Contact info |
| Team | `Team.js` | Club team members |
| Login | `Login.js` | Google OAuth login |
| Admin Panel | `AdminPanel.js` | Full admin dashboard (~6700 lines) |
| Scanner | `Scanner.js` | QR code ticket scanner |
| Team Scanner | `TeamScanner.js` | Team member scanner |
| Privacy Policy | `PrivacyPolicy.js` | Legal page |
| Terms of Service | `TermsOfService.js` | Legal page |
| Refund Policy | `RefundPolicy.js` | Legal page |

**Components:** `Navbar.js`, `Footer.js`, `QRScanner.js`  
**Contexts:** `AuthContext.js` (user auth state), `ThemeContext.js` (dark/light mode)  
**API Client:** `api/axios.js` — uses `withCredentials: true`, relative URLs in production

---

## 7. ENVIRONMENT VARIABLES

### Production (Render Dashboard)

| Variable | Value/Notes | Status |
|----------|-------------|--------|
| `NODE_ENV` | `production` | ✅ Set |
| `DATABASE_URL` | Neon PostgreSQL connection string | ✅ Set (auto from Render PG) |
| `SESSION_SECRET` | Random secret string | ✅ Set |
| `GOOGLE_CLIENT_ID` | `700742264274-t1gu...` | ✅ Set |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX--pKG8G0y...` | ✅ Set |
| `RAZORPAY_KEY_ID` | `rzp_test_S4CeLC...` (test) | ✅ Set |
| `RAZORPAY_KEY_SECRET` | `qP568DB1Xm...` | ✅ Set |
| `CLOUDINARY_CLOUD_NAME` | `dmc8r6zym` | ✅ Set |
| `CLOUDINARY_API_KEY` | (set in Render) | ✅ Set |
| `CLOUDINARY_API_SECRET` | (set in Render) | ✅ Set |
| `FRONTEND_URL` | `https://chalchitrafinal.vercel.app` | ✅ Set |
| `BACKEND_URL` | `https://chalchitra-backend.onrender.com` | ✅ Set |
| `BREVO_API_KEY` | `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` | ✅ Set |
| `BREVO_FROM_EMAIL` | `chalchitra@iitjammu.ac.in` | ✅ Set |

### Variables to REMOVE (no longer used)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` — old SMTP vars, unused since Brevo migration
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — old Resend vars, replaced by Brevo

### Local `.env` file
Located at project root. Contains development values for all the above vars plus:
- `PORT=3000`
- `DATABASE_PATH=./database.db`
- `DEV_CLIENT_URL=http://localhost:3001`

---

## 8. EMAIL SYSTEM — CURRENT STATE

### Provider: Brevo (formerly Sendinblue)
- **API:** REST HTTP (`https://api.brevo.com/v3/smtp/email`)
- **Auth:** `api-key` header with `BREVO_API_KEY` env var
- **No npm package needed** — uses native `fetch()`
- **Sender:** `chalchitra@iitjammu.ac.in` (verified single sender in Brevo)
- **Free tier:** 300 emails/day

### Email sending points:
| Location | Type | Behavior |
|----------|------|----------|
| `bookings.js` — `sendEmailWithRetry()` | Ticket emails | Awaited, with 2x retry, 2s delay between |
| `admin.js` — `POST /email/single` | Single email | **Awaited** — returns real success/failure |
| `admin.js` — `POST /email/custom` | Custom email | **Awaited** — returns real success/failure |
| `admin.js` — `POST /email/bulk` | Bulk email | Background (`setImmediate`) — responds immediately, sends async |
| `admin.js` — `POST /email/feedback-request` | Feedback requests | Background (`setImmediate`) — responds immediately, sends async |
| `admin.js` — coupon email | Coupon winner | Background (`.then()/.catch()` promise chain) |
| `admin.js` — `POST /mail-settings/test` | Test email | Awaited |

### Email History
All sends are logged to `email_history` table with status (`sent`, `failed`, `skipped`) and error messages.

### Known Issue: Spam
Emails land in spam because `iitjammu.ac.in` domain is not authenticated in Brevo (no SPF/DKIM DNS records). User has a GoDaddy domain `chalchitraiitjammu.in` that could be authenticated to fix this — needs DNS record setup in GoDaddy pointing to Brevo.

### Email Evolution History
1. **Gmail SMTP (nodemailer)** → Failed: Render blocks SMTP ports 465/587
2. **Resend HTTP API** → Failed: SMTP key used instead of API key; also required DNS for custom sender
3. **Brevo HTTP API** → ✅ **Current** — Working, 300 emails/day free, single sender verification

---

## 9. RECENT FIX HISTORY (Last 10 Commits)

| Commit | Fix |
|--------|-----|
| `da9c02c` | **Food not showing on booking page** — `INSERT OR IGNORE` is SQLite-only; added conversion to PostgreSQL `ON CONFLICT DO NOTHING` + unique constraints on `movie_foods` and `booking_food_status` |
| `d8d8f9d` | **Email showing success before sending** — Removed `setImmediate` background wrapper for single/custom emails; now awaits Brevo response before returning success/failure to frontend |
| `d141a1d` | **Brevo integration** — Replaced all Resend API calls with Brevo REST API using native `fetch()` |
| `fbb7076` | **Resend integration** — Replaced nodemailer SMTP with Resend HTTP API |
| `f31611c` | **Network error on email** — Made email sends async with `setImmediate` to avoid Render's 30s timeout |
| `514cf32` | **Email timeout** — Switched to `service:'gmail'` with port 465 SSL + retry logic |
| `1afcbe5` | **Email status reporting** — Sync send, proper status, masked passwords |
| `f76e830` | **QR code not saved** — Added `RETURNING id` to PostgreSQL INSERTs for `lastID` support |
| `32f4235` | **Email timeout + image resilience** — Better error handling |
| `b385fc5` | **PostgreSQL datetime + Cloudinary** — Fixed datetime conversion, upload params, parallel query handling |

---

## 10. KNOWN ISSUES & GOTCHAS

### Critical
1. **Emails go to spam** — Domain not authenticated in Brevo. Fix: authenticate `chalchitraiitjammu.in` in Brevo dashboard, add DNS records in GoDaddy, then update `BREVO_FROM_EMAIL` to `tickets@chalchitraiitjammu.in`
2. **Food linking must be redone** — After the `INSERT OR IGNORE` fix, foods need to be re-linked to movies from admin panel (old link attempts all failed silently)

### Architecture
3. **Dual file copies** — `server/` (production/PostgreSQL) and `Chalchitra Website/server/` (dev/SQLite). Must sync after every change.
4. **SQLite↔PostgreSQL fragility** — Runtime SQL conversion via `convertToPostgres()` is fragile. Any SQLite-specific syntax will break on production unless a conversion rule exists.
5. **Render free tier** — Cold starts take 30-50s. Blocks SMTP ports. 30s request timeout.
6. **AdminPanel.js is ~6700 lines** — Massive monolith, difficult to maintain.
7. **No migration system** — Schema changes require manual `ALTER TABLE` on production or rely on `CREATE TABLE IF NOT EXISTS` (which won't add new columns to existing tables).

### Minor
8. **`nodemailer` and `resend` still in package.json** — Can be removed from dependencies (no longer imported anywhere).
9. **`puppeteer` in dependencies** — Was used for PDF generation, unclear if still needed (jsPDF is used instead now).
10. **Test Razorpay keys** — Production is using test keys (`rzp_test_*`), not live keys.

---

## 11. DEPENDENCIES

### Server (root `package.json`)
```
axios, body-parser, cloudinary, concurrently, dotenv, ejs, express, express-session,
jspdf, jspdf-autotable, multer, multer-storage-cloudinary, nodemailer (unused),
passport, passport-google-oauth20, pg, puppeteer (possibly unused), qrcode,
resend (unused), sequelize, sqlite3
```

### Client (`Chalchitra Website/client/package.json`)
```
axios, bootstrap, framer-motion, html2canvas, html5-qrcode, jspdf, jspdf-autotable,
jsqr, react (19.2.3), react-bootstrap, react-dom, react-qr-code,
react-router-dom (7.11.0), react-scripts, web-vitals
```

---

## 12. HOW TO RUN LOCALLY

```bash
# 1. Install dependencies
cd /Users/aaryansaroha/Desktop/Projects/Chalchitra_Series
npm install
cd "Chalchitra Website/client" && npm install && cd ../..

# 2. Start backend (SQLite, port 3000)
cd "Chalchitra Website/server" && node index.js

# 3. Start frontend (port 3001, proxies to 3000)
cd "Chalchitra Website/client" && npm start

# OR use concurrently:
npm run fullstack
```

### Build for Vercel
```bash
cd "Chalchitra Website/client" && npm run build
```
Then commit `Chalchitra Website/client/build/` — Vercel serves this.

---

## 13. DEPLOYMENT CHECKLIST

### Push code changes:
```bash
# 1. Edit files in server/ (root)
# 2. Sync to inner copy
cp server/routes/admin.js "Chalchitra Website/server/routes/admin.js"
cp server/routes/bookings.js "Chalchitra Website/server/routes/bookings.js"
cp server/database.js "Chalchitra Website/server/database.js"
# etc.

# 3. Commit and push
git add -A && git commit -m "Description" && git push origin main

# 4. Render auto-deploys from main branch
# 5. Vercel auto-deploys from main branch
```

### Frontend changes:
```bash
# 1. Edit files in Chalchitra Website/client/src/
# 2. Build
cd "Chalchitra Website/client" && npm run build
# 3. Commit the build + source
git add -A && git commit -m "Frontend update" && git push origin main
```

---

## 14. USEFUL DIAGNOSTIC COMMANDS

```bash
# Check email config on production
curl https://chalchitra-backend.onrender.com/api/bookings/email-config-check

# Check foods linked to movie ID 1
curl https://chalchitra-backend.onrender.com/api/foods/available/1

# Check all foods
curl https://chalchitra-backend.onrender.com/api/foods

# Health check
curl https://chalchitra-backend.onrender.com/health

# Test Brevo API key
curl -s -X POST 'https://api.brevo.com/v3/smtp/email' \
  -H 'accept: application/json' \
  -H 'api-key: YOUR_BREVO_KEY' \
  -H 'content-type: application/json' \
  -d '{"sender":{"name":"Test","email":"chalchitra@iitjammu.ac.in"},"to":[{"email":"test@example.com"}],"subject":"Test","htmlContent":"<p>Test</p>"}'

# Check Render logs
# Go to: Render Dashboard → Your service → Logs
```

---

## 15. NEXT STEPS / TODO

1. **Authenticate domain in Brevo** — Add `chalchitraiitjammu.in` in Brevo, add DNS records in GoDaddy, update `BREVO_FROM_EMAIL` to fix spam issue
2. **Re-link foods to movies** — Go to admin panel → Foods tab → link foods to each movie (old links failed due to SQLite syntax bug, now fixed)
3. **Remove unused npm packages** — `nodemailer`, `resend`, possibly `puppeteer` and `sequelize`
4. **Switch to live Razorpay keys** when ready for real payments
5. **Consider breaking up AdminPanel.js** — It's ~6700 lines, very hard to maintain

---

*This report was generated on 12 February 2026. The codebase is on the `main` branch, latest commit: `da9c02c`.*
