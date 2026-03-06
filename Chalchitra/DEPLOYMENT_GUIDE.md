# 🚀 Complete Deployment Guide for Beginners

## No Coding Required - Just Follow These Steps!

---

## 📋 Table of Contents

1. [What You'll Deploy](#what-youll-deploy)
2. [Step 1: Push Code to GitHub](#step-1-push-code-to-github)
3. [Step 2: Create Render Account](#step-2-create-render-account)
4. [Step 3: Deploy Backend on Render](#step-3-deploy-backend-on-render)
5. [Step 4: Create Netlify Account](#step-4-create-netlify-account)
6. [Step 5: Deploy Frontend on Netlify](#step-5-deploy-frontend-on-netlify)
7. [Step 6: Connect GoDaddy Domain](#step-6-connect-godaddy-domain)
8. [Testing Your Website](#testing-your-website)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 What You'll Deploy

| Part | Service | What It Does |
|------|---------|--------------|
| **Backend** | Render.com | Runs your server, handles bookings, payments, login |
| **Frontend** | Netlify.com | Shows your website to visitors |
| **Domain** | GoDaddy.com | Your website address (like chalchitra.com) |

---

## Step 1: Push Code to GitHub

### 1.1 Create GitHub Account

1. Open: **https://github.com**
2. Click **Sign up**
3. Fill in:
   - Username (write this down!)
   - Email
   - Password
4. Complete the verification
5. Verify your email

### 1.2 Create New Repository

1. After logging in, click **+** in top-right corner → **New repository**
2. **Repository name**: `chalchitra-website`
3. **Public** should be selected
4. Click **Create repository**

### 1.3 Push Your Code

**NOTE:** If your code is already on GitHub at `https://github.com/aaryansaroha98/chalchitra-website.git`, you can skip this step!

If you need to push your code, open **Terminal** and run:

```bash
# Navigate to your project folder
cd /Users/aaryansaroha/Desktop/Projects/Chalchitra\ Website

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial deployment commit"

# Rename your branch to main
git branch -M main

# Add your GitHub repository
git remote add origin https://github.com/aaryansaroha98/chalchitra-website.git

# Push code to GitHub
git push -u origin main
```

**🎉 Your code is now on GitHub!**

---

## Step 2: Create Render Account

### 2.1 Sign Up for Render

1. Open: **https://render.com**
2. Click **Sign Up**
3. Choose **Continue with GitHub** (easiest!)
4. Click **Authorize Render**
5. Complete your account setup

### 2.2 Verify Email

1. Check your email for a message from Render
2. Click the verification link

---

## Step 3: Deploy Backend on Render

### 3.1 Create PostgreSQL Database

1. After logging into Render, click **New +** (blue button)
2. Click **PostgreSQL**
3. Fill in the form:
   ```
   Name: chalchitra-db
   Database: chalchitra
   User: chalchitra_user
   ```
4. **Important**: Under "Plan", select **Free** (smallest option)
5. Click **Create Database**
6. ⏳ Wait 1-2 minutes for it to be ready (status will turn green)
7. **COPY** the "Internal Database URL" - you'll need this later!
   - It looks like: `postgres://user:password@host/chalchitra`

### 3.2 Deploy Backend Web Service

1. Click **New +** (blue button)
2. Click **Web Service**
3. Scroll down and find **Build and Deploy Settings**
4. Configure exactly like this:

   | Setting | Value |
   |---------|-------|
   | Owner | Your GitHub account |
   | Repository | `chalchitra-website` |
   | Branch | `main` |
   | Root Directory | (leave empty) |
   | Build Command | `npm install` |
   | Start Command | `npm start` |

5. Click **Create Web Service**
6. Wait 2-3 minutes for deployment to finish

### 3.3 Add Environment Variables

1. On the left sidebar, click **Environment**
2. Scroll down to "Environment Variables"
3. Click **Add**
4. Add these variables one by one:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |
   | `SESSION_SECRET` | `Type any random words here like: my-secret-key-12345` |
   | `DATABASE_URL` | Paste the URL from Step 3.1 |
   | `FRONTEND_URL` | `https://your-site.netlify.app` (we'll get this later!) |

5. After adding all, click **Save Changes**
6. Wait for the service to redeploy (2-3 minutes)

### 3.4 Get Your Backend URL

1. Look at the top of the page - you'll see something like:
   ```
   https://chalchitra-backend.onrender.com
   ```
2. Copy this URL - you'll need it for the frontend!

### 3.5 Test Your Backend

1. Open a new browser tab
2. Paste your backend URL and add `/health` at the end:
   ```
   https://your-backend-name.onrender.com/health
   ```
3. You should see:
   ```json
   {"status":"ok","timestamp":"...","environment":"production"}
   ```

**🎉 Backend is deployed! Move to next step!**

---

## Step 4: Create Netlify Account

### 4.1 Sign Up for Netlify

1. Open: **https://netlify.com**
2. Click **Sign Up**
3. Choose **Continue with GitHub**
4. Click **Authorize Netlify**
5. Complete your account setup

### 4.2 Verify Email

1. Check your email for Netlify verification
2. Click the link to verify

---

## Step 5: Deploy Frontend on Netlify

### 5.1 Connect Your Repository

1. After logging into Netlify, click **Add new site**
2. Click **Import an existing project**
3. Click **GitHub** under "Connect to Git provider"
4. Select your `chalchitra-website` repository

### 5.2 Configure Build Settings

On the next screen, configure exactly like this:

| Setting | Value |
|---------|-------|
| Branch to deploy | `main` |
| Base directory | `client` |
| Build command | `npm install && npm run build` |
| Publish directory | `build` |

**It should look like this:**
```
🔨 Build command:         npm install && npm run build
📂 Publish directory:     build
```

5. Click **Deploy**

### 5.3 Wait for Deployment

⏳ This takes 3-5 minutes. You'll see a progress bar.

### 5.4 Add Environment Variable

1. After deployment, click **Site settings** (left sidebar)
2. Click **Environment variables**
3. Click **Add variable**
4. Add:
   - Key: `REACT_APP_API_URL`
   - Value: Your backend URL from Step 3.4 (like `https://chalchitra-backend.onrender.com`)
5. Click **Save**
6. Go back to **Deploys** (left sidebar)
7. Click **Trigger deploy** → **Deploy site**
8. Wait 2-3 minutes for redeploy

### 5.5 Get Your Frontend URL

1. Look at the top of the page
2. You'll see something like: `https://random-name.netlify.app`
3. This is your website URL!

### 5.6 Update Backend with Frontend URL

1. Go back to **Render Dashboard**
2. Click your backend service
3. Click **Environment**
4. Find `FRONTEND_URL` and update it with your Netlify URL
5. Click **Save Changes**
6. Wait for redeploy

**🎉 Frontend is deployed! Now connect your domain!**

---

## Step 6: Connect GoDaddy Domain

### 6.1 Get Netlify Nameservers

1. In Netlify, click **Domain management** (left sidebar)
2. Click **Add custom domain**
3. Type your GoDaddy domain (like `chalchitra.com`)
4. Click **Verify**
5. Netlify will show you 4 nameservers that look like:
   ```
   dns1.p01.nsone.net
   dns2.p01.nsone.net
   dns3.p01.nsone.net
   dns4.p01.nsone.net
   ```
6. Copy all 4 nameservers (write them down!)

### 6.2 Change Nameservers in GoDaddy

1. Open: **https://godaddy.com**
2. Log in to your account
3. Click **My Products** → **Domains**
4. Find your domain and click **Manage DNS**
5. Scroll down to **Nameservers**
6. Click **Change**
7. Select **Enter my own nameservers**
8. Enter the 4 nameservers from Netlify (one per box)
9. Click **Save**

### 6.3 Wait for DNS Propagation

⚠️ **This takes 24-48 hours!** But sometimes it happens in 1-2 hours.

To check if your domain is working:
1. Open: **https://dnschecker.org**
2. Enter your domain
3. If most checks show green ✓, your domain is ready!

---

## 🔄 What to Update After Domain Works

Once your domain is active:

1. **In Render:**
   - Update `FRONTEND_URL` to: `https://yourdomain.com`

2. **In Netlify:**
   - Your site should automatically use the custom domain

3. **Test your website:**
   - Open: `https://yourdomain.com`
   - Should show your Chalchitra website!

---

## 📞 Testing Your Website

### Test Checklist

| Test | What to Do | Expected Result |
|------|------------|-----------------|
| Homepage | Open your URL | See the hero video and movie posters |
| Login | Click Login button | Google login should work |
| API | Add `/api/movies` to URL | See JSON list of movies |
| Health | Add `/health` to URL | See `{"status":"ok"}` |

### If Something Doesn't Work...

**Frontend shows "loading" or error:**
- Check if Netlify deployed correctly
- Verify `REACT_APP_API_URL` is set

**Backend not responding:**
- Check Render logs (click "Logs" in left sidebar)
- Verify all environment variables are set

**Google Login not working:**
- You need to configure Google OAuth (see below)

---

## 🔐 Setting Up Google Login (Required)

### 7.1 Create Google Cloud Project

1. Open: **https://console.cloud.google.com**
2. Click **Select project** → **New Project**
3. Name: `chalchitra`
4. Click **Create**

### 7.2 Enable Google+ API

1. In left sidebar, click **APIs & Services** → **Library**
2. Search for **Google+ API** or **Google People API**
3. Click it → **Enable**

### 7.3 Create OAuth Credentials

1. Click **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Configure consent screen:
   - Application name: `Chalchitra`
   - User support email: your email
   - Click **Save**

4. Back on OAuth client page:
   - Application type: **Web application**
   - Name: `Chalchitra Web`
   - Authorized redirect URIs:
     ```
     https://your-backend.onrender.com/api/auth/google/callback
     http://localhost:3000/api/auth/google/callback
     ```
   - Authorized JavaScript origins:
     ```
     https://your-backend.onrender.com
     http://localhost:3000
     ```

5. Click **Create**
6. Copy your **Client ID** and **Client Secret**

### 7.4 Add to Render Environment Variables

1. Go to Render Dashboard → Your Backend → **Environment**
2. Add:
   ```
   GOOGLE_CLIENT_ID = your-client-id-here
   GOOGLE_CLIENT_SECRET = your-client-secret-here
   GOOGLE_CALLBACK_URL = https://your-backend.onrender.com/api/auth/google/callback
   ```
3. Click **Save Changes**
4. Wait for redeploy

**🎉 Google Login should now work!**

---

## 🆘 Troubleshooting

### "502 Bad Gateway" Error
- Your backend crashed
- Check logs in Render: Click **Logs** in left sidebar
- Common cause: Missing environment variable

### "Cannot Read Property of Undefined"
- Frontend can't connect to backend
- Check `REACT_APP_API_URL` in Netlify environment variables

### Google Login Shows Error
- Google OAuth not configured correctly
- Check callback URLs in Google Cloud Console
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Render

### Domain Not Working After 48 Hours
- Double-check nameservers in GoDaddy
- Contact GoDaddy support
- Use a DNS checker to verify propagation

### Changes Not Showing
- Click **Trigger Deploy** in Netlify to rebuild
- Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)

---

## 📝 Environment Variables Summary

### Render (Backend)

| Variable | Where to Get |
|----------|--------------|
| `DATABASE_URL` | From PostgreSQL in Render |
| `SESSION_SECRET` | Type any random words |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `FRONTEND_URL` | Your Netlify URL |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |

### Netlify (Frontend)

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | Your Render backend URL |

---

## 🔒 Security Reminders

⚠️ **Never share these:**
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`
- `DATABASE_URL`

These give full access to your website!

---

## ✅ Final Checklist

Before launching:

- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created on Render
- [ ] Backend deployed on Render
- [ ] Backend health check works
- [ ] Frontend deployed on Netlify
- [ ] Frontend shows your website
- [ ] Google OAuth configured
- [ ] Domain connected
- [ ] Domain resolves correctly
- [ ] Login works
- [ ] You can view movies
- [ ] You can make bookings

---

## 📞 Get Help

If stuck:

1. **Render Documentation:** https://render.com/docs
2. **Netlify Documentation:** https://docs.netlify.com
3. **Google Cloud Help:** https://developers.google.com/identity/protocols/oauth2

---

## 🎉 CONGRATULATIONS!

Your website is now live! 🎊

Share your URL with everyone!

