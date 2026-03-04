// Mock react-router-dom before any imports
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: () => <div>Route</div>,
  useLocation: () => ({
    pathname: '/'
  }),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
  Navigate: () => <div>Navigate</div>,
}));

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock contexts
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: { name: 'Test User' }
  })
}));

// Mock components
jest.mock('./components/Navbar', () => () => <nav role="navigation">Navbar</nav>);
jest.mock('./components/Footer', () => () => <footer>Footer</footer>);

// Mock pages
jest.mock('./pages/Home', () => () => <div>Home Page</div>);
jest.mock('./pages/UpcomingMovies', () => () => <div>Upcoming Movies</div>);
jest.mock('./pages/PastMovies', () => () => <div>Past Movies</div>);
jest.mock('./pages/Gallery', () => () => <div>Gallery</div>);
jest.mock('./pages/Team', () => () => <div>Team</div>);
jest.mock('./pages/Contact', () => () => <div>Contact</div>);
jest.mock('./pages/Booking', () => () => <div>Booking</div>);
jest.mock('./pages/Payment', () => () => <div>Payment</div>);
jest.mock('./pages/PaymentSuccess', () => () => <div>Payment Success</div>);
jest.mock('./pages/MyBookings', () => () => <div>My Bookings</div>);
jest.mock('./pages/AdminPanel', () => () => <div>Admin Panel</div>);
jest.mock('./pages/TeamScanner', () => () => <div>Team Scanner</div>);
jest.mock('./pages/Scanner', () => () => <div>Scanner</div>);
jest.mock('./pages/Login', () => () => <div>Login</div>);
jest.mock('./pages/PrivacyPolicy', () => () => <div>Privacy Policy</div>);
jest.mock('./pages/TermsOfService', () => () => <div>Terms of Service</div>);
jest.mock('./pages/RefundPolicy', () => () => <div>Refund Policy</div>);
