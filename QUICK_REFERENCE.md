# 🎯 Quick Reference - Chalchitra Website

---

## 🌐 URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | https://chalchitraseries.netlify.app | User-facing website |
| **Backend** | https://chalchitra-backend.onrender.com | API server |
| **Health Check** | https://chalchitra-backend.onrender.com/health | Check if backend is up |
| **Movies API** | https://chalchitra-backend.onrender.com/api/movies/all | Test API |

---

## 🔑 Admin Access

**Admin Email**: `2025uee0154@iitjammu.ac.in`

**Admin Panel**: https://chalchitraseries.netlify.app/admin

---

## 📦 Environment Variables

### Render (Backend)

```bash
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

```bash
REACT_APP_API_URL=https://chalchitra-backend.onrender.com
```

---

## 🚀 Deployment Commands

### Deploy Backend (Automatic via GitHub)

1. Commit changes to GitHub:
```bash
git add -A
git commit -m "Update backend"
git push origin main
```

2. Render automatically deploys (takes 2-3 min)

### Deploy Frontend (Automatic via GitHub)

1. Make changes to `client/` folder
2. Commit and push:
```bash
git add -A
git commit -m "Update frontend"
git push origin main
```

3. Netlify automatically deploys (takes 2-3 min)

### Manual Redeploy

**Render**:
- Dashboard → Your service → "Manual Deploy" → "Deploy latest commit"

**Netlify**:
- Dashboard → "Deploys" → "Trigger deploy" → "Deploy site"

---

## 🗄️ Database Management

### Location

- **Local**: `/Users/aaryansaroha/Desktop/Projects/Chalchitra Website/database.db`
- **Production**: `/data/database.db` (on Render server)

### Backup Production Database

1. Go to Render Dashboard → Shell
2. Run:
```bash
cat /data/database.db > database_backup.db
```
3. Download via Shell interface

### Upload New Database

1. Go to Render Dashboard → Shell
2. Click "Upload file"
3. Select `database.db` from your computer
4. Upload to: `/data/database.db`
5. Restart service: "Manual Deploy" → "Deploy latest commit"

### View Database Contents (Render Shell)

```bash
# Navigate to database directory
cd /data

# Check database file exists
ls -la database.db

# Count movies
sqlite3 database.db "SELECT COUNT(*) FROM movies;"

# Count users
sqlite3 database.db "SELECT COUNT(*) FROM users;"

# List all tables
sqlite3 database.db ".tables"

# View specific movie
sqlite3 database.db "SELECT * FROM movies WHERE id=1;"
```

---

## 🧪 Testing APIs

### Health Check

```bash
curl https://chalchitra-backend.onrender.com/health
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### Get All Movies

```bash
curl https://chalchitra-backend.onrender.com/api/movies/all
```

### Get Team Members

```bash
curl https://chalchitra-backend.onrender.com/api/team/all
```

---

## 🔧 Common Tasks

### Add New Movie

1. Go to: https://chalchitraseries.netlify.app/admin
2. Login with admin account
3. Click "Movies" tab
4. Click "Add Movie"
5. Fill in details
6. Upload poster image
7. Click "Save"

### Add Team Member

1. Admin Panel → "Team" tab
2. Click "Add Member"
3. Fill name, role, photo
4. Click "Save"

### View Bookings

1. Admin Panel → "Bookings" tab
2. See all bookings with details
3. Export as PDF if needed

### Send Coupons

1. Admin Panel → "Coupon Winners" tab
2. Click "Share Coupon"
3. Select users
4. Set discount amount
5. Click "Send"

---

## 🐛 Troubleshooting

### Frontend Not Loading

**Check**:
1. Netlify deploy succeeded: https://app.netlify.com/sites/chalchitraseries/deploys
2. Environment variable set: `REACT_APP_API_URL`
3. No build errors in logs

**Fix**:
- Trigger new deploy
- Check build logs for errors

### API Not Responding

**Check**:
1. Render service is running: https://dashboard.render.com
2. Backend health check: https://chalchitra-backend.onrender.com/health
3. Logs show errors

**Fix**:
- Check Render logs for errors
- Restart service if needed
- Verify environment variables

### Google Login Not Working

**Check**:
1. Google Console redirect URIs match:
   ```
   https://chalchitra-backend.onrender.com/api/auth/google/callback
   ```
2. Client ID and Secret correct in Render env vars
3. Browser console for errors

**Fix**:
- Update Google Console URIs
- Update Render environment variables
- Redeploy

### Database Empty

**Check**:
1. Database file exists: Render Shell → `ls -la /data/database.db`
2. Tables created: `sqlite3 /data/database.db ".tables"`

**Fix**:
- Restart service (creates tables automatically)
- Upload database.db if you have existing data

### 500 Server Error

**Check**:
1. Render logs: Dashboard → "Logs" tab
2. Look for error message

**Common causes**:
- Missing environment variable
- Database connection failed
- Invalid Google OAuth credentials

**Fix**:
- Add missing env vars
- Check DATABASE_PATH is `/data/database.db`
- Verify Google credentials

---

## 📊 Monitoring

### Check Service Status

**Render**:
- Dashboard shows: "Deploy succeeded" or "Deploy failed"
- Logs show recent activity

**Netlify**:
- Dashboard shows: "Published" with green checkmark
- Deploy log shows no errors

### View Logs

**Render Logs**:
1. Dashboard → Your service
2. Click "Logs" tab
3. Real-time logs appear

**Netlify Logs**:
1. Dashboard → "Deploys"
2. Click on specific deploy
3. View build log

### Performance

**Render Free Tier**:
- Sleeps after 15 min inactivity
- First request after sleep: ~30 seconds
- Subsequent requests: <1 second

**Upgrade if needed**:
- $7/month for always-on instance
- No cold starts

---

## 🔐 Security

### Never Commit These

- `.env` file
- `database.db` file
- Google OAuth credentials
- Session secrets

### Always Use

- Environment variables for secrets
- `.gitignore` for sensitive files
- Strong SESSION_SECRET (auto-generated in Render)

---

## 📞 Support Links

| Service | Dashboard | Docs | Support |
|---------|-----------|------|---------|
| **Render** | https://dashboard.render.com | https://render.com/docs | https://render.com/docs/support |
| **Netlify** | https://app.netlify.com | https://docs.netlify.com | https://answers.netlify.com |
| **Google OAuth** | https://console.cloud.google.com | https://developers.google.com/identity | - |

---

## ✅ Post-Deployment Checklist

After deploying:

- [ ] Frontend loads: https://chalchitraseries.netlify.app
- [ ] Backend responds: https://chalchitra-backend.onrender.com/health
- [ ] API works: https://chalchitra-backend.onrender.com/api/movies/all
- [ ] Google login works
- [ ] Admin can access admin panel
- [ ] Movies display on homepage
- [ ] Team page shows members
- [ ] Bookings can be created

---

**Last Updated**: January 2024

**Repository**: https://github.com/YOUR_USERNAME/chalchitraseries
