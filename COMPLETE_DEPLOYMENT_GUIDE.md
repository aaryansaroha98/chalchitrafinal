# 🚀 Complete Fresh Deployment Guide - Chalchitra Website

This guide will help you deploy your app **from scratch** with zero errors.

---

## 📋 What We're Building

| Component | Service | URL (after setup) |
|-----------|---------|-------------------|
| **Frontend** | Netlify | https://chalchitraseries.netlify.app |
| **Backend API** | Render | https://chalchitra-backend.onrender.com |
| **Database** | SQLite on Render Disk | /data/database.db |

**Total Cost**: $0/month (100% FREE)

---

## ⚠️ Before You Start

### 1. Check Your GitHub Repository

Your code must be on GitHub. If not:

```bash
cd "/Users/aaryansaroha/Desktop/Projects/Chalchitra Website"

# Initialize git if needed
git init

# Add all files
git add -A

# Commit
git commit -m "Initial commit for deployment"

# Create repo on GitHub (go to github.com/new)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 2. Get Google OAuth Credentials

You need these for login to work.

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Application type: **Web application**
4. Name: `Chalchitra Website`
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://chalchitraseries.netlify.app
   https://chalchitra-backend.onrender.com
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/google/callback
   https://chalchitra-backend.onrender.com/api/auth/google/callback
   ```
7. Click **"Create"**
8. **SAVE** the Client ID and Client Secret (you'll need these!)

---

## 🎯 PART 1: Deploy Backend to Render

### Step 1: Sign Up for Render

1. Go to: https://dashboard.render.com/register
2. Sign up with GitHub (easiest option)
3. Authorize Render to access your repositories

### Step 2: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Find your repository: `YOUR_USERNAME/chalchitraseries` (or your repo name)
3. Click **"Connect"**

### Step 3: Configure Web Service Settings

Fill in these EXACT values:

| Setting | Value |
|---------|-------|
| **Name** | `chalchitra-backend` |
| **Region** | Choose closest to you (e.g., Oregon, Frankfurt) |
| **Branch** | `main` |
| **Root Directory** | (leave empty) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

### Step 4: Add Persistent Disk (IMPORTANT!)

1. Scroll down to **"Disk"** section
2. Click **"Add Disk"**
3. Configure:
   - **Name**: `chalchitra-data`
   - **Mount Path**: `/data`
   - **Size**: 1 GB (free tier)

### Step 5: Set Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these ONE BY ONE:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Don't change |
| `PORT` | `10000` | Don't change (Render requires this) |
| `DATABASE_PATH` | `/data/database.db` | Points to persistent disk |
| `SESSION_SECRET` | Click "Generate" button | Auto-generates secure secret |
| `GOOGLE_CLIENT_ID` | Paste from Step 2 above | Your Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Paste from Step 2 above | Your Google OAuth Secret |
| `GOOGLE_CALLBACK_URL` | `https://chalchitra-backend.onrender.com/api/auth/google/callback` | Must match Google Console |
| `FRONTEND_URL` | `https://chalchitraseries.netlify.app` | Your Netlify URL |

**⚠️ IMPORTANT**: 
- For `SESSION_SECRET`: Use the "Generate" button in Render
- Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` match what you got from Google Console

### Step 6: Deploy!

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. Watch the logs - you should see:
   ```
   ✅ Database connected successfully
   ✅ SQLite database connected!
   🚀 Server running on port 10000
   ```

### Step 7: Check Your Backend URL

1. After deployment completes, you'll see: **"Your service is live 🎉"**
2. Your backend URL will be: `https://chalchitra-backend.onrender.com`
3. Test it by clicking the URL - you should see a JSON response

### Step 8: Initialize Database (First Time Only)

Since this is your first deployment, the database is empty. We need to create tables:

1. In Render dashboard, click on your service
2. Click **"Shell"** tab (top right)
3. In the shell, run:

```bash
# Check database file exists
ls -la /data/

# Should show: database.db

# If database.db doesn't exist, restart the service
# Click "Manual Deploy" → "Deploy latest commit"
```

The database tables will be created automatically when the server starts (thanks to server/database.js).

---

## 🎨 PART 2: Deploy Frontend to Netlify

### Step 1: Sign Up for Netlify

1. Go to: https://app.netlify.com/signup
2. Sign up with GitHub
3. Authorize Netlify

### Step 2: Create New Site

1. Click **"Add new site"** → **"Import an existing project"**
2. Click **"Deploy with GitHub"**
3. Find and select your repository
4. Click **"Deploy"**

### Step 3: Configure Build Settings

Netlify should auto-detect React. Verify these settings:

| Setting | Value |
|---------|-------|
| **Base directory** | `client` |
| **Build command** | `npm run build` |
| **Publish directory** | `client/build` |

### Step 4: Add Environment Variable

**BEFORE clicking "Deploy site"**:

1. Click **"Show advanced"**
2. Click **"New variable"**
3. Add:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://chalchitra-backend.onrender.com`

### Step 5: Deploy!

1. Click **"Deploy site"**
2. Wait 2-3 minutes
3. You'll get a random URL like: `random-name-123.netlify.app`

### Step 6: Change Site Name (Optional but Recommended)

1. Click **"Site settings"**
2. Click **"Change site name"**
3. Enter: `chalchitraseries`
4. Your new URL: `https://chalchitraseries.netlify.app`

---

## 🔄 PART 3: Update Google OAuth URLs

Now that you have your final URLs, update Google Console:

1. Go back to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth Client ID
3. **Update Authorized JavaScript origins** to:
   ```
   http://localhost:3000
   https://chalchitraseries.netlify.app
   https://chalchitra-backend.onrender.com
   ```
4. **Update Authorized redirect URIs** to:
   ```
   http://localhost:3000/api/auth/google/callback
   https://chalchitra-backend.onrender.com/api/auth/google/callback
   ```
5. Click **"Save"**

---

## ✅ PART 4: Test Everything

### Test 1: Backend Health Check

Open in browser:
```
https://chalchitra-backend.onrender.com/health
```

**Expected**: JSON response with `"status": "ok"`

### Test 2: Frontend Loads

Open in browser:
```
https://chalchitraseries.netlify.app
```

**Expected**: Your website homepage loads

### Test 3: API Works

Open in browser:
```
https://chalchitra-backend.onrender.com/api/movies/all
```

**Expected**: JSON array (might be empty if no movies added yet)

### Test 4: Google Login

1. Go to: `https://chalchitraseries.netlify.app`
2. Click **"Login"** or **"Admin"**
3. Click **"Sign in with Google"**
4. Should redirect to Google login
5. After login, should redirect back to your site

---

## 🎉 SUCCESS! What's Next?

### Add Your First Admin User

1. Login with Google using email: `2025uee0154@iitjammu.ac.in`
2. This email is auto-created as admin (see server/database.js)
3. Go to Admin Panel to add movies, team members, etc.

### Add Movies

1. Go to: `https://chalchitraseries.netlify.app/admin`
2. Click **"Movies"** tab
3. Click **"Add Movie"**
4. Fill in details and save

### Upload Database (If You Have Existing Data)

If you have an existing `database.db` with movies/team/bookings:

1. Go to Render dashboard → Your service
2. Click **"Shell"** tab
3. Click **"Upload file"**
4. Select your `database.db`
5. Upload to: `/data/database.db`
6. Click **"Manual Deploy"** → **"Deploy latest commit"** to restart

---

## 🔧 Troubleshooting Common Errors

### Error: "Failed to fetch" on frontend

**Cause**: Backend URL not set correctly

**Fix**:
1. Go to Netlify dashboard
2. **Site settings** → **Environment variables**
3. Verify `REACT_APP_API_URL` = `https://chalchitra-backend.onrender.com`
4. Trigger new deploy: **Deploys** → **Trigger deploy** → **Deploy site**

### Error: "Google OAuth redirect_uri mismatch"

**Cause**: Google Console URLs don't match

**Fix**:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit your OAuth Client
3. Make sure redirect URI is EXACTLY:
   ```
   https://chalchitra-backend.onrender.com/api/auth/google/callback
   ```
4. No trailing slash, no extra spaces

### Error: "Database error" in Render logs

**Cause**: Database path not configured

**Fix**:
1. Check Render environment variables
2. Make sure `DATABASE_PATH` = `/data/database.db`
3. Make sure Disk is mounted at `/data`
4. Redeploy

### Error: Backend takes 30+ seconds to respond

**Cause**: Render free tier sleeps after 15 minutes

**This is normal!** First request after sleep takes ~30 seconds. Subsequent requests are fast.

**Upgrade to paid tier ($7/month) if you need 24/7 uptime**

### Error: "Movies not showing" but API returns data

**Cause**: Frontend using wrong API URL

**Fix**:
1. Open browser console (F12)
2. Check Network tab for failed requests
3. Verify requests go to `chalchitra-backend.onrender.com`
4. If not, redeploy Netlify with correct env var

---

## 📊 Free Tier Limits

| Service | Limit | What Happens |
|---------|-------|--------------|
| **Render** | 750 hours/month | Enough for 24/7 small traffic |
| **Render** | 15 min inactivity → sleep | 30s cold start on wake |
| **Render Disk** | 1 GB | Enough for database + uploads |
| **Netlify** | 100 GB bandwidth/month | Plenty for most sites |
| **Netlify** | 300 build minutes/month | More than enough |

---

## 🚀 Optional: Custom Domain (GoDaddy)

If you have a domain from GoDaddy:

### For Frontend (Netlify)

1. In Netlify: **Domain settings** → **Add custom domain**
2. Enter your domain: `yourdomain.com`
3. Netlify will show DNS settings
4. In GoDaddy DNS settings, add:
   - **A Record**: `@` → `75.2.60.5`
   - **CNAME**: `www` → `chalchitraseries.netlify.app`
5. Wait 24-48 hours for DNS propagation

### For Backend (Keep on Render subdomain)

- Keep backend at `chalchitra-backend.onrender.com`
- Don't point your main domain to backend (users don't need to see it)

---

## 📝 Environment Variables Quick Reference

### Render (Backend)

```
NODE_ENV=production
PORT=10000
DATABASE_PATH=/data/database.db
SESSION_SECRET=(auto-generated)
GOOGLE_CLIENT_ID=(from Google Console)
GOOGLE_CLIENT_SECRET=(from Google Console)
GOOGLE_CALLBACK_URL=https://chalchitra-backend.onrender.com/api/auth/google/callback
FRONTEND_URL=https://chalchitraseries.netlify.app
```

### Netlify (Frontend)

```
REACT_APP_API_URL=https://chalchitra-backend.onrender.com
```

---

## 📞 Need More Help?

If you get stuck:

1. **Check Render Logs**:
   - Dashboard → Your service → **"Logs"** tab
   - Look for error messages

2. **Check Netlify Deploy Logs**:
   - Dashboard → **"Deploys"** → Click on deploy
   - Look for build errors

3. **Check Browser Console**:
   - Open your site
   - Press F12 → **"Console"** tab
   - Look for errors (red text)

4. **Check Network Requests**:
   - F12 → **"Network"** tab
   - Try an action (like loading movies)
   - See if API calls succeed

---

## ✅ Final Checklist

After completing all steps:

- [ ] Backend deployed to Render
- [ ] Backend URL: `https://chalchitra-backend.onrender.com`
- [ ] Backend health check works: `/health`
- [ ] Persistent disk attached at `/data`
- [ ] All environment variables set in Render
- [ ] Frontend deployed to Netlify
- [ ] Frontend URL: `https://chalchitraseries.netlify.app`
- [ ] `REACT_APP_API_URL` set in Netlify
- [ ] Google OAuth credentials configured
- [ ] Google Console has correct redirect URIs
- [ ] Can login with Google
- [ ] Admin user can access admin panel
- [ ] Database tables created automatically

---

## 🎯 You're Done!

Your app is now live and 100% free to host!

**Frontend**: https://chalchitraseries.netlify.app  
**Backend**: https://chalchitra-backend.onrender.com

Share with friends and enjoy! 🎬🍿
