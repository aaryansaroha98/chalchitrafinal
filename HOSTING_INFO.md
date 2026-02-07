# Chalchitra Website - Hosting & Deployment Details

## 📊 Current Status (Last Updated: Feb 2025)

### ⚠️ ISSUES TO FIX
- Frontend showing white screen on Netlify
- JavaScript errors in console
- API not connecting properly

---

## 🏠 Project Overview

**Project Name:** Chalchitra Website (Movie Booking System)  
**Repository:** https://github.com/aaryansaroha98/chalchitraseries  
**Local Path:** `/Users/aaryansaroha/Desktop/Projects/Chalchitra Website`

---

## 🌐 Hosting Setup

### Frontend (User Interface)
| Property | Value |
|----------|-------|
| **Platform** | Netlify |
| **URL** | https://chalchitraseries.netlify.app |
| **Status** | White screen error |
| **Build Command** | `cd client && npm run build` |
| **Publish Directory** | `client/build` |
| **Node Version** | 18 |

### Backend (API & Database)
| Property | Value |
|----------|-------|
| **Platform** | Render |
| **URL** | https://chalchitra-api.onrender.com |
| **Status** | ✅ Running |
| **Port** | 3000 |
| **Environment** | Node.js |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

---

## 📁 Project Structure

```
Chalchitra Website/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js     # API configuration (IMPORTANT!)
│   │   ├── pages/            # 13 page components
│   │   ├── components/       # Navbar, Footer, QRScanner
│   │   └── contexts/         # AuthContext, ThemeContext
│   └── public/
│       ├── index.html
│       └── _redirects         # Netlify SPA routing
├── server/                    # Express Backend
│   ├── index.js              # Main server file
│   ├── database.js           # SQLite database setup
│   └── routes/               # API routes
│       ├── auth.js, movies.js, bookings.js
│       ├── payments.js, admin.js, foods.js
│       ├── team.js, feedback.js
├── public/                    # Static files (images, videos)
└── netlify.toml              # Netlify build config
```

---

## 🔧 Key Configuration Files

### 1. API Configuration (`client/src/api/axios.js`)
```javascript
// API calls go to Render backend
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 
  'https://chalchitra-api.onrender.com';
```

**Environment Variable Needed on Netlify:**
- Key: `REACT_APP_API_BASE_URL`
- Value: `https://chalchitra-api.onrender.com`

### 2. Netlify Config (`netlify.toml`)
```toml
[build]
  command = "cd client && npm run build"
  publish = "client/build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 🗄️ Database

| Property | Value |
|----------|-------|
| **Type** | SQLite |
| **File** | `database.db` |
| **Location** | Render persistent disk |
| **Tables** | users, movies, bookings, feedback, team, gallery, settings, coupons, foods, etc. |

**Note:** Render free tier has limited persistent disk. Consider migrating to PostgreSQL for production.

---

## 🔐 Authentication

| Property | Value |
|----------|-------|
| **Type** | Google OAuth 2.0 |
| **Client ID** | `700742264274-t1gu6b7cj3li6fb8v0asjimmhrv34mrp.apps.googleusercontent.com` |
| **Callback URL** | `https://chalchitra-api.onrender.com/api/auth/google/callback` |

---

## 💳 Payment Gateway

| Property | Value |
|----------|-------|
| **Provider** | Razorpay |
| **Key ID** | (Set in environment variables) |
| **Settings Table** | `razorpay_settings` in database |

---

## 📧 Email Configuration

| Property | Value |
|----------|-------|
| **Provider** | Nodemailer (SMTP) |
| **Settings Table** | `mail_settings` in database |

---

## 🚨 Current Errors

### Console Errors on https://chalchitraseries.netlify.app
```
1. "Uncaught SyntaxError: Unexpected token '<' (at particles.js:1:1)"
2. "Error fetching movies: TypeError: (e.data || []).filter is not a function"
3. "Navbar.js:354 Uncaught TypeError: Cannot read properties of undefined (reading 'split')"
```

### Root Causes
1. **particles.js 404** - Trying to load non-existent script
2. **API not connecting** - Environment variable not set on Netlify
3. **Navbar error** - `split()` called on undefined value

---

## 🔧 Required Fixes

### Fix 1: Set Environment Variable on Netlify
1. Go to https://app.netlify.com/sites/chalchitraseries
2. Click **Site settings** → **Environment variables**
3. Add:
   - Key: `REACT_APP_API_BASE_URL`
   - Value: `https://chalchitra-api.onrender.com`
4. Click **Trigger deploy**

### Fix 2: Check for Missing Files
- `particles.js` file is referenced but doesn't exist
- Check `index.html` and component imports

### Fix 3: Fix API Response Handling
The API is returning data but `Home.js` expects a different format.
Check `server/routes/movies.js` response format.

---

## 🧪 Testing Commands

### Test Backend API
```bash
# Should return JSON response
curl https://chalchitra-api.onrender.com/api/movies
```

### Test Local Build
```bash
cd "/Users/aaryansaroha/Desktop/Projects/Chalchitra Website"
npm run build
```

### Run Locally
```bash
# Terminal 1 - Backend
cd "/Users/aaryansaroha/Desktop/Projects/Chalchitra Website"
npm run server

# Terminal 2 - Frontend  
cd "/Users/aaryansaroha/Desktop/Projects/Chalchitra Website/client"
npm start
```

---

## 📝 Git Commands

### Push Changes to GitHub
```bash
cd "/Users/aaryansaroha/Desktop/Projects/Chalchitra Website"
git add -A
git commit -m "Describe your changes"
git push origin main
```

### Trigger Netlify Deploy
1. Go to https://app.netlify.com
2. Click **Deploys** tab
3. Click **"Trigger deploy"**

---

## 🎯 Contact Info

| Role | Email |
|------|-------|
| Admin User | 2025uee0154@iitjammu.ac.in |

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `DEPLOYMENT_GUIDE.md` | Full deployment guide |
| `FIX_IMPORT_ERRORS.md` | Import path fixes |
| `README.md` | Project documentation |

---

## ✅ Deployment Checklist

- [x] Code pushed to GitHub
- [x] Backend deployed on Render
- [x] Frontend configured on Netlify
- [x] Database initialized
- [ ] Environment variables set on Netlify
- [ ] White screen issue fixed
- [ ] All features tested
- [ ] Custom domain connected (optional)

---

**For Help:** Share this document with anyone helping to fix the deployment issues.
