import io from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { getAuthToken } from './api';

let socket = null;

// Initialize socket connection
export const initializeSocket = (socketUrl) => { // Receive socketUrl
  return new Promise((resolve, reject) => {
    try {
      // Close existing connection if any
      if (socket) {
        socket.disconnect();
      }

      // Get auth token
      const token = getAuthToken();
      if (!token) {
        reject(new Error('No auth token available'));
        return;
      }

      // Connect to the server with better reconnection strategy
      socket = io(socketUrl, { // Use the passed socketUrl
        auth: { token },
        reconnection: true,
        reconnectionAttempts: Infinity, // Keep trying to reconnect
        reconnectionDelay: 1000, // Start with 1 second delay
        reconnectionDelayMax: 30000, // Max delay of 30 seconds
        randomizationFactor: 0.5, // Add some randomness to prevent server overload
        timeout: 20000, // 20 second timeout
        transports: ['websocket', 'polling'] // Try WebSocket first, fall back to polling
      });

      // Connection events with better error tracking
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        // Clear any "disconnected" UI indicators
        resolve(socket);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        toast.error('Connection error, retrying...');
        reject(error);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
        toast.success('Reconnected to server');

        // Reload critical data after reconnection
        window.dispatchEvent(new CustomEvent('socket:reconnected'));
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Socket reconnection attempt #${attemptNumber}`);
      });

      socket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
      });

      socket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed');
        toast.error('Failed to reconnect. Please refresh the page.');
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);

        // Show disconnected UI indicator
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect manually
          socket.connect();
        }

        // If transport is closed, let the reconnection handle it
      });

      // Error event
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        if (error.message) {
          toast.error(error.message);
        }
      });

    } catch (error) {
      console.error('Socket initialization error:', error);
      reject(error);
    }
  });
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Get socket instance
export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
};

// Send message to server
export const emitEvent = (event, data) => {
  if (!socket) {
    console.error('Socket not initialized');
    return;
  }
  socket.emit(event, data);
};

// Listen for an event (wrapper around socket.on)
export const onEvent = (event, callback) => {
  if (!socket) {
    console.error('Socket not initialized');
    return () => { };
  }
  socket.on(event, callback);

  // Return a function to remove the listener
  return () => socket.off(event, callback);
};

// Generic error handler for socket events
export const handleSocketError = (error) => {
  console.error('Socket operation failed:', error);
  toast.error(error.message || 'Operation failed');
};

export default {
  initializeSocket,
  disconnectSocket,
  getSocket,
  emitEvent,
  onEvent,
  handleSocketError
};
