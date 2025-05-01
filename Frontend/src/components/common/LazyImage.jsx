// client/src/components/common/LazyImage.jsx
import React, { useState, useEffect } from 'react';

// This component handles lazy loading of images and shows a nice loading state
const LazyImage = ({ src, alt, className, placeholderClassName, onLoad, onError }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  
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
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError]);
  
  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 ${placeholderClassName || className}`} />
    );
  }
  
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  
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