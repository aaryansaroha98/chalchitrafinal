import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axios';

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
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0b0e17" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 6v12"/>
                <path d="M8 10c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2"/>
                <path d="M8 14c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2"/>
              </svg>
            </div>
            <h3 style={{
              color: '#0b0e17',
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Congratulations!
            </h3>
            <p style={{
              color: '#5c6270',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              You got {bonusCoinAmount} Chalchitra coins. Use them to book movie tickets and more.
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
