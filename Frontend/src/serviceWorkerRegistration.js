// client/src/serviceWorkerRegistration.js
import { toast } from 'react-hot-toast'; // Import toast for notifications

export function register(config) {
    if (import.meta.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            const swUrl = `${import.meta.env.PUBLIC_URL}/service-worker.js`;

            navigator.serviceWorker
                .register(swUrl)
                .then(registration => {
                    console.log('Service Worker registered: ', registration);

                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        if (installingWorker == null) {
                            return;
                        }
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    // New content is available; notify user
                                    console.log('New content is available; please refresh.');

                                    // Execute callback on update
                                    if (config && config.onUpdate) {
                                        config.onUpdate(registration);
                                    } else {
                                        toast.success('New version available! Click to refresh.', {
                                            onClick: () => window.location.reload(),
                                            duration: 10000,
                                        });
                                    }
                                } else {
                                    // Content is cached for offline use
                                    console.log('Content is cached for offline use.');

                                    // Execute callback on initial install
                                    if (config && config.onSuccess) {
                                        config.onSuccess(registration);
                                    } else {
                                        toast.success('App is now available offline!');
                                    }
                                }
                            }
                        };
                    };
                })
                .catch(error => {
                    console.error('Error during service worker registration:', error);
                    if (config && config.onError) {
                        config.onError(error);
                    }
                });
        });
    }
}

export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then(registration => {
                registration.unregister();
                console.log('Service worker unregistered.');
                toast.success('Offline support disabled.');
            })
            .catch(error => {
                console.error(error.message);
                toast.error('Error unregistering service worker.');
            });
    }
}