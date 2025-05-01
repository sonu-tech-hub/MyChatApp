import React, { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CallProvider } from "./context/CallContext";
import LoadingScreen from "./components/common/LoadingScreen";
import ErrorBoundary from "./components/common/ErrorBoundary";
const AppLayout = lazy(() => import("./components/layout/AppLayout"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyAccount = lazy(() => import("./pages/VerifyAccount"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const GroupChat = lazy(() => import("./pages/GroupChat"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivateRoute = lazy(() => import("./components/common/PrivateRoute"));
const PublicRoute = lazy(() => import("./components/common/PublicRoute"));
import { initializeSocket, disconnectSocket } from "./services/socketService"; // Import

const App = () => {
  const { user, isLoading } = useAuth(); // Get isLoading from AuthContext
  const [socketInitialized, setSocketInitialized] = useState(false);
  const [socketError, setSocketError] = useState(null);
  console.log("User in App:", user); // Debugging line

  // Define socket URL here, use a constant
  const SOCKET_URL =
    import.meta.env.VITE_REACT_APP_SOCKET_URL || "http://localhost:5000";

  useEffect(() => {
    const initSocket = async () => {
      if (user) {
        // Only initialize if logged in
        try {
          await initializeSocket(SOCKET_URL); // Pass the URL
          setSocketInitialized(true);
        } catch (error) {
          setSocketError(error);
          console.error("Failed to initialize socket:", error);
          toast.error("Failed to connect to chat service."); // Inform the user
        }
      } else {
        setSocketInitialized(false);
      }
    };

    if (!isLoading) { // Only init socket if not loading
      initSocket();
    }


    // Cleanup: Disconnect socket when user logs out or component unmounts
    return () => {
      disconnectSocket();
      setSocketInitialized(false);
    };
  }, [user, SOCKET_URL, isLoading]); // Depend on user, SOCKET_URL and isLoading

  // Render different things based on socket state and auth loading
  if (isLoading) {
    return <LoadingScreen />; // Show loading screen while auth state is being determined
  }

  if (socketError) {
    return (
      <div>
        <h1>Connection Error</h1>
        <p>Failed to connect to the chat service. Please try again later.</p>
        {/* You could add a button to retry initialization here */}
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <CallProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: "10px",
                  background: "#333",
                  color: "yellow",
                  fontSize: "16px",
                  padding: "16px",
                  fontWeight: "bold",
                  textAlign: "center",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.2s ease-in-out",
                  transform: "translateY(-10px)",
                },
              }}
            />

            <Suspense fallback={<LoadingScreen />}>
              <ErrorBoundary>                                     
                <Routes>
                  {/* Public routes */}
                  <Route
                    path="/login"
                    element={
                      // <PublicRoute>
                        <Login />
                      // </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      // <PublicRoute>
                        <Register />
                      // </PublicRoute>
                    }
                  />
                  <Route
                    path="/verify"
                    element={
                      // <PublicRoute>
                        <VerifyAccount />
                      // </PublicRoute>
                    }
                  />

                  {/* Private routes */}
                  <Route
                    path="/"
                    element={
                      socketInitialized ? ( // Only render PrivateRoute if socket is ready
                        // <PrivateRoute>
                          <AppLayout />
                        // </PrivateRoute>
                      ) : (
                        <LoadingScreen /> // Or a "Connecting..." message
                      )
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="chat/:chatId" element={<ChatPage />} />
                    <Route path="group/:groupId" element={<GroupChat />} />
                    <Route path="profile" element={<Profile />} />
                    {/* <Route path="groups" element={<GroupChat />} /> */}
                    <Route path="ChangePassword" element={<ChangePassword />} />
                  </Route>

                  {/* Fallback 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </Suspense>
          </CallProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
