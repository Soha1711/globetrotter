import React, { createContext, useContext, useState, useEffect } from 'react';

// Check for saved theme preference or system preference
const getSavedTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('gt_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
};

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {}
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getSavedTheme);

  // Sync with system preference on mount (if no saved preference)
  useEffect(() => {
    const handleChange = () => {
      if (theme === 'light') {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    };
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    // Only override if localStorage doesn't have a saved preference
    if (!localStorage.getItem('gt_theme')) {
      setTheme(mediaQuery.matches ? 'dark' : 'light');
    }
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;