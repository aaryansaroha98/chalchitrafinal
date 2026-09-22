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
      {/* The welcome bonus. Same sheet as the "coins received" popup, so the
          two coin messages are one thing wearing one design rather than two
          hand-styled cards that drift apart. */}
      {showCoinBonusPopup && (
        <div className="coin-gift-backdrop" onClick={() => setShowCoinBonusPopup(false)}>
          <div
            className="coin-gift-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coin-bonus-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="coin-gift-head">
              <span className="coin-gift-kicker">Welcome gift</span>
              <button
                type="button"
                className="coin-gift-close"
                onClick={() => setShowCoinBonusPopup(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="coin-gift-body">
              <div className="coin-gift-mark" aria-hidden="true">
                <CoinIcon size={54} />
              </div>

              <h2 id="coin-bonus-title" className="coin-gift-title">
                You have <span className="coin-gift-amount">{bonusCoinAmount}</span>{' '}
                {bonusCoinAmount === 1 ? 'coin' : 'coins'} to start with
              </h2>

              <p className="coin-gift-text">
                Spend them on any screening. Your balance is in the header whenever you need it.
              </p>
            </div>

            <div className="coin-gift-foot">
              <button
                type="button"
                className="btn btn-primary coin-gift-action"
                onClick={() => setShowCoinBonusPopup(false)}
              >
                Thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
