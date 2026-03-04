import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true); // Default to dark theme

  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('chalchitra-theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }

    // Apply theme to body
    updateTheme(isDark);
  }, []);

  useEffect(() => {
    updateTheme(isDark);
    localStorage.setItem('chalchitra-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const updateTheme = (dark) => {
    const root = document.documentElement;
    if (dark) {
      root.style.setProperty('--bg-primary', '#000000');
      root.style.setProperty('--bg-secondary', '#1C1C1E');
      root.style.setProperty('--bg-tertiary', '#2C2C2E');
      root.style.setProperty('--bg-quaternary', '#3A3A3C');
      root.style.setProperty('--text-primary', '#FFFFFF');
      root.style.setProperty('--text-secondary', '#EBEBF5');
      root.style.setProperty('--text-tertiary', '#C7C7CC');
      root.style.setProperty('--border-color', '#38383A');
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.2)');
    } else {
      root.style.setProperty('--bg-primary', '#FFFFFF');
      root.style.setProperty('--bg-secondary', '#F2F2F7');
      root.style.setProperty('--bg-tertiary', '#E5E5EA');
      root.style.setProperty('--bg-quaternary', '#D1D1D6');
      root.style.setProperty('--text-primary', '#1C1C1E');
      root.style.setProperty('--text-secondary', '#3C3C43');
      root.style.setProperty('--text-tertiary', '#8E8E93');
      root.style.setProperty('--border-color', '#C6C6C8');
      root.style.setProperty('--glass-bg', 'rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.1)');
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const value = {
    isDark,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
