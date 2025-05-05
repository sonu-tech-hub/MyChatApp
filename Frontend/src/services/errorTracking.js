// client/src/services/errorTrackingService.js
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { getAuthToken } from './api'; // Assuming you have a way to get the auth token

// Initialize Sentry error tracking
export const initializeErrorTracking = () => {
    if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.REACT_APP_SENTRY_DSN,
            integrations: [new BrowserTracing()],
            tracesSampleRate: 0.2, // Adjust this value as per your needs
            beforeSend(event) {
                if (event.request && event.request.headers) {
                    delete event.request.headers.Authorization; // Remove sensitive Authorization header
                    // Optionally remove more headers, e.g., 'X-Token', 'X-Auth-Token'
                    delete event.request.headers['X-Token'];
                }
                if (event.request && event.request.url) {
                    // Redact sensitive URL parameters (e.g., tokens)
                    event.request.url = event.request.url.replace(/token=[^&]+/, 'token=[REDACTED]');
                    // Optionally redact more sensitive parameters like session IDs
                    event.request.url = event.request.url.replace(/sessionId=[^&]+/, 'sessionId=[REDACTED]');
                }
                return event;
            },
        });
    }
};

// Set user context for Sentry
export const setUserContext = (userId, userEmail) => {
    if (process.env.NODE_ENV === 'production') {
        Sentry.setUser({ id: userId, email: userEmail });
    }
};

// Clear user context from Sentry
export const clearUserContext = () => {
    if (process.env.NODE_ENV === 'production') {
        Sentry.setUser(null);
    }
};

// Add a breadcrumb for Sentry events
export const addBreadcrumb = (category, message, data = {}, level = Sentry.Severity.Info) => {
    if (import.meta.env.NODE_ENV === 'production') {
        Sentry.addBreadcrumb({
            category,
            message,
            data,
            level,
        });
    }
};

// Track and capture an error in Sentry
export const trackError = (error, context = {}) => {
    console.error('Application error:', error);
    if (process.env.NODE_ENV === 'production') {
        Sentry.captureException(error, {
            extra: context // Additional context for debugging
        });
    }
};

// Track a custom event (e.g., user actions, button clicks) in Sentry
export const trackEvent = (name, data = {}) => {
    if (process.env.NODE_ENV === 'production') {
        Sentry.captureMessage(`Event: ${name}`, {
            level: 'info',
            extra: data // Attach custom data related to the event
        });
    }
};

// Exporting the error tracking service
const errorTrackingService = {
    initializeErrorTracking,
    setUserContext,
    clearUserContext,
    addBreadcrumb,
    trackError,
    trackEvent
};

export default errorTrackingService;
