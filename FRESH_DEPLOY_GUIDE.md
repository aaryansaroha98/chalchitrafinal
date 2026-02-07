
# 🚀 FRESH START GUIDE - Deploy with SQLite + Persistent Disk

**Your app uses SQLite (database.db). Instead of PostgreSQL, we'll use Render's Persistent Disk to store the database file.**

---

## Step 1: Delete Existing Render Services

1. Go to https://dashboard.render.com
2. **Delete your Web Service** (chalchitra-api)
3. **Delete your PostgreSQL database** if you created one
4. Click "Yes, delete" for each

---

## Step 2: Push Latest Code to GitHub

Run these commands in Terminal:

```bash
cd "/Users/aaryansaroha/Desktop/Projects/Chalchitra Website"

# Check what files changed
git status

# Add all changes
git add -A

# Commit
git commit -m "Ready for fresh deployment with persistent disk"

# Push to GitHub
git push origin main
```

---

## Step 3: Create Backend on Render with Persistent Disk

### 3.1 Create Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Find and select your repository: `aaryansaroha98/chalchitraseries`
4. Click **"Connect"**

### 3.2 Configure Settings

Fill in these values:

| Setting | Value |
|---------|-------|
| **Name** | `chalchitra-backend` |
| **Branch** | `main` |
| **Root Directory** | (leave empty) |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | **Starter** (free) |

### 3.3 Add Persistent Disk (Important!)

1. Scroll down to **"Advanced"**
2. Click **"Add Persistent Disk"**
3. Configure:
   - **Mount Path**: `/data`
   - **Size**: 1 GB (free)
4. Click **"Create"**

### 3.4 Add Environment Variables

In the same section, add these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_PATH` | `/data/database.db` |
| `SESSION_SECRET` | `any-secret-key-here-change-this` |
| `GOOGLE_CLIENT_ID` | `your-google-client-id` |
| `GOOGLE_CLIENT_SECRET` | `your-google-client-secret` |
| `GOOGLE_CALLBACK_URL` | `https://chalchitra-backend.onrender.com/api/auth/google/callback` |
| `FRONTEND_URL` | `https://chalchitraseries.netlify.app` |

**Important**: Change `SESSION_SECRET` to something random and secure!

### 3.5 Create the Service

Click **"Create Web Service"**

Wait 2-3 minutes for deployment.

### 3.6 Note Your Backend URL

After deployed, you'll see:
- **URL**: `https://chalchitra-backend.onrender.com`

---

## Step 4: Upload Your Local Database

### 4.1 Export Your Local Database

On your computer, run:

```bash
cd "/Users/aaryansaroha/Desktop/Projects/Chalchitra Website"

# Copy database to a backup
cp database.db database_backup.db

# Verify the file exists
ls -la database.db
```

### 4.2 Upload via Render Shell

1. Go to https://dashboard.render.com
2. Click on your `chalchitra-backend` service
3. Click **"Shell"** in the top menu
4. In the shell, run:
```bash
# Check current directory
pwd
# Should show: /data

# List files
ls -la
# Should show your uploaded database.db
```

5. Upload your `database.db` file:
   - Click **"Upload"** button in Render shell
   - Select `database.db` from your computer
   - Upload to `/data/database.db`

---

## Step 5: Verify Database Works

1. In Render Shell, run:
```bash
cd /data
sqlite3 database.db "SELECT COUNT(*) FROM movies;"
sqlite3 database.db "SELECT COUNT(*) FROM team;"
sqlite3 database.db "SELECT COUNT(*) FROM settings;"
```

2. Should show your data counts!

3. Test the API:
```bash
curl https://chalchitra-backend.onrender.com/api/movies/all
```

Should return your movie data.

---

## Step 6: Update Netlify Frontend

### 6.1 Check Environment Variables

1. Go to https://app.netlify.com/sites/chalchitraseries/overview
2. Click **"Site settings"** → **"Environment variables"**
3. Verify this is set:
   - Key: `REACT_APP_API_URL`
   - Value: `https://chalchitra-backend.onrender.com`

### 6.2 Trigger New Deploy

1. Go to https://app.netlify.com/sites/chalchitraseries/deploys
2. Click **"Trigger deploy"** → **"Deploy latest commit"**
3. Wait 2-3 minutes

---

## Step 7: Test Everything

| Test | URL | Expected |
|------|-----|----------|
| Frontend | https://chalchitraseries.netlify.app | Shows website with movies |
| Backend API | https://chalchitra-backend.onrender.com/api/movies/all | Returns JSON with movies |
| Admin Login | https://chalchitraseries.netlify.app/login | Google OAuth works |

---

## 🔧 Troubleshooting

### "No movies showing" / "Data not loading"

1. **Check API is working:**
   ```bash
   curl https://chalchitra-backend.onrender.com/api/movies/all
   ```

2. **If API returns empty:**
   - Database not uploaded
   - Check Render shell: `ls -la /data/database.db`

3. **If API returns error:**
   - Check Render logs: Click "Logs" tab
   - Look for database errors

### "Cannot connect to database"

1. Check Render logs for errors
2. Verify database file exists in `/data`
3. Try restarting the service:
   - Click "Settings" → "Deploys" → "Restart"

### "Upload failed" / "Permission denied"

1. Make sure you have the Persistent Disk attached
2. Check Mount Path is `/data`
3. Contact Render support if persists

---

## 📋 Quick Reference

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend (Netlify)** | https://chalchitraseries.netlify.app | User website |
| **Backend (Render)** | https://chalchitra-backend.onrender.com | API server |
| **Database** | `/data/database.db` on Render | SQLite file |

---

## ⚠️ Important Notes

1. **Free Tier Limitations:**
   - Service sleeps after 15 min inactivity
   - First request after sleep takes ~30 seconds
   - Disk persists data but service restarts daily

2. **Data Backup:**
   - Always keep a backup of `database.db`
   - Your local version is the "master" copy

3. **Production Use:**
   - For production, upgrade to paid tier
   - $7/month for always-on instance
   - Larger disk if needed

---

## ✅ Checklist

- [ ] Deleted old Render services
- [ ] Pushed code to GitHub
- [ ] Created new Web Service with Persistent Disk
- [ ] Set environment variables (including `DATABASE_PATH=/data/database.db`)
- [ ] Uploaded database.db to /data
- [ ] Verified API works
- [ ] Triggered Netlify redeploy
- [ ] Tested frontend shows data

---

## Need Help?

If something doesn't work, tell me:
1. What error message you see
2. Whether the API works: `curl https://chalchitra-backend.onrender.com/api/movies/all`
3. What shows in Render logs

