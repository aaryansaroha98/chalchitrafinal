# 🚀 Deployment Steps for Chalchitra Website

## Complete Step-by-Step Guide

---

## STEP 1: Create GitHub Repository (Do this first)

1. Go to https://github.com and sign in
2. Click **New Repository** (green button)
3. Repository name: `chalchitra-website`
4. Description: "Chalchitra - Movie Booking Website"
5. Select **Public**
6. Click **Create Repository** (don't initialize with README)

---

## STEP 2: Push Code to GitHub

Run these commands in terminal:

```bash
cd /Users/aaryansaroha/Desktop/Projects/Chalchitra\ Website

# Add remote origin (replace YOUR_GITHUB_USERNAME with your username)
git remote set-url origin https://github.com/YOUR_GITHUB_USERNAME/chalchitra-website.git

# Stage and commit
git add .
git commit -m "Prepare for deployment"

# Push to GitHub
git push -u origin main
```

**Check:** Go to your GitHub repository URL to confirm code is uploaded.

---

## STEP 3: Deploy Backend on Render

### 3.1 Create Render Account
1. Go to https://render.com
2. Click **Sign Up** → Use **GitHub** to sign in
3. Authorize Render to access your GitHub

### 3.2 Create PostgreSQL Database
1. Click **New +** → **PostgreSQL**
2. Configure:
   - **Name**: `chalchitra-db`
   - **Database User**: `chalchitra`
   - **Plan**: **Free**
3. Click **Create Database**
4. **IMPORTANT**: Copy the "Internal Database URL" (格式: `postgres://...`)

### 3.3 Create Web Service for Backend
1. Click **New +** → **Web Service**
2. Connect your GitHub repository: `YOUR_USERNAME/chalchitra-website`
3. Configure:
   - **Name**: `chalchitra-api`
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
4. Click **Create Web Service**

### 3.4 Add Environment Variables on Render
After service is created, go to **Environment** tab and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | `postgres://...` (from step 3.2) |
| `SESSION_SECRET` | `any-random-string-at-least-32-chars` |
| `GOOGLE_CLIENT_ID` | `your-google-oauth-client-id` |
| `GOOGLE_CLIENT_SECRET` | `your-google-oauth-client-secret` |
| `GOOGLE_CALLBACK_URL` | `https://chalchitra-api.onrender.com/api/auth/google/callback` |
| `FRONTEND_URL` | `https://your-netlify-site.netlify.app` |

5. Click **Save Changes**
6. Click **Deploy** → **Deploy latest commit**

### 3.5 Wait for Deployment
- Wait 2-5 minutes for build to complete
- Check logs for any errors
- Your backend URL: `https://chalchitra-api.onrender.com`

---

## STEP 4: Deploy Frontend on Netlify

### 4.1 Create Netlify Account
1. Go to https://netlify.com
2. Click **Sign Up** → Use **GitHub** to sign in
3. Authorize Netlify to access your GitHub

### 4.2 Deploy Frontend
1. Click **Add new site** → **Import an existing project**
2. Select your GitHub repository: `YOUR_USERNAME/chalchitra-website`
3. Configure:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/build`
4. Click **Deploy site**

### 4.3 Add Environment Variable
1. Go to **Site Settings** → **Environment Variables**
2. Add:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://chalchitra-api.onrender.com`
3. Click **Save**
4. Go to **Deploys** → **Trigger deploy** → **Deploy latest commit**

### 4.4 Note Your Frontend URL
- Your site URL: `https://random-name.netlify.app`
- Rename in **Site Settings** → **Change site name**

---

## STEP 5: Connect GoDaddy Domain

### 5.1 Add Domain in Netlify
1. Go to Netlify → **Domain Management** → **Add custom domain**
2. Enter your domain: `chalchitra.com` (without www)
3. Click **Yes, add domain**
4. Netlify will show you nameservers to use

### 5.2 Update GoDaddy Nameservers
1. Go to https://godaddy.com and sign in
2. Go to **DNS** → **Nameservers**
3. Replace current nameservers with:
   ```
   dns1.p01.nsone.net
   dns2.p01.nsone.net
   dns3.p01.nsone.net
   dns4.p01.nsone.net
   ```
4. Click **Save**

### 5.3 Wait for DNS Propagation
- DNS changes take 24-48 hours (usually within 1-2 hours)
- Check status at: https://dnschecker.org

### 5.4 SSL Certificate
- Netlify automatically provisions SSL
- Wait 5-10 minutes after DNS propagates
- Check: https://www.yourdomain.com (should show 🔒 lock icon)

---

## STEP 6: Update Final URLs

### 6.1 Update Render Environment Variables
In Render dashboard, update:
| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://www.yourdomain.com` |

### 6.2 Update Google OAuth Console
1. Go to https://console.cloud.google.com
2. Select your project
3. Go to **Credentials** → **OAuth 2.0 Client IDs**
4. Add to **Authorized redirect URIs**:
   ```
   https://chalchitra-api.onrender.com/api/auth/google/callback
   https://yourdomain.com/api/auth/google/callback
   ```
5. Add to **Authorized JavaScript origins**:
   ```
   https://chalchitra-api.onrender.com
   https://yourdomain.com
   ```
6. Click **Save**

---

## STEP 7: Test Your Deployment

Test these URLs:
1. Backend: `https://chalchitra-api.onrender.com/api/movies`
2. Frontend: `https://www.yourdomain.com`
3. Google Login
4. Movie browsing
5. Booking flow

---

## ✅ Final Checklist

- [ ] GitHub repository created and code pushed
- [ ] Render PostgreSQL database created
- [ ] Render web service deployed and running
- [ ] All environment variables set on Render
- [ ] Netlify site deployed
- [ ] Environment variable set on Netlify
- [ ] Custom domain connected
- [ ] SSL certificate active (HTTPS working)
- [ ] Google OAuth callback URLs updated
- [ ] All features tested

---

## 🔧 Troubleshooting

**If deployment fails:**
- Check logs in Render/Netlify dashboard
- Ensure all environment variables are set
- Restart service after adding env vars

**If CORS errors:**
- Verify `FRONTEND_URL` in Render is correct
- Restart Render service after changes

**If domain not working:**
- Wait 24-48 hours for DNS propagation
- Check nameservers are correct
- Verify SSL certificate in Netlify

---

## 📝 Your Deployment URLs

Fill in your actual URLs:

| Service | Your URL |
|---------|----------|
| GitHub | `https://github.com/YOUR_USERNAME/chalchitra-website` |
| Backend (Render) | `https://chalchitra-api.onrender.com` |
| Frontend (Netlify) | `https://YOUR_SITE.netlify.app` |
| Custom Domain | `https://www.YOUR_DOMAIN.com` |

---

*Created for Chalchitra Website Deployment*

