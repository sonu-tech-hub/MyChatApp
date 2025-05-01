// client/src/components/common/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'primary' }) => {
  // Define size classes
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4'
  };
  
  // Define color classes
  const colorClasses = {
    primary: 'border-primary',
    white: 'border-white',
    gray: 'border-gray-300'
  };
  
  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} rounded-full ${colorClasses[color]} border-t-transparent animate-spin`}
      ></div>
    </div>
  );
};

export default LoadingSpinner;