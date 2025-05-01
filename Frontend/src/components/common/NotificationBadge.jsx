// client/src/components/common/NotificationBadge.jsx
import React from 'react';

const NotificationBadge = ({ count }) => {
  if (!count || count <= 0) return null;
  
  return (
    <span className="absolute -top-1 -right-1 flex h-5 w-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default NotificationBadge;