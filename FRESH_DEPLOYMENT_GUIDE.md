# FRESH DEPLOYMENT GUIDE - Chalchitra Website

**Platform**: Backend on Render, Frontend on Netlify  
**Last Updated**: February 2025

---

## STEP 1: Local Preparation

### 1.1 Clean Up Current Project
```bash
# Remove nested folder structure
cd /Users/aaryansaroha/Desktop/Projects/Chalchitra_Series

# Remove the nested Chalchitra Website folder
rm -rf "Chalchitra Website"

# Remove database and node_modules
rm -rf database.db node_modules package-lock.json

# Remove old git history
rm -rf .git
```

### 1.2 Create Fresh Project Structure
```
Chalchitra_Series/
├── client/              (React frontend - move here)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── build/          (will be created after build)
├── server/             (Node.js backend)
│   ├── routes/
│   ├── utils/
│   ├── index.js
│   ├── database.js
│   └── package.json
├── public/             (Static files)
├── uploads/            (File uploads)
├── .env                (Environment variables)
├── .gitignore
└── README.md
```

### 1.3 Move Files to Proper Locations
```bash
# Move client files to root
mv "Chalchitra Website/client" .

# Move server files to root
mv "Chalchitra Website/server" .

# Move public folder
mv "Chalchitra Website/public" .

# Move uploads folder
mv "Chalchitra Website/uploads" .

# Remove the now empty nested folder
rm -rf "Chalchitra Website"
```

---

## STEP 2: Backend Configuration

### 2.1 Create Server package.json
```json
{
  "name": "chalchitra-server",
  "version": "1.0.0",
  "description": "Chalchitra IIT Jammu - Backend Server",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "sequelize": "^6.37.0",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "body-parser": "^1.20.2",
    "express-session": "^1.17.3",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "nodemailer": "^6.9.8",
    "multer": "^1.4.5-lts.1",
    "qrcode": "^1.5.3",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### 2.2 Update server/index.js for Production
```javascript
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Database setup
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(
  process.env.DATABASE_URL,
  {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false
  }
);

// Test database connection
sequelize.authenticate()
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection error:', err));

// Make sequelize available globally
global.sequelize = sequelize;

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/foods', require('./routes/foods'));
app.use('/api/team', require('./routes/team'));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});
```

---

## STEP 3: Frontend Configuration

### 3.1 Update client/src/api/axios.js
```javascript
import axios from 'axios';

const apiBaseUrl = process.env.REACT_APP_API_URL || 
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'production' 
    ? 'https://your-render-backend.onrender.com' 
    : 'http://localhost:3000');

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default api;
```

### 3.2 Create client/.env.production
```
REACT_APP_API_URL=https://your-render-backend.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_RAZORPAY_KEY_ID=your-razorpay-key
```

### 3.3 Create client/public/_redirects (for React Router)
```
/* /index.html 200
```

---

## STEP 4: Environment Variables

### 4.1 Create .env file
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Session Secret (generate a strong random string)
SESSION_SECRET=your-super-secret-session-key-min-32-chars

# Database Configuration (Render PostgreSQL)
DATABASE_URL=postgresql://user:password@hostname:5432/database_name

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
SENDER_NAME=Chalchitra IIT Jammu

# Frontend URL (Netlify)
FRONTEND_URL=https://your-netlify-site.netlify.app
```

### 4.2 Create .gitignore
```
node_modules/
.env
.env.local
.env.production
database.db
*.log
.DS_Store
uploads/*
!uploads/.gitkeep
client/build/
client/node_modules/
```

---

## STEP 5: GitHub Setup

### 5.1 Initialize Git Repository
```bash
cd /Users/aaryansaroha/Desktop/Projects/Chalchitra_Series

# Initialize git
git init

# Create .gitignore
touch .gitignore
# (Add content from section 4.2)

# Stage all files
git add .

# Create initial commit
git commit -m "Initial commit - Fresh deployment setup"

# Create GitHub repo and push
gh repo create chalchitra-website --public --source=. --push
```

---

## STEP 6: Backend Deployment (Render)

### 6.1 Create Render Account
1. Go to https://dashboard.render.com
2. Sign up with GitHub
3. Authorize Render access to your repos

### 6.2 Create PostgreSQL Database
1. In Render Dashboard, click "New +" → "PostgreSQL"
2. Configure:
   - Name: `chalchitra-db`
   - Database: `chalchitra`
   - User: `chalchitra_user`
3. Copy the "External Database URL" (you'll need this for environment variables)
4. Click "Create Database"

### 6.3 Create Web Service for Backend
1. In Render Dashboard, click "New +" → "Web Service"
2. Select your GitHub repository: `yourusername/chalchitra-website`
3. Configure:
   - Name: `chalchitra-backend`
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Click "Create Web Service"

### 6.4 Configure Environment Variables
1. In your Web Service, go to "Environment" tab
2. Add the following variables:
   ```
   PORT=3000
   NODE_ENV=production
   SESSION_SECRET=your-super-secret-session-key
   DATABASE_URL=postgresql://user:password@hostname:5432/database_name
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-key-secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   SENDER_NAME=Chalchitra IIT Jammu
   FRONTEND_URL=https://your-netlify-site.netlify.app
   ```
3. Click "Save Changes"

### 6.5 Deploy Backend
1. Render will automatically build and deploy
2. Monitor the logs for any errors
3. Once deployed, your backend URL will be: `https://chalchitra-backend.onrender.com`

---

## STEP 7: Frontend Deployment (Netlify)

### 7.1 Create Netlify Account
1. Go to https://app.netlify.com
2. Sign up with GitHub
3. Authorize Netlify access to your repos

### 7.2 Deploy Frontend
1. Click "Add new site" → "Import an existing project"
2. Select your GitHub repository: `yourusername/chalchitra-website`
3. Configure:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/build`
4. Click "Deploy site"

### 7.3 Configure Environment Variables
1. In Netlify Dashboard, go to Site Settings → Environment Variables
2. Add:
   ```
   REACT_APP_API_URL=https://chalchitra-backend.onrender.com
   REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
   REACT_APP_RAZORPAY_KEY_ID=your-razorpay-key-id
   ```
3. Click "Save"

### 7.4 Trigger Rebuild
1. Go to "Deploys" tab
2. Click "Trigger deploy" → "Deploy site"
3. Wait for build to complete

### 7.5 Configure Site Settings
1. Go to Site Settings → Domain Management
2. Add your custom domain (optional)
3. Netlify will automatically configure SSL

---

## STEP 8: Testing

### 8.1 Test Backend API
```bash
# Test health endpoint
curl https://chalchitra-backend.onrender.com/health

# Expected response:
# {"status":"ok","timestamp":"2025-02-10T12:00:00.000Z","environment":"production"}
```

### 8.2 Test Frontend
1. Open your Netlify URL: `https://your-site.netlify.app`
2. Check if pages load correctly
3. Test user registration/login
4. Test booking flow
5. Test admin panel access

### 8.3 Test API Communication
1. Open browser developer console (F12)
2. Check Network tab for API calls
3. Verify requests go to: `https://chalchitra-backend.onrender.com`

---

## TROUBLESHOOTING

### Issue: Build Failures
- Check Render/Netlify build logs
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### Issue: Database Connection Errors
- Verify DATABASE_URL is correct
- Check if PostgreSQL is ready
- Ensure security group allows connections

### Issue: CORS Errors
- Verify FRONTEND_URL in backend .env
- Check CORS configuration in server/index.js
- Ensure frontend URL matches exactly

### Issue: API Calls Failing
- Verify REACT_APP_API_URL in Netlify
- Check if backend is running
- Monitor backend logs for errors

---

## IMPORTANT NOTES

1. **Database**: SQLite won't work on Render. You MUST use PostgreSQL.

2. **Session Secret**: Use a strong random string (32+ characters). Generate with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Google OAuth**: 
   - Go to Google Cloud Console
   - Add your Netlify domain to "Authorized JavaScript origins"
   - Add your Netlify domain to "Authorized redirect URIs"

4. **Razorpay**: 
   - Use test mode for development
   - Switch to live mode for production

5. **Email**: 
   - Use Gmail App Password instead of regular password
   - Enable 2-factor authentication and generate app password

---

## SUPPORT

For issues:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check Netlify logs: Dashboard → Deploys → View deploy logs
3. Verify all environment variables are set correctly
4. Ensure database is accessible from Render

Good luck with your deployment! 🚀

