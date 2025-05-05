import React, { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CallProvider } from "./context/CallContext";
import LoadingScreen from "./components/common/LoadingScreen";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { initializeSocket, disconnectSocket } from "./services/socketService"; // Import

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

const App = () => {
  const { user, isLoading } = useAuth();
  const [socketInitialized, setSocketInitialized] = useState(false);
  const [socketError, setSocketError] = useState(null);

  // Define socket URL here, use a constant
  const SOCKET_URL =
    import.meta.env.VITE_REACT_APP_SOCKET_URL || "http://localhost:5000";

  useEffect(() => {
    const initSocket = async () => {
      if (user) {
        try {
          await initializeSocket(SOCKET_URL);
          setSocketInitialized(true);
        } catch (error) {
          setSocketError(error);
          toast.error("Failed to connect to chat service.");
        }
      } else {
        setSocketInitialized(false);
      }
    };

    if (!isLoading) {
      initSocket();
    }

    return () => {
      disconnectSocket();
      setSocketInitialized(false);
    };
  }, [user, SOCKET_URL, isLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (socketError) {
    return (
      <div>
        <h1>Connection Error</h1>
        <p>Failed to connect to the chat service. Please try again later.</p>
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
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify" element={<VerifyAccount />} />

                  <Route
                    path="/"
                    element={
                      socketInitialized ? <AppLayout /> : <LoadingScreen />
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="chat/:chatId" element={<ChatPage />} />
                    <Route path="group/:groupId" element={<GroupChat />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="ChangePassword" element={<ChangePassword />} />
                  </Route>

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
