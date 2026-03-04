# Duplicate Booking Check Feature

This feature prevents users from booking tickets multiple times for the same movie.

## Changes Made:

### 1. Server-side (bookings.js)
- Added `GET /api/bookings/check/:movieId` endpoint to check if user has already booked a specific movie
- Returns booking details if found, or null if not booked

### 2. Client-side (Booking.js)
- Added state for `hasExistingBooking` and `showAlreadyBookedModal`
- Added `existingBooking` state to store the booking details
- Added `fetchUserBookings()` function to check for existing bookings on mount
- Added `AlreadyBookedModal` component that shows when user has already booked
- Modal includes:
  - Message: "You have already booked tickets for this movie"
  - Booking details (booking ID, seats, date, venue)
  - "View My Bookings" button
  - "Close" button

## User Flow:
1. User clicks "Book Ticket" for a movie
2. On Booking page load, the system checks if user has already booked this movie
3. If YES: Show modal with "You already booked the ticket for this movie" message
4. If NO: Show normal seat selection and booking flow

## Testing:
1. Book a ticket for any movie
2. Go back and try to book the same movie again
3. You should see the popup: "You already booked the ticket for this movie"

