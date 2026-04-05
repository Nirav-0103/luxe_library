import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('lib_theme');
    return saved ? saved === 'dark' : true;
  });

  // Apply theme to <html> element immediately on mount + every change
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      root.removeAttribute('data-light');
    } else {
      root.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('lib_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Apply on first render before paint (avoids flash)
  useEffect(() => {
    const saved = localStorage.getItem('lib_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
