// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext'; // Adjust the path if needed
import { ThemeProvider } from './context/ThemeContext'; // Adjust the path if needed
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { toast } from 'react-hot-toast'; // Import toast for service worker messages

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ThemeProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ThemeProvider>
    </React.StrictMode>
);

// Register service worker for PWA and push notifications
serviceWorkerRegistration.register({
    onSuccess: (registration) => {
        console.log('SW registered: ', registration);
        toast.success('App is ready for offline use!');
    },
    onUpdate: (registration) => {
        console.log('SW update found: ', registration);
        toast.info('New version available! Refresh to update.', {
            onClick: () => window.location.reload(),
            duration: 10000,
        });
    },
    onError: (error) => {
        console.error('Error during SW registration:', error);
        toast.error('Failed to register service worker.');
    },
});