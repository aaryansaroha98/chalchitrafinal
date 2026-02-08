# ✅ Pre-Deployment Checklist

Complete these steps **before** deploying to avoid errors.

---

## 1️⃣ Code Ready

- [ ] All code committed to GitHub
- [ ] Repository is public (or Render/Netlify has access)
- [ ] No sensitive data in code (all secrets in .env)
- [ ] `.env` file is in `.gitignore` (never commit secrets!)

```bash
# Check git status
git status

# If there are changes:
git add -A
git commit -m "Ready for deployment"
git push origin main
```

---

## 2️⃣ Google OAuth Setup

- [ ] Created OAuth Client ID at https://console.cloud.google.com/apis/credentials
- [ ] Saved Client ID somewhere safe
- [ ] Saved Client Secret somewhere safe
- [ ] Added redirect URIs (we'll update these after deployment)

**Temporary redirect URI for now**:
```
http://localhost:3000/api/auth/google/callback
```

---

## 3️⃣ Database Ready

- [ ] `database.db` exists locally
- [ ] Has admin user: `2025uee0154@iitjammu.ac.in`
- [ ] (Optional) Has movies, team, settings data

**If you need to reset database**:
```bash
cd "/Users/aaryansaroha/Desktop/Projects/Chalchitra Website"
rm database.db
npm start
# Database will be recreated with tables
```

---

## 4️⃣ Dependencies Installed

- [ ] Root `node_modules` exists
- [ ] Client `node_modules` exists
- [ ] No dependency errors locally

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

---

## 5️⃣ Local Testing Works

- [ ] Backend runs: `npm start`
- [ ] Frontend runs: `cd client && npm start`
- [ ] Can access: http://localhost:3000
- [ ] API works: http://localhost:3000/api/movies/all
- [ ] Google login works (if configured)

---

## 6️⃣ Files Updated

Check these files exist and are correct:

### ✅ Root Files

- [ ] `package.json` - has correct scripts
- [ ] `render.yaml` - configured for Render deployment
- [ ] `netlify.toml` - configured for Netlify
- [ ] `.gitignore` - includes .env and database.db
- [ ] `.env.example` - template for environment variables

### ✅ Server Files

- [ ] `server/index.js` - uses DATABASE_PATH env variable
- [ ] `server/database.js` - creates tables automatically
- [ ] `server/routes/auth.js` - Google OAuth configured

### ✅ Client Files

- [ ] `client/src/api/axios.js` - uses REACT_APP_API_URL
- [ ] `client/package.json` - has build script

---

## 7️⃣ Environment Variables Prepared

Have these ready to paste into Render:

```
NODE_ENV=production
PORT=10000
DATABASE_PATH=/data/database.db
SESSION_SECRET=(will generate in Render)
GOOGLE_CLIENT_ID=(your value)
GOOGLE_CLIENT_SECRET=(your value)
GOOGLE_CALLBACK_URL=https://chalchitra-backend.onrender.com/api/auth/google/callback
FRONTEND_URL=https://chalchitraseries.netlify.app
```

Have this ready for Netlify:

```
REACT_APP_API_URL=https://chalchitra-backend.onrender.com
```

---

## 8️⃣ Accounts Created

- [ ] GitHub account (for code hosting)
- [ ] Render account (for backend)
- [ ] Netlify account (for frontend)
- [ ] Google Cloud account (for OAuth)

---

## 🚀 Ready to Deploy!

If all checkboxes are checked, you're ready!

**Next**: Open [COMPLETE_DEPLOYMENT_GUIDE.md](./COMPLETE_DEPLOYMENT_GUIDE.md) and follow the steps.

---

## ⚠️ Common Pre-Deployment Mistakes

### Mistake 1: Hardcoded URLs in Code

**Wrong**:
```javascript
const apiUrl = 'http://localhost:3000';
```

**Correct**:
```javascript
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
```

### Mistake 2: Database Path Not Flexible

**Wrong**:
```javascript
const dbPath = './database.db';
```

**Correct**:
```javascript
const dbPath = process.env.DATABASE_PATH || './database.db';
```

### Mistake 3: Secrets in Code

**Wrong**:
```javascript
const secret = 'my-secret-key-12345';
```

**Correct**:
```javascript
const secret = process.env.SESSION_SECRET || 'fallback-for-dev';
```

### Mistake 4: Wrong Build Directory

**Wrong in netlify.toml**:
```toml
[build]
  publish = "build"  # Wrong! Client is in subdirectory
```

**Correct**:
```toml
[build]
  base = "client"
  publish = "build"
```

---

## 🔍 Quick Test Commands

Before deploying, run these:

```bash
# Test backend starts
npm start
# Should see: "Server running on port 3000"
# Press Ctrl+C to stop

# Test client builds
cd client
npm run build
# Should create client/build/ directory
cd ..

# Test database connection
npm start
# Check logs for: "Database connected successfully"
```

---

## ✅ All Set!

Once everything is checked, proceed to:

👉 **[COMPLETE_DEPLOYMENT_GUIDE.md](./COMPLETE_DEPLOYMENT_GUIDE.md)**
