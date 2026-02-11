# Chalchitra Website - Fresh Deployment Plan

## Current Issues Identified:
1. Nested project structure causing path issues
2. SQLite database (needs PostgreSQL for Render)
3. Hardcoded localhost API URL in frontend
4. Environment variables not properly configured for production

## Deployment Architecture:
- **Backend**: Render (Node.js with PostgreSQL)
- **Frontend**: Netlify (React static build)

## TODO List:

### Phase 1: Project Structure Fixes
- [ ] 1.1 Clean up nested folder structure
- [ ] 1.2 Move client/ and server/ to root level
- [ ] 1.3 Fix all import paths in server files

### Phase 2: Backend Configuration
- [ ] 2.1 Update server/index.js for production
- [ ] 2.2 Switch from SQLite to PostgreSQL
- [ ] 2.3 Create production environment variables
- [ ] 2.4 Configure CORS for Netlify domain
- [ ] 2.5 Create PostgreSQL database on Render

### Phase 3: Frontend Configuration
- [ ] 3.1 Update axios.js for production API URL
- [ ] 3.2 Add environment variable for REACT_APP_API_URL
- [ ] 3.3 Build React app locally
- [ ] 3.4 Create _redirects file for React Router

### Phase 4: GitHub Setup
- [ ] 4.1 Initialize fresh git repository
- [ ] 4.2 Create .gitignore file
- [ ] 4.3 Push to GitHub

### Phase 5: Backend Deployment (Render)
- [ ] 5.1 Connect GitHub repo to Render
- [ ] 5.2 Create Web Service for backend
- [ ] 5.3 Configure environment variables
- [ ] 5.4 Create PostgreSQL database on Render
- [ ] 5.5 Deploy and test

### Phase 6: Frontend Deployment (Netlify)
- [ ] 6.1 Connect GitHub repo to Netlify
- [ ] 6.2 Configure build settings
- [ ] 6.3 Add environment variables
- [ ] 6.4 Deploy and test

### Phase 7: Testing & Verification
- [ ] 7.1 Test all API endpoints
- [ ] 7.2 Test frontend pages
- [ ] 7.3 Verify payment flow
- [ ] 7.4 Verify email functionality

## Quick Links:
- Render Dashboard: https://dashboard.render.com
- Netlify Dashboard: https://app.netlify.com
- GitHub: https://github.com

