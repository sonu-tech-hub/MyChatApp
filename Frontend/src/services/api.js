import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== Auth Token Utilities =====

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try {
      localStorage.setItem('accessToken', token);
    } catch (e) {
      console.error('Failed to store access token:', e);
    }
  } else {
    delete api.defaults.headers.common['Authorization'];
    try {
      localStorage.removeItem('accessToken');
    } catch (e) {
      console.error('Failed to remove access token:', e);
    }
  }
};

export const removeAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
  try {
    localStorage.removeItem('accessToken');
  } catch (e) {
    console.error('Failed to remove access token:', e);
  }
};

export const getAuthToken = () => {
  try {
    return localStorage.getItem('accessToken');
  } catch (e) {
    console.error('Failed to get access token:', e);
    return null;
  }
};

// ===== Axios Interceptor for Token Refresh =====

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthError = error.response?.status === 401;
    const isNotRetrying = !originalRequest._retry;
    const isNotRefreshing = !originalRequest.url.includes('/auth/refresh-token');

    if (isAuthError && isNotRetrying && isNotRefreshing) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token found');

        const { data } = await api.post('/auth/refresh-token', { refreshToken });

        // Update token storage and retry original request
        setAuthToken(data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        removeAuthToken();
        try {
          localStorage.removeItem('refreshToken');
        } catch (e) {
          console.error('Failed to remove refresh token:', e);
        }

        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
