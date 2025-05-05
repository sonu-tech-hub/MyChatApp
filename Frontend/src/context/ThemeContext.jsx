// client/src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  // Check for system preference or saved preference on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      // Default to system preference if no saved theme is found
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  // Update document class based on the theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Function to toggle theme
  const toggleTheme = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  // Theme values
  const theme = {
    colors: {
      primary: darkMode ? '#6366F1' : '#4F46E5',
      background: darkMode ? '#1F2937' : '#F9FAFB',
      surface: darkMode ? '#374151' : '#FFFFFF',
      text: darkMode ? '#F9FAFB' : '#1F2937',
      border: darkMode ? '#4B5563' : '#E5E7EB',
    },
    darkMode,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
