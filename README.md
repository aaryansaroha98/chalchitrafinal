# Chalchitra Series - Movie Screening Website

A full-stack web application for IIT Jammu's student-led movie screening initiative.

## Features

- **Google OAuth Authentication** - Restricted to @iitjammu.ac.in emails
- **Movie Management** - Add, edit, and manage upcoming/past movies
- **Ticket Booking** - Book tickets for up to 6 people with QR code generation
- **QR Code Scanning** - Admin can scan QR codes for entry validation (single-use)
- **Admin Panel** - Comprehensive dashboard for managing movies, bookings, users, team, and gallery
- **Feedback System** - Users can rate and review past movies
- **Gallery** - Display event photos
- **Team Page** - Showcase team members
- **Responsive Design** - Mobile-friendly interface

## Tech Stack

- **Backend**: Node.js, Express.js, SQLite
- **Frontend**: React.js, React Bootstrap
- **Authentication**: Passport.js with Google OAuth 2.0
- **Database**: SQLite3
- **Other**: QRCode generation, file uploads, email sending

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chalchitra-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   ```

4. **Run the application**
   ```bash
   # Development mode - build React app and serve from Express
   npm run build
   npm run server    # Everything on port 3000

   # Or for development with hot reload:
   npm run server    # Backend on port 3000
   # Then open http://localhost:3000 in browser
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Database Schema

The application uses SQLite with the following tables:
- `users` - User accounts (Google OAuth)
- `movies` - Movie listings
- `bookings` - Ticket bookings with QR codes
- `feedback` - Movie ratings and reviews
- `team` - Team member information
- `gallery` - Event photos

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/logout` - Logout
- `GET /api/auth/current_user` - Get current user

### Movies
- `GET /api/movies/upcoming` - Get upcoming movies
- `GET /api/movies/past` - Get past movies
- `GET /api/movies/:id` - Get movie by ID
- `POST /api/movies` - Add movie (admin)
- `PUT /api/movies/:id` - Update movie (admin)
- `DELETE /api/movies/:id` - Delete movie (admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my` - Get user's bookings
- `POST /api/bookings/scan` - Scan QR code (admin)

### Admin
- `GET /api/admin/stats` - Get dashboard stats
- `GET /api/admin/users` - Get all users
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/feedback` - Get all feedback
- `GET /api/admin/team` - Get team members
- `GET /api/admin/gallery` - Get gallery images

## Usage

1. **For Students**:
   - Sign in with IIT Jammu Google account
   - Browse upcoming movies
   - Book tickets (max 6 people)
   - View booking history and download tickets
   - Rate and review past movies

2. **For Admins**:
   - Access admin panel
   - Manage movies (add, edit, move to past)
   - View and manage bookings
   - Scan QR codes for entry
   - Manage team members and gallery
   - View user feedback

## Security Features

- Google OAuth restricted to IIT Jammu emails
- Session-based authentication
- Admin role checking for sensitive operations
- Single-use QR codes for entry validation

## Deployment

The application is ready for deployment on platforms like Heroku, Vercel, or traditional servers. Make sure to set environment variables for production.

## Contributing

This is a student project for IIT Jammu. For contributions or issues, please contact the Chalchitra team.

## License

ISC License
