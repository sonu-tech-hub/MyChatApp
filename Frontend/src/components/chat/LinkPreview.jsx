import React, { useState, useEffect, useCallback } from 'react';
import { HiExternalLink, HiX } from 'react-icons/hi';
import api from '../../services/api';

const LinkPreview = ({ url }) => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showIframe, setShowIframe] = useState(false);
  const [debouncedUrl, setDebouncedUrl] = useState(url);

  // Debounce the URL to prevent unnecessary API calls
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUrl(url), 500);
    return () => clearTimeout(timer);
  }, [url]);

  // Fetch link preview data
  const fetchPreviewData = useCallback(async (link) => {
    try {
      setLoading(true);
      const { data } = await api.post('/chat/link-preview', { url: link });
      setPreviewData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching link preview:', err);
      setError(err.response?.data?.message || 'Could not load preview');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch the preview data when the debounced URL changes
  useEffect(() => {
    if (debouncedUrl) {
      fetchPreviewData(debouncedUrl);
    }
  }, [debouncedUrl, fetchPreviewData]);

  // Extract domain from URL
  const extractDomain = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch (error) {
      return url;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="mt-2 border border-gray-200 rounded-lg p-3 bg-gray-50 animate-pulse flex items-center justify-center h-20">
        <span className="text-gray-400 text-sm">Loading preview...</span>
      </div>
    );
  }

  // Error state or if no preview data is found
  if (error || !previewData) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-500 underline break-all"
      >
        {url}
      </a>
    );
  }

  return (
    <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Preview header */}
      <div 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setShowIframe(!showIframe)}
      >
        <div className="flex p-3">
          {previewData.image && (
            <div className="mr-3 flex-shrink-0">
              <img 
                src={previewData.image} 
                alt={previewData.title || 'Link preview'} 
                className="w-16 h-16 object-cover rounded"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {previewData.title || extractDomain(url)}
            </p>
            
            {previewData.description && (
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                {previewData.description}
              </p>
            )}
            
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <span>{extractDomain(url)}</span>
              <HiExternalLink className="ml-1 w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Iframe for in-app preview */}
      {showIframe && (
        <div className="relative border-t border-gray-200">
          <div className="absolute top-2 right-2 z-10">
            <button 
              className="p-1 bg-gray-800 bg-opacity-70 text-white rounded-full hover:bg-opacity-90"
              onClick={() => setShowIframe(false)}
            >
              <HiX className="w-4 h-4" />
            </button>
          </div>
          
          <iframe 
            src={url} 
            title={previewData.title || 'Link preview'}
            className="w-full h-96 border-0" // Making the iframe height dynamic
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}
    </div>
  );
};

export default LinkPreview;
