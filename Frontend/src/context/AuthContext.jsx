import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { setAuthToken, removeAuthToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      if (accessToken) {
        setAuthToken(accessToken);
        try {
          // Fetch current user data
          const { data } = await api.get('/users/me');
          setUser(data.user);
        } catch (error) {
          // If error, try to refresh token
          if (refreshToken) {
            try {
              const response = await api.post('/auth/refresh-token', { refreshToken });
              const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

              // Update tokens
              setAccessToken(newAccessToken);
              setRefreshToken(newRefreshToken);
              localStorage.setItem('accessToken', newAccessToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              setAuthToken(newAccessToken);

              // Fetch user data with new token
              const { data } = await api.get('/users/me');
              setUser(data.user);
            } catch (refreshError) {
              // If refresh fails, log user out
              handleLogout();
            }
          } else {
            handleLogout();
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [accessToken, refreshToken]);

  // Register a new user
  const register = async (userData) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/register', userData);
      toast.success('Registration successful! Please verify your account.');
      return data;
    } catch (error) {
      handleApiError(error, 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify user account with OTP
  const verifyAccount = async (userId, otp) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/verify', { userId, otp });

      // Set auth tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setAuthToken(data.accessToken);

      // Set user data
      setUser(data.user);

      toast.success('Account verified successfully!');
      return data;
    } catch (error) {
      handleApiError(error, 'Verification failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Log in user
  const login = async (emailOrPhone, password) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', { emailOrPhone, password });

      // If account requires verification
      if (data.requiresVerification) {
        return data;
      }

      // Set auth tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setAuthToken(data.accessToken);

      // Set user data
      setUser(data.user);

      toast.success('Login successful!');
      return data;
    } catch (error) {
      handleApiError(error, 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh access token
  const refreshAuthToken = async () => {
    if (!refreshToken) return false;

    try {
      const { data } = await axios.post('/auth/refresh-token', { refreshToken });

      // Set new tokens in state and localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setAuthToken(data.accessToken);

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear all auth state on refresh failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      removeAuthToken();
      return false;
    }
  };

  // Log out user
  const handleLogout = async () => {
    try {
      if (user && user._id) {
        await api.post('/auth/logout', { userId: user._id });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear auth state regardless of API success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      removeAuthToken();
      toast.success('Logged out successfully');
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    setIsLoading(true);
    try {
      const { data } = await api.put('/users/profile', profileData);
      setUser(data.user);
      toast.success('Profile updated successfully');
      return data.user;
    } catch (error) {
      handleApiError(error, 'Failed to update profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to handle API errors
  const handleApiError = (error, defaultMessage) => {
    const errorMessage = error.response?.data?.message || defaultMessage;
    toast.error(errorMessage);
    console.error(error.response?.data || error);
  };

  // Auth context value
  const value = {
    user,
    isLoading,
    accessToken,
    register,
    login,
    verifyAccount,
    refreshToken: refreshAuthToken,
    logout: handleLogout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
