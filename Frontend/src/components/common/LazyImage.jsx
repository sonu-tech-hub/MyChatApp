// client/src/components/common/LazyImage.jsx
import React, { useState, useEffect } from 'react';

const LazyImage = ({
  src,
  alt = '', // Default to empty string for alt
  className,
  placeholderClassName,
  onLoad,
  onError,
  fallbackSrc = '', // Optionally pass a fallback image URL
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState('');

  // Use effect to load the image and manage state
  useEffect(() => {
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setLoading(false);
      setImageSrc(src);
      if (onLoad) onLoad();
    };
    
    img.onerror = () => {
      setLoading(false);
      setError(true);
      if (onError) onError();
    };

    // Cleanup function
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError]);

  // Display loading state
  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 ${placeholderClassName || className}`} />
    );
  }

  // Display error state
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        {fallbackSrc ? (
          <img src={fallbackSrc} alt={alt || 'Fallback Image'} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
    );
  }

  // Display the image once loaded
  return (
    <img 
      src={imageSrc} 
      alt={alt} 
      className={className}
      loading="lazy"
    />
  );
};

export default LazyImage;
