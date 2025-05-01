// client/src/services/errorTrackingService.js
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { getAuthToken } from './api'; // Assuming you have a way to get the auth token

export const initializeErrorTracking = () => {
    if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.REACT_APP_SENTRY_DSN,
            integrations: [new BrowserTracing()],
            tracesSampleRate: 0.2,
            beforeSend(event) {
                if (event.request && event.request.headers) {
                    delete event.request.headers.Authorization;
                    // Add other sensitive headers to delete here if necessary
                }
                if (event.request && event.request.url) {
                    event.request.url = event.request.url.replace(/token=[^&]+/, 'token=[REDACTED]');
                    // Add other sensitive URL parameters to redact here if necessary
                }
                return event;
            },
        });
    }
};

export const setUserContext = (userId, userEmail) => {
    if (process.env.NODE_ENV === 'production') {
        Sentry.setUser({ id: userId, email: userEmail });
    }
};

export const clearUserContext = () => {
    if (process.env.NODE_ENV === 'production') {
        Sentry.setUser(null);
    }
};

export const addBreadcrumb = (category, message, data = {}, level = Sentry.Severity.Info) => {
    if (process.env.NODE_ENV === 'production') {
        Sentry.addBreadcrumb({
            category,
            message,
            data,
            level,
        });
    }
};

export const trackError = (error, context = {}) => {
    console.error('Application error:', error);
    if (process.env.NODE_ENV === 'production') {
        Sentry.captureException(error, {
            extra: context
        });
    }
};

export const trackEvent = (name, data = {}) => {
    if (process.env.NODE_ENV === 'production') {
        Sentry.captureMessage(`Event: ${name}`, {
            level: 'info',
            extra: data
        });
    }
};

const errorTrackingService = {
    initializeErrorTracking,
    setUserContext,
    clearUserContext,
    addBreadcrumb,
    trackError,
    trackEvent
};

export default errorTrackingService;