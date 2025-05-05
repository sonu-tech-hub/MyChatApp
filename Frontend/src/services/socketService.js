import io from "socket.io-client";
import { toast } from "react-hot-toast";
import { getAuthToken } from "./api";

let socket = null;

// Initialize socket connection
export const initializeSocket = (socketUrl) => {
  return new Promise((resolve, reject) => {
    try {
      // Close existing connection if any
      if (socket) {
        socket.disconnect();
      }

      // Get auth token
      const token = getAuthToken();
      console.log("Initializing socket with token:", token);

      if (!token) {
        reject(new Error("No auth token available"));
        return;
      }

      // Connect to the server with better reconnection strategy
      socket = io(socketUrl, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: Infinity, // Keep trying to reconnect
        reconnectionDelay: 1000, // Start with 1 second delay
        reconnectionDelayMax: 30000, // Max delay of 30 seconds
        randomizationFactor: 0.5, // Add some randomness to prevent server overload
        timeout: 20000, // 20 second timeout
        transports: ["websocket", "polling"], // Try WebSocket first, fall back to polling
      });

      // Connection events with better error tracking
      socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
        resolve(socket);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        toast.error("Connection error, retrying...");
        reject(error);
      });

      socket.on("reconnect", (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
        toast.success("Reconnected to server");
      });

      socket.on("reconnect_attempt", (attemptNumber) => {
        console.log(`Socket reconnection attempt #${attemptNumber}`);
      });

      socket.on("reconnect_error", (error) => {
        console.error("Socket reconnection error:", error);
      });

      socket.on("reconnect_failed", () => {
        console.error("Socket reconnection failed");
        toast.error("Failed to reconnect. Please refresh the page.");
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        if (reason === "io server disconnect") {
          socket.connect();
        }
      });

      socket.on("error", (error) => {
        console.error("Socket error:", error);
        toast.error(error.message || "An error occurred");
      });
    } catch (error) {
      console.error("Socket initialization error:", error);
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
    throw new Error("Socket not initialized. Call initializeSocket first.");
  }
  return socket;
};

// Send message to server
export const emitEvent = (event, data) => {
  if (!socket) {
    console.error("Socket not initialized");
    return;
  }
  socket.emit(event, data);
};

// Listen for an event (wrapper around socket.on)
export const onEvent = (event, callback) => {
  if (!socket) {
    console.error(
      `[Socket] Tried to listen for "${event}" but socket is not initialized`
    );
    return () => {};
  }

  socket.on(event, callback);

  // Cleanup function
  return () => {
    socket.off(event, callback);
    console.log(`[Socket] Removed listener for "${event}"`);
  };
};

// Generic error handler for socket events
export const handleSocketError = (error) => {
  console.error("Socket operation failed:", error);
  toast.error(error.message || "Operation failed");
};

export default {
  initializeSocket,
  disconnectSocket,
  getSocket,
  emitEvent,
  onEvent,
  handleSocketError,
};
