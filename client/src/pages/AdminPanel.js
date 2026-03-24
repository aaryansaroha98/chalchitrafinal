import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Tab, Tabs, Table, Modal, Form, Badge } from 'react-bootstrap';
import api from '../api/axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import Loader from '../components/Loader';
import { getMovieStatus } from '../utils/movieStatus';

// Configure axios to send cookies with requests
api.defaults.withCredentials = true;

// Helper function to get the full team image URL
const getTeamImageUrl = (url) => {
  if (!url) return '/placeholder-movie.jpg';
  if (url.startsWith('http')) return url;
  // Handle paths - if starts with /, use as-is, otherwise add /team/ prefix
  if (url.startsWith('/')) return `${window.location.origin}${url}`;
  return `${window.location.origin}/team/${url}`;
};

// Helper function to get the full gallery image URL
const getGalleryImageUrl = (url) => {
  if (!url) return '/placeholder-movie.jpg';
  if (url.startsWith('http')) return url;
  // Handle paths - if starts with /, use as-is, otherwise add /gallery/ prefix
  if (url.startsWith('/')) return `${window.location.origin}${url}`;
  return `${window.location.origin}/gallery/${url}`;
};

const formatExactJoinDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

const normalizeGalleryEventDate = (value) => {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const trimmed = String(value).trim();
  if (!trimmed) return '';

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (slashMatch) {
    const part1 = Number(slashMatch[1]);
    const part2 = Number(slashMatch[2]);
    const year = slashMatch[3];
    let day = part1;
    let month = part2;

    if (part1 <= 12 && part2 > 12) {
      day = part2;
      month = part1;
    }

    const monthSafe = String(Math.max(1, Math.min(12, month))).padStart(2, '0');
    const daySafe = String(Math.max(1, Math.min(31, day))).padStart(2, '0');
    return `${year}-${monthSafe}-${daySafe}`;
  }

  return '';
};

const getGalleryDateInputValue = (image, overrides) => {
  if (!image?.id) return '';
  if (overrides && Object.prototype.hasOwnProperty.call(overrides, image.id)) {
    return overrides[image.id] || '';
  }
  return normalizeGalleryEventDate(image.event_date) || '';
};

const parseGalleryDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { date: value, forceUTC: false };
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return {
        date: new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))),
        forceUTC: true
      };
    }
    const normalized = trimmed.replace(' ', 'T');
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) return null;
    return { date: parsed, forceUTC: false };
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return { date: parsed, forceUTC: false };
};

const formatGalleryDisplayDate = (eventDate) => {
  const parsed = parseGalleryDate(eventDate);
  if (!parsed) return 'Date not available';
  const { date, forceUTC } = parsed;
  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };
  if (forceUTC) {
    options.timeZone = 'UTC';
  }
  return date.toLocaleDateString('en-IN', options);
};

const AdminPanel = () => {
  console.log('🔧 AdminPanel component starting...');

  const [stats, setStats] = useState({ total_users: 0, total_movies: 0, upcoming_movies: 0, total_bookings: 0, recent_bookings: 0 });

  // Revenue stats for Database Management (Config tab)
  const [revenueStats, setRevenueStats] = useState({
    total_revenue: 0,
    food_revenue: 0,
    total_discounts: 0,
    total_bookings: 0,
    revenue_by_movie: [],
    recent_transactions: [],
    monthly_revenue: [],
    payment_methods: []
  });
  const [revenueLoading, setRevenueLoading] = useState(false);

  const [movies, setMovies] = useState([]);
  const [pastMovies, setPastMovies] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [team, setTeam] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [couponWinners, setCouponWinners] = useState([]);
  const [bookingsWithFood, setBookingsWithFood] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase: '',
    max_discount: '',
    usage_limit: '',
    expiry_date: ''
  });
  const [settings, setSettings] = useState({
    tagline: 'Student-led movie screening initiative at IIT Jammu',
    hero_background: '#007bff'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasConfigAccess, setHasConfigAccess] = useState(false);
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    date: '',
    venue: '',
    price: '',
    category: '',
    duration: '',
    imdb_rating: '',
    language: '',
    poster: null,
    availableFoods: [],
    is_special: 0,
    special_message: ''
  });
  const [selectedFoodsForMovie, setSelectedFoodsForMovie] = useState([]);
  const [freeFoodIds, setFreeFoodIds] = useState([]);
  const [availableFoods, setAvailableFoods] = useState([]);
  const [teamForm, setTeamForm] = useState({
    name: '', student_id: '', photo: null, photo_url: '', role: '', section: 'foundation_team', display_order: 0
  });
  const [foods, setFoods] = useState([]);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [foodForm, setFoodForm] = useState({
    name: '', description: '', price: '', image: null, is_available: true
  });
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryForm, setGalleryForm] = useState({
    event_name: '',
    event_date: '',
    image: null
  });
  const [galleryDateEdits, setGalleryDateEdits] = useState({});
  const [settingsForm, setSettingsForm] = useState({
    tagline: 'Student-led movie screening initiative at IIT Jammu',
    hero_background: '#007bff',
    hero_background_image: null,
    hero_background_video: null,
    about_text: 'Chalchitra Series is a pioneering student-led initiative at IIT Jammu dedicated to bringing world-class cinematic experiences to our vibrant campus community. Founded with the vision to create a cultural hub on campus, we organize premium movie screenings featuring a diverse collection of films - from timeless classics to contemporary blockbusters, independent gems to international masterpieces. Our mission goes beyond entertainment; we strive to foster a thriving cultural atmosphere that enriches the lives of IIT Jammu students, providing affordable access to quality cinema while creating memorable experiences that bring our community together. Through innovation, dedication, and a passion for storytelling, Chalchitra Series continues to be the heartbeat of cinematic culture at IIT Jammu, creating lasting memories one screening at a time.',
    about_image: null
  });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [singleEmailSearch, setSingleEmailSearch] = useState('');
  const [emailRecipientMode, setEmailRecipientMode] = useState('user');
  const [feedbackMovieId, setFeedbackMovieId] = useState('');
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [bulkEmailSearch, setBulkEmailSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [emailForm, setEmailForm] = useState({
    user_id: '',
    recipient_name: '',
    email: '',
    subject: '',
    message: '',
    attachment_name: '',
    attachment_type: '',
    attachment_base64: ''
  });
  const [bulkEmailForm, setBulkEmailForm] = useState({
    subject: '',
    message: ''
  });
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [selectedWinners, setSelectedWinners] = useState([]);
  const [winnerForm, setWinnerForm] = useState({
    discount_amount: '',
    discount_type: 'fixed',
    max_discount: '',
    expiry_days: 30,
    winner_limit: 5,
    winner_message: 'You have been selected as a coupon winner!'
  });
  const [winnerSearchTerm, setWinnerSearchTerm] = useState('');
  const [winnerSending, setWinnerSending] = useState(false);
  const [selectedCoupons, setSelectedCoupons] = useState([]);
  const [selectAllCoupons, setSelectAllCoupons] = useState(false);
  const normalizedSingleEmailSearch = singleEmailSearch.trim().toLowerCase();
  const filteredEmailUsers = normalizedSingleEmailSearch
    ? (users || []).filter((user) => {
      const haystack = `${user.name || ''} ${user.email || ''}`.toLowerCase();
      return haystack.includes(normalizedSingleEmailSearch);
    })
    : (users || []);
  const normalizedBulkEmailSearch = bulkEmailSearch.trim().toLowerCase();
  const filteredBulkEmailUsers = normalizedBulkEmailSearch
    ? (users || []).filter((user) => {
      const haystack = `${user.name || ''} ${user.email || ''}`.toLowerCase();
      return haystack.includes(normalizedBulkEmailSearch);
    })
    : (users || []);
  const feedbackMovieOptions = (movies || [])
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const selectedFeedbackMovie = feedbackMovieId
    ? feedbackMovieOptions.find((movie) => String(movie.id) === String(feedbackMovieId))
    : null;
  const scannedTicketsForSelectedMovie = selectedFeedbackMovie
    ? (bookings || []).filter((booking) => {
      const sameMovie = String(booking.movie_id) === String(selectedFeedbackMovie.id);
      const isScanned = booking.is_used === 1 || booking.is_used === true || Number(booking.admitted_people) > 0;
      return sameMovie && isScanned;
    }).length
    : 0;

  // Permission management state
  const [myPermissions, setMyPermissions] = useState({ allowed_tabs: [], is_super_admin: false, can_manage_permissions: false });
  const [adminUsers, setAdminUsers] = useState([]);
  const [availableTabs, setAvailableTabs] = useState([]);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedAdminForPermission, setSelectedAdminForPermission] = useState(null);
  const [selectedAdminTabs, setSelectedAdminTabs] = useState([]);
  const [selectedAdminScanner, setSelectedAdminScanner] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);

  // Search user for making admin state
  const [showMakeAdminModal, setShowMakeAdminModal] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Store current user for permission checks
  const [currentUser, setCurrentUser] = useState(null);

  // Database Management view state
  const [showDatabaseManagement, setShowDatabaseManagement] = useState(false);

  // Mail Settings state
  const [showMailSettings, setShowMailSettings] = useState(false);
  const [mailSettings, setMailSettings] = useState({
    email_host: 'smtp.gmail.com',
    email_port: 587,
    email_user: '',
    email_pass: '',
    sender_name: 'Chalchitra IIT Jammu'
  });
  const [mailSettingsLoading, setMailSettingsLoading] = useState(false);
  const [mailSettingsSaving, setMailSettingsSaving] = useState(false);
  const [mailSettingsError, setMailSettingsError] = useState('');
  const [mailSettingsSuccess, setMailSettingsSuccess] = useState('');

  // Razorpay Settings state
  const [showRazorpaySettings, setShowRazorpaySettings] = useState(false);
  const [razorpaySettings, setRazorpaySettings] = useState({
    key_id: '',
    key_secret: '',
    has_secret: false
  });
  const [razorpaySettingsLoading, setRazorpaySettingsLoading] = useState(false);
  const [razorpaySettingsSaving, setRazorpaySettingsSaving] = useState(false);
  const [razorpaySettingsError, setRazorpaySettingsError] = useState('');
  const [razorpaySettingsSuccess, setRazorpaySettingsSuccess] = useState('');

  console.log('✅ AdminPanel state initialized successfully');

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  // Reset showDatabaseManagement when activeTab changes
  useEffect(() => {
    if (activeTab !== 'config') {
      setShowDatabaseManagement(false);
      setShowMailSettings(false);
      setShowRazorpaySettings(false);
    }
  }, [activeTab]);

  const checkAuthAndLoadData = async () => {
    try {
      console.log('Checking authentication...');
      // First check if user is authenticated and is admin
      const authRes = await api.get('/api/auth/current_user');
      const user = authRes.data;
      console.log('Auth response:', user);

      if (!user || !user.is_admin) {
        console.log('User not admin or not logged in:', user);
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      // Check if user has config access (only specific email can access Config tab)
      const AUTHORIZED_CONFIG_EMAIL = '2025uee0154@iitjammu.ac.in';
      const isSuperAdmin = user.email === AUTHORIZED_CONFIG_EMAIL;
      setHasConfigAccess(isSuperAdmin);
      setCurrentUser(user); // Store user for permission checks
      console.log('Config access granted:', isSuperAdmin);

      // Fetch user's permissions
      try {
        const permRes = await api.get('/api/admin/my-permissions');
        setMyPermissions(permRes.data);
        console.log('User permissions loaded:', permRes.data);

        // Fetch available tabs for permission management
        const tabsRes = await api.get('/api/admin/available-tabs');
        setAvailableTabs(tabsRes.data);

        // If super admin, fetch all admin users for permission management
        if (isSuperAdmin) {
          const adminsRes = await api.get('/api/admin/permission-admins');
          setAdminUsers(adminsRes.data);
        }
      } catch (permErr) {
        console.error('Error fetching permissions:', permErr);
      }

      console.log('User is admin, loading data...');
      // If user is admin, load all data
      await fetchAllData();
    } catch (err) {
      console.log('Authentication error:', err);
      setError('Authentication failed. Please login as admin.');
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      console.log('🔄 Starting to fetch all admin data...');

      const [statsRes, allMoviesRes, pastMoviesRes, bookingsRes, usersRes, feedbackRes, teamRes, galleryRes, couponsRes, couponWinnersRes, settingsRes, foodsRes] = await Promise.all([
        api.get('/api/admin/stats').catch(err => {
          console.log('❌ Stats API failed:', err.message);
          return { data: { total_users: 0, total_movies: 0, upcoming_movies: 0, total_bookings: 0, recent_bookings: 0 } };
        }),
        api.get('/api/movies/all').catch(err => {
          console.log('❌ All Movies API failed:', err.message);
          return { data: [] };
        }),
        api.get('/api/movies/past').catch(err => {
          console.log('❌ Past Movies API failed:', err.message);
          return { data: [] };
        }),
        api.get('/api/admin/bookings').catch(err => {
          console.log('❌ Bookings API failed:', err.message);
          return { data: [] };
        }),
        api.get('/api/admin/users').catch(err => {
          console.log('❌ Users API failed:', err.message);
          return { data: [] };
        }),
        api.get('/api/admin/feedback').catch(err => {
          console.log('❌ Feedback API failed:', err.message);
          return { data: [] };
        }),
        api.get('/api/admin/team').catch(err => {
          console.log('❌ Team API failed:', err.message);
          return { data: [] };
        }),
        api.get('/api/admin/gallery').catch(err => {
          console.log('❌ Gallery API failed:', err.message);
          return { data: [] };
        }),
        api.get('/api/admin/coupons').catch(err => {
          console.log('❌ Coupons API failed:', err.message);
          return { data: [] };
        }),
        api.get('/api/admin/coupon-winners').catch(err => {
          console.log('❌ Coupon Winners API failed:', err.message);
          return { data: { winners: [] } };
        }),
        api.get('/api/admin/settings').catch(err => {
          console.log('❌ Settings API failed:', err.message);
          return { data: { tagline: 'Student-led movie screening initiative at IIT Jammu', hero_background: '#007bff' } };
        }),
        api.get('/api/foods').catch(err => {
          console.log('❌ Foods API failed:', err.message);
          return { data: [] };
        })
      ]);



      console.log('✅ API calls completed');
      console.log('All Movies API response:', allMoviesRes?.data);
      console.log('Past Movies API response:', pastMoviesRes?.data);

      // Use all movies for the admin panel (shows both upcoming and past movies)
      const allMovies = Array.isArray(allMoviesRes?.data) ? allMoviesRes.data : [];
      console.log('Using all movies for admin panel - found', allMovies.length, 'movies');


      // Set all the data

      setStats(statsRes?.data || { total_users: 0, total_movies: 0, upcoming_movies: 0, total_bookings: 0, recent_bookings: 0 });
      setMovies(allMovies); // Show all movies for admin management


      // Fetch food orders for each booking
      const bookingsData = Array.isArray(bookingsRes?.data) ? bookingsRes.data : [];
      const bookingsWithFood = await Promise.all(
        bookingsData.map(async (booking) => {
          try {
            const foodRes = await api.get(`/api/foods/booking/${booking.id}`);
            const foodOrders = foodRes.data;

            // Calculate food cost
            const foodCost = foodOrders.reduce((total, item) => total + (item.price * item.quantity), 0);

            return {
              ...booking,
              foodOrders,
              foodCost
            };
          } catch (foodErr) {
            console.warn('Failed to fetch food orders for booking', booking.id, foodErr);
            return {
              ...booking,
              foodOrders: [],
              foodCost: 0
            };
          }
        })
      );

      setBookings(bookingsWithFood);
      setUsers(Array.isArray(usersRes?.data) ? usersRes.data : []);
      setFeedback(Array.isArray(feedbackRes?.data) ? feedbackRes.data : []);
      setTeam(Array.isArray(teamRes?.data) ? teamRes.data : []);
      setGallery(Array.isArray(galleryRes?.data) ? galleryRes.data : []);
      setCoupons(Array.isArray(couponsRes?.data) ? couponsRes.data : []);
      setFoods(Array.isArray(foodsRes?.data) ? foodsRes.data : []);
      setAvailableFoods(Array.isArray(foodsRes?.data) ? foodsRes.data.filter(f => f.is_available) : []);

      setSettings(settingsRes?.data || { tagline: 'Student-led movie screening initiative at IIT Jammu', hero_background: '#007bff' });

      setSettingsForm({
        ...(settingsRes.data || { tagline: 'Student-led movie screening initiative at IIT Jammu', hero_background: '#007bff' }),
        hero_background_video: (settingsRes.data && settingsRes.data.hero_background_video) || null
      });

      console.log('✅ Data loaded successfully:', {
        stats: statsRes?.data,
        movies: allMovies.length,
        pastMovies: pastMoviesRes?.data?.length || 0,
        bookings: bookingsRes?.data?.length || 0,
        users: usersRes?.data?.length || 0,
        feedback: feedbackRes?.data?.length || 0,
        team: teamRes?.data?.length || 0,
        gallery: galleryRes?.data?.length || 0,
        coupons: couponsRes?.data?.length || 0,
        foods: foodsRes?.data?.length || 0
      });

      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading admin data:', err);
      setError('Failed to load admin data: ' + err.message);
      setLoading(false);
    }
  };

  // Fetch revenue statistics for Database Management (Config tab)
  const fetchRevenueStats = async () => {
    if (!hasConfigAccess) return; // Only super admin can access

    setRevenueLoading(true);
    try {
      const response = await api.get('/api/admin/revenue-stats');
      setRevenueStats(response.data || {
        total_revenue: 0,
        food_revenue: 0,
        total_discounts: 0,
        total_bookings: 0,
        revenue_by_movie: [],
        recent_transactions: [],
        monthly_revenue: [],
        payment_methods: []
      });
      console.log('✅ Revenue stats loaded:', response.data);
    } catch (err) {
      console.error('❌ Error loading revenue stats:', err);
      // Don't show error, just keep default values
    } finally {
      setRevenueLoading(false);
    }
  };

  // Fetch mail settings
  const fetchMailSettings = async () => {
    if (!hasConfigAccess) return; // Only super admin can access

    setMailSettingsLoading(true);
    setMailSettingsError('');
    try {
      const response = await api.get('/api/admin/mail-settings');
      setMailSettings(response.data || {
        email_host: 'smtp.gmail.com',
        email_port: 587,
        email_user: '',
        email_pass: '',
        sender_name: 'Chalchitra IIT Jammu'
      });
      console.log('✅ Mail settings loaded:', response.data);
    } catch (err) {
      console.error('❌ Error loading mail settings:', err);
      // Show the actual error message from the server
      const errorMessage = err.response?.data?.error || err.response?.data || 'Failed to load mail settings';
      setMailSettingsError(errorMessage);
    } finally {
      setMailSettingsLoading(false);
    }
  };

  // Save mail settings
  const saveMailSettings = async () => {
    if (!hasConfigAccess) return;

    setMailSettingsSaving(true);
    setMailSettingsError('');
    setMailSettingsSuccess('');

    try {
      await api.put('/api/admin/mail-settings', mailSettings);
      setMailSettingsSuccess('Mail settings saved successfully!');
      console.log('✅ Mail settings saved');
    } catch (err) {
      console.error('❌ Error saving mail settings:', err);
      setMailSettingsError(err.response?.data?.error || 'Failed to save mail settings');
    } finally {
      setMailSettingsSaving(false);
    }
  };

  // Test mail configuration
  const testMailSettings = async () => {
    if (!hasConfigAccess) return;

    setMailSettingsSaving(true);
    setMailSettingsError('');
    setMailSettingsSuccess('');

    try {
      const response = await api.post('/api/admin/mail-settings/test', mailSettings);
      setMailSettingsSuccess(`Test email sent successfully! Message ID: ${response.data.message_id}`);
      console.log('✅ Test email sent');
    } catch (err) {
      console.error('❌ Error testing mail settings:', err);
      setMailSettingsError(err.response?.data?.error || err.response?.data?.hint || 'Failed to send test email');
    } finally {
      setMailSettingsSaving(false);
    }
  };

  // Fetch Razorpay settings
  const fetchRazorpaySettings = async () => {
    if (!hasConfigAccess) return;

    setRazorpaySettingsLoading(true);
    setRazorpaySettingsError('');
    try {
      const response = await api.get('/api/admin/razorpay-settings');
      setRazorpaySettings(response.data || {
        key_id: '',
        key_secret: '',
        has_secret: false
      });
      console.log('✅ Razorpay settings loaded');
    } catch (err) {
      console.error('❌ Error loading Razorpay settings:', err);
      const errorMessage = err.response?.data?.error || 'Failed to load Razorpay settings';
      setRazorpaySettingsError(errorMessage);
    } finally {
      setRazorpaySettingsLoading(false);
    }
  };

  // Save Razorpay settings
  const saveRazorpaySettings = async () => {
    if (!hasConfigAccess) return;

    setRazorpaySettingsSaving(true);
    setRazorpaySettingsError('');
    setRazorpaySettingsSuccess('');

    try {
      await api.put('/api/admin/razorpay-settings', razorpaySettings);
      setRazorpaySettingsSuccess('Razorpay settings saved successfully!');
      console.log('✅ Razorpay settings saved');
    } catch (err) {
      console.error('❌ Error saving Razorpay settings:', err);
      setRazorpaySettingsError(err.response?.data?.error || 'Failed to save Razorpay settings');
    } finally {
      setRazorpaySettingsSaving(false);
    }
  };

  const handleMovieSubmit = async (e) => {
    e.preventDefault();

    // Isolate the movie update in a completely separate try/catch to prevent any component remounting
    const performMovieUpdate = async () => {
      try {
        // Prepare movie data with selected foods
        const movieData = {
          ...movieForm,
          availableFoods: selectedFoodsForMovie
        };

        if (editingMovie) {
          // For editing, always use FormData to handle file uploads
          const formData = new FormData();
          Object.keys(movieData).forEach(key => {
            if (key === 'availableFoods') {
              formData.append(key, JSON.stringify(movieData[key]));
            } else if (key === 'poster') {
              // Handle poster file upload
              if (movieForm.poster) {
                formData.append('poster', movieForm.poster);
              } else if (editingMovie.poster_url) {
                formData.append('poster_url', editingMovie.poster_url);
              }
            } else {
              // Always append the field, even if empty
              formData.append(key, movieData[key] || '');
            }
          });

          console.log('Sending PUT request for movie:', editingMovie.id);
          const response = await api.put(`/api/movies/${editingMovie.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          console.log('PUT response:', response.data);

          // Update food links (isolated to prevent errors from affecting movie update)
          try {
            await updateMovieFoodLinks(editingMovie.id, selectedFoodsForMovie, freeFoodIds);
          } catch (foodErr) {
            console.warn('Food linking failed, but movie was updated successfully:', foodErr.message);
          }
        } else {
          const formData = new FormData();
          Object.keys(movieData).forEach(key => {
            if (key === 'availableFoods') {
              formData.append(key, JSON.stringify(movieData[key]));
            } else if (key === 'poster') {
              if (movieForm.poster) {
                formData.append('poster', movieForm.poster);
              }
            } else {
              formData.append(key, movieData[key] ?? '');
            }
          });

          const response = await api.post('/api/movies', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (selectedFoodsForMovie.length > 0) {
            try {
              await updateMovieFoodLinks(response.data.id, selectedFoodsForMovie, freeFoodIds);
            } catch (foodErr) {
              console.warn('Food linking failed, but movie was created successfully:', foodErr.message);
            }
          }
        }

        return true; // Success
      } catch (err) {
        console.error('Error in movie update operation:', err);
        throw err; // Re-throw to be handled by outer catch
      }
    };

    try {
      const success = await performMovieUpdate();

      if (success) {
        // Close modal and reset form
        setShowMovieModal(false);
        setEditingMovie(null);
        setMovieForm({ title: '', description: '', date: '', venue: '', price: '', category: '', duration: '', imdb_rating: '', language: '', poster: null, availableFoods: [], is_special: 0, special_message: '' });
        setSelectedFoodsForMovie([]);
        setFreeFoodIds([]);

        // Update the local state directly for immediate UI update
        console.log('Updating local state after movie update...');
        try {
          // For editing, update the movie in the local state
          if (editingMovie) {
            setMovies(prevMovies =>
              prevMovies.map(movie =>
                movie.id === editingMovie.id
                  ? { ...movie, ...movieForm, available_foods: selectedFoodsForMovie.join(',') }
                  : movie
              )
            );
            console.log('Local state updated for edited movie');
          } else {
            // For new movie, refresh the data to get the new movie with ID
            const allMoviesRes = await api.get('/api/movies/all');
            setMovies(Array.isArray(allMoviesRes.data) ? allMoviesRes.data : []);
            console.log('Movies state refreshed after adding new movie');
          }
        } catch (refreshErr) {
          console.error('Error updating local state:', refreshErr);
          // Fallback: refresh all data
          fetchAllData();
        }

        alert('Movie saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save movie:', err);
      alert('Error saving movie: ' + (err.response?.data?.error || err.message));
    }
  };

  const updateMovieFoodLinks = async (movieId, foodIds, freeIds = []) => {
    try {
      // Get current food links for this movie
      const currentLinksRes = await api.get(`/api/foods/movie/${movieId}`);
      const currentFoodLinks = currentLinksRes.data;
      const currentFoodIds = currentFoodLinks.map(link => link.id);

      // Remove links that are no longer selected
      for (const currentFoodId of currentFoodIds) {
        if (!foodIds.includes(currentFoodId)) {
          await api.delete(`/api/foods/link/${movieId}/${currentFoodId}`);
        }
      }

      // Add or update links for selected foods
      for (const foodId of foodIds) {
        const isFree = freeIds.includes(foodId) ? 1 : 0;
        const existingLink = currentFoodLinks.find(link => link.id === foodId);
        
        // If link doesn't exist OR is_free status has changed, update it
        if (!existingLink || existingLink.is_free !== isFree) {
          await api.post(`/api/foods/link/${movieId}/${foodId}`, { is_free: isFree });
        }
      }
    } catch (err) {
      console.error('Error updating food links:', err);
      // Don't throw error for food linking - it's not critical
      console.log('Food linking failed, but movie was created successfully');
    }
  };

  // Rest of the component remains the same...

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', teamForm.name);
      formData.append('student_id', teamForm.student_id);
      formData.append('role', teamForm.role);
      formData.append('section', teamForm.section);
      if (teamForm.photo_url) {
        formData.append('photo_url', teamForm.photo_url);
      }
      formData.append('display_order', teamForm.display_order || 0);
      if (teamForm.photo) {
        formData.append('photo', teamForm.photo);
      }

      if (editingTeam) {
        await api.put(`/api/admin/team/${editingTeam.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/api/admin/team', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowTeamModal(false);
      setEditingTeam(null);
      setTeamForm({ name: '', student_id: '', photo: null, photo_url: '', role: '', section: 'foundation_team', display_order: 0 });
      fetchAllData();
    } catch (err) {
      console.error('Error saving team member:', err);
    }
  };

  const handleGallerySubmit = async (e) => {
    e.preventDefault();

    if (!galleryForm.event_date) {
      alert('Please select the event date.');
      return;
    }

    if (!galleryForm.image) {
      alert('Please select an image for the event.');
      return;
    }

    try {
      const normalizedEventDate = normalizeGalleryEventDate(galleryForm.event_date);
      if (!normalizedEventDate) {
        alert('Please select a valid event date.');
        return;
      }
      const formData = new FormData();
      formData.append('event_name', galleryForm.event_name || '');
      formData.append('event_date', normalizedEventDate);
      formData.append('image', galleryForm.image);

      const createRes = await api.post('/api/admin/gallery', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowGalleryModal(false);
      setGalleryForm({ event_name: '', event_date: '', image: null });
      fetchAllData();
    } catch (err) {
      console.error('Error uploading gallery image:', err);
      alert('Error uploading image: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleGalleryDateUpdate = async (imageId) => {
    const rawDate = galleryDateEdits[imageId];
    const normalizedEventDate = normalizeGalleryEventDate(rawDate);
    if (!normalizedEventDate) {
      alert('Please select a valid event date.');
      return;
    }

    try {
      await api.put(`/api/admin/gallery/${imageId}`, {
        event_date: normalizedEventDate
      });
      setGalleryDateEdits((prev) => {
        const next = { ...prev };
        delete next[imageId];
        return next;
      });
      fetchAllData();
    } catch (err) {
      console.error('Error updating gallery date:', err);
      alert('Error updating date: ' + (err.response?.data?.error || err.message));
    }
  };

  // ... existing code ...

  if (loading) {
    return <Loader message="Accessing Admin Panel" subtitle="Securing your administrative access..." />;
  }

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Filter bookings based on selected movie
  const filteredBookings = selectedMovie
    ? bookings.filter(booking => booking.movie_id == selectedMovie)
    : bookings;

  // Filter users for winner selection based on search term
  const filteredWinnerUsers = users.filter(user =>
    user.name.toLowerCase().includes(winnerSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(winnerSearchTerm.toLowerCase())
  );

  // Handle coupon selection
  const handleSelectCoupon = (couponId, isSelected) => {
    if (isSelected) {
      setSelectedCoupons([...selectedCoupons, couponId]);
    } else {
      setSelectedCoupons(selectedCoupons.filter(id => id !== couponId));
    }
  };

  // Handle select all coupons
  const handleSelectAllCoupons = (isSelected) => {
    if (isSelected) {
      setSelectedCoupons(coupons.map(coupon => coupon.id));
    } else {
      setSelectedCoupons([]);
    }
    setSelectAllCoupons(isSelected);
  };

  // Handle bulk delete coupons
  const handleBulkDeleteCoupons = async () => {
    if (selectedCoupons.length === 0) return;

    try {
      await Promise.all(selectedCoupons.map(couponId =>
        api.delete(`/api/admin/coupons/${couponId}`)
      ));

      alert(`Successfully deleted ${selectedCoupons.length} coupon(s)!`);
      setSelectedCoupons([]);
      setSelectAllCoupons(false);
      fetchAllData();
    } catch (err) {
      console.error('Error bulk deleting coupons:', err);
      alert('Error deleting coupons: ' + (err.response?.data?.error || err.message));
    }
  };

  // Handle single coupon delete
  const handleDeleteCoupon = async (couponId) => {
    try {
      await api.delete(`/api/admin/coupons/${couponId}`);
      alert('Coupon deleted successfully!');
      fetchAllData();
    } catch (err) {
      console.error('Error deleting coupon:', err);
      alert('Error deleting coupon: ' + (err.response?.data?.error || err.message));
    }
  };

  // Handle send feedback emails
  const handleSendFeedbackEmails = async () => {
    try {
      if (!feedbackMovieId) {
        alert('Please select a movie to send feedback requests.');
        return;
      }
      if (scannedTicketsForSelectedMovie === 0) {
        alert('No scanned tickets found for this movie.');
        return;
      }
      const payload = { movie_id: Number(feedbackMovieId) };
      const result = await api.post('/api/admin/email/feedback-request', payload);
      const targetLabel = selectedFeedbackMovie?.title
        ? ` for "${selectedFeedbackMovie.title}"`
        : '';
      const totalRecipients = result.data.total_users ?? result.data.sent ?? 0;
      alert(`Feedback request emails sent successfully${targetLabel}! ${result.data.sent} emails sent to ${totalRecipients} scanned users.`);
    } catch (err) {
      console.error('Error sending feedback emails:', err);
      alert('Error sending feedback emails: ' + (err.response?.data?.error || err.message));
    }
  };

  // Handle reset feedback ratings
  const handleResetFeedback = async () => {
    if (!window.confirm('Are you sure you want to reset all ratings? This will permanently delete all feedback data.')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete('/api/admin/feedback/reset');
      setFeedback([]);
      alert('All feedback ratings have been reset successfully.');
    } catch (err) {
      console.error('Error resetting feedback:', err);
      alert('Error resetting feedback: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle select all winners
  const handleSelectAllWinners = (isSelected) => {
    if (isSelected) {
      const allWinnerIds = (couponWinners.winners || []).map(winner => winner.id);
      setSelectedWinners(allWinnerIds);
    } else {
      setSelectedWinners([]);
    }
  };

  // Handle delete selected winners
  const handleDeleteSelectedWinners = async () => {
    if (selectedWinners.length === 0) return;

    try {
      await api.delete('/api/admin/coupon-winners', {
        data: { ids: selectedWinners }
      });

      alert(`Successfully deleted ${selectedWinners.length} winner(s)!`);
      setSelectedWinners([]);
      fetchAllData();
    } catch (err) {
      console.error('Error deleting winners:', err);
      alert('Error deleting winners: ' + (err.response?.data?.error || err.message));
    }
  };
  // Reset bookings (optionally filtered by selected movie)
  const handleResetBookings = async () => {
    const movieName = selectedMovie && movies ? movies.find(m => m.id == selectedMovie)?.title : null;
    const target = movieName ? `all bookings for "${movieName}"` : 'ALL bookings';

    if (!window.confirm(`Are you sure you want to reset ${target}? This action cannot be undone.`)) return;
    if (!window.confirm(`⚠️ FINAL WARNING: This will permanently delete ${target}. Proceed?`)) return;

    try {
      await api.delete('/api/admin/bookings/reset', {
        data: selectedMovie ? { movie_id: selectedMovie } : {}
      });
      alert(`Successfully reset ${target}.`);
      fetchAllData();
    } catch (err) {
      console.error('Error resetting bookings:', err);
      alert('Error resetting bookings: ' + (err.response?.data?.error || err.message));
    }
  };

  // Export bookings to PDF
  const exportBookingsToPDF = (bookingsToExport) => {
    try {
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const now = new Date();

      // ── HEADER ──
      doc.setFillColor(26, 26, 26);
      doc.rect(0, 0, pageWidth, 32, 'F');
      doc.setFillColor(0, 123, 255);
      doc.rect(0, 32, pageWidth, 1.5, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('CHALCHITRA', 15, 16);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Indian Institute of Technology Jammu', 15, 24);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Date: ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth - 15, 16, { align: 'right' });
      doc.text(`Total Bookings: ${bookingsToExport.length}`, pageWidth - 15, 24, { align: 'right' });

      doc.setTextColor(0, 0, 0);

      // ── REPORT TITLE ──
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Bookings Report', 15, 44);

      // Movie filter info
      const movieName = selectedMovie && movies ? movies.find(m => m.id == selectedMovie)?.title : null;
      if (movieName) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text(`Filtered by: ${movieName}`, 15, 51);
        doc.setTextColor(0, 0, 0);
      }

      // ── BOOKINGS TABLE ──
      const foodOrderSummary = {};
      let totalRevenue = 0;
      let totalFoodRevenue = 0;
      let usedCount = 0;
      let activeCount = 0;
      let totalSeats = 0;

      const tableData = bookingsToExport.map(booking => {
        const foodOrders = booking.foodOrders && booking.foodOrders.length > 0
          ? booking.foodOrders.map(f => `${f.name} x${f.quantity}`).join(', ')
          : '—';
        const foodCost = booking.foodCost || 0;
        const ticketPrice = parseFloat(booking.total_price || booking.price || 0);
        const grandTotal = ticketPrice + foodCost;

        totalRevenue += grandTotal;
        totalFoodRevenue += foodCost;
        if (booking.is_used) usedCount++; else activeCount++;

        // Parse seats
        const seats = booking.selected_seats || booking.num_people || '—';
        if (typeof seats === 'string' && seats.includes(',')) {
          totalSeats += seats.split(',').length;
        } else if (typeof seats === 'number') {
          totalSeats += seats;
        } else if (seats !== '—') {
          totalSeats += 1;
        }

        // Build food summary
        if (booking.foodOrders && booking.foodOrders.length > 0) {
          booking.foodOrders.forEach(food => {
            const qty = parseInt(food.quantity) || 0;
            const price = parseFloat(food.price) || 0;
            if (foodOrderSummary[food.name]) {
              foodOrderSummary[food.name].quantity += qty;
              foodOrderSummary[food.name].total += price * qty;
            } else {
              foodOrderSummary[food.name] = {
                name: food.name,
                price,
                quantity: qty,
                total: price * qty
              };
            }
          });
        }

        return [
          booking.id.toString(),
          booking.name || 'N/A',
          booking.title || booking.movie_title || 'N/A',
          seats,
          foodOrders,
          `Rs. ${ticketPrice.toFixed(0)}`,
          `Rs. ${foodCost.toFixed(0)}`,
          `Rs. ${grandTotal.toFixed(0)}`,
          booking.is_used ? 'Used' : 'Active',
          new Date(booking.created_at).toLocaleDateString('en-IN')
        ];
      });

      autoTable(doc, {
        head: [['#', 'User', 'Movie', 'Seats', 'Food Orders', 'Ticket', 'Food', 'Total', 'Status', 'Date']],
        body: tableData,
        startY: movieName ? 56 : 50,
        styles: {
          fontSize: 7,
          cellPadding: 2.5,
          overflow: 'linebreak',
          lineColor: [220, 220, 220],
          lineWidth: 0.25
        },
        headStyles: {
          fillColor: [26, 26, 26],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 30 },
          2: { cellWidth: 35 },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 50 },
          5: { cellWidth: 22, halign: 'right' },
          6: { cellWidth: 22, halign: 'right' },
          7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
          8: { cellWidth: 20, halign: 'center' },
          9: { cellWidth: 25, halign: 'center' }
        },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 8) {
            if (data.cell.raw === 'Used') {
              data.cell.styles.textColor = [40, 167, 69];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [0, 123, 255];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        margin: { left: 10, right: 10 }
      });

      let currentY = doc.lastAutoTable.finalY + 12;

      // ── Check if we need a new page ──
      const checkPageBreak = (needed) => {
        if (currentY + needed > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }
      };

      // ── BOOKING SUMMARY ──
      checkPageBreak(30);

      // Thin separator line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(15, currentY, pageWidth - 15, currentY);
      currentY += 6;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Summary', 15, currentY);
      currentY += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`Total Bookings: ${bookingsToExport.length}`, 15, currentY);
      doc.text(`Total Seats: ${totalSeats}`, 80, currentY);
      doc.text(`Report Generated: ${now.toLocaleString('en-IN')}`, 145, currentY);
      currentY += 12;

      // ── FOOD ORDERS SUMMARY ──
      const foodSummaryEntries = Object.values(foodOrderSummary);
      if (foodSummaryEntries.length > 0) {
        checkPageBreak(30);

        // Thin separator line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(15, currentY, pageWidth - 15, currentY);
        currentY += 6;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('Food Orders Summary', 15, currentY);
        currentY += 5;

        const foodTotalQty = foodSummaryEntries.reduce((sum, f) => sum + f.quantity, 0);

        const foodTableData = foodSummaryEntries.map((food, i) => [
          (i + 1).toString(),
          food.name,
          food.quantity.toString()
        ]);

        foodTableData.push(['', 'Total', foodTotalQty.toString()]);

        autoTable(doc, {
          head: [['#', 'Food Item', 'Quantity']],
          body: foodTableData,
          startY: currentY,
          styles: {
            fontSize: 9,
            cellPadding: 3,
            lineColor: [230, 230, 230],
            lineWidth: 0.2,
            textColor: [50, 50, 50]
          },
          headStyles: {
            fillColor: [50, 50, 50],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
          },
          alternateRowStyles: {
            fillColor: [250, 250, 250]
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 80 },
            2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
          },
          didParseCell: function (data) {
            if (data.section === 'body' && data.row.index === foodTableData.length - 1) {
              data.cell.styles.fillColor = [240, 240, 240];
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fontSize = 10;
            }
          },
          margin: { left: 15, right: 15 },
          tableWidth: 125
        });

        currentY = doc.lastAutoTable.finalY + 10;
      }

      // ── FOOTER ──
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(245, 245, 245);
        doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
        doc.setFontSize(7);
        doc.setTextColor(130, 130, 130);
        doc.setFont('helvetica', 'normal');
        doc.text('Chalchitra Series | IIT Jammu — Confidential Report', 15, pageHeight - 5);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 5, { align: 'right' });
      }

      // Save the PDF
      doc.save(`chalchitra-bookings-${now.toISOString().split('T')[0]}.pdf`);
      alert('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF: ' + error.message);
    }
  };

  const getBookingSeatsText = (booking) => {
    if (!booking) return 'N/A';
    if (booking.selected_seats) {
      try {
        const parsed = JSON.parse(booking.selected_seats);
        if (Array.isArray(parsed)) {
          return parsed.map(seat => String(seat)).join(', ');
        }
      } catch (err) {
        return String(booking.selected_seats);
      }
    }
    if (booking.selectedSeats && Array.isArray(booking.selectedSeats)) {
      return booking.selectedSeats.map(seat => String(seat)).join(', ');
    }
    return booking.num_people ? String(booking.num_people) : 'N/A';
  };

  const handleDownloadTicketForBooking = async (booking) => {
    try {
      const ticketBgUrl = `${window.location.origin}/misc/ticc.png`;
      const bookingDate = booking.date || booking.movie_date || booking.show_date || booking.created_at;
      const bookingTitle = booking.title || booking.movie_title || booking.movie_name || 'Movie';
      const bookingName = booking.name || booking.user_name || booking.student_name || 'Guest';
      const bookingId = booking.booking_code || booking.booking_id || booking.id;
      const seatsText = getBookingSeatsText(booking);

      const ticketHTML = `
        <div style="
          width: 800px;
          height: 260px;
          position: relative;
          font-family: Arial, sans-serif;
          color: #0b1a2b;
          box-sizing: border-box;
        " id="ticket-design">
          <img
            src="${ticketBgUrl}"
            alt="Ticket Background"
            style="width: 100%; height: 100%; object-fit: cover; display: block;"
            crossorigin="anonymous"
          />

          <div style="position: absolute; left: 227px; top: 117.5px; width: 230px; color: #000000; fontFamily: 'Tahoma, Arial, sans-serif';">
            <div style="font-size: 12px; font-weight: 400; letter-spacing: 0.2px;">
              ${bookingId}
            </div>
          </div>

          <div style="position: absolute; left: 227px; top: 141.5px; width: 230px; color: #000000; fontFamily: 'Tahoma, Arial, sans-serif';">
            <div style="font-size: 12px; font-weight: 400; letter-spacing: 0.2px;">
              ${bookingTitle}
            </div>
          </div>

          <div style="position: absolute; left: 227px; top: 165px; width: 230px; color: #000000; fontFamily: 'Tahoma, Arial, sans-serif';">
            <div style="font-size: 12px; font-weight: 400; letter-spacing: 0.2px;">
              ${booking.num_people || 1}
            </div>
          </div>

          <div style="position: absolute; left: 227px; top: 189px; width: 260px; color: #000000; fontFamily: 'Tahoma, Arial, sans-serif';">
            <div style="font-size: 12px; font-weight: 400; letter-spacing: 0.2px;">
              ${seatsText}
            </div>
          </div>

          <div style="position: absolute; right: -25px; top: 67px; width: 180px; color: #000000; textAlign: 'left'; fontFamily: 'Tahoma, Arial, sans-serif';">
            <div style="font-size: 13px; font-weight: 400; letter-spacing: 0.2px; line-height: 1.2; text-transform: uppercase;">
              ${bookingDate ? new Date(bookingDate).toLocaleDateString('en-IN', { weekday: 'long' }) : 'N/A'}
            </div>
            <div style="font-size: 13px; font-weight: 400; letter-spacing: 0.2px; line-height: 1.2; marginTop: '2px';">
              ${bookingDate ? new Date(bookingDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
            </div>
          </div>

          <div style="position: absolute; right: -25px; top: 118px; width: 180px; color: #000000; textAlign: 'left'; fontFamily: 'Tahoma, Arial, sans-serif';">
            <div style="font-size: 13px; font-weight: 400; letter-spacing: 0.2px; line-height: 1.2;">
              ${bookingDate ? new Date(bookingDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </div>
          </div>

          <div style="position: absolute; right: -30px; top: 169.5px; width: 180px; color: #000000; textAlign: 'left'; fontFamily: 'Tahoma, Arial, sans-serif';">
            <div style="font-size: 13px; font-weight: 400; letter-spacing: 0.2px; line-height: 1.2;">
              ${booking.venue || 'N/A'}
            </div>
          </div>

          <div style="
            position: absolute;
            left: 472px;
            top: 98px;
            width: 98px;
            height: 98px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${booking.qr_code && booking.qr_code.trim() !== ''
          ? '<img src="' + booking.qr_code + '" style="width: 98px; height: 98px; object-fit: contain; display: block;" alt="QR Code" crossorigin="anonymous" />'
          : '<div style="width: 98px; height: 98px; background: transparent; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #666; font-weight: 400;">QR NOT FOUND</div>'
        }
          </div>
        </div>
      `;

      const ticketElement = document.createElement('div');
      ticketElement.style.position = 'absolute';
      ticketElement.style.left = '-9999px';
      ticketElement.style.top = '-9999px';
      ticketElement.style.width = '800px';
      ticketElement.style.height = '260px';
      ticketElement.innerHTML = ticketHTML;
      document.body.appendChild(ticketElement);

      const images = ticketElement.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => new Promise(resolve => {
        if (img.complete && img.naturalHeight !== 0) resolve();
        else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 5000);
        }
      })));
      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        height: ticketElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        imageTimeout: 10000,
        removeContainer: false,
        foreignObjectRendering: false
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({
        orientation: pdfHeight > 297 ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, Math.min(pdfHeight, 297)]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`ticket-${bookingId}.pdf`);

      if (ticketElement.parentNode) {
        ticketElement.parentNode.removeChild(ticketElement);
      }
    } catch (err) {
      console.error('Failed to download ticket:', err);
      alert('Failed to download ticket. Please try again.');
    }
  };

  // ==================== PERMISSION MANAGEMENT FUNCTIONS ====================

  // Check if user has access to a specific tab
  const hasTabAccess = (tabId) => {
    if (myPermissions.is_super_admin) return true;
    return myPermissions.allowed_tabs.includes(tabId);
  };

  // Open permission modal for an admin
  const openPermissionModal = async (admin) => {
    setSelectedAdminForPermission(admin);
    setPermissionLoading(true);
    setShowPermissionModal(true);

    try {
      const res = await api.get(`/api/admin/permissions/${admin.id}`);
      setSelectedAdminTabs(res.data.allowed_tabs || []);
      setSelectedAdminScanner(admin.code_scanner === 1 || admin.code_scanner === true);
    } catch (err) {
      console.error('Error fetching admin permissions:', err);
      // Set default tabs if fetch fails
      setSelectedAdminTabs([
        'dashboard', 'movies', 'foods', 'bookings', 'users',
        'team', 'gallery', 'coupons', 'coupon-winners', 'feedback', 'mail', 'settings'
      ]);
      setSelectedAdminScanner(admin.code_scanner === 1 || admin.code_scanner === true);
    } finally {
      setPermissionLoading(false);
    }
  };

  // Toggle a tab in the selected admin's permissions
  const toggleAdminTab = (tabId) => {
    if (selectedAdminTabs.includes(tabId)) {
      setSelectedAdminTabs(selectedAdminTabs.filter(id => id !== tabId));
    } else {
      setSelectedAdminTabs([...selectedAdminTabs, tabId]);
    }
  };

  // Save permissions for an admin
  const saveAdminPermissions = async () => {
    if (!selectedAdminForPermission) return;

    try {
      // Save tab permissions
      await api.put(`/api/admin/permissions/${selectedAdminForPermission.id}`, {
        allowed_tabs: selectedAdminTabs
      });

      // Save scanner permission
      if (selectedAdminScanner) {
        await api.put(`/api/admin/users/${selectedAdminForPermission.id}/make_scanner`);
      } else {
        await api.put(`/api/admin/users/${selectedAdminForPermission.id}/remove_scanner`);
      }

      alert(`Permissions updated for ${selectedAdminForPermission.name}`);

      // Refresh admin list
      const adminsRes = await api.get('/api/admin/permission-admins');
      setAdminUsers(adminsRes.data);

      setShowPermissionModal(false);
      setSelectedAdminForPermission(null);
      setSelectedAdminTabs([]);
      setSelectedAdminScanner(false);
    } catch (err) {
      console.error('Error saving permissions:', err);
      alert('Error saving permissions: ' + (err.response?.data?.error || err.message));
    }
  };

  // Reset permissions to default for an admin
  const resetAdminPermissions = async (adminId) => {
    if (!window.confirm('Reset permissions to default? This will allow the admin to access all tabs except Config.')) {
      return;
    }

    try {
      await api.delete(`/api/admin/permissions/${adminId}`);
      alert('Permissions reset to default');

      // Refresh admin list
      const adminsRes = await api.get('/api/admin/permission-admins');
      setAdminUsers(adminsRes.data);
    } catch (err) {
      console.error('Error resetting permissions:', err);
      alert('Error resetting permissions: ' + (err.response?.data?.error || err.message));
    }
  };

  // Search users to make them admin
  const searchUsers = async (searchTerm) => {
    setUserSearchTerm(searchTerm);
    if (searchTerm.length < 2) {
      setSearchedUsers([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Search users by name or email (including admins)
      const filteredUsers = users.filter(user =>
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setSearchedUsers(filteredUsers);
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchedUsers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Make a user admin
  const makeUserAdmin = async (userId) => {
    try {
      await api.put(`/api/admin/users/${userId}/make_admin`);
      alert('User promoted to admin successfully!');

      // Refresh users and admin lists
      const usersRes = await api.get('/api/admin/users');
      setUsers(usersRes.data);

      const adminsRes = await api.get('/api/admin/permission-admins');
      setAdminUsers(adminsRes.data);

      setShowMakeAdminModal(false);
      setUserSearchTerm('');
      setSearchedUsers([]);
    } catch (err) {
      console.error('Error making user admin:', err);
      alert('Error promoting user: ' + (err.response?.data?.error || err.message));
    }
  };

  // Remove admin privileges from a user
  const removeUserAdmin = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove admin privileges from ${userName}? They will no longer be able to access the admin panel.`)) {
      return;
    }

    try {
      await api.put(`/api/admin/users/${userId}/remove_admin`);
      alert('Admin privileges removed successfully!');

      // Refresh users and admin lists
      const usersRes = await api.get('/api/admin/users');
      setUsers(usersRes.data);

      const adminsRes = await api.get('/api/admin/permission-admins');
      setAdminUsers(adminsRes.data);

      // Refresh search results if modal is open
      if (showMakeAdminModal) {
        searchUsers(userSearchTerm);
      }
    } catch (err) {
      console.error('Error removing admin:', err);
      alert('Error removing admin privileges: ' + (err.response?.data?.error || err.message));
    }
  };

  // Update admin tag
  const updateAdminTag = async (adminId, currentTag) => {
    const newTag = prompt('Enter a tag name for this admin (e.g., "Head Admin", "Movie Manager"):', currentTag || '');

    if (newTag === null) return; // Cancelled

    try {
      console.log('🔄 Updating admin tag for user:', adminId, 'to:', newTag);

      // Make the API call to update the tag
      const response = await api.put(`/api/admin/users/${adminId}/make_scanner`, { admin_tag: newTag });
      console.log('✅ Admin tag update response:', response.data);

      alert('Admin tag updated successfully!');

      // Force refresh admin list with a fresh fetch
      console.log('🔄 Fetching fresh admin list...');
      const adminsRes = await api.get('/api/admin/permission-admins');
      console.log('✅ Fresh admin data:', adminsRes.data);

      // Update the state with fresh data
      setAdminUsers(adminsRes.data);

      // Force a re-render by updating a trigger state
      setMyPermissions(prev => ({ ...prev }));

      // If updating own tag, refresh auth data to update navbar
      if (adminId === currentUser?.id) {
        const authRes = await api.get('/api/auth/current_user');
        setCurrentUser(authRes.data);
        console.log('✅ Updated current user:', authRes.data);
      }
    } catch (err) {
      console.error('❌ Error updating admin tag:', err);
      alert('Error updating admin tag: ' + (err.response?.data?.error || err.message));
    }
  };

  // Update my own admin tag
  const updateMyTag = async () => {
    const newTag = prompt('Enter your tag name (e.g., "Head Admin", "Event Manager"):', currentUser?.admin_tag || '');

    if (newTag === null) return; // Cancelled

    try {
      console.log('🔄 Updating my tag to:', newTag);

      // Make the API call to update the tag
      const response = await api.put(`/api/admin/users/${currentUser.id}/make_scanner`, { admin_tag: newTag });
      console.log('✅ Tag update response:', response.data);

      alert('Your tag name updated successfully!');

      // Refresh current user data from server
      const authRes = await api.get('/api/auth/current_user');
      setCurrentUser(authRes.data);
      console.log('✅ Updated current user:', authRes.data);

      // Also refresh the admin list in the Config tab to update the table
      const adminsRes = await api.get('/api/admin/permission-admins');
      setAdminUsers(adminsRes.data);

      // Force re-render
      setMyPermissions(prev => ({ ...prev }));
    } catch (err) {
      console.error('❌ Error updating tag:', err);
      alert('Error updating tag: ' + (err.response?.data?.error || err.message));
    }
  };

  // ==================== TAB CONFIGURATION ====================
  // All available tabs configuration
  const allTabsConfig = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'movies', name: 'Movies', icon: '🎬' },
    { id: 'foods', name: 'Foods', icon: '🍿' },
    { id: 'bookings', name: 'Bookings', icon: '🎫' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'team', name: 'Team', icon: '👨‍💼' },
    { id: 'gallery', name: 'Gallery', icon: '🖼️' },
    { id: 'coupons', name: 'Coupons', icon: '🎟️' },
    { id: 'coupon-winners', name: 'Winners', icon: '🏆' },
    { id: 'feedback', name: 'Feedback', icon: '💬' },
    { id: 'mail', name: 'Mail', icon: '📧' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
    { id: 'config', name: 'Config', icon: '🔧' }
  ];

  // Super admin email constant
  const SUPER_ADMIN_EMAIL = '2025uee0154@iitjammu.ac.in';

  // Get filtered tabs based on user permissions
  // Show all tabs by default until permissions are loaded
  // Super admin always gets all tabs, others get only their allowed tabs
  const visibleTabs = (
    !currentUser || // Show all until user data loads
    currentUser?.email === SUPER_ADMIN_EMAIL ||
    myPermissions.is_super_admin
  ) ? allTabsConfig
    : allTabsConfig.filter(tab => myPermissions.allowed_tabs.includes(tab.id));

  // ==================== END PERMISSION MANAGEMENT ====================

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)',
      minHeight: '100vh',
      position: 'relative',
      padding: '2rem 0'
    }}>
      <Container className="py-5" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '30px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 10px 30px rgba(0,0,0,0.2)',
          textAlign: 'center'
        }}>
          <div className="d-flex justify-content-center align-items-center flex-wrap gap-3 mb-2">
            <h1 style={{
              color: 'white',
              fontSize: '3rem',
              fontWeight: '700',
              marginBottom: '0',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}>
              {currentUser?.admin_tag || 'Admin Panel'}
            </h1>
          </div>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '1.1rem',
            margin: 0,
            fontWeight: '300'
          }}>
            {currentUser?.name || 'Admin User'} • Management Dashboard • Chalchitra IIT Jammu
          </p>
        </div>

        {/* Navigation and content */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          padding: '8px 12px',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            gap: '2px',
            alignItems: 'center',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id
                    ? tab.id === 'config'
                      ? 'linear-gradient(145deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.2))'
                      : 'linear-gradient(145deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))'
                    : 'transparent',
                  backdropFilter: activeTab === tab.id ? 'blur(15px)' : 'none',
                  border: activeTab === tab.id
                    ? tab.id === 'config'
                      ? '1px solid rgba(255, 215, 0, 0.6)'
                      : '1px solid rgba(255, 255, 255, 0.4)'
                    : 'none',
                  borderRadius: '15px',
                  padding: '8px 12px',
                  color: tab.id === 'config' ? '#ffd700' : 'white',
                  fontWeight: tab.id === 'config' ? '600' : '500',
                  fontSize: '0.8rem',
                  transition: 'all 0.25s ease',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: activeTab === tab.id
                    ? tab.id === 'config'
                      ? '0 2px 8px rgba(255, 215, 0, 0.3)'
                      : '0 2px 8px rgba(0,0,0,0.15)'
                    : 'none',
                  minWidth: '65px',
                  justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'movies' && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h3 className="text-white mb-0">
                  <i className="fas fa-film me-2"></i>
                  Movie Management
                </h3>
                <small className="text-success">
                  <i className="fas fa-check-circle me-1"></i>
                  Fixed: Movies will stay visible after editing
                </small>
              </div>
              <Button
                onClick={() => {
                  setEditingMovie(null);
                  setMovieForm({
                    title: '',
                    description: '',
                    date: '',
                    venue: '',
                    price: '',
                    category: '',
                    duration: '',
                    imdb_rating: '',
                    language: '',
                    poster: null,
                    is_special: 0,
                    special_message: ''
                  });
                  setSelectedFoodsForMovie([]);
                  setShowMovieModal(true);
                }}
                style={{
                  background: 'linear-gradient(145deg, rgba(40, 167, 69, 0.8), rgba(40, 167, 69, 0.6))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '25px',
                  color: 'white',
                  boxShadow: '0 8px 32px rgba(40, 167, 69, 0.3)',
                  fontWeight: '600',
                  padding: '12px 24px'
                }}
              >
                <i className="fas fa-plus me-2"></i>
                Add New Movie
              </Button>
            </div>

            {/* Movies Stats Cards */}
            <Row className="mb-4">
              <Col md={4}>
                <Card className="text-dark h-100" style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '20px',
                  boxShadow: '0 15px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
                    pointerEvents: 'none'
                  }}></div>
                  <Card.Body className="text-center" style={{ position: 'relative', zIndex: 1 }}>
                    <Card.Title className="display-4 mb-3 fw-bold text-white" style={{
                      textShadow: '0 2px 6px rgba(0,0,0,0.5)',
                      fontWeight: '700'
                    }}>
                      {movies.length}
                    </Card.Title>
                    <Card.Text className="h5 mb-0 text-white" style={{
                      fontWeight: '600',
                      textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}>
                      Total Movies
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-dark h-100" style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '20px',
                  boxShadow: '0 15px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
                    pointerEvents: 'none'
                  }}></div>
                  <Card.Body className="text-center" style={{ position: 'relative', zIndex: 1 }}>
                    <Card.Title className="display-4 mb-3 fw-bold text-white" style={{
                      textShadow: '0 2px 6px rgba(0,0,0,0.5)',
                      fontWeight: '700'
                    }}>
                      {movies.filter(m => getMovieStatus(m.date) === 'Upcoming').length}
                    </Card.Title>
                    <Card.Text className="h5 mb-0 text-white" style={{
                      fontWeight: '600',
                      textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}>
                      Upcoming Movies
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-dark h-100" style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '20px',
                  boxShadow: '0 15px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
                    pointerEvents: 'none'
                  }}></div>
                  <Card.Body className="text-center" style={{ position: 'relative', zIndex: 1 }}>
                    <Card.Title className="display-4 mb-3 fw-bold text-white" style={{
                      textShadow: '0 2px 6px rgba(0,0,0,0.5)',
                      fontWeight: '700'
                    }}>
                      {movies.filter(m => getMovieStatus(m.date) === 'Past').length}
                    </Card.Title>
                    <Card.Text className="h5 mb-0 text-white" style={{
                      fontWeight: '600',
                      textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}>
                      Past Movies
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Movies Table */}
            <Card style={{
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '15px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <Card.Body>
                <Table responsive hover className="mb-0">
                  <thead style={{ borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
                    <tr>
                      <th style={{ color: 'black', border: '1px solid black', padding: '15px', fontWeight: '600' }}>Movie Details</th>
                      <th style={{ color: 'black', border: '1px solid black', padding: '15px', fontWeight: '600' }}>Date & Venue</th>
                      <th style={{ color: 'black', border: '1px solid black', padding: '15px', fontWeight: '600' }}>Food</th>
                      <th style={{ color: 'black', border: '1px solid black', padding: '15px', fontWeight: '600' }}>Status</th>
                      <th style={{ color: 'black', border: '1px solid black', padding: '15px', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movies && movies.length > 0 ? movies.map(movie => (
                      <tr key={movie.id} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        transition: 'all 0.2s ease'
                      }}>
                        <td style={{ padding: '15px', verticalAlign: 'middle', border: '1px solid black' }}>
                          <div>
                            <h6 className="text-dark mb-1" style={{ fontWeight: '600' }}>
                              {movie.title}
                            </h6>
                            <p className="text-muted mb-1" style={{ fontSize: '0.85rem', margin: 0 }}>
                              ₹{movie.price}
                            </p>
                          </div>
                        </td>
                        <td style={{ padding: '15px', verticalAlign: 'middle', border: '1px solid black' }}>
                          <div className="text-dark">
                            <div style={{ fontWeight: '500' }}>
                              {new Date(movie.date).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                              {new Date(movie.date).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="text-info mt-1" style={{ fontSize: '0.8rem' }}>
                              <i className="fas fa-map-marker-alt me-1"></i>
                              {movie.venue}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '15px', verticalAlign: 'middle', border: '1px solid black' }}>
                          <div className="text-dark">
                            {movie.available_foods && movie.available_foods.trim() ? (
                              <div style={{ fontSize: '0.8rem' }}>
                                {movie.available_foods.split(',').map((food, index) => {
                                  // Check if it's a number (ID) or name
                                  const foodName = /^\d+$/.test(food.trim())
                                    ? foods.find(f => f.id == food.trim())?.name || `Food ${food.trim()}`
                                    : food.trim();
                                  return (
                                    <div key={index} style={{ marginBottom: '2px' }}>
                                      • {foodName}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#666' }}>No foods available</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '15px', verticalAlign: 'middle', border: '1px solid black' }}>
                          <Badge
                            bg={getMovieStatus(movie.date) === 'Upcoming' ? 'success' : 'warning'}
                            style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                          >
                            {getMovieStatus(movie.date)}
                          </Badge>
                        </td>
                        <td style={{ padding: '15px', verticalAlign: 'middle', border: '1px solid black', textAlign: 'center' }}>
                          <div className="d-flex flex-column gap-1 align-items-center">
                            <div className="d-flex gap-1 justify-content-center">
                              <Button
                                variant="outline-dark"
                                size="sm"
                                onClick={() => {
                                  setEditingMovie(movie);
                                  setMovieForm({
                                    title: movie.title,
                                    description: movie.description || '',
                                    date: new Date(movie.date).toISOString().slice(0, 16),
                                    venue: movie.venue,
                                    price: movie.price || '',
                                    category: movie.category || '',
                                    duration: movie.duration || '',
                                    imdb_rating: movie.imdb_rating || '',
                                    language: movie.language || '',
                                    poster: null,
                                    is_special: movie.is_special || 0,
                                    special_message: movie.special_message || ''
                                  });
                                  // Load existing food links
                                  api.get(`/api/foods/movie/${movie.id}`)
                                    .then(res => {
                                      const foodIds = res.data.map(f => f.id);
                                      const freeIds = res.data.filter(f => f.is_free).map(f => f.id);
                                      setSelectedFoodsForMovie(foodIds);
                                      setFreeFoodIds(freeIds);
                                      setShowMovieModal(true);
                                    })
                                    .catch(err => {
                                      console.error('Error loading movie foods:', err);
                                      setSelectedFoodsForMovie([]);
                                      setFreeFoodIds([]);
                                      setShowMovieModal(true);
                                    });
                                }}
                                style={{
                                  borderColor: '#000',
                                  color: '#000',
                                  background: 'transparent',
                                  fontSize: '0.75rem'
                                }}
                              >
                                <i className="fas fa-edit me-1"></i>
                                Edit
                              </Button>

                              <Button
                                variant="outline-dark"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm(`Move "${movie.title}" to past movies? This will mark it as completed.`)) {
                                    api.put(`/api/movies/${movie.id}/move_to_past`)
                                      .then(() => {
                                        alert('Movie moved to past successfully!');
                                        fetchAllData();
                                      })
                                      .catch(err => {
                                        console.error('Error updating movie:', err);
                                        alert('Error updating movie: ' + (err.response?.data?.error || err.message));
                                      });
                                  }
                                }}
                                style={{
                                  borderColor: '#000',
                                  color: '#000',
                                  background: 'transparent',
                                  fontSize: '0.75rem'
                                }}
                              >
                                <i className="fas fa-clock me-1"></i>
                                To Past
                              </Button>

                              <Button
                                variant="outline-dark"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to permanently delete "${movie.title}"? This action cannot be undone.`)) {
                                    api.delete(`/api/movies/${movie.id}`)
                                      .then(() => {
                                        alert('Movie deleted successfully!');
                                        fetchAllData();
                                      })
                                      .catch(err => {
                                        console.error('Error deleting movie:', err);
                                        alert('Error deleting movie: ' + (err.response?.data?.error || err.message));
                                      });
                                  }
                                }}
                                style={{
                                  borderColor: '#000',
                                  color: '#000',
                                  background: 'transparent',
                                  fontSize: '0.75rem'
                                }}
                              >
                                <i className="fas fa-trash me-1"></i>
                                Delete
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="text-center py-5">
                          <div className="text-muted">
                            <i className="fas fa-film fa-3x mb-3"></i>
                            <h5>No Movies Found</h5>
                            <p>Click "Add New Movie" to create your first movie.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </>
        )}

        {activeTab === 'dashboard' && (
          <div className="text-center py-5">
            <h2 className="text-white mb-4" style={{ fontSize: '2rem', fontWeight: '600' }}>
              <i className="fas fa-tachometer-alt me-2"></i>
              Admin Dashboard
            </h2>
            <p className="text-white-50 mb-5" style={{ fontSize: '1.1rem' }}>Overview of your movie screening platform</p>

            <Row className="mt-4">
              <Col md={3} className="mb-4">
                <Card style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  boxShadow: '0 15px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '160px'
                }}>
                  <Card.Body className="text-center" style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem' }}>
                    <Card.Title style={{
                      fontSize: '3rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      marginBottom: '0.5rem',
                      textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                    }}>
                      {stats.total_movies || 0}
                    </Card.Title>
                    <Card.Text style={{
                      fontSize: '1.1rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                      margin: 0,
                      textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}>
                      Total Movies
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} className="mb-4">
                <Card style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  boxShadow: '0 15px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '160px'
                }}>
                  <Card.Body className="text-center" style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem' }}>
                    <Card.Title style={{
                      fontSize: '3rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      marginBottom: '0.5rem',
                      textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                    }}>
                      {stats.upcoming_movies || 0}
                    </Card.Title>
                    <Card.Text style={{
                      fontSize: '1.1rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                      margin: 0,
                      textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}>
                      Booking For Upcoming Movie
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} className="mb-4">
                <Card style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  boxShadow: '0 15px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '160px'
                }}>
                  <Card.Body className="text-center" style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem' }}>
                    <Card.Title style={{
                      fontSize: '3rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      marginBottom: '0.5rem',
                      textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                    }}>
                      {stats.total_bookings || 0}
                    </Card.Title>
                    <Card.Text style={{
                      fontSize: '1.1rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                      margin: 0,
                      textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}>
                      Total Bookings
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} className="mb-4">
                <Card style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  boxShadow: '0 15px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '160px'
                }}>
                  <Card.Body className="text-center" style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem' }}>
                    <Card.Title style={{
                      fontSize: '2.5rem',
                      fontWeight: '700',
                      color: '#28a745',
                      marginBottom: '0.5rem',
                      textShadow: '0 2px 10px rgba(40, 167, 69, 0.4)'
                    }}>
                      {stats.total_users || 0}
                    </Card.Title>
                    <Card.Text style={{
                      fontSize: '1.1rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                      margin: 0,
                      textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}>
                      Total Users
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {activeTab === 'foods' && (
          <>
            <Button
              className="mb-3"
              onClick={() => setShowFoodModal(true)}
              style={{
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '25px',
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                fontWeight: '600',
                padding: '12px 24px'
              }}
            >
              <i className="fas fa-plus me-2"></i>
              Add Food Item
            </Button>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {foods && foods.length > 0 ? foods.map(food => (
                  <tr key={food.id}>
                    <td>{food.name}</td>
                    <td>
                      {food.is_available ? (
                        <Badge bg="success">Yes</Badge>
                      ) : (
                        <Badge bg="danger">No</Badge>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => {
                          setEditingFood(food);
                          setFoodForm({
                            name: food.name,
                            description: food.description,
                            price: food.price,
                            image: null,
                            is_available: food.is_available
                          });
                          setShowFoodModal(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={async () => {
                          // First check if food is linked to movies
                          try {
                            const moviesResponse = await api.get(`/api/foods/${food.id}/movies`);
                            const linkedMovies = moviesResponse.data;

                            let confirmMessage = `Are you sure you want to delete "${food.name}"?`;

                            if (linkedMovies.length > 0) {
                              confirmMessage += `\n\n⚠️ This food is linked to ${linkedMovies.length} movie(s):`;
                              linkedMovies.slice(0, 3).forEach(movie => {
                                confirmMessage += `\n• ${movie.title}`;
                              });
                              if (linkedMovies.length > 3) {
                                confirmMessage += `\n• ...and ${linkedMovies.length - 3} more`;
                              }
                              confirmMessage += `\n\nChoose "Force Delete" to remove from all movies and delete the food.`;
                              confirmMessage += `\nChoose "Cancel" to keep the food.`;

                              const choice = window.confirm(confirmMessage + '\n\nForce delete?');
                              if (choice) {
                                // Force delete
                                api.delete(`/api/foods/${food.id}/force`)
                                  .then((response) => {
                                    alert(`Food deleted successfully! Removed from ${response.data.movies_removed_from} movie(s).`);
                                    fetchAllData();
                                  })
                                  .catch(err => {
                                    console.error('Error force deleting food:', err);
                                    alert('Error deleting food: ' + (err.response?.data?.error || err.message));
                                  });
                              }
                            } else {
                              // No movies linked, regular delete
                              const confirm = window.confirm(confirmMessage + ' This action cannot be undone.');
                              if (confirm) {
                                api.delete(`/api/foods/${food.id}`)
                                  .then(() => {
                                    alert('Food item deleted successfully!');
                                    fetchAllData();
                                  })
                                  .catch(err => {
                                    console.error('Error deleting food:', err);
                                    alert('Error deleting food: ' + (err.response?.data?.error || err.message));
                                  });
                              }
                            }
                          } catch (err) {
                            console.error('Error checking food links:', err);
                            // Fallback to regular delete attempt
                            if (window.confirm(`Are you sure you want to delete "${food.name}"? This action cannot be undone.`)) {
                              api.delete(`/api/foods/${food.id}`)
                                .then(() => {
                                  alert('Food item deleted successfully!');
                                  fetchAllData();
                                })
                                .catch(err => {
                                  console.error('Error deleting food:', err);
                                  alert('Error deleting food: ' + (err.response?.data?.error || err.message));
                                });
                            }
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="text-center text-muted py-4">
                      <i className="fas fa-utensils fa-2x mb-2"></i>
                      <br />
                      No food items found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </>
        )}

        {activeTab === 'bookings' && (
          <div className="text-center text-white py-5">
            <h2>Bookings Management</h2>
            <p>View and manage all movie bookings.</p>

            {/* Simple Glass Design Stats Cards */}
            <Row className="mb-5">
              <Col md={4} className="mb-4">
                <Card className="text-white h-100" style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '15px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  <Card.Body className="text-center">
                    <Card.Title className="display-4 mb-3 fw-bold text-white">
                      {stats.upcoming_movies || 0}
                    </Card.Title>
                    <Card.Text className="h5 mb-0 text-white-50">
                      Upcoming Movies
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4} className="mb-4">
                <Card className="text-white h-100" style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '15px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  <Card.Body className="text-center">
                    <Card.Title className="display-4 mb-3 fw-bold text-white">
                      {stats.total_bookings || 0}
                    </Card.Title>
                    <Card.Text className="h5 mb-0 text-white-50">
                      Total Bookings
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4} className="mb-4">
                <Card className="text-white h-100" style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '15px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  <Card.Body className="text-center">
                    <Card.Title className="display-4 mb-3 fw-bold text-white">
                      {stats.recent_bookings || 0}
                    </Card.Title>
                    <Card.Text className="h5 mb-0 text-white-50">
                      Recent Bookings (7 days)
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <style jsx>{`
              @keyframes liquidFloat {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                25% { transform: translate(10px, -10px) rotate(5deg); }
                50% { transform: translate(-5px, 10px) rotate(-3deg); }
                75% { transform: translate(-10px, -5px) rotate(2deg); }
              }
            `}</style>

            {/* Movie Filter and Export Controls */}
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Filter by Movie:</Form.Label>
                  <Form.Select
                    value={selectedMovie || ''}
                    onChange={(e) => setSelectedMovie(e.target.value || null)}
                    className="bg-dark text-white border-secondary"
                  >
                    <option value="">All Movies</option>
                    {movies && movies.length > 0 && movies.map(movie => (
                      <option key={movie.id} value={movie.id}>
                        {movie.title} ({new Date(movie.date).toLocaleDateString()})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} className="d-flex align-items-end gap-2">
                <Button
                  variant="success"
                  onClick={() => exportBookingsToPDF(filteredBookings)}
                  className="flex-grow-1"
                  style={{
                    background: 'linear-gradient(145deg, rgba(40, 167, 69, 0.8), rgba(40, 167, 69, 0.6))',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white'
                  }}
                >
                  <i className="fas fa-file-pdf me-2"></i>
                  Export PDF ({filteredBookings.length})
                </Button>
                <Button
                  variant="danger"
                  onClick={handleResetBookings}
                  style={{
                    background: 'linear-gradient(145deg, rgba(220, 53, 69, 0.8), rgba(220, 53, 69, 0.6))',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <i className="fas fa-trash-alt me-2"></i>
                  Reset {selectedMovie ? 'Movie' : 'All'}
                </Button>
              </Col>
            </Row>

            <Table striped bordered hover className="mt-4">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Movie</th>
                  <th>Seats</th>
                  <th>Food Orders</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings && filteredBookings.length > 0 ? filteredBookings.map(booking => (
                  <tr key={booking.id}>
                    <td>#{booking.id}</td>
                    <td>
                      <div>
                        <strong>{booking.name || 'N/A'}</strong><br />
                        <small className="text-muted">{booking.email || booking.user_email}</small>
                      </div>
                    </td>
                    <td>{booking.title || booking.movie_title || 'N/A'}</td>
                    <td>{booking.selected_seats || booking.num_people || 'N/A'}</td>
                    <td>
                      {booking.foodOrders && booking.foodOrders.length > 0 ? (
                        <div>
                          {booking.foodOrders.map((food, index) => (
                            <Badge key={index} bg="info" className="me-1 mb-1">
                              {food.name} x{food.quantity}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">No food</span>
                      )}
                    </td>
                    <td>
                      <strong>₹{booking.total_price || booking.price}</strong>
                    </td>
                    <td>
                      <Badge bg={booking.is_used ? 'success' : 'warning'}>
                        {booking.is_used ? 'Used' : 'Active'}
                      </Badge>
                    </td>
                    <td>{new Date(booking.created_at).toLocaleDateString()}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => {
                          // Mark as used/unused
                          api.put(`/api/admin/bookings/${booking.id}`, {
                            is_used: !booking.is_used
                          }).then(() => {
                            fetchAllData();
                          }).catch(err => alert('Error updating booking status'));
                        }}
                      >
                        {booking.is_used ? 'Mark Unused' : 'Mark Used'}
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleDownloadTicketForBooking(booking)}
                      >
                        Download Ticket
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      <i className="fas fa-ticket-alt fa-2x mb-2"></i>
                      <br />
                      {selectedMovie ? 'No bookings found for selected movie' : 'No bookings found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="text-center text-white py-5">
            <h2>Users Management</h2>
            <p>Manage user accounts and permissions.</p>

            {/* Total Users Stats Card */}
            <Row className="mb-4 justify-content-center">
              <Col md={4} className="mb-4">
                <Card className="text-white h-100" style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  boxShadow: '0 15px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '160px'
                }}>
                  <Card.Body className="text-center" style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem' }}>
                    <Card.Title style={{
                      fontSize: '3rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      marginBottom: '0.5rem',
                      textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                    }}>
                      {stats.total_users || 0}
                    </Card.Title>
                    <Card.Text style={{
                      fontSize: '1.1rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                      margin: 0,
                      textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}>
                      Total Users
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Search Users Section */}
            <h4 className="text-white mt-5 mb-4 text-start">
              <i className="fas fa-users me-2"></i>
              All Users
            </h4>
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="form-control"
                style={{ maxWidth: '300px' }}
              />
            </div>
            <Table striped bordered hover className="mt-4">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers && filteredUsers.length > 0 ? filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={user.is_admin ? 'danger' : 'primary'}>
                        {user.is_admin ? 'Admin' : 'User'}
                      </Badge>
                    </td>
                    <td>{formatExactJoinDateTime(user.created_at)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
                      <i className="fas fa-users fa-2x mb-2"></i>
                      <br />
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="text-center text-white py-5">
            <h2>Team Management</h2>
            <p>Manage team members and their roles.</p>
            <Button
              className="mb-3"
              onClick={() => setShowTeamModal(true)}
              style={{
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '25px',
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                fontWeight: '600',
                padding: '12px 24px'
              }}
            >
              <i className="fas fa-plus me-2"></i>
              Add Team Member
            </Button>
            <Table striped bordered hover className="mt-4">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Section</th>
                  <th>Order</th>
                  <th>Student ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {team && team.length > 0 ? team.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        margin: '0 auto'
                      }}>
                        {member.photo_url ? (
                          <img
                            src={getTeamImageUrl(member.photo_url)}
                            alt={member.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.src = '/placeholder-movie.jpg';
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, rgba(0, 123, 255, 0.8), rgba(0, 123, 255, 0.6))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{member.name}</td>
                    <td>{member.role}</td>
                    <td>
                      <Badge bg="info" style={{fontSize: '0.7rem'}}>
                        {member.section === 'foundation_team' ? 'Foundation' : 
                         member.section === 'current_team' ? 'Current' : 'Backend'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg="secondary" pill>
                        {member.display_order || 0}
                      </Badge>
                    </td>
                    <td>{member.student_id}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => {
                          setEditingTeam(member);
                          setTeamForm({
                            name: member.name,
                            student_id: member.student_id,
                            role: member.role,
                            section: member.section,
                            display_order: member.display_order || 0,
                            photo: null,
                            photo_url: member.photo_url || ''
                          });
                          setShowTeamModal(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
                            api.delete(`/api/admin/team/${member.id}`)
                              .then(() => {
                                fetchAllData();
                                alert('Team member removed successfully!');
                              })
                              .catch(err => {
                                console.error('Error removing team member:', err);
                                alert('Error removing team member: ' + (err.response?.data?.error || err.message));
                              });
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      <i className="fas fa-users fa-2x mb-2"></i>
                      <br />
                      No team members found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="text-center text-white py-5">
            <h2>Gallery Management</h2>
            <p>Manage event photos and gallery images.</p>
            <div className="d-flex justify-content-center mt-3">
              <Button
                onClick={() => setShowGalleryModal(true)}
                style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '25px',
                  color: 'white',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  fontWeight: '600',
                  padding: '12px 24px'
                }}
              >
                <i className="fas fa-plus me-2"></i>
                Add New Event
              </Button>
            </div>
            <Row className="mt-4">
              {gallery && gallery.length > 0 ? gallery.map((image, index) => (
                <Col key={image.id || index} md={3} className="mb-4">
                  <Card className="bg-glass border-glass text-white">
                    <Card.Img
                      variant="top"
                      src={getGalleryImageUrl(image.image_url)}
                      style={{
                        height: '200px',
                        objectFit: 'contain',
                        backgroundColor: 'rgba(0, 0, 0, 0.35)'
                      }}
                      onError={(e) => {
                        e.target.src = '/placeholder-movie.jpg';
                      }}
                    />
                    <Card.Body>
                      <Card.Title className="text-truncate" style={{ color: 'black' }}>{image.event_name || 'Gallery Image'}</Card.Title>
                      <div style={{ marginBottom: '1rem' }}>
                        <small style={{ color: 'var(--gray-600)', fontWeight: '500' }}>
                          <i className="fas fa-calendar me-1"></i>
                          {formatGalleryDisplayDate(image.event_date || image.uploaded_at)}
                        </small>
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="mt-2 text-danger border-danger hover-bg-danger hover-text-white"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this image?')) {
                            api.delete(`/api/admin/gallery/${image.id}`)
                              .then(() => {
                                fetchAllData();
                              })
                              .catch(err => alert('Error deleting image'));
                          }
                        }}
                      >
                        <i className="fas fa-trash me-1"></i>Delete
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              )) : (
                <Col>
                  <div className="text-muted py-5">
                    <i className="fas fa-images fa-3x mb-3"></i>
                    <p>No gallery images found</p>
                  </div>
                </Col>
              )}
            </Row>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="text-center text-white py-5">
            <h2>Coupons Management</h2>
            <p>Create and manage discount coupons.</p>

            {/* Action Buttons */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <Button
                  onClick={() => setShowCouponModal(true)}
                  style={{
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '25px',
                    color: 'white',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    fontWeight: '600',
                    padding: '12px 24px'
                  }}
                >
                  <i className="fas fa-plus me-2"></i>
                  Create Coupon
                </Button>
              </div>

              <div className="d-flex gap-2">
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={() => {
                    // Refresh coupons data
                    api.get('/api/admin/coupons')
                      .then(res => {
                        setCoupons(Array.isArray(res.data) ? res.data : []);
                        alert('Coupons list refreshed!');
                      })
                      .catch(err => {
                        console.error('Error refreshing coupons:', err);
                        alert('Error refreshing coupons list');
                      });
                  }}
                  style={{
                    borderColor: '#17a2b8',
                    color: '#17a2b8',
                    background: 'transparent'
                  }}
                >
                  <i className="fas fa-sync-alt me-2"></i>
                  Refresh
                </Button>

                {selectedCoupons.length > 0 && (
                  <div className="d-flex gap-2">
                    <span className="text-white align-self-center me-2">
                      {selectedCoupons.length} selected
                    </span>
                    <Button
                      variant="outline-danger"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${selectedCoupons.length} selected coupon(s)? This action cannot be undone.`)) {
                          handleBulkDeleteCoupons();
                        }
                      }}
                      style={{
                        borderColor: '#dc3545',
                        color: '#dc3545',
                        background: 'transparent'
                      }}
                    >
                      <i className="fas fa-trash me-2"></i>
                      Delete Selected ({selectedCoupons.length})
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Table striped bordered hover className="mt-4">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>
                    <Form.Check
                      type="checkbox"
                      checked={selectAllCoupons}
                      onChange={(e) => handleSelectAllCoupons(e.target.checked)}
                      style={{ margin: 0 }}
                    />
                  </th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th>Expiry</th>
                  <th style={{ width: '200px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons && coupons.length > 0 ? coupons.map(coupon => (
                  <tr key={coupon.id}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selectedCoupons.includes(coupon.id)}
                        onChange={(e) => handleSelectCoupon(coupon.id, e.target.checked)}
                        style={{ margin: 0 }}
                      />
                    </td>
                    <td><strong>{coupon.code}</strong></td>
                    <td>{coupon.description}</td>
                    <td>
                      <Badge bg={coupon.discount_type === 'percentage' ? 'info' : 'success'}>
                        {coupon.discount_type}
                      </Badge>
                    </td>
                    <td>{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}</td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <div style={{ fontSize: '0.85rem', color: 'black' }}>
                          {coupon.used_count || 0}/{coupon.usage_limit === -1 ? 'Unlimited' : coupon.usage_limit}
                        </div>
                        {coupon.usage_limit > 0 && (
                          <div className="progress" style={{ height: '6px', borderRadius: '3px' }}>
                            <div
                              className="progress-bar"
                              style={{
                                width: `${coupon.usage_percentage || 0}%`,
                                background: coupon.status === 'Expired' ? '#dc3545' :
                                  coupon.status === 'Low Usage' ? '#ffc107' : '#28a745'
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge
                        bg={coupon.status === 'Expired' ? 'danger' :
                          coupon.status === 'Used' ? 'secondary' :
                            coupon.status === 'Low Usage' ? 'warning' :
                              'success'}
                        style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                      >
                        {coupon.status === 'Used' ? 'Used' :
                          coupon.status === 'Expired' ? 'Expired' :
                            'Valid'}
                      </Badge>
                    </td>
                    <td>{new Date(coupon.expiry_date).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="d-flex gap-2 justify-content-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setEditingCoupon(coupon);
                            setCouponForm({
                              code: coupon.code,
                              description: coupon.description,
                              discount_type: coupon.discount_type,
                              discount_value: coupon.discount_value,
                              min_purchase: coupon.min_purchase || '',
                              max_discount: coupon.max_discount || '',
                              usage_limit: coupon.usage_limit || '',
                              expiry_date: coupon.expiry_date ? new Date(coupon.expiry_date).toISOString().slice(0, 16) : ''
                            });
                            setShowCouponModal(true);
                          }}
                        >
                          <i className="fas fa-edit me-1"></i>
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the coupon "${coupon.code}"? This action cannot be undone.`)) {
                              handleDeleteCoupon(coupon.id);
                            }
                          }}
                        >
                          <i className="fas fa-trash me-1"></i>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      <i className="fas fa-ticket-alt fa-2x mb-2"></i>
                      <br />
                      No coupons created yet
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}

        {activeTab === 'coupon-winners' && (
          <div className="text-center text-white py-5">
            <h2>Coupon Winners Management</h2>
            <p>Select users to win coupons and view winner history.</p>

            <Button
              className="mb-4"
              onClick={() => setShowWinnerModal(true)}
              style={{
                background: 'linear-gradient(145deg, rgba(255, 193, 7, 0.8), rgba(255, 193, 7, 0.6))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '25px',
                color: 'white',
                boxShadow: '0 8px 32px rgba(255, 193, 7, 0.3)',
                fontWeight: '600',
                padding: '12px 24px'
              }}
            >
              <i className="fas fa-trophy me-2"></i>
              Select New Winners
            </Button>

            {/* Winners Table */}
            <div style={{
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '15px',
              padding: '1.5rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="text-white mb-0">
                  <i className="fas fa-users me-2"></i>
                  All Winners
                </h4>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => {
                      // Export to CSV
                      const headers = ['User', 'Email', 'Coupon Code', 'Discount', 'Status', 'Won Date'];
                      const rows = (couponWinners.winners || []).map(winner => [
                        winner.user_name || 'N/A',
                        winner.user_email,
                        winner.coupon_code,
                        winner.discount_type === 'percentage'
                          ? `${winner.discount_amount}% off`
                          : `₹${winner.discount_amount} off`,
                        winner.is_used ? 'Used' : 'Active',
                        new Date(winner.created_at).toLocaleDateString('en-IN')
                      ]);
                      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `coupon-winners-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                    }}
                  >
                    <i className="fas fa-file-csv me-2"></i>
                    Export CSV
                  </Button>
                  <Button
                    variant="outline-info"
                    size="sm"
                    onClick={() => {
                      // Refresh winners data
                      api.get('/api/admin/coupon-winners')
                        .then(res => {
                          setCouponWinners(res.data);
                          alert('Winners list refreshed!');
                        })
                        .catch(err => {
                          console.error('Error refreshing winners:', err);
                          alert('Error refreshing winners list');
                        });
                    }}
                  >
                    <i className="fas fa-sync-alt me-2"></i>
                    Refresh
                  </Button>
                  {selectedWinners.length > 0 && (
                    <div className="d-flex gap-2">
                      <span className="text-white align-self-center me-2">
                        {selectedWinners.length} selected
                      </span>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${selectedWinners.length} selected winner(s)? This action cannot be undone.`)) {
                            handleDeleteSelectedWinners();
                          }
                        }}
                        style={{
                          borderColor: '#dc3545',
                          color: '#dc3545',
                          background: 'transparent'
                        }}
                      >
                        <i className="fas fa-trash me-2"></i>
                        Delete Selected ({selectedWinners.length})
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Select All Checkbox */}
              {couponWinners.winners && couponWinners.winners.length > 0 && (
                <div className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="select-all-winners"
                    label={`Select All (${couponWinners.winners.length} winners)`}
                    checked={selectedWinners.length === couponWinners.winners.length && couponWinners.winners.length > 0}
                    onChange={(e) => handleSelectAllWinners(e.target.checked)}
                    style={{ color: 'white' }}
                  />
                </div>
              )}

              <Table striped bordered hover responsive style={{ marginBottom: 0 }}>
                <thead style={{ borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                  <tr>
                    <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'left' }}>User</th>
                    <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'left' }}>Email</th>
                    <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'left' }}>Coupon Code</th>
                    <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'left' }}>Discount</th>
                    <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'center' }}>Status</th>
                    <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'left' }}>Won Date</th>
                    <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {couponWinners && couponWinners.winners && couponWinners.winners.length > 0 ? couponWinners.winners.map(winner => (
                    <tr key={winner.id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: winner.is_used ? 'rgba(255,255,255,0.02)' : 'transparent'
                    }}>
                      <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left' }}>
                        <strong>{winner.user_name || 'N/A'}</strong>
                      </td>
                      <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left' }}>
                        <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>
                          {winner.user_email}
                        </code>
                      </td>
                      <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left' }}>
                        <Badge bg="warning" style={{ fontSize: '0.9rem', padding: '6px 10px' }}>
                          <strong>{winner.coupon_code}</strong>
                        </Badge>
                      </td>
                      <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left' }}>
                        <div style={{ fontWeight: '600' }}>
                          {winner.discount_type === 'percentage'
                            ? `${winner.discount_amount}% off`
                            : `₹${winner.discount_amount} off`
                          }
                          {winner.discount_type === 'percentage' && winner.max_discount &&
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                              Max: ₹{winner.max_discount}
                            </div>
                          }
                        </div>
                      </td>
                      <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'center' }}>
                        <Badge bg={winner.is_used ? 'success' : 'warning'} style={{ fontSize: '0.8rem' }}>
                          {winner.is_used ? (
                            <>
                              <i className="fas fa-check me-1"></i>
                              Used
                            </>
                          ) : (
                            <>
                              <i className="fas fa-clock me-1"></i>
                              Active
                            </>
                          )}
                        </Badge>
                      </td>
                      <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left' }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>
                            {new Date(winner.created_at).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            {new Date(winner.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })}
                          </div>
                        </div>
                      </td>
                      <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'center' }}>
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            title="View Details"
                            onClick={() => {
                              alert(`Winner Details:\n\nUser: ${winner.user_name || winner.user_email}\nCoupon: ${winner.coupon_code}\nDiscount: ${winner.discount_type === 'percentage' ? `${winner.discount_amount}%` : `₹${winner.discount_amount}`}\nExpires: ${new Date(winner.expiry_date).toLocaleDateString()}\nStatus: ${winner.is_used ? 'Used' : 'Active'}`);
                            }}
                          >
                            <i className="fas fa-eye me-2"></i>
                            View Details
                          </Button>

                          {!winner.is_used && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              title="Delete Winner"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete the winner record for "${winner.user_name || winner.user_email}" with coupon "${winner.coupon_code}"? This action cannot be undone.`)) {
                                  // Delete individual winner
                                  api.delete('/api/admin/coupon-winners', {
                                    data: { ids: [winner.id] }
                                  })
                                    .then(() => {
                                      alert(`Winner record deleted successfully!`);
                                      // Refresh the winners list
                                      api.get('/api/admin/coupon-winners')
                                        .then(res => {
                                          setCouponWinners(res.data);
                                        })
                                        .catch(err => {
                                          console.error('Error refreshing winners:', err);
                                        });
                                    })
                                    .catch(err => {
                                      console.error('Error deleting winner:', err);
                                      alert('Error deleting winner: ' + (err.response?.data?.error || err.message));
                                    });
                                }
                              }}
                            >
                              <i className="fas fa-trash me-2"></i>
                              Delete Winner
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="text-white-50">
                          <i className="fas fa-trophy fa-3x mb-3"></i>
                          <h5>No Winners Yet</h5>
                          <p>Click "Select New Winners" to create winners and send coupon codes!</p>
                          <small className="text-muted">All winners who receive emails will appear here</small>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="text-white py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">Feedback Analytics</h2>
              <Button 
                variant="danger" 
                onClick={handleResetFeedback}
                style={{
                  borderRadius: '12px',
                  padding: '0.5rem 1.25rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
                  border: 'none'
                }}
              >
                <i className="fas fa-trash-alt me-2"></i> Reset All Ratings
              </Button>
            </div>

            {/* Overall Stats Cards */}
            <Row className="mb-4">
              <Col md={3}>
                <Card style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  color: 'white'
                }}>
                  <Card.Body className="text-center">
                    <i className="fas fa-star fa-2x mb-2" style={{ color: '#ffd700' }}></i>
                    <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#ffffff' }}>
                      {feedback && feedback.length > 0
                        ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length).toFixed(1)
                        : '0.0'}
                    </h3>
                    <p style={{ color: '#ffffff', marginBottom: 0 }}>Average Rating</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  color: 'white'
                }}>
                  <Card.Body className="text-center">
                    <i className="fas fa-comments fa-2x mb-2" style={{ color: '#4CAF50' }}></i>
                    <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#ffffff' }}>
                      {feedback ? feedback.length : 0}
                    </h3>
                    <p style={{ color: '#ffffff', marginBottom: 0 }}>Total Responses</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  color: 'white'
                }}>
                  <Card.Body className="text-center">
                    <i className="fas fa-thumbs-up fa-2x mb-2" style={{ color: '#2196F3' }}></i>
                    <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#ffffff' }}>
                      {feedback ? feedback.filter(f => f.rating >= 4).length : 0}
                    </h3>
                    <p style={{ color: '#ffffff', marginBottom: 0 }}>Positive (4-5 ★)</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  color: 'white'
                }}>
                  <Card.Body className="text-center">
                    <i className="fas fa-film fa-2x mb-2" style={{ color: '#9C27B0' }}></i>
                    <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#ffffff' }}>
                      {feedback ? [...new Set(feedback.map(f => f.movie_id))].length : 0}
                    </h3>
                    <p style={{ color: '#ffffff', marginBottom: 0 }}>Movies Reviewed</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Per Movie Feedback Summary */}
            <Card style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              marginBottom: '1.5rem'
            }}>
              <Card.Header style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontWeight: '600',
                fontSize: '1.1rem'
              }}>
                <i className="fas fa-chart-bar me-2"></i>
                Feedback by Movie
              </Card.Header>
              <Card.Body style={{ padding: '1rem' }}>
                {feedback && feedback.length > 0 ? (
                  <Row>
                    {(() => {
                      // Group feedback by movie
                      const movieFeedback = {};
                      feedback.forEach(f => {
                        const movieId = f.movie_id || 'unknown';
                        const movieTitle = f.movie_title || 'Unknown Movie';
                        if (!movieFeedback[movieId]) {
                          movieFeedback[movieId] = {
                            title: movieTitle,
                            ratings: [],
                            comments: []
                          };
                        }
                        movieFeedback[movieId].ratings.push(f.rating || 0);
                        if (f.comment) movieFeedback[movieId].comments.push(f.comment);
                      });

                      return Object.entries(movieFeedback).map(([movieId, data]) => {
                        const avgRating = data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length;
                        const totalResponses = data.ratings.length;
                        const ratingDistribution = [1, 2, 3, 4, 5].map(r =>
                          data.ratings.filter(rating => rating === r).length
                        );

                        return (
                          <Col md={6} lg={4} key={movieId} className="mb-3">
                            <div style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '12px',
                              padding: '1rem',
                              height: '100%'
                            }}>
                              <h5 style={{
                                color: 'white',
                                marginBottom: '0.75rem',
                                fontSize: '1rem',
                                fontWeight: '600'
                              }}>
                                {data.title}
                              </h5>

                              {/* Average Rating */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '0.75rem',
                                gap: '0.5rem'
                              }}>
                                <span style={{
                                  fontSize: '1.75rem',
                                  fontWeight: '700',
                                  color: '#ffd700'
                                }}>
                                  {avgRating.toFixed(1)}
                                </span>
                                <div>
                                  <div style={{ display: 'flex' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <span key={star} style={{
                                        color: star <= Math.round(avgRating) ? '#ffd700' : 'rgba(255, 255, 255, 0.3)',
                                        fontSize: '14px'
                                      }}>★</span>
                                    ))}
                                  </div>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    color: 'rgba(255, 255, 255, 0.6)'
                                  }}>
                                    {totalResponses} review{totalResponses !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>

                              {/* Rating Distribution Bar */}
                              <div style={{ marginBottom: '0.5rem' }}>
                                {[5, 4, 3, 2, 1].map(star => {
                                  const count = ratingDistribution[star - 1];
                                  const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
                                  return (
                                    <div key={star} style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      marginBottom: '4px'
                                    }}>
                                      <span style={{
                                        fontSize: '0.7rem',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        width: '15px'
                                      }}>
                                        {star}★
                                      </span>
                                      <div style={{
                                        flex: 1,
                                        height: '6px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '3px',
                                        overflow: 'hidden'
                                      }}>
                                        <div style={{
                                          width: `${percentage}%`,
                                          height: '100%',
                                          background: star >= 4 ? '#4CAF50' : star >= 3 ? '#FFC107' : '#f44336',
                                          borderRadius: '3px',
                                          transition: 'width 0.3s ease'
                                        }}></div>
                                      </div>
                                      <span style={{
                                        fontSize: '0.7rem',
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        width: '20px',
                                        textAlign: 'right'
                                      }}>
                                        {count}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </Col>
                        );
                      });
                    })()}
                  </Row>
                ) : (
                  <div className="text-center py-4" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    <i className="fas fa-chart-bar fa-2x mb-2"></i>
                    <p>No feedback data to analyze</p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Detailed Feedback Table */}
            <Card style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '16px'
            }}>
              <Card.Header style={{
                background: 'rgba(255, 255, 255, 0.9)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                color: '#000000',
                fontWeight: '600',
                fontSize: '1.1rem'
              }}>
                <i className="fas fa-list me-2"></i>
                All Feedback Responses
              </Card.Header>
              <Card.Body style={{ padding: 0 }}>
                <Table striped hover style={{ marginBottom: 0 }}>
                  <thead>
                    <tr style={{ background: 'rgba(0, 0, 0, 0.03)' }}>
                      <th style={{ color: '#000000', borderColor: 'rgba(0, 0, 0, 0.1)' }}>User</th>
                      <th style={{ color: '#000000', borderColor: 'rgba(0, 0, 0, 0.1)' }}>Movie</th>
                      <th style={{ color: '#000000', borderColor: 'rgba(0, 0, 0, 0.1)' }}>Rating</th>
                      <th style={{ color: '#000000', borderColor: 'rgba(0, 0, 0, 0.1)' }}>Comment</th>
                      <th style={{ color: '#000000', borderColor: 'rgba(0, 0, 0, 0.1)' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedback && feedback.length > 0 ? feedback.map(item => (
                      <tr key={item.id} style={{ background: 'transparent' }}>
                        <td style={{ color: '#333333', borderColor: 'rgba(0, 0, 0, 0.08)' }}>
                          {item.user_name || item.user_email || 'Anonymous'}
                        </td>
                        <td style={{ color: '#333333', borderColor: 'rgba(0, 0, 0, 0.08)' }}>
                          {item.movie_title || 'N/A'}
                        </td>
                        <td style={{ borderColor: 'rgba(0, 0, 0, 0.08)' }}>
                          <div className="d-flex align-items-center">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} style={{
                                color: i < item.rating ? '#ffd700' : 'rgba(0, 0, 0, 0.2)',
                                fontSize: '14px'
                              }}>
                                ★
                              </span>
                            ))}
                            <span style={{
                              marginLeft: '8px',
                              color: '#333333',
                              fontSize: '0.85rem'
                            }}>
                              {item.rating}/5
                            </span>
                          </div>
                        </td>
                        <td style={{
                          color: '#444444',
                          borderColor: 'rgba(0, 0, 0, 0.08)',
                          maxWidth: '250px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.comment || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No comment</span>}
                        </td>
                        <td style={{ color: '#555555', borderColor: 'rgba(0, 0, 0, 0.08)' }}>
                          {new Date(item.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4" style={{ color: '#666666' }}>
                          <i className="fas fa-comments fa-2x mb-2"></i>
                          <br />
                          No feedback received yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </div>
        )}

        {activeTab === 'mail' && (
          <div className="text-center text-white py-5">
            <h2 style={{ color: 'white' }}>Email Management</h2>
            <p style={{ color: 'white' }}>Send emails to users and manage email templates.</p>

            <Row className="mb-4">
              <Col md={4}>
                <Card style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  color: 'black'
                }}>
                  <Card.Body>
                    <Card.Title style={{ color: 'black', fontWeight: '600' }}>Send Single Email</Card.Title>
                    <Card.Text style={{ color: 'black', opacity: 0.8 }}>Send to a specific user or any email address</Card.Text>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setEmailRecipientMode('user');
                        setShowEmailModal(true);
                        setSingleEmailSearch('');
                        setEmailForm({ user_id: '', recipient_name: '', email: '', subject: '', message: '', attachment_name: '', attachment_type: '', attachment_base64: '' });
                      }}
                      style={{
                        background: 'linear-gradient(145deg, rgba(0, 123, 255, 0.9), rgba(0, 123, 255, 0.7))',
                        border: '1px solid rgba(0, 0, 0, 0.2)',
                        borderRadius: '25px',
                        color: 'white',
                        fontWeight: '600',
                        padding: '12px 24px'
                      }}
                    >
                      <i className="fas fa-envelope me-2"></i>
                      Send Email
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  color: 'black'
                }}>
                  <Card.Body>
                    <Card.Title style={{ color: 'black', fontWeight: '600' }}>Bulk Email</Card.Title>
                    <Card.Text style={{ color: 'black', opacity: 0.8 }}>Send to multiple selected users</Card.Text>
                    <Button
                      variant="warning"
                      onClick={() => {
                        setSelectedUsers([]);
                        setShowBulkEmailModal(true);
                        setBulkEmailForm({ subject: '', message: '' });
                      }}
                      style={{
                        background: 'linear-gradient(145deg, rgba(255, 193, 7, 0.9), rgba(255, 193, 7, 0.7))',
                        border: '1px solid rgba(0, 0, 0, 0.2)',
                        borderRadius: '25px',
                        color: 'white',
                        fontWeight: '600',
                        padding: '12px 24px'
                      }}
                    >
                      <i className="fas fa-users me-2"></i>
                      Bulk Email
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  color: 'black'
                }}>
                  <Card.Body>
                    <Card.Title style={{ color: 'black', fontWeight: '600' }}>Send Feedback Request</Card.Title>
                    <Card.Text style={{ color: 'black', opacity: 0.8 }}>Send feedback email to users who scanned tickets</Card.Text>
                    <Form.Group className="mb-3" style={{ textAlign: 'left' }}>
                      <Form.Label style={{ fontWeight: '600', color: 'black' }}>Choose Movie</Form.Label>
                      <Form.Select
                        size="sm"
                        value={feedbackMovieId}
                        onChange={(e) => setFeedbackMovieId(e.target.value)}
                      >
                        <option value="" disabled>Select a movie</option>
                        {feedbackMovieOptions.map((movie) => (
                          <option key={movie.id} value={movie.id}>
                            {movie.title} ({new Date(movie.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        {selectedFeedbackMovie
                          ? `Scanned tickets for this movie: ${scannedTicketsForSelectedMovie}`
                          : 'Select a movie to see scanned ticket count.'}
                      </Form.Text>
                    </Form.Group>
                    <Button
                      variant="info"
                      onClick={() => {
                        if (!selectedFeedbackMovie?.title) {
                          alert('Please select a movie to send feedback requests.');
                          return;
                        }
                        const confirmTarget = `for "${selectedFeedbackMovie.title}"`;
                        const confirmCount = scannedTicketsForSelectedMovie;
                        if (window.confirm(`Send feedback request emails ${confirmTarget} to ${confirmCount} scanned users?`)) {
                          handleSendFeedbackEmails();
                        }
                      }}
                      style={{
                        background: 'linear-gradient(145deg, rgba(23, 162, 184, 0.9), rgba(23, 162, 184, 0.7))',
                        border: '1px solid rgba(0, 0, 0, 0.2)',
                        borderRadius: '25px',
                        color: 'white',
                        fontWeight: '600',
                        padding: '12px 24px'
                      }}
                    >
                      <i className="fas fa-comments me-2"></i>
                      Request Feedback
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Table striped bordered hover className="mt-4" style={{ color: 'black' }}>
              <thead style={{ borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
                <tr>
                  <th style={{ color: 'black', border: '1px solid rgba(0,0,0,0.1)', padding: '12px', fontWeight: '600' }}>User</th>
                  <th style={{ color: 'black', border: '1px solid rgba(0,0,0,0.1)', padding: '12px', fontWeight: '600' }}>Email</th>
                  <th style={{ color: 'black', border: '1px solid rgba(0,0,0,0.1)', padding: '12px', fontWeight: '600' }}>Joined</th>
                  <th style={{ color: 'black', border: '1px solid rgba(0,0,0,0.1)', padding: '12px', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users && users.length > 0 ? users.slice(0, 10).map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={{ color: 'black', border: '1px solid rgba(0,0,0,0.1)', padding: '12px' }}>{user.name}</td>
                    <td style={{ color: 'black', border: '1px solid rgba(0,0,0,0.1)', padding: '12px' }}>{user.email}</td>
                    <td style={{ color: 'black', border: '1px solid rgba(0,0,0,0.1)', padding: '12px' }}>{formatExactJoinDateTime(user.created_at)}</td>
                    <td style={{ border: '1px solid rgba(0,0,0,0.1)', padding: '12px', textAlign: 'center' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setEmailRecipientMode('user');
                          setShowEmailModal(true);
                          setSingleEmailSearch('');
                          setEmailForm({
                            user_id: user.id,
                            recipient_name: '',
                            email: '',
                            subject: '',
                            message: ''
                          });
                        }}
                        style={{
                          background: 'linear-gradient(145deg, rgba(0, 123, 255, 0.9), rgba(0, 123, 255, 0.7))',
                          border: '1px solid rgba(0, 0, 0, 0.2)',
                          borderRadius: '20px',
                          color: 'white',
                          fontWeight: '600',
                          padding: '8px 16px'
                        }}
                      >
                        <i className="fas fa-envelope me-2"></i>
                        Email
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
                      <div style={{ color: 'black' }}>
                        <i className="fas fa-users fa-2x mb-2"></i>
                        <br />
                        No users found
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}

        {activeTab === 'email-history' && (
          <div className="text-center text-white py-5">
            <h2>Email History</h2>
            <p>View sent emails and their status.</p>
            <Table striped bordered hover className="mt-4">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Sent Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    <i className="fas fa-envelope fa-2x mb-2"></i>
                    <br />
                    Email history will be displayed here
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-center text-white py-5">
            <h2>Website Settings</h2>
            <p>Configure website settings and preferences.</p>

            <Form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const formData = new FormData();
                formData.append('tagline', settingsForm.tagline);
                formData.append('hero_background', settingsForm.hero_background);
                formData.append('about_text', settingsForm.about_text);

                if (settingsForm.hero_background_image) {
                  formData.append('hero_background_image', settingsForm.hero_background_image);
                }
                if (settingsForm.hero_background_video) {
                  formData.append('hero_background_video', settingsForm.hero_background_video);
                }
                if (settingsForm.about_image) {
                  formData.append('about_image', settingsForm.about_image);
                }

                await api.put('/api/admin/settings', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });

                alert('Settings updated successfully!');
                fetchAllData();
              } catch (err) {
                console.error('Error updating settings:', err);
                alert('Error updating settings: ' + (err.response?.data?.error || err.message));
              }
            }} className="mt-4" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
              <Form.Group className="mb-3">
                <Form.Label>Website Tagline</Form.Label>
                <Form.Control
                  type="text"
                  value={settingsForm.tagline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                  placeholder="Enter website tagline"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Hero Background Color</Form.Label>
                <Form.Control
                  type="color"
                  value={settingsForm.hero_background}
                  onChange={(e) => setSettingsForm({ ...settingsForm, hero_background: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Hero Background Image</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setSettingsForm({ ...settingsForm, hero_background_image: e.target.files[0] })}
                  accept="image/*"
                />
                <Form.Text className="text-muted">
                  Upload a background image for the hero section (optional)
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Hero Background Video</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setSettingsForm({ ...settingsForm, hero_background_video: e.target.files[0] })}
                  accept="video/*"
                />
                <Form.Text className="text-muted">
                  Upload a background video for the hero section (optional)
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>About Section Text</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={settingsForm.about_text}
                  onChange={(e) => setSettingsForm({ ...settingsForm, about_text: e.target.value })}
                  placeholder="Enter about section text"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>About Section Image</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setSettingsForm({ ...settingsForm, about_image: e.target.files[0] })}
                  accept="image/*"
                />
                <Form.Text className="text-muted">
                  Upload an image for the about section (optional)
                </Form.Text>
              </Form.Group>

              <Button variant="primary" type="submit" size="lg">
                <i className="fas fa-save me-2"></i>
                Save Settings
              </Button>
            </Form>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="text-center text-white py-5">
            {!hasConfigAccess ? (
              <div style={{
                background: 'linear-gradient(145deg, rgba(220, 53, 69, 0.15), rgba(220, 53, 69, 0.1))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(220, 53, 69, 0.4)',
                borderRadius: '20px',
                padding: '3rem',
                maxWidth: '500px',
                margin: '0 auto',
                boxShadow: '0 15px 50px rgba(220, 53, 69, 0.3)'
              }}>
                <div style={{
                  fontSize: '4rem',
                  marginBottom: '1rem'
                }}>
                  🚫
                </div>
                <h2 style={{
                  color: '#ff6b6b',
                  fontWeight: '700',
                  marginBottom: '1rem'
                }}>
                  Access Denied
                </h2>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1.1rem',
                  lineHeight: '1.6'
                }}>
                  You dont have permission to View this page.
                  <br /><br />
                  <strong>Note:</strong> Only the admin with email
                  <br />
                  <code style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    display: 'inline-block',
                    marginTop: '0.5rem',
                    fontSize: '1rem'
                  }}>
                    2025uee0154@iitjammu.ac.in
                  </code>
                  <br /><br />
                  can access this Config tab.
                </p>
              </div>
            ) : (
              <>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#ffd700'
                }}>
                  <i className="fas fa-cogs me-2" style={{ color: '#ffd700' }}></i>
                  Configuration Panel
                </h2>
                <p className="text-white-50 mb-5" style={{ fontSize: '1.1rem' }}>
                  Advanced system configuration (Super Admin Only)
                </p>

                {/* Config Access Granted Badge */}
                <div style={{
                  background: 'linear-gradient(145deg, rgba(40, 167, 69, 0.2), rgba(40, 167, 69, 0.1))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(40, 167, 69, 0.4)',
                  borderRadius: '15px',
                  padding: '1rem 2rem',
                  marginBottom: '2rem',
                  display: 'inline-block'
                }}>
                  <Badge bg="success" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                    <i className="fas fa-check-circle me-1"></i>
                    Super Admin Access Granted
                  </Badge>
                </div>

                {/* Config Cards */}
                <Row className="mt-4">
                  <Col md={4} className="mb-4">
                    <Card style={{
                      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                      backdropFilter: 'blur(30px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '20px',
                      boxShadow: '0 15px 50px rgba(0,0,0,0.2)',
                      minHeight: '200px'
                    }}>
                      <Card.Body className="text-center d-flex flex-column justify-content-center">
                        <div style={{
                          fontSize: '3rem',
                          marginBottom: '1rem'
                        }}>
                          🔐
                        </div>
                        <Card.Title style={{ color: 'white', fontWeight: '600' }}>
                          Security Settings
                        </Card.Title>
                        <Card.Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Configure mail server and payment gateway
                        </Card.Text>
                        <div className="d-flex flex-column gap-2 mt-3">
                          <Button
                            variant="outline-light"
                            size="sm"
                            onClick={() => {
                              setShowMailSettings(true);
                              fetchMailSettings();
                            }}
                            style={{
                              borderRadius: '20px',
                              background: 'transparent'
                            }}
                          >
                            <i className="fas fa-envelope me-2"></i>
                            Configure Mail
                          </Button>
                          <Button
                            variant="outline-light"
                            size="sm"
                            onClick={() => {
                              setShowRazorpaySettings(true);
                              fetchRazorpaySettings();
                            }}
                            style={{
                              borderRadius: '20px',
                              background: 'transparent'
                            }}
                          >
                            <i className="fas fa-credit-card me-2"></i>
                            Configure Razorpay
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={4} className="mb-4">
                    <Card style={{
                      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                      backdropFilter: 'blur(30px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '20px',
                      boxShadow: '0 15px 50px rgba(0,0,0,0.2)',
                      minHeight: '200px'
                    }}>
                      <Card.Body className="text-center d-flex flex-column justify-content-center">
                        <div style={{
                          fontSize: '3rem',
                          marginBottom: '1rem'
                        }}>
                          📊
                        </div>
                        <Card.Title style={{ color: 'white', fontWeight: '600' }}>
                          Database Management
                        </Card.Title>
                        <Card.Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          View revenue, financial data, and sensitive info
                        </Card.Text>
                        <Button
                          variant="outline-light"
                          size="sm"
                          className="mt-3"
                          onClick={() => {
                            setShowDatabaseManagement(true);
                            fetchRevenueStats();
                          }}
                          style={{
                            borderRadius: '20px',
                            background: 'transparent'
                          }}
                        >
                          <i className="fas fa-database me-2"></i>
                          View Data
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={4} className="mb-4">
                    <Card style={{
                      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                      backdropFilter: 'blur(30px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '20px',
                      boxShadow: '0 15px 50px rgba(0,0,0,0.2)',
                      minHeight: '200px'
                    }}>
                      <Card.Body className="text-center d-flex flex-column justify-content-center">
                        <div style={{
                          fontSize: '3rem',
                          marginBottom: '1rem'
                        }}>
                          👥
                        </div>
                        <Card.Title style={{ color: 'white', fontWeight: '600' }}>
                          Manage Admins
                        </Card.Title>
                        <Card.Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Grant or revoke admin tab permissions
                        </Card.Text>
                        <Button
                          variant="outline-light"
                          size="sm"
                          className="mt-3"
                          onClick={() => setActiveTab('manage-admins')}
                          style={{
                            borderRadius: '20px',
                            background: 'transparent'
                          }}
                        >
                          Manage
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Warning about super admin access */}
                <Alert variant="warning" className="mt-4" style={{
                  background: 'rgba(255, 193, 7, 0.15)',
                  border: '1px solid rgba(255, 193, 7, 0.4)',
                  borderRadius: '15px',
                  color: 'white'
                }}>
                  <Alert.Heading style={{ color: '#ffc107' }}>
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Super Admin Privileges
                  </Alert.Heading>
                  <p className="mb-0">
                    You have full access to system configuration. Please be careful when making changes
                    as they may affect the entire system. Only authorized personnel should access this area.
                  </p>
                </Alert>
              </>
            )}
          </div>
        )}

        {/* Database Management View - Shows Total Revenue and Sensitive Data */}
        {activeTab === 'config' && showDatabaseManagement && hasConfigAccess && (
          <div className="text-center text-white py-5">
            <div className="d-flex justify-content-between align-items-center mb-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div className="text-start">
                <h2 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem', color: '#28a745' }}>
                  <i className="fas fa-database me-2" style={{ color: '#28a745' }}></i>
                  Database Management
                </h2>
                <p className="text-white-50" style={{ fontSize: '1rem', margin: 0 }}>
                  Revenue statistics and sensitive data (Super Admin Only)
                </p>
              </div>
              <Button
                variant="outline-light"
                onClick={() => setShowDatabaseManagement(false)}
                style={{
                  borderRadius: '20px',
                  background: 'transparent'
                }}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Config
              </Button>
            </div>

            {/* Revenue Stats Cards */}
            {revenueLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-white-50">Loading revenue data...</p>
              </div>
            ) : (
              <>
                <Row className="mb-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                  {/* Total Revenue Card */}
                  <Col md={3} className="mb-4">
                    <Card style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(30px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '20px',
                      boxShadow: '0 15px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                      minHeight: '180px'
                    }}>
                      <Card.Body className="text-center" style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💰</div>
                        <Card.Title style={{
                          fontSize: '2rem',
                          fontWeight: '700',
                          color: '#ffffff',
                          marginBottom: '0.5rem',
                          textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                        }}>
                          ₹{parseFloat(revenueStats.total_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </Card.Title>
                        <Card.Text style={{
                          fontSize: '1rem',
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontWeight: '500',
                          margin: 0,
                          textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }}>
                          Total Revenue (Bookings)
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Food Revenue Card */}
                  <Col md={3} className="mb-4">
                    <Card style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(30px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '20px',
                      boxShadow: '0 15px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                      minHeight: '180px'
                    }}>
                      <Card.Body className="text-center" style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍿</div>
                        <Card.Title style={{
                          fontSize: '2rem',
                          fontWeight: '700',
                          color: '#ffffff',
                          marginBottom: '0.5rem',
                          textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                        }}>
                          ₹{parseFloat(revenueStats.food_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </Card.Title>
                        <Card.Text style={{
                          fontSize: '1rem',
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontWeight: '500',
                          margin: 0,
                          textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }}>
                          Food Revenue
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Total Discounts Card */}
                  <Col md={3} className="mb-4">
                    <Card style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(30px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '20px',
                      boxShadow: '0 15px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                      minHeight: '180px'
                    }}>
                      <Card.Body className="text-center" style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏷️</div>
                        <Card.Title style={{
                          fontSize: '2rem',
                          fontWeight: '700',
                          color: '#ffffff',
                          marginBottom: '0.5rem',
                          textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                        }}>
                          ₹{parseFloat(revenueStats.total_discounts || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </Card.Title>
                        <Card.Text style={{
                          fontSize: '1rem',
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontWeight: '500',
                          margin: 0,
                          textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }}>
                          Total Discounts Given
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Total Bookings Card */}
                  <Col md={3} className="mb-4">
                    <Card style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(30px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '20px',
                      boxShadow: '0 15px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                      minHeight: '180px'
                    }}>
                      <Card.Body className="text-center" style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎫</div>
                        <Card.Title style={{
                          fontSize: '2rem',
                          fontWeight: '700',
                          color: '#ffffff',
                          marginBottom: '0.5rem',
                          textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                        }}>
                          {revenueStats.total_bookings || 0}
                        </Card.Title>
                        <Card.Text style={{
                          fontSize: '1rem',
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontWeight: '500',
                          margin: 0,
                          textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }}>
                          Total Bookings
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Revenue by Movie Table */}
                <div style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '15px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  maxWidth: '1400px',
                  margin: '0 auto 2rem'
                }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="text-white mb-0">
                      <i className="fas fa-film me-2"></i>
                      Revenue by Movie
                    </h4>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => {
                        // Export to CSV
                        const headers = ['Movie', 'Date', 'Bookings', 'Revenue'];
                        const rows = revenueStats.revenue_by_movie.map(m => [
                          m.title,
                          new Date(m.date).toLocaleDateString('en-IN'),
                          m.booking_count,
                          `₹${parseFloat(m.revenue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                        ]);
                        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `revenue-by-movie-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                      }}
                    >
                      <i className="fas fa-file-csv me-2"></i>
                      Export CSV
                    </Button>
                  </div>
                  <Table striped bordered hover responsive style={{ marginBottom: 0 }}>
                    <thead style={{ borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                      <tr>
                        <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'left' }}>Movie</th>
                        <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'left' }}>Date</th>
                        <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'center' }}>Bookings</th>
                        <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'right' }}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueStats.revenue_by_movie && revenueStats.revenue_by_movie.length > 0 ? (
                        revenueStats.revenue_by_movie.map((movie, index) => (
                          <tr key={index} style={{
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                          }}>
                            <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left' }}>
                              <strong>{movie.title}</strong>
                            </td>
                            <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left' }}>
                              {new Date(movie.date).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'center' }}>
                              <Badge bg="primary">{movie.booking_count}</Badge>
                            </td>
                            <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'right' }}>
                              <strong style={{ color: '#28a745' }}>
                                ₹{parseFloat(movie.revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </strong>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-4" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div className="text-white-50">
                              <i className="fas fa-film fa-2x mb-2"></i>
                              <p className="mb-0">No movie revenue data available</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                {/* Recent Transactions Table */}
                <div style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '15px',
                  padding: '1.5rem',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  maxWidth: '1400px',
                  margin: '0 auto'
                }}>
                  <h4 className="text-white mb-3">
                    <i className="fas fa-history me-2"></i>
                    Recent Transactions
                  </h4>
                  <Table striped bordered hover responsive style={{ marginBottom: 0 }}>
                    <thead style={{ borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                      <tr>
                        <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'left' }}>ID</th>
                        <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'left' }}>User</th>
                        <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'left' }}>Movie</th>
                        <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'center' }}>Seats</th>
                        <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'right' }}>Amount</th>
                        <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'center' }}>Status</th>
                        <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'left' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueStats.recent_transactions && revenueStats.recent_transactions.length > 0 ? (
                        revenueStats.recent_transactions.map((tx, index) => (
                          <tr key={tx.id || index} style={{
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                          }}>
                            <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left' }}>
                              <code>#{tx.booking_code || tx.id}</code>
                            </td>
                            <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left' }}>
                              <div>
                                <strong>{tx.user_name}</strong>
                                <br />
                                <small style={{ color: '#666' }}>{tx.user_email}</small>
                              </div>
                            </td>
                            <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left' }}>
                              {tx.movie_title}
                            </td>
                            <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'center' }}>
                              {tx.selected_seats ? JSON.parse(tx.selected_seats).join(', ') : tx.num_people}
                            </td>
                            <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'right' }}>
                              <strong style={{ color: '#28a745' }}>
                                ₹{parseFloat(tx.total_price || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </strong>
                            </td>
                            <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'center' }}>
                              <Badge bg={tx.is_used ? 'success' : 'warning'}>
                                {tx.is_used ? 'Used' : 'Active'}
                              </Badge>
                            </td>
                            <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left' }}>
                              {new Date(tx.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-4" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div className="text-white-50">
                              <i className="fas fa-receipt fa-2x mb-2"></i>
                              <p className="mb-0">No recent transactions</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                {/* Monthly Revenue Section */}
                {revenueStats.monthly_revenue && revenueStats.monthly_revenue.length > 0 && (
                  <div style={{
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '15px',
                    padding: '1.5rem',
                    marginTop: '2rem',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    maxWidth: '1400px',
                    margin: '2rem auto 0'
                  }}>
                    <h4 className="text-white mb-3">
                      <i className="fas fa-chart-line me-2"></i>
                      Monthly Revenue (Last 6 Months)
                    </h4>
                    <Row>
                      {revenueStats.monthly_revenue.map((month, index) => (
                        <Col md={4} key={index} className="mb-3">
                          <Card style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px'
                          }}>
                            <Card.Body className="text-center">
                              <Card.Title style={{ color: 'white', fontSize: '1.2rem' }}>
                                {month.month}
                              </Card.Title>
                              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#28a745' }}>
                                ₹{parseFloat(month.revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </div>
                              <small className="text-white-50">
                                {month.bookings} bookings
                              </small>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

                {/* Payment Methods Section */}
                {revenueStats.payment_methods && revenueStats.payment_methods.length > 0 && (
                  <div style={{
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '15px',
                    padding: '1.5rem',
                    marginTop: '2rem',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    maxWidth: '1400px',
                    margin: '2rem auto 0'
                  }}>
                    <h4 className="text-white mb-3">
                      <i className="fas fa-credit-card me-2"></i>
                      Payment Methods Breakdown
                    </h4>
                    <Row>
                      {revenueStats.payment_methods.map((pm, index) => (
                        <Col md={6} key={index} className="mb-3">
                          <Card style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px'
                          }}>
                            <Card.Body className="text-center">
                              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                                {pm.payment_method === 'razorpay' ? '💳' : pm.payment_method === 'upi' ? '📱' : '🏦'}
                              </div>
                              <Card.Title style={{ color: 'white', fontSize: '1.1rem' }}>
                                {pm.payment_method === 'razorpay' ? 'Razorpay' : pm.payment_method === 'upi' ? 'UPI' : pm.payment_method === 'offline' ? 'Offline' : pm.payment_method}
                              </Card.Title>
                              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#007bff' }}>
                                ₹{parseFloat(pm.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </div>
                              <small className="text-white-50">
                                {pm.count} transactions
                              </small>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

                {/* Warning about sensitive data */}
                <Alert variant="danger" className="mt-4" style={{
                  background: 'rgba(220, 53, 69, 0.15)',
                  border: '1px solid rgba(220, 53, 69, 0.4)',
                  borderRadius: '15px',
                  color: 'white',
                  maxWidth: '1400px',
                  margin: '0 auto'
                }}>
                  <Alert.Heading style={{ color: '#ff6b6b' }}>
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Sensitive Data Warning
                  </Alert.Heading>
                  <p className="mb-0">
                    This page contains sensitive financial data including revenue figures, discounts given, and transaction details.
                    Only share this information with authorized personnel. Do not screenshot or share this data publicly.
                  </p>
                </Alert>
              </>
            )}
          </div>
        )}

        {/* Mail Settings View - Configure Email Server */}
        {activeTab === 'config' && showMailSettings && hasConfigAccess && (
          <div className="text-center text-white py-5">
            <div className="d-flex justify-content-between align-items-center mb-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div className="text-start">
                <h2 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem', color: '#ffffff' }}>
                  <i className="fas fa-envelope me-2" style={{ color: '#ffffff' }}></i>
                  Mail Server Configuration
                </h2>
                <p className="text-white-50" style={{ fontSize: '1rem', margin: 0 }}>
                  Configure SMTP settings for sending emails (Super Admin Only)
                </p>
              </div>
              <Button
                variant="outline-light"
                onClick={() => setShowMailSettings(false)}
                style={{
                  borderRadius: '20px',
                  background: 'transparent'
                }}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Config
              </Button>
            </div>

            {mailSettingsLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-white-50">Loading mail settings...</p>
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                padding: '2rem',
                maxWidth: '900px',
                margin: '0 auto',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                {/* Success Message */}
                {mailSettingsSuccess && (
                  <Alert variant="success" className="mb-4" style={{
                    background: 'rgba(40, 167, 69, 0.2)',
                    border: '1px solid rgba(40, 167, 69, 0.4)',
                    borderRadius: '10px'
                  }}>
                    <i className="fas fa-check-circle me-2"></i>
                    {mailSettingsSuccess}
                  </Alert>
                )}

                {/* Error Message */}
                {mailSettingsError && (
                  <Alert variant="danger" className="mb-4" style={{
                    background: 'rgba(220, 53, 69, 0.2)',
                    border: '1px solid rgba(220, 53, 69, 0.4)',
                    borderRadius: '10px'
                  }}>
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {mailSettingsError}
                  </Alert>
                )}

                <Form onSubmit={(e) => { e.preventDefault(); saveMailSettings(); }}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ color: 'white', fontWeight: '500' }}>SMTP Host</Form.Label>
                        <Form.Control
                          type="text"
                          value={mailSettings.email_host}
                          onChange={(e) => setMailSettings({ ...mailSettings, email_host: e.target.value })}
                          placeholder="e.g., smtp.gmail.com"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '10px',
                            color: 'white',
                            padding: '12px'
                          }}
                        />
                        <Form.Text className="text-muted">
                          SMTP server address (e.g., smtp.gmail.com, smtp.outlook.com)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ color: 'white', fontWeight: '500' }}>SMTP Port</Form.Label>
                        <Form.Control
                          type="number"
                          value={mailSettings.email_port}
                          onChange={(e) => setMailSettings({ ...mailSettings, email_port: parseInt(e.target.value) })}
                          placeholder="e.g., 587"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '10px',
                            color: 'white',
                            padding: '12px'
                          }}
                        />
                        <Form.Text className="text-muted">
                          Port 587 (TLS) or 465 (SSL)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ color: 'white', fontWeight: '500' }}>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          value={mailSettings.email_user}
                          onChange={(e) => setMailSettings({ ...mailSettings, email_user: e.target.value })}
                          placeholder="e.g., your-email@gmail.com"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '10px',
                            color: 'white',
                            padding: '12px'
                          }}
                        />
                        <Form.Text className="text-muted">
                          The email address to send emails from
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ color: 'white', fontWeight: '500' }}>
                          App Password
                          {mailSettings.email_pass && mailSettings.email_pass !== '' && mailSettings.email_pass !== '••••••••' && (
                            <Badge bg="success" className="ms-2">Saved</Badge>
                          )}
                        </Form.Label>
                        <Form.Control
                          type="password"
                          value={mailSettings.email_pass}
                          onChange={(e) => setMailSettings({ ...mailSettings, email_pass: e.target.value })}
                          placeholder="Enter app password"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '10px',
                            color: 'white',
                            padding: '12px'
                          }}
                        />
                        <Form.Text className="text-muted">
                          For Gmail, use an App Password (not regular password)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <Form.Label style={{ color: 'white', fontWeight: '500' }}>Sender Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={mailSettings.sender_name}
                      onChange={(e) => setMailSettings({ ...mailSettings, sender_name: e.target.value })}
                      placeholder="e.g., Chalchitra IIT Jammu"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '10px',
                        color: 'white',
                        padding: '12px'
                      }}
                    />
                    <Form.Text className="text-muted">
                      The name that will appear in the "From" field of emails
                    </Form.Text>
                  </Form.Group>

                  {/* Action Buttons */}
                  <div className="d-flex gap-3 justify-content-center">
                    <Button
                      variant="outline-light"
                      type="button"
                      onClick={testMailSettings}
                      disabled={mailSettingsSaving}
                      style={{
                        borderRadius: '20px',
                        background: 'transparent',
                        padding: '12px 24px'
                      }}
                    >
                      <i className="fas fa-paper-plane me-2"></i>
                      {mailSettingsSaving ? 'Sending...' : 'Test Configuration'}
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={mailSettingsSaving}
                      style={{
                        background: 'linear-gradient(145deg, rgba(0, 123, 255, 0.8), rgba(0, 123, 255, 0.6))',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '25px',
                        color: 'white',
                        fontWeight: '600',
                        padding: '12px 24px'
                      }}
                    >
                      <i className="fas fa-save me-2"></i>
                      Save Settings
                    </Button>
                  </div>
                </Form>

                {/* Help Section */}
                <div className="mt-5" style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '15px',
                  padding: '1.5rem',
                  textAlign: 'left'
                }}>
                  <h5 style={{ color: 'white', marginBottom: '1rem' }}>
                    <i className="fas fa-question-circle me-2"></i>
                    Setup Guide
                  </h5>
                  <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.8' }}>
                    <p className="mb-3"><strong>For Gmail:</strong></p>
                    <ol style={{ paddingLeft: '1.5rem' }}>
                      <li>Go to your Google Account → Security</li>
                      <li>Enable 2-Step Verification</li>
                      <li>Go to App Passwords (under Security → 2-Step Verification)</li>
                      <li>Create a new app password for "Mail"</li>
                      <li>Copy the 16-character password and paste it above</li>
                    </ol>
                    <p className="mb-2 mt-3"><strong>Common SMTP Settings:</strong></p>
                    <ul style={{ paddingLeft: '1.5rem' }}>
                      <li>Gmail: smtp.gmail.com (Port 587)</li>
                      <li>Outlook: smtp.office365.com (Port 587)</li>
                      <li>Yahoo: smtp.mail.yahoo.com (Port 587)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Razorpay Settings View - Configure Payment Gateway */}
        {activeTab === 'config' && showRazorpaySettings && hasConfigAccess && (
          <div className="text-center text-white py-5">
            <div className="d-flex justify-content-between align-items-center mb-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div className="text-start">
                <h2 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem', color: '#ffffff' }}>
                  <i className="fas fa-credit-card me-2" style={{ color: '#ffffff' }}></i>
                  Razorpay Configuration
                </h2>
                <p className="text-white-50" style={{ fontSize: '1rem', margin: 0 }}>
                  Configure payment gateway keys (Super Admin Only)
                </p>
              </div>
              <Button
                variant="outline-light"
                onClick={() => setShowRazorpaySettings(false)}
                style={{
                  borderRadius: '20px',
                  background: 'transparent'
                }}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Config
              </Button>
            </div>

            {razorpaySettingsLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-white-50">Loading Razorpay settings...</p>
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                padding: '2rem',
                maxWidth: '900px',
                margin: '0 auto',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                {/* Success Message */}
                {razorpaySettingsSuccess && (
                  <Alert variant="success" className="mb-4" style={{
                    background: 'rgba(40, 167, 69, 0.2)',
                    border: '1px solid rgba(40, 167, 69, 0.4)',
                    borderRadius: '10px'
                  }}>
                    <i className="fas fa-check-circle me-2"></i>
                    {razorpaySettingsSuccess}
                  </Alert>
                )}

                {/* Error Message */}
                {razorpaySettingsError && (
                  <Alert variant="danger" className="mb-4" style={{
                    background: 'rgba(220, 53, 69, 0.2)',
                    border: '1px solid rgba(220, 53, 69, 0.4)',
                    borderRadius: '10px'
                  }}>
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {razorpaySettingsError}
                  </Alert>
                )}

                <Form onSubmit={(e) => { e.preventDefault(); saveRazorpaySettings(); }}>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ color: 'white', fontWeight: '500' }}>Razorpay Key ID</Form.Label>
                        <Form.Control
                          type="text"
                          value={razorpaySettings.key_id}
                          onChange={(e) => setRazorpaySettings({ ...razorpaySettings, key_id: e.target.value })}
                          placeholder="e.g., rzp_live_xxxxxxxxxx or rzp_test_xxxxxxxxxx"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '10px',
                            color: 'white',
                            padding: '12px'
                          }}
                        />
                        <Form.Text className="text-muted">
                          Your Razorpay Key ID (starts with rzp_test_ or rzp_live_)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ color: 'white', fontWeight: '500' }}>
                          Razorpay Key Secret
                          {razorpaySettings.has_secret && razorpaySettings.key_secret === '••••••••' && (
                            <Badge bg="success" className="ms-2">Saved</Badge>
                          )}
                        </Form.Label>
                        <Form.Control
                          type="password"
                          value={razorpaySettings.key_secret}
                          onChange={(e) => setRazorpaySettings({ ...razorpaySettings, key_secret: e.target.value })}
                          placeholder="Enter Razorpay Key Secret"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '10px',
                            color: 'white',
                            padding: '12px'
                          }}
                        />
                        <Form.Text className="text-muted">
                          Your Razorpay Key Secret (keep this confidential)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-end gap-3 mt-4">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={razorpaySettingsSaving}
                      style={{
                        background: 'linear-gradient(145deg, rgba(0, 123, 255, 0.8), rgba(0, 123, 255, 0.6))',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '25px',
                        color: 'white',
                        fontWeight: '600',
                        padding: '12px 24px'
                      }}
                    >
                      <i className="fas fa-save me-2"></i>
                      {razorpaySettingsSaving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </Form>

                {/* Help Section */}
                <div className="mt-5" style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '15px',
                  padding: '1.5rem',
                  textAlign: 'left'
                }}>
                  <h5 style={{ color: 'white', marginBottom: '1rem' }}>
                    <i className="fas fa-question-circle me-2"></i>
                    Setup Guide
                  </h5>
                  <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.8' }}>
                    <p className="mb-3"><strong>To get your Razorpay API Keys:</strong></p>
                    <ol style={{ paddingLeft: '1.5rem' }}>
                      <li>Login to your Razorpay Dashboard at <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer" style={{ color: '#00bfff' }}>dashboard.razorpay.com</a></li>
                      <li>Go to Settings → API Keys</li>
                      <li>Generate or view your API keys</li>
                      <li>Copy the Key ID and Key Secret</li>
                    </ol>
                    <p className="mb-2 mt-3"><strong>Important Notes:</strong></p>
                    <ul style={{ paddingLeft: '1.5rem' }}>
                      <li><strong>Test Keys:</strong> Use keys starting with <code style={{ color: '#00bfff' }}>rzp_test_</code> for testing</li>
                      <li><strong>Live Keys:</strong> Use keys starting with <code style={{ color: '#00bfff' }}>rzp_live_</code> for production</li>
                      <li>Never share your Key Secret publicly</li>
                      <li>The Key Secret is only shown once when generated - save it securely</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manage Admins Tab - for super admin to manage other admin permissions */}
        {activeTab === 'manage-admins' && (
          <div className="text-center text-white py-5">
            <div className="d-flex justify-content-between align-items-center mb-4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div className="text-start">
                <h2 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  <i className="fas fa-users-cog me-2" style={{ color: '#ffd700' }}></i>
                  Manage Admin Permissions
                </h2>
                <p className="text-white-50" style={{ fontSize: '1rem', margin: 0 }}>
                  Grant or revoke admin tab permissions
                </p>
              </div>
              <div className="d-flex gap-2">
                <Button
                  variant="info"
                  onClick={async () => {
                    try {
                      const adminsRes = await api.get('/api/admin/permission-admins');
                      console.log('✅ Refreshed admin users:', adminsRes.data);
                      setAdminUsers(adminsRes.data);
                      alert('Admin list refreshed!');
                    } catch (err) {
                      console.error('❌ Error refreshing admin list:', err);
                      alert('Error refreshing admin list');
                    }
                  }}
                  style={{
                    borderRadius: '20px',
                    background: 'rgba(0, 123, 255, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white'
                  }}
                >
                  <i className="fas fa-sync-alt me-2"></i>
                  Refresh List
                </Button>
                <Button
                  variant="success"
                  onClick={() => setShowMakeAdminModal(true)}
                  style={{
                    background: 'linear-gradient(145deg, rgba(40, 167, 69, 0.8), rgba(40, 167, 69, 0.6))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '25px',
                    color: 'white',
                    boxShadow: '0 8px 32px rgba(40, 167, 69, 0.3)',
                    fontWeight: '600',
                    padding: '10px 20px'
                  }}
                >
                  <i className="fas fa-user-plus me-2"></i>
                  Make Admin
                </Button>
                <Button
                  variant="outline-light"
                  onClick={() => setActiveTab('config')}
                  style={{
                    borderRadius: '20px',
                    background: 'transparent'
                  }}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Back
                </Button>
              </div>
            </div>

            <Alert variant="info" style={{
              background: 'rgba(0, 123, 255, 0.15)',
              border: '1px solid rgba(0, 123, 255, 0.4)',
              borderRadius: '15px',
              color: 'black',
              maxWidth: '1200px',
              margin: '0 auto 2rem',
              textAlign: 'left'
            }}>
              <Alert.Heading style={{ color: '#0d6efd' }}>
                <i className="fas fa-info-circle me-2"></i>
                How Admin Permissions Work
              </Alert.Heading>
              <ul style={{ marginBottom: 0, paddingLeft: '1.5rem' }}>
                <li>Select which tabs each admin can access</li>
                <li>Admins can only see the tabs you grant them access to</li>
                <li>If an admin tries to access a restricted tab, they will see an "Access Denied" message</li>
                <li>The Config tab is only accessible by the super admin (2025uee0154@iitjammu.ac.in)</li>
              </ul>
            </Alert>

            {/* Admin Users Table */}
            <div style={{
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '15px',
              padding: '1.5rem',
              maxWidth: '1200px',
              margin: '0 auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <Table striped bordered hover responsive style={{ marginBottom: 0 }}>
                <thead style={{ borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                  <tr>
                    <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'center' }}>Admin Name</th>
                    <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'center' }}>Tag Name</th>
                    <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'center' }}>Email</th>
                    <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'center' }}>Scanner</th>
                    <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'center' }}>Tabs Access</th>
                    <th style={{ color: 'black', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers && adminUsers.length > 0 ? adminUsers.map(admin => (
                    <tr key={admin.id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: admin.email === '2025uee0154@iitjammu.ac.in' ? 'rgba(255, 215, 0, 0.05)' : 'transparent'
                    }}>
                      <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left' }}>
                        <div className="d-flex align-items-center gap-2">
                          <strong>{admin.name}</strong>
                          {admin.email === '2025uee0154@iitjammu.ac.in' && (
                            <Badge bg="warning" style={{ fontSize: '0.7rem' }}>Super Admin</Badge>
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left' }}>
                        <Badge bg={admin.admin_tag ? 'info' : 'secondary'} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                          {admin.admin_tag || 'No Tag'}
                        </Badge>
                      </td>
                      <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left' }}>
                        <code style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px' }}>
                          {admin.email}
                        </code>
                      </td>
                      <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'center' }}>
                        <Badge bg={admin.code_scanner ? 'success' : 'secondary'} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                          {admin.code_scanner ? (
                            <>
                              <i className="fas fa-check-circle me-1"></i>
                              Enabled
                            </>
                          ) : (
                            <>
                              <i className="fas fa-times-circle me-1"></i>
                              Disabled
                            </>
                          )}
                        </Badge>
                      </td>
                      <td style={{ color: 'black', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'left' }}>
                        <div className="d-flex flex-wrap gap-1">
                          {admin.allowed_tabs && admin.allowed_tabs.length > 0 ? (
                            admin.allowed_tabs.map(tabId => {
                              const tabInfo = allTabsConfig.find(t => t.id === tabId);
                              return (
                                <Badge
                                  key={tabId}
                                  bg={tabId === 'config' ? 'warning' : 'secondary'}
                                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                >
                                  {tabInfo?.icon || ''} {tabInfo?.name || tabId}
                                </Badge>
                              );
                            })
                          ) : (
                            <span className="text-muted">All tabs (default)</span>
                          )}
                        </div>
                        <small className="text-muted d-block mt-1">
                          {admin.allowed_tabs?.length || 12} / 13 tabs
                        </small>
                      </td>
                      <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'center' }}>
                        <div className="d-flex gap-2 justify-content-center flex-wrap">
                          <>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openPermissionModal(admin)}
                            >
                              <i className="fas fa-edit me-1"></i>
                              Edit
                            </Button>
                            <Button
                              variant="outline-dark"
                              size="sm"
                              onClick={() => updateAdminTag(admin.id, admin.admin_tag)}
                            >
                              <i className="fas fa-tag me-1"></i>
                              Tag
                            </Button>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => resetAdminPermissions(admin.id)}
                            >
                              <i className="fas fa-undo me-1"></i>
                              Reset
                            </Button>
                          </>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="text-center py-5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="text-white-50">
                          <i className="fas fa-users fa-3x mb-3"></i>
                          <h5>No Admin Users Found</h5>
                          <p>Only admin users will appear here</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        )}

        {/* Permission Management Modal */}
        <Modal
          show={showPermissionModal}
          onHide={() => {
            setShowPermissionModal(false);
            setSelectedAdminForPermission(null);
            setSelectedAdminTabs([]);
            setSelectedAdminScanner(false);
          }}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="fas fa-user-shield me-2"></i>
              Manage Permissions for {selectedAdminForPermission?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {permissionLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading permissions...</p>
              </div>
            ) : (
              <>
                <Alert variant="info" style={{
                  background: 'rgba(0, 123, 255, 0.15)',
                  border: '1px solid rgba(0, 123, 255, 0.4)',
                  borderRadius: '10px',
                  color: 'black',
                  marginBottom: '1.5rem'
                }}>
                  <strong>Select which tabs this admin can access:</strong>
                  <ul style={{ marginBottom: 0, paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
                    <li>Selected tabs will be visible to this admin</li>
                    <li>Unselected tabs will show "Access Denied" message</li>
                    <li>The Config tab requires super admin email</li>
                  </ul>
                </Alert>

                {/* Scanner Permission Toggle */}
                <div style={{
                  background: selectedAdminScanner
                    ? 'linear-gradient(145deg, rgba(40, 167, 69, 0.3), rgba(40, 167, 69, 0.2))'
                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                  backdropFilter: 'blur(10px)',
                  border: selectedAdminScanner
                    ? '2px solid rgba(40, 167, 69, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
                  onClick={() => setSelectedAdminScanner(!selectedAdminScanner)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '1.8rem' }}>📱</div>
                    <div>
                      <div style={{ color: '#222', fontWeight: '600', fontSize: '1rem' }}>Scanner Access</div>
                      <div style={{ color: 'rgba(0,0,0,0.55)', fontSize: '0.85rem' }}>
                        Allow this admin to scan tickets
                      </div>
                    </div>
                  </div>
                  <div style={{
                    width: '50px',
                    height: '26px',
                    borderRadius: '13px',
                    background: selectedAdminScanner ? '#28a745' : 'rgba(255,255,255,0.2)',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '3px',
                      left: selectedAdminScanner ? '27px' : '3px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'white',
                      transition: 'all 0.3s ease'
                    }}></div>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '10px'
                }}>
                  {allTabsConfig.filter(tab => tab.id !== 'config').map(tab => (
                    <div
                      key={tab.id}
                      onClick={() => toggleAdminTab(tab.id)}
                      style={{
                        background: selectedAdminTabs.includes(tab.id)
                          ? 'linear-gradient(145deg, rgba(40, 167, 69, 0.3), rgba(40, 167, 69, 0.2))'
                          : 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                        backdropFilter: 'blur(10px)',
                        border: selectedAdminTabs.includes(tab.id)
                          ? '2px solid rgba(40, 167, 69, 0.6)'
                          : '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{tab.icon}</div>
                      <div style={{ color: '#222', fontWeight: '500', fontSize: '0.9rem' }}>{tab.name}</div>
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: selectedAdminTabs.includes(tab.id) ? '#28a745' : 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem'
                      }}>
                        {selectedAdminTabs.includes(tab.id) ? '✓' : ''}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-center">
                  <small className="text-muted">
                    Selected: {selectedAdminTabs.length} / {allTabsConfig.length - 1} tabs
                  </small>
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowPermissionModal(false);
                setSelectedAdminForPermission(null);
                setSelectedAdminTabs([]);
                setSelectedAdminScanner(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={saveAdminPermissions}
              disabled={permissionLoading}
            >
              <i className="fas fa-save me-2"></i>
              Save Permissions
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Movie Modal */}
        <Modal
          show={showMovieModal}
          onHide={() => {
            setShowMovieModal(false);
            setEditingMovie(null);
            setMovieForm({ title: '', description: '', date: '', venue: '', price: '', category: '', duration: '', imdb_rating: '', language: '', poster: null });
            setSelectedFoodsForMovie([]);
          }}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>{editingMovie ? 'Edit Movie' : 'Add Movie'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleMovieSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  placeholder="Add a short synopsis (optional)"
                />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={movieForm.date}
                      onChange={(e) => setMovieForm({ ...movieForm, date: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Venue</Form.Label>
                    <Form.Select
                      value={movieForm.venue}
                      onChange={(e) => setMovieForm({ ...movieForm, venue: e.target.value })}
                      required
                    >
                      <option value="">Select Venue</option>
                      <option value="Mansar Auditorium">Mansar Auditorium</option>
                      <option value="Pushkar 11AC2022">Pushkar 11AC2022</option>
                      <option value="Pushkar 11AC3027">Pushkar 11AC3027</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ticket Price (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      value={movieForm.price}
                      onChange={(e) => setMovieForm({ ...movieForm, price: e.target.value })}
                      placeholder="Enter ticket price"
                      min="0"
                      step="1"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Movie Poster</Form.Label>
                    <Form.Control
                      type="file"
                      onChange={(e) => setMovieForm({ ...movieForm, poster: e.target.files[0] })}
                      accept="image/*"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Control
                      type="text"
                      value={movieForm.category}
                      onChange={(e) => setMovieForm({ ...movieForm, category: e.target.value })}
                      placeholder="Action, Drama, Comedy..."
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Duration</Form.Label>
                    <Form.Control
                      type="text"
                      value={movieForm.duration}
                      onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                      placeholder="2h 15m"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Subtitle</Form.Label>
                    <Form.Control
                      type="text"
                      value={movieForm.imdb_rating}
                      onChange={(e) => setMovieForm({ ...movieForm, imdb_rating: e.target.value })}
                      placeholder="English subtitles"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Language</Form.Label>
                    <Form.Control
                      type="text"
                      value={movieForm.language}
                      onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                      placeholder="Hindi, English..."
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Check 
                    type="switch"
                    id="is-special-switch"
                    label="Special Movie (e.g., Event with Free Tickets)"
                    checked={movieForm.is_special === 1}
                    onChange={(e) => setMovieForm({ ...movieForm, is_special: e.target.checked ? 1 : 0 })}
                    className="mb-2 fw-bold text-primary"
                  />
                  {movieForm.is_special === 1 && (
                    <Form.Group>
                      <Form.Label>Special Message (Shown on Booking & Payment pages)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={movieForm.special_message}
                        onChange={(e) => setMovieForm({ ...movieForm, special_message: e.target.value })}
                        placeholder="e.g., Special event: Use code FREEENTRY for 100% off!"
						required={movieForm.is_special === 1}
                      />
                    </Form.Group>
                  )}
                </Col>
              </Row>

              {/* Food Selection Section */}
              <Form.Group className="mb-3">
                <Form.Label>Available Foods</Form.Label>
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #dee2e6',
                  borderRadius: '0.375rem',
                  padding: '0.75rem'
                }}>
                  {availableFoods && availableFoods.length > 0 ? availableFoods.map(food => (
                    <div key={food.id} className="d-flex align-items-center justify-content-between mb-2 p-2 border rounded" style={{ background: selectedFoodsForMovie.includes(food.id) ? '#f8f9fa' : 'transparent' }}>
                      <Form.Check
                        type="checkbox"
                        id={`food-${food.id}`}
                        label={`${food.name} - ₹${food.price}`}
                        checked={selectedFoodsForMovie.includes(food.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFoodsForMovie([...selectedFoodsForMovie, food.id]);
                          } else {
                            setSelectedFoodsForMovie(selectedFoodsForMovie.filter(id => id !== food.id));
                            setFreeFoodIds(freeFoodIds.filter(id => id !== food.id));
                          }
                        }}
                        className="mb-0"
                      />
                      {selectedFoodsForMovie.includes(food.id) && (
                        <Form.Check
                          type="switch"
                          id={`free-food-${food.id}`}
                          label="Free"
                          checked={freeFoodIds.includes(food.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFreeFoodIds([...freeFoodIds, food.id]);
                            } else {
                              setFreeFoodIds(freeFoodIds.filter(id => id !== food.id));
                            }
                          }}
                          className="ms-3"
                        />
                      )}
                    </div>
                  )) : (
                    <p className="text-muted mb-0">No food items available. Add some in the Foods tab first.</p>
                  )}
                </div>
                <Form.Text className="text-muted">
                  Select which food items should be available for this movie
                </Form.Text>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => {
                setShowMovieModal(false);
                setEditingMovie(null);
                setMovieForm({ title: '', description: '', date: '', venue: '', price: '', category: '', duration: '', imdb_rating: '', language: '', poster: null });
                setSelectedFoodsForMovie([]);
                setFreeFoodIds([]);
              }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingMovie ? 'Update' : 'Add'} Movie
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Food Modal */}
        <Modal show={showFoodModal} onHide={() => {
          setShowFoodModal(false);
          setEditingFood(null);
          setFoodForm({ name: '', description: '', price: '', image: null, is_available: true });
        }}>
          <Modal.Header closeButton>
            <Modal.Title>{editingFood ? 'Edit Food Item' : 'Add Food Item'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const formData = new FormData();
              formData.append('name', foodForm.name);
              formData.append('description', foodForm.description);
              formData.append('price', foodForm.price);
              formData.append('is_available', foodForm.is_available ? '1' : '0');
              if (foodForm.image) {
                formData.append('image', foodForm.image);
              }

              if (editingFood) {
                await api.put(`/api/foods/${editingFood.id}`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
              } else {
                await api.post('/api/foods', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
              }

              setShowFoodModal(false);
              setEditingFood(null);
              setFoodForm({ name: '', description: '', price: '', image: null, is_available: true });
              fetchAllData();
            } catch (err) {
              console.error('Error saving food:', err);
              alert('Error saving food item: ' + (err.response?.data?.error || err.message));
            }
          }}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={foodForm.name}
                  onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  value={foodForm.description}
                  onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Price (₹)</Form.Label>
                <Form.Control
                  type="number"
                  value={foodForm.price}
                  onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                  min="0"
                  step="1"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Image</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setFoodForm({ ...foodForm, image: e.target.files[0] })}
                  accept="image/*"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Available for ordering"
                  checked={foodForm.is_available}
                  onChange={(e) => setFoodForm({ ...foodForm, is_available: e.target.checked })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => {
                setShowFoodModal(false);
                setEditingFood(null);
                setFoodForm({ name: '', description: '', price: '', image: null, is_available: true });
              }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingFood ? 'Update' : 'Add'} Food Item
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Email Modal */}
        <Modal show={showEmailModal} onHide={() => {
          setShowEmailModal(false);
          setEmailForm({ user_id: '', recipient_name: '', email: '', subject: '', message: '', attachment_name: '', attachment_type: '', attachment_base64: '' });
          setSingleEmailSearch('');
          setEmailRecipientMode('user');
        }} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Send Email</Modal.Title>
          </Modal.Header>
          <Form onSubmit={async (e) => {
            e.preventDefault();
            try {
              if (emailRecipientMode === 'custom') {
                if (!emailForm.email) {
                  alert('Please enter an email address.');
                  return;
                }
                await api.post('/api/admin/email/custom', {
                  email: emailForm.email,
                  recipient_name: emailForm.recipient_name,
                  subject: emailForm.subject,
                  message: emailForm.message,
                  attachment_name: emailForm.attachment_name,
                  attachment_type: emailForm.attachment_type,
                  attachment_base64: emailForm.attachment_base64
                });
              } else {
                if (!emailForm.user_id) {
                  alert('Please select a user.');
                  return;
                }
                await api.post('/api/admin/email/single', {
                  user_id: emailForm.user_id,
                  subject: emailForm.subject,
                  message: emailForm.message,
                  attachment_name: emailForm.attachment_name,
                  attachment_type: emailForm.attachment_type,
                  attachment_base64: emailForm.attachment_base64
                });
              }
              alert('Email sent successfully!');
              setShowEmailModal(false);
              setEmailForm({ user_id: '', recipient_name: '', email: '', subject: '', message: '', attachment_name: '', attachment_type: '', attachment_base64: '' });
              setSingleEmailSearch('');
              setEmailRecipientMode('user');
            } catch (err) {
              console.error('Error sending email:', err);
              alert('Error sending email: ' + (err.response?.data?.error || err.response?.data?.details || err.message));
            }
          }}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Send To</Form.Label>
                <div className="d-flex flex-wrap gap-3">
                  <Form.Check
                    type="radio"
                    id="email-recipient-user"
                    name="email-recipient-mode"
                    label="Existing user"
                    checked={emailRecipientMode === 'user'}
                    onChange={() => {
                      setEmailRecipientMode('user');
                      setEmailForm({ ...emailForm, email: '', recipient_name: '' });
                    }}
                  />
                  <Form.Check
                    type="radio"
                    id="email-recipient-custom"
                    name="email-recipient-mode"
                    label="Custom email address"
                    checked={emailRecipientMode === 'custom'}
                    onChange={() => {
                      setEmailRecipientMode('custom');
                      setEmailForm({ ...emailForm, user_id: '' });
                    }}
                  />
                </div>
              </Form.Group>

              {emailRecipientMode === 'user' ? (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Search User</Form.Label>
                    <Form.Control
                      type="text"
                      value={singleEmailSearch}
                      onChange={(e) => setSingleEmailSearch(e.target.value)}
                      placeholder="Search by name or email"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>User</Form.Label>
                    <Form.Select
                      value={emailForm.user_id}
                      onChange={(e) => setEmailForm({ ...emailForm, user_id: e.target.value })}
                      required
                    >
                      <option value="">Select a user</option>
                      {filteredEmailUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </Form.Select>
                    {filteredEmailUsers.length === 0 ? (
                      <Form.Text className="text-muted">No users found for this search.</Form.Text>
                    ) : null}
                  </Form.Group>
                </>
              ) : (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                      placeholder="recipient@example.com"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Recipient Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={emailForm.recipient_name}
                      onChange={(e) => setEmailForm({ ...emailForm, recipient_name: e.target.value })}
                      placeholder="Recipient name (optional)"
                    />
                  </Form.Group>
                </>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Subject</Form.Label>
                <Form.Control
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  placeholder="Email subject"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  placeholder="Email message content..."
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Attachment (optional)</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) {
                      setEmailForm({ ...emailForm, attachment_name: '', attachment_type: '', attachment_base64: '' });
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      alert('Attachment must be 5MB or smaller.');
                      e.target.value = '';
                      setEmailForm({ ...emailForm, attachment_name: '', attachment_type: '', attachment_base64: '' });
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const result = reader.result;
                      const base64 = typeof result === 'string' ? result.split(',')[1] : '';
                      setEmailForm({
                        ...emailForm,
                        attachment_name: file.name,
                        attachment_type: file.type || 'application/octet-stream',
                        attachment_base64: base64 || ''
                      });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <Form.Text className="text-muted">Max 5MB. PDF, image, or document.</Form.Text>
                {emailForm.attachment_name ? (
                  <Form.Text className="text-muted d-block">Attached: {emailForm.attachment_name}</Form.Text>
                ) : null}
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => {
                setShowEmailModal(false);
                setEmailForm({ user_id: '', recipient_name: '', email: '', subject: '', message: '', attachment_name: '', attachment_type: '', attachment_base64: '' });
                setSingleEmailSearch('');
                setEmailRecipientMode('user');
              }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                <i className="fas fa-paper-plane me-2"></i>
                Send Email
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Bulk Email Modal */}
        <Modal show={showBulkEmailModal} onHide={() => {
          setShowBulkEmailModal(false);
          setSelectedUsers([]);
          setBulkEmailForm({ subject: '', message: '' });
          setBulkEmailSearch('');
        }} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>Send Bulk Email</Modal.Title>
          </Modal.Header>
          <Form onSubmit={async (e) => {
            e.preventDefault();
            if (selectedUsers.length === 0) {
              alert('Please select at least one user to send email to.');
              return;
            }
            try {
              const result = await api.post('/api/admin/email/bulk', {
                user_ids: selectedUsers,
                subject: bulkEmailForm.subject,
                message: bulkEmailForm.message
              });
              alert(`Bulk email sent! ${result.data.sent}/${result.data.total_users} emails sent successfully.`);
              setShowBulkEmailModal(false);
              setSelectedUsers([]);
              setBulkEmailForm({ subject: '', message: '' });
            } catch (err) {
              console.error('Error sending bulk email:', err);
              alert('Error sending bulk email: ' + (err.response?.data?.error || err.message));
            }
          }}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <div className="border rounded p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6>Select Recipients ({selectedUsers.length} selected)</h6>
                      <div>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setSelectedUsers(filteredBulkEmailUsers.map(u => u.id))}
                          className="me-1"
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setSelectedUsers([])}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                    <Form.Group className="mb-3">
                      <Form.Control
                        type="text"
                        value={bulkEmailSearch}
                        onChange={(e) => setBulkEmailSearch(e.target.value)}
                        placeholder="Search users by name or email"
                      />
                      <Form.Text className="text-muted">
                        Showing {filteredBulkEmailUsers.length} of {(users || []).length} users
                      </Form.Text>
                    </Form.Group>
                    {filteredBulkEmailUsers.length > 0 ? filteredBulkEmailUsers.map(user => (
                      <Form.Check
                        key={user.id}
                        type="checkbox"
                        id={`bulk-user-${user.id}`}
                        label={`${user.name} (${user.email})`}
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                        className="mb-2"
                      />
                    )) : (
                      <p className="text-muted">No users found</p>
                    )}
                  </div>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Subject</Form.Label>
                    <Form.Control
                      type="text"
                      value={bulkEmailForm.subject}
                      onChange={(e) => setBulkEmailForm({ ...bulkEmailForm, subject: e.target.value })}
                      placeholder="Email subject"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={12}
                      value={bulkEmailForm.message}
                      onChange={(e) => setBulkEmailForm({ ...bulkEmailForm, message: e.target.value })}
                      placeholder="Email message content..."
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => {
                setShowBulkEmailModal(false);
                setSelectedUsers([]);
                setBulkEmailForm({ subject: '', message: '' });
              }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={selectedUsers.length === 0}
              >
                <i className="fas fa-paper-plane me-2"></i>
                Send to {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Coupon Modal */}
        <Modal show={showCouponModal} onHide={() => {
          setShowCouponModal(false);
          setEditingCoupon(null);
          setCouponForm({
            code: '',
            description: '',
            discount_type: 'percentage',
            discount_value: '',
            min_purchase: '',
            max_discount: '',
            usage_limit: '',
            expiry_date: ''
          });
        }} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={async (e) => {
            e.preventDefault();
            try {
              if (editingCoupon) {
                // Update existing coupon
                await api.put(`/api/admin/coupons/${editingCoupon.id}`, couponForm);
                alert('Coupon updated successfully!');
              } else {
                // Create new coupon
                await api.post('/api/admin/coupons', couponForm);
                alert('Coupon created successfully!');
              }

              setShowCouponModal(false);
              setEditingCoupon(null);
              setCouponForm({
                code: '',
                description: '',
                discount_type: 'percentage',
                discount_value: '',
                min_purchase: '',
                max_discount: '',
                usage_limit: '',
                expiry_date: ''
              });
              fetchAllData();
            } catch (err) {
              console.error('Error saving coupon:', err);
              alert('Error saving coupon: ' + (err.response?.data?.error || err.message));
            }
          }}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Coupon Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., SAVE10"
                      required
                    />
                    <Form.Text className="text-muted">
                      Code will be converted to uppercase
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Discount Type</Form.Label>
                    <Form.Select
                      value={couponForm.discount_type}
                      onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                      required
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Discount Value</Form.Label>
                    <Form.Control
                      type="number"
                      value={couponForm.discount_value}
                      onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                      placeholder={couponForm.discount_type === 'percentage' ? 'e.g., 10' : 'e.g., 50'}
                      min="0"
                      step="0.01"
                      required
                    />
                    <Form.Text className="text-muted">
                      {couponForm.discount_type === 'percentage' ? 'Percentage (0-100%)' : 'Fixed amount in ₹'}
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Minimum Purchase (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      value={couponForm.min_purchase}
                      onChange={(e) => setCouponForm({ ...couponForm, min_purchase: e.target.value })}
                      placeholder="e.g., 100"
                      min="0"
                      step="1"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Maximum Discount (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      value={couponForm.max_discount}
                      onChange={(e) => setCouponForm({ ...couponForm, max_discount: e.target.value })}
                      placeholder="e.g., 200"
                      min="0"
                      step="1"
                    />
                    <Form.Text className="text-muted">
                      Only for percentage discounts
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Usage Limit</Form.Label>
                    <Form.Control
                      type="number"
                      value={couponForm.usage_limit}
                      onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })}
                      placeholder="e.g., 100"
                      min="1"
                    />
                    <Form.Text className="text-muted">
                      Leave empty for unlimited
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Expiry Date</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={couponForm.expiry_date}
                  onChange={(e) => setCouponForm({ ...couponForm, expiry_date: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  placeholder="Brief description of the coupon"
                  required
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => {
                setShowCouponModal(false);
                setCouponForm({
                  code: '',
                  description: '',
                  discount_type: 'percentage',
                  discount_value: '',
                  min_purchase: '',
                  max_discount: '',
                  usage_limit: '',
                  expiry_date: ''
                });
              }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                <i className="fas fa-plus me-2"></i>
                Create Coupon
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Team Modal */}
        <Modal show={showTeamModal} onHide={() => {
          setShowTeamModal(false);
          setEditingTeam(null);
          setTeamForm({ name: '', student_id: '', photo: null, photo_url: '', role: '', section: 'foundation_team', display_order: 0 });
        }}>
          <Modal.Header closeButton>
            <Modal.Title>{editingTeam ? 'Edit Team Member' : 'Add Team Member'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleTeamSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Student ID (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  value={teamForm.student_id}
                  onChange={(e) => setTeamForm({ ...teamForm, student_id: e.target.value })}
                  placeholder="e.g., 2021XYZ123 (optional)"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Control
                  type="text"
                  value={teamForm.role}
                  onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
                  placeholder="e.g., Team Lead, Developer, Designer"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Section</Form.Label>
                <Form.Select
                  value={teamForm.section}
                  onChange={(e) => setTeamForm({ ...teamForm, section: e.target.value })}
                  required
                >
                  <option value="foundation_team">Foundation Team</option>
                  <option value="current_team">Current Team</option>
                  <option value="database_backend_team">Database & Backend Management</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Display Order</Form.Label>
                <Form.Control
                  type="number"
                  value={teamForm.display_order}
                  onChange={(e) => setTeamForm({ ...teamForm, display_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <Form.Text className="text-muted">
                  Lower numbers appear first within the section.
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Photo</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setTeamForm({ ...teamForm, photo: e.target.files[0] })}
                  accept="image/*"
                />
                <Form.Text className="text-muted">
                  Upload a profile photo (optional)
                </Form.Text>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => {
                setShowTeamModal(false);
                setEditingTeam(null);
                setTeamForm({ name: '', student_id: '', photo: null, photo_url: '', role: '', section: 'foundation_team', display_order: 0 });
              }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingTeam ? 'Update' : 'Add'} Team Member
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Gallery Modal */}
        <Modal
          show={showGalleryModal}
          onHide={() => {
            setShowGalleryModal(false);
            setGalleryForm({ event_name: '', event_date: '', image: null });
          }}
        >
          <Modal.Header closeButton>
            <Modal.Title>Add Gallery Event</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleGallerySubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Event Name (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  value={galleryForm.event_name}
                  onChange={(e) => setGalleryForm({ ...galleryForm, event_name: e.target.value })}
                  placeholder="e.g., Freshers Night 2025"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Event Date</Form.Label>
                <Form.Control
                  type="date"
                  value={galleryForm.event_date}
                  onChange={(e) => setGalleryForm({ ...galleryForm, event_date: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Event Image</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => setGalleryForm({ ...galleryForm, image: e.target.files[0] })}
                  required
                />
                <Form.Text className="text-muted">
                  Upload a photo for this event.
                </Form.Text>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowGalleryModal(false);
                  setGalleryForm({ event_name: '', event_date: '', image: null });
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                <i className="fas fa-upload me-2"></i>
                Upload
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Winner Selection Modal */}
        <Modal show={showWinnerModal} onHide={() => {
          setShowWinnerModal(false);
          setSelectedWinners([]);
          setWinnerForm({
            discount_amount: '',
            discount_type: 'fixed',
            max_discount: '',
            expiry_days: 30,
            winner_limit: 5
          });
        }} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>Select Coupon Winners</Modal.Title>
          </Modal.Header>
          <Form onSubmit={async (e) => {
            e.preventDefault();
            if (winnerSending) return;
            if (selectedWinners.length === 0) {
              alert('Please select at least one winner.');
              return;
            }
            if (selectedWinners.length > winnerForm.winner_limit) {
              alert(`You can select maximum ${winnerForm.winner_limit} winners.`);
              return;
            }
            try {
              setWinnerSending(true);
              const result = await api.post('/api/admin/coupon-winners/send', {
                user_ids: selectedWinners,
                discount_amount: winnerForm.discount_amount,
                discount_type: winnerForm.discount_type,
                max_discount: winnerForm.max_discount,
                expiry_days: winnerForm.expiry_days,
                winner_message: winnerForm.winner_message
              });
              const data = result.data || {};
              console.log('Winner email API response:', data);

              const total = data.total_users ?? selectedWinners.length;
              const sent = data.sent_count ?? (data.success === false ? total - (data.failed_email_count || 0) : total);
              const failedEmailList = data.failed_emails || [];
              const failedEmailCount = data.failed_email_count ?? failedEmailList.length ?? 0;
              const failedRecordCount = data.failed_record_count ?? 0;
              const results = data.results || [];
              const emailFailures = results.filter(r => r.status === 'email_failed');
              const recordFailures = results.filter(r => r.status === 'failed');
              const message = data.message || `Processed ${total} winners`;

              if (failedEmailCount > 0 || failedRecordCount > 0 || data.success === false) {
                const lines = [
                  message,
                  `Sent: ${sent}/${total}`,
                  `Email failed: ${failedEmailCount}${failedEmailList.length ? ` (${failedEmailList.join(', ')})` : ''}`,
                  failedRecordCount ? `Record failed: ${failedRecordCount}` : null,
                  emailFailures.length ? `Last email error: ${emailFailures[emailFailures.length - 1].email_error}` : null,
                  recordFailures.length ? `Last record error: ${recordFailures[recordFailures.length - 1].error || recordFailures[recordFailures.length - 1].email_error || 'unknown'}` : null,
                ].filter(Boolean);
                alert(lines.join('\n'));
              } else {
                alert(message || `Success! ${total} coupon winners selected and emails sent!`);
              }
              setShowWinnerModal(false);
              setSelectedWinners([]);
              setWinnerForm({
                discount_amount: '',
                discount_type: 'fixed',
                max_discount: '',
                expiry_days: 30,
                winner_limit: 5,
                winner_message: 'You have been selected as a coupon winner!'
              });

              // Refresh coupon winners data specifically and immediately update state
              try {
                const winnersRes = await api.get('/api/admin/coupon-winners');
                console.log('Refreshed coupon winners data:', winnersRes.data);
                setCouponWinners(winnersRes.data);
              } catch (err) {
                console.error('Error refreshing coupon winners:', err);
              }

              // Also refresh all data
              fetchAllData();
            } catch (err) {
              console.error('Error selecting winners:', err);
              alert('Error selecting winners: ' + (err.response?.data?.error || err.message));
            } finally {
              setWinnerSending(false);
            }
          }}>
            <Modal.Body>
              <Row>
                <Col md={8}>
                  <div className="border rounded p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6>Select Winners ({selectedWinners.length} selected)</h6>
                      <div>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => {
                            // Only select first user when clicking "Select One"
                            if (filteredWinnerUsers.length > 0) {
                              setSelectedWinners([filteredWinnerUsers[0].id]);
                              alert(`Selected 1 user: ${filteredWinnerUsers[0].name} (${filteredWinnerUsers[0].email})`);
                            }
                          }}
                          className="me-1"
                        >
                          Select First User
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setSelectedWinners([])}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>

                    {/* Warning about selection */}
                    {selectedWinners.length > 0 && (
                      <Alert variant="info" className="mb-3">
                        <strong>⚠️ Important:</strong> You have selected {selectedWinners.length} user{selectedWinners.length > 1 ? 's' : ''}.
                        This will create {selectedWinners.length} individual coupon{selectedWinners.length > 1 ? 's' : ''}.
                        Each selected user will receive their own unique coupon code.
                      </Alert>
                    )}

                    {/* Search Input */}
                    <div className="mb-3">
                      <Form.Control
                        type="text"
                        placeholder="Search users by name or email..."
                        value={winnerSearchTerm}
                        onChange={(e) => setWinnerSearchTerm(e.target.value)}
                        size="sm"
                      />
                    </div>
                    {filteredWinnerUsers && filteredWinnerUsers.length > 0 ? filteredWinnerUsers.map(user => (
                      <Form.Check
                        key={user.id}
                        type="checkbox"
                        id={`winner-${user.id}`}
                        label={`${user.name} (${user.email})`}
                        checked={selectedWinners.includes(user.id)}
                        disabled={!selectedWinners.includes(user.id) && selectedWinners.length >= winnerForm.winner_limit}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (selectedWinners.length < winnerForm.winner_limit) {
                              setSelectedWinners([...selectedWinners, user.id]);
                            }
                          } else {
                            setSelectedWinners(selectedWinners.filter(id => id !== user.id));
                          }
                        }}
                        className="mb-2"
                      />
                    )) : (
                      <p className="text-muted">{winnerSearchTerm ? 'No users match your search' : 'No users found'}</p>
                    )}
                  </div>
                </Col>
                <Col md={4}>
                  <div className="border rounded p-3">
                    <h6 className="mb-3">Coupon Configuration</h6>

                    <Form.Group className="mb-3">
                      <Form.Label>Winner Limit</Form.Label>
                      <Form.Control
                        type="number"
                        value={winnerForm.winner_limit}
                        onChange={(e) => setWinnerForm({ ...winnerForm, winner_limit: parseInt(e.target.value) || 1 })}
                        min="1"
                        max="50"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Discount Type</Form.Label>
                      <Form.Select
                        value={winnerForm.discount_type}
                        onChange={(e) => setWinnerForm({ ...winnerForm, discount_type: e.target.value })}
                      >
                        <option value="fixed">Fixed Amount (₹)</option>
                        <option value="percentage">Percentage (%)</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Discount Amount</Form.Label>
                      <Form.Control
                        type="number"
                        value={winnerForm.discount_amount}
                        onChange={(e) => setWinnerForm({ ...winnerForm, discount_amount: e.target.value })}
                        placeholder={winnerForm.discount_type === 'fixed' ? 'e.g., 50' : 'e.g., 20'}
                        min="0"
                        step="1"
                        required
                      />
                    </Form.Group>

                    {winnerForm.discount_type === 'percentage' && (
                      <Form.Group className="mb-3">
                        <Form.Label>Max Discount (₹)</Form.Label>
                        <Form.Control
                          type="number"
                          value={winnerForm.max_discount}
                          onChange={(e) => setWinnerForm({ ...winnerForm, max_discount: e.target.value })}
                          placeholder="e.g., 200"
                          min="0"
                          step="1"
                        />
                      </Form.Group>
                    )}

                    <Form.Group className="mb-3">
                      <Form.Label>Expiry Days</Form.Label>
                      <Form.Control
                        type="number"
                        value={winnerForm.expiry_days}
                        onChange={(e) => setWinnerForm({ ...winnerForm, expiry_days: parseInt(e.target.value) || 30 })}
                        min="1"
                        max="365"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Winner Message</Form.Label>
                      <Form.Control
                        type="text"
                        value={winnerForm.winner_message}
                        onChange={(e) => setWinnerForm({ ...winnerForm, winner_message: e.target.value })}
                        placeholder="e.g., Best Student, Lucky Draw Winner, etc."
                        maxLength="100"
                      />
                      <Form.Text className="text-muted">
                        Custom message to replace "You have been selected as a coupon winner!"
                      </Form.Text>
                    </Form.Group>

                    <div className="mt-3 p-3 bg-light rounded">
                      <strong>Preview:</strong>
                      <br />
                      Each winner will receive a coupon worth{' '}
                      {winnerForm.discount_type === 'percentage'
                        ? `${winnerForm.discount_amount}% off`
                        : `₹${winnerForm.discount_amount} off`
                      }
                      {winnerForm.discount_type === 'percentage' && winnerForm.max_discount
                        ? ` (max ₹${winnerForm.max_discount})`
                        : ''
                      }
                      <br />
                      <small>Valid for {winnerForm.expiry_days} days</small>
                    </div>
                  </div>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => {
                setShowWinnerModal(false);
                setSelectedWinners([]);
                setWinnerForm({
                  discount_amount: '',
                  discount_type: 'fixed',
                  max_discount: '',
                  expiry_days: 30,
                  winner_limit: 5
                });
              }}>
                Cancel
              </Button>
              <Button
                variant="success"
                type="submit"
                disabled={winnerSending || selectedWinners.length === 0 || !winnerForm.discount_amount}
              >
                <i className="fas fa-trophy me-2"></i>
                {winnerSending
                  ? 'Sending...'
                  : `Select ${selectedWinners.length} Winner${selectedWinners.length !== 1 ? 's' : ''} & Send Emails`}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Make Admin Modal */}
        <Modal
          show={showMakeAdminModal}
          onHide={() => {
            setShowMakeAdminModal(false);
            setUserSearchTerm('');
            setSearchedUsers([]);
          }}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="fas fa-user-plus me-2"></i>
              Make User Admin
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="info" style={{
              background: 'rgba(0, 123, 255, 0.15)',
              border: '1px solid rgba(0, 123, 255, 0.4)',
              borderRadius: '10px',
              color: 'black',
              marginBottom: '1.5rem'
            }}>
              <strong>Search for a user to manage admin status:</strong>
              <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                Search for any user by name or email. Admins will show a "Remove Admin" option,
                while regular users will show "Make Admin".
              </p>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Search User</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search by name or email..."
                value={userSearchTerm}
                onChange={(e) => searchUsers(e.target.value)}
                autoFocus
              />
              <Form.Text className="text-muted">
                Type at least 2 characters to search
              </Form.Text>
            </Form.Group>

            {/* Search Results */}
            {searchLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Searching...</p>
              </div>
            ) : userSearchTerm.length >= 2 && searchedUsers.length === 0 ? (
              <div className="text-center py-4" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px'
              }}>
                <i className="fas fa-search fa-2x mb-3 text-muted"></i>
                <p className="text-muted mb-0">No users found matching "{userSearchTerm}"</p>
              </div>
            ) : searchedUsers.length > 0 ? (
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px'
              }}>
                {searchedUsers.map(user => (
                  <div
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 15px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.2s ease',
                      background: user.is_admin ? 'rgba(255, 193, 7, 0.05)' : 'transparent'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: 'black' }}>{user.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        {user.email}
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {user.is_admin ? (
                        <>
                          <Badge bg="warning" style={{ fontSize: '0.75rem', color: 'black' }}>
                            <i className="fas fa-shield-alt me-1"></i>
                            Admin
                          </Badge>
                          {user.email !== '2025uee0154@iitjammu.ac.in' && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeUserAdmin(user.id, user.name)}
                              style={{
                                borderRadius: '20px',
                                background: 'transparent'
                              }}
                            >
                              <i className="fas fa-times me-1"></i>
                              Remove Admin
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to make ${user.name} (${user.email}) an admin?`)) {
                              makeUserAdmin(user.id);
                            }
                          }}
                          style={{
                            background: 'linear-gradient(145deg, rgba(40, 167, 69, 0.8), rgba(40, 167, 69, 0.6))',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '20px'
                          }}
                        >
                          <i className="fas fa-check me-1"></i>
                          Make Admin
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowMakeAdminModal(false);
                setUserSearchTerm('');
                setSearchedUsers([]);
              }}
            >
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default AdminPanel;
