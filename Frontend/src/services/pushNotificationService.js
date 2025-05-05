import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, setBackgroundMessageHandler } from 'firebase/messaging';
import api from './api';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Request permission and get token
export const requestNotificationPermission = async () => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support push notifications');
      return false;
    }

    // Check if notification permission has already been granted
    if (Notification.permission === 'granted') {
      return true;  // Permission already granted
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    // Get FCM token
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
    });

    if (currentToken) {
      // Send token to server (check if token exists in storage before registering)
      await registerDeviceToken(currentToken);
      return true;
    } else {
      console.log('No registration token available');
      return false;
    }
  } catch (error) {
    console.error('An error occurred while setting up notifications:', error);
    return false;
  }
};

// Register device token with server
const registerDeviceToken = async (token) => {
  try {
    // Avoid registering the same token multiple times
    const storedToken = localStorage.getItem('fcmToken');
    if (storedToken === token) {
      return; // Token already registered
    }

    await api.post('/users/fcm-token', { token });
    console.log('FCM token registered successfully');
    localStorage.setItem('fcmToken', token);  // Store the token locally
  } catch (error) {
    console.error('Error registering FCM token:', error);
  }
};

// Handle foreground messages
export const setupForegroundNotifications = (callback) => {
  return onMessage(messaging, (payload) => {
    console.log('Message received in the foreground:', payload);

    // Create notification options
    const options = {
      body: payload.notification.body,
      icon: '/logo192.png',
      badge: '/badge-icon.png',
      data: payload.data
    };

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(payload.notification.title, options);

      // Handle notification click
      notification.onclick = () => {
        notification.close();
        window.focus();

        if (callback) {
          callback(payload.data);
        }
      };
    }
  });
};

// Handle background messages
export const setupBackgroundNotifications = () => {
  setBackgroundMessageHandler(messaging, (payload) => {
    console.log('Message received in the background:', payload);

    const options = {
      body: payload.notification.body,
      icon: '/logo192.png',
      badge: '/badge-icon.png',
      data: payload.data
    };

    // Display background notification
    if ('Notification' in window && Notification.permission === 'granted') {
      self.registration.showNotification(payload.notification.title, options);
    }
  });
};

export default {
  requestNotificationPermission,
  setupForegroundNotifications,
  setupBackgroundNotifications
};
