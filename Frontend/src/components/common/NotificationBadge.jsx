// client/src/components/common/NotificationBadge.jsx
import React from 'react';

const NotificationBadge = ({ count, position = 'top-right' }) => {
  if (!count || count <= 0) return null;

  // Compute badge size and position dynamically
  const positionClasses = {
    'top-left': 'top-1 left-1',
    'top-right': 'top-1 right-1',
    'bottom-left': 'bottom-1 left-1',
    'bottom-right': 'bottom-1 right-1',
  };

  const badgeSize = count > 99 ? 'text-xs' : 'text-xxs';  // Slightly adjust for readability

  return (
    <span
      className={`absolute flex h-5 w-5 min-w-5 items-center justify-center rounded-full bg-red-500 ${badgeSize} font-medium text-white ${positionClasses[position]}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default NotificationBadge;
