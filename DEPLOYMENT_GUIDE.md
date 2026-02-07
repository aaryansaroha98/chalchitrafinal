# Complete Deployment Guide: Chalchitra Website

## 📋 Project Overview
- **Backend**: Express.js with SQLite (needs PostgreSQL migration for production)
- **Frontend**: React 19 with React Router
- **Database**: SQLite → PostgreSQL (for Render deployment)
- **Root Package**: `chalchitra-website` with concurrent server/client scripts

---

## Step 1: Push Code to GitHub

### 1.1 Create .gitignore
Your `.gitignore` should already exist. If not:
```bash
# Navigate to your project directory
cd /Users/aaryansaroha/Desktop/Projects/Chalchitra\ Website

cat > .gitignore << 'EOF'
node_modules/
.env
.DS_Store
*.log
uploads/
database.db
client/build/
EOF
```

### 1.2 Create GitHub Repository
1. Go to [GitHub](https://github.com) and sign in
2. Click **New Repository** (green button)
3. Repository name: `chalchitra-website`
4. Description: "Chalchitra - Movie Booking Website"
5. Select **Public** or **Private**
6. **Do NOT** initialize with README (we have one)
7. Click **Create Repository**

### 1.3 Push Code to GitHub
```bash
# Add remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/chalchitra-website.git

# Stage all files
git add .

# Commit with message
git commit -m "Initial commit: Full stack movie booking website"

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend on Render

### ⚠️ Important: Database Migration Required

Your current project uses **SQLite** (`database.db`), but Render's free tier doesn't support persistent filesystem storage. You have two options:

#### Option A: Use Render's PostgreSQL (Recommended)
#### Option B: Keep SQLite with filesystem persistence (Limited)

I'll provide instructions for **Option A** (PostgreSQL) since it's production-ready.

### 2.1 Update Code for PostgreSQL

**Install PostgreSQL dependencies:**
```bash
npm install pg pg-hstore
```

**Update `server/database.js`** for PostgreSQL:
```javascript
const { Sequelize } = require('sequelize');
const path = require('path');

// Use PostgreSQL in production, SQLite in development
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '..', 'database.db'),
      logging: false
    });

module.exports = sequelize;
```

**Or use `better-sqlite3` with persistent disk (simpler migration):**
```bash
npm install better-sqlite3
```

**Update `server/database.js`** to use `better-sqlite3`:
```javascript
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

// Export db for use in routes
module.exports = db;
```

### 2.2 Deploy Backend on Render

1. **Create Render Account**
   - Go to [Render](https://render.com) and sign up (use GitHub)

2. **Create PostgreSQL Database** (Required for persistent data)
   - Click **New +** → **PostgreSQL**
   - Configure:
     - **Name**: `chalchitra-db`
     - **Database User**: `chalchitra`
     - **Plan**: Free
   - Click **Create Database**
   - **Note**: The connection string will be: `postgres://user:pass@hostname:5432/database`

3. **Create Web Service**
   - Click **New +** → **Web Service**
   - Connect your GitHub repository: `YOUR_USERNAME/chalchitra-website`
   - Configure:
     - **Name**: `chalchitra-api`
     - **Branch**: `main`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free (or $7/month for persistent disk)

4. **Add Environment Variables** (in Render dashboard):
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |
   | `DATABASE_URL` | `postgres://...` (from PostgreSQL) |
   | `SESSION_SECRET` | `your-super-secret-session-key` |
   | `GOOGLE_CLIENT_ID` | `your-google-oauth-client-id` |
   | `GOOGLE_CLIENT_SECRET` | `your-google-oauth-client-secret` |
   | `GOOGLE_CALLBACK_URL` | `https://chalchitra-api.onrender.com/api/auth/google/callback` |
   | `FRONTEND_URL` | `https://yourdomain.com` |

5. **Deploy**
   - Click **Create Web Service**
   - Wait for build to complete (2-5 minutes)
   - Your backend URL: `https://chalchitra-api.onrender.com`

### 2.3 Initialize Database on Render

After deployment, run a database initialization script:
```bash
# Create a setup script that runs once
curl https://chalchitra-api.onrender.com/api/setup
```

Or manually run migrations by connecting to PostgreSQL and running the table creation SQL from your `database.js` file.

---

## Step 3: Deploy Frontend on Netlify

### 3.1 Prepare Your Frontend

**Update API Configuration in `client/src/config/api.js` or similar:**
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://chalchitra-api.onrender.com';
```

**Or update `client/package.json` build script:**
```json
{
  "scripts": {
    "build": "DISABLE_ESLINT_PLUGIN=true react-scripts build"
  }
}
```

### 3.2 Deploy on Netlify

1. **Create Netlify Account**
   - Go to [Netlify](https://netlify.com) and sign up (use GitHub)

2. **Deploy via GitHub**
   - Click **Add new site** → **Import an existing project**
   - Select your GitHub repository: `YOUR_USERNAME/chalchitra-website`
   - Configure:
     - **Base directory**: `client`
     - **Build command**: `npm run build`
     - **Publish directory**: `client/build`
   - Click **Deploy site**

3. **Add Environment Variables** (in Netlify dashboard):
   | Key | Value |
   |-----|-------|
   | `REACT_APP_API_URL` | `https://chalchitra-api.onrender.com` |

4. **Note your frontend URL**: `https://chalchitra.netlify.app`

### 3.3 Update CORS on Backend

Your `server/index.js` already has CORS configured for all origins, which works for deployment. Ensure your Google OAuth callback is correct:

**Update `server/index.js`** (verify):
```javascript
// Google OAuth callback URL should match your Render backend
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 
  'https://chalchitra-api.onrender.com/api/auth/google/callback';
```

---

## Step 4: Connect GoDaddy Domain

### 4.1 Purchase Domain (if not already)
1. Go to [GoDaddy](https://godaddy.com)
2. Search for your desired domain (e.g., `chalchitra.com`)
3. Complete purchase

### 4.2 Configure DNS on GoDaddy

#### Recommended: Use Netlify DNS (easiest)

1. **In Netlify**:
   - Go to **Domain Management** → **Add custom domain**
   - Enter: `chalchitra.com`
   - Select **Yes, add domain**

2. **In GoDaddy**:
   - Go to **DNS Management**
   - Find current nameservers
   - Replace with Netlify nameservers (shown in Netlify dashboard):
     ```
     dns1.p01.nsone.net
     dns2.p01.nsone.net
     dns3.p01.nsone.net
     dns4.p01.nsone.net
     ```

#### Alternative: CNAME Records (keep GoDaddy DNS)

**For Frontend (main domain):**
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | your-site-name.netlify.app | 600 |
| CNAME | www | your-site-name.netlify.app | 600 |

**For Backend (subdomain - optional):**
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | api | chalchitra-api.onrender.com | 600 |

### 4.3 SSL/HTTPS

1. **Netlify** auto-provisions SSL via Let's Encrypt
2. In Netlify: Domain shows "HTTPS: Active certificate"
3. Enable **Force HTTPS** redirect in Netlify settings

### 4.4 Update URLs After Domain Setup

**In Render Environment Variables:**
| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://www.chalchitra.com` |

**In Netlify Environment Variables:**
| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://chalchitra-api.onrender.com` |

**Update `server/index.js` for Google OAuth:**
```javascript
const GOOGLE_CALLBACK_URL = `https://${process.env.RENDER_SERVICE_NAME}.onrender.com/api/auth/google/callback`;
// Or use environment variable
```

---

## Step 5: Final Configuration

### 5.1 Update Environment Variables Summary

**Render Backend:**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://...
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://chalchitra-api.onrender.com/api/auth/google/callback
FRONTEND_URL=https://www.yourdomain.com
```

**Netlify Frontend:**
```
REACT_APP_API_URL=https://chalchitra-api.onrender.com
```

### 5.2 Test Your Deployment

1. **Backend Health Check**: `https://chalchitra-api.onrender.com/api/movies` (should return JSON)
2. **Frontend**: `https://www.yourdomain.com`
3. **Test Features**:
   - [ ] User login with Google OAuth
   - [ ] Browse movies
   - [ ] Make a booking
   - [ ] Payment flow (Razorpay)
   - [ ] QR code generation
   - [ ] Admin panel access

### 5.3 Deployment Checklist

- [ ] GitHub repository created and code pushed
- [ ] Render web service deployed and running
- [ ] PostgreSQL database created and connected
- [ ] All environment variables set on Render
- [ ] Netlify site deployed
- [ ] Environment variables set on Netlify
- [ ] Custom domain connected
- [ ] SSL certificate active (HTTPS working)
- [ ] Google OAuth callback URL updated
- [ ] All features tested end-to-end

---

## Quick Reference

| Service | Your URL | Purpose |
|---------|----------|---------|
| GitHub | `github.com/YOUR_USER/chalchitra-website` | Source code |
| Backend | `chalchitra-api.onrender.com` | API server |
| Frontend | `chalchitra.netlify.app` | Preview URL |
| Custom Domain | `www.yourdomain.com` | Production URL |
| Database | PostgreSQL on Render | Persistent storage |

---

## Troubleshooting Common Issues

### 1. **CORS Errors**
**Problem**: API requests blocked by CORS policy
**Solution**:
```javascript
// In server/index.js, ensure CORS allows your frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  // ... rest of CORS config
});
```

### 2. **Environment Variables Not Loading**
**Problem**: `process.env.VARIABLE_NAME` is undefined
**Solution**:
- Restart Render service after adding env vars
- Check for typos in variable names
- Ensure `.env` is NOT committed to Git

### 3. **Build Failures**
**Problem**: Deployment fails during build
**Solution**:
- Check build logs on Render/Netlify
- Ensure Node.js version is compatible (use Node 18)
- Run `npm install` locally first to verify dependencies

### 4. **Database Connection Failed**
**Problem**: Cannot connect to PostgreSQL
**Solution**:
- Verify `DATABASE_URL` is correct in Render
- Check PostgreSQL instance is running
- Ensure connection string format: `postgres://user:pass@host:5432/dbname`

### 5. **Google OAuth Not Working**
**Problem**: Login fails with Google
**Solution**:
- Update Google Cloud Console authorized redirect URIs:
  ```
  https://chalchitra-api.onrender.com/api/auth/google/callback
  ```
- Update authorized JavaScript origins:
  ```
  https://chalchitra-api.onrender.com
  https://www.yourdomain.com
  ```

### 6. **Domain Not Resolving**
**Problem**: DNS not propagating
**Solution**:
- DNS changes can take 24-48 hours
- Check TTL values (lower = faster propagation)
- Verify DNS records at: https://dnschecker.org

### 7. **Session/Authentication Issues**
**Problem**: Users get logged out frequently
**Solution**:
```javascript
// In server/index.js, configure session properly
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

---

## Support Links

- **Render Docs**: https://render.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **GoDaddy Help**: https://www.godaddy.com/help
- **PostgreSQL**: https://www.postgresql.org/docs/

---

*Last Updated: 2025*
*For Chalchitra Website Deployment*

