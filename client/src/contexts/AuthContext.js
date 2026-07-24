import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axios';
import CoinIcon from '../components/CoinIcon';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coinBalance, setCoinBalance] = useState(0);
  const [coinBalanceLoading, setCoinBalanceLoading] = useState(false);
  const [showCoinBonusPopup, setShowCoinBonusPopup] = useState(false);
  const [bonusCoinAmount, setBonusCoinAmount] = useState(0);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Fetch coin balance whenever user changes
  useEffect(() => {
    if (user && user.id) {
      fetchCoinBalance();
      // Grant signup bonus if this is a new user (coins are 0 or null)
      grantSignupBonusIfNeeded();
    } else {
      setCoinBalance(0);
    }
  }, [user]);

  // Refresh coin balance when the user returns to the tab (e.g. after an admin sends coins)
  useEffect(() => {
    if (!user || !user.id) return;

    const refreshOnActive = () => {
      if (document.visibilityState === 'visible') {
        fetchCoinBalance();
      }
    };

    document.addEventListener('visibilitychange', refreshOnActive);
    window.addEventListener('focus', refreshOnActive);
    return () => {
      document.removeEventListener('visibilitychange', refreshOnActive);
      window.removeEventListener('focus', refreshOnActive);
    };
    // fetchCoinBalance is a stable useCallback([]) declared below; omitted from deps to avoid TDZ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/api/auth/current_user', {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      // User is not authenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoinBalance = useCallback(async () => {
    setCoinBalanceLoading(true);
    try {
      const response = await api.get('/api/coins/balance', {
        withCredentials: true
      });
      setCoinBalance(response.data.coins || 0);
    } catch (error) {
      console.log('Could not fetch coin balance');
      setCoinBalance(0);
    } finally {
      setCoinBalanceLoading(false);
    }
  }, []);

  const grantSignupBonusIfNeeded = useCallback(async () => {
    try {
      const response = await api.post('/api/coins/grant-signup-bonus', {}, {
        withCredentials: true
      });
      if (response.data && response.data.granted) {
        setBonusCoinAmount(response.data.coins || 50);
        setShowCoinBonusPopup(true);
      }
      fetchCoinBalance();
    } catch (error) {
      // Silently fail - bonus might already be granted or user not authenticated
    }
  }, [fetchCoinBalance]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.get('/api/auth/logout', { withCredentials: true });
      setUser(null);
      setCoinBalance(0);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on client side
      setUser(null);
      setCoinBalance(0);
      window.location.href = '/';
    }
  };

  const value = {
    user,
    loading,
    coinBalance,
    coinBalanceLoading,
    fetchCoinBalance,
    login,
    logout,
    checkAuthStatus,
    isAuthenticated: !!user,
    showCoinBonusPopup,
    setShowCoinBonusPopup,
    bonusCoinAmount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showCoinBonusPopup && (
        <div className="coin-bonus-overlay" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem'
        }}>
          <div className="coin-bonus-card" style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            maxWidth: '380px',
            width: '100%'
          }}>
            <div className="coin-bonus-icon" style={{
              width: '72px',
              height: '72px',
              margin: '0 auto 1.25rem',
              background: '#f6f6f7',
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CoinIcon size={40} />
            </div>
            <h3 style={{
              color: '#0b0e17',
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Congratulations! 🎉
            </h3>
            <p style={{
              color: '#5c6270',
              fontSize: '0.95rem',
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              You got <strong style={{ color: '#0b0e17' }}>{bonusCoinAmount} bonus coins</strong> as a welcome gift!
              Use them to book movie tickets and other stuff.
            </p>
            <button
              onClick={() => setShowCoinBonusPopup(false)}
              style={{
                background: '#0b0e17',
                border: '1px solid #0b0e17',
                color: '#ffffff',
                padding: '0.6rem 2rem',
                fontSize: '0.85rem',
                fontWeight: '500',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#0b0e17';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0b0e17';
                e.currentTarget.style.color = '#ffffff';
              }}
            >
              Nice!
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
