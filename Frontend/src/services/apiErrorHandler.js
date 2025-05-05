// client/src/services/apiErrorHandler.js
import { toast } from 'react-hot-toast';
import { trackError } from './errorTracking';

let lastToastId = null;

export const handleApiError = (error, customMessage = 'An error occurred') => {
  // Default fallback
  let errorMessage = customMessage;

  // Detect if it's a server response
  if (error.response) {
    errorMessage = error.response.data?.message || customMessage;

    // Optional: handle validation errors
    if (error.response.status === 422 && error.response.data?.errors) {
      const fieldErrors = error.response.data.errors;
      Object.entries(fieldErrors).forEach(([field, messages]) => {
        toast.error(`${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`);
      });
    } else {
      // Show toast with deduplication
      if (lastToastId) toast.dismiss(lastToastId);
      lastToastId = toast.error(errorMessage);
    }

    // Handle status-specific cases
    switch (error.response.status) {
      case 401:
        if (error.response.data?.tokenExpired) return; // handled by interceptor
        break;

      case 403:
        toast.error('You do not have permission to perform this action.');
        break;

      case 404:
        toast.error('The requested resource was not found.');
        break;

      case 429:
        toast.error('Too many requests. Please slow down.');
        break;

      default:
        break;
    }

    // Track error for monitoring
    trackError(error, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response.status,
      message: errorMessage,
    });

  } else if (error.request) {
    // No response from server
    errorMessage = 'No response from server. Please check your connection.';
    toast.error(errorMessage);
  } else {
    // Unknown error
    errorMessage = error.message || customMessage;
    toast.error(errorMessage);
  }

  console.error('API Error:', error);

  return errorMessage;
};
