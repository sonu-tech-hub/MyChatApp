// client/src/components/common/Avatar.jsx
import React from 'react';

const Avatar = ({ src, name, size = 'md', className = '' }) => {
  // Define size classes
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  // Get initials from name, handle cases for empty or null name
  const getInitials = (name) => {
    if (!name) return ''; // Return empty string if no name
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 0) return ''; // Handle case where name might only be spaces
    return nameParts.map(part => part[0]).join('').toUpperCase().substring(0, 2);
  };

  // If there's an image, render it
  if (src) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
            const parent = e.target.parentNode;
            parent.classList.add('bg-primary', 'text-white', 'flex', 'items-center', 'justify-center');
            parent.innerHTML = getInitials(name);
          }}
        />
      </div>
    );
  }

  // Otherwise render a placeholder with initials
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 ${className}`}>
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
