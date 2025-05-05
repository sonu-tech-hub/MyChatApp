import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from './LoadingScreen';

const PublicRoute = () => {
  const { user, isLoading } = useAuth();

  // If the app is still loading (checking user session), display a loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If the user is logged in, redirect them to the home page ("/")
  // Otherwise, render the public route's children (Outlet)
  return user ? <Navigate to="/" replace /> : <Outlet />;
};

export default PublicRoute;
