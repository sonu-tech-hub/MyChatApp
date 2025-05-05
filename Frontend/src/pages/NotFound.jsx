// client/src/pages/NotFound.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiChat, HiArrowLeft } from 'react-icons/hi';

const NotFound = () => {
  useEffect(() => {
    // Log the 404 error page URL to console or send it to a logging service
    console.error(`404 error: The page ${window.location.pathname} was not found.`);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary bg-opacity-10 rounded-full">
            <HiChat className="w-16 h-16 text-primary" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed, 
          or is temporarily unavailable.
        </p>
        
        <Link 
          to="/"
          className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition duration-200"
        >
          <HiArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
