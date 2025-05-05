// client/src/components/common/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'primary', speed = '1s' }) => {
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
    gray: 'border-gray-300',
    // Optionally, allow custom colors
  };
  
  // If color is not predefined, we allow custom color via inline styling
  const spinnerStyle = colorClasses[color] || `border-${color}`;
  
  return (
    <div className="flex items-center justify-center" role="status" aria-live="polite">
      <div
        className={`${sizeClasses[size]} ${spinnerStyle} rounded-full border-t-transparent animate-spin`}
        style={{ animationDuration: speed }}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
