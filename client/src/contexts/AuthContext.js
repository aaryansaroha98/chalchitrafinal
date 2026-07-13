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
      await api.post('/api/coins/grant-signup-bonus', {}, {
        withCredentials: true
      });
      // Refresh balance after potentially granting bonus
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
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
