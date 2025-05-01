// client/src/services/apiErrorHandler.js
import { toast } from 'react-hot-toast';
import { trackError } from './errorTracking';

export const handleApiError = (error, customMessage = 'An error occurred') => {
  // Get error message from response or use custom message
  const errorMessage = error.response?.data?.message || customMessage;
  
  // Show error message to user
  toast.error(errorMessage);
  
  // Log error
  console.error('API Error:', error);
  
  // Track error for monitoring
  trackError(error, {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    message: errorMessage
  });
  
  // Handle specific error status codes
  switch (error.response?.status) {
    case 401: // Unauthorized
      // Check if token expired error
      if (error.response.data.tokenExpired) {
        // This will be handled by the API interceptor
        return;
      }
      // Otherwise might be invalid credentials
      break;
      
    case 403: // Forbidden
      // User doesn't have permission
      break;
      
    case 404: // Not Found
      // Resource not found
      break;
      
    case 422: // Validation Error
      // Handle validation errors (form fields)
      break;
      
    case 429: // Too Many Requests
      toast.error('Too many requests. Please try again later.');
      break;
      
    default:
      // Handle other errors
      break;
  }
  
  return errorMessage;
};