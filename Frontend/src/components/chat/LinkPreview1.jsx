import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Assuming axios is already installed
import Spinner from '../common/LoadingSpinner'; // You can replace this with your loading spinner component

const LinkPreview = ({ url }) => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showIframe, setShowIframe] = useState(false);
  
  // Fetch preview data when the URL changes
  useEffect(() => {
    const fetchPreviewData = async () => {
      try {
        const { data } = await axios.post('/api/chat/link-preview', { url });
        setPreviewData(data); // Set the preview data received from the API
      } catch (err) {
        setError('Could not load preview'); // Handle error if the API call fails
      } finally {
        setLoading(false); // Hide the loading spinner once the data is fetched or failed
      }
    };

    if (url) {
      fetchPreviewData(); // Trigger data fetching
    }
  }, [url]);

  // If loading, show a spinner
  if (loading) {
    return (
      <div className="link-preview">
        <Spinner /> {/* Replace with your custom spinner component */}
      </div>
    );
  }

  // If there's an error, show an error message
  if (error) {
    return (
      <div className="link-preview error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="link-preview">
      {/* Preview Meta Data */}
      <div className="preview-meta" onClick={() => setShowIframe(!showIframe)}>
        {previewData.image && (
          <img 
            src={previewData.image} 
            alt="Link preview" 
            className="preview-image"
          />
        )}
        
        <div className="preview-content">
          <h3>{previewData.title}</h3>
          <p>{previewData.description}</p>
          <span className="preview-domain">{previewData.domain}</span>
        </div>
      </div>

      {/* Iframe Preview */}
      {showIframe && (
        <div className="iframe-container">
          <iframe 
            src={url} 
            title={previewData.title}
            sandbox="allow-scripts allow-same-origin"
            className="iframe"
          />
          <button 
            className="close-iframe"
            onClick={() => setShowIframe(false)}
          >
            Close Preview
          </button>
        </div>
      )}
    </div>
  );
};

export default LinkPreview;
