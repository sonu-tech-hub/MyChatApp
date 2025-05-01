// Sample link preview component (client/src/components/chat/LinkPreview.js)
const LinkPreview = ({ url }) => {
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showIframe, setShowIframe] = useState(false);
    
    useEffect(() => {
      const fetchPreviewData = async () => {
        try {
          const { data } = await axios.post('/api/chat/link-preview', { url });
          setPreviewData(data);
        } catch (err) {
          setError('Could not load preview');
        } finally {
          setLoading(false);
        }
      };
      
      fetchPreviewData();
    }, [url]);
    
    return (
      <div className="link-preview">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            <div className="preview-meta" onClick={() => setShowIframe(!showIframe)}>
              {previewData.image && <img src={previewData.image} alt="Link preview" />}
              <div className="preview-content">
                <h3>{previewData.title}</h3>
                <p>{previewData.description}</p>
                <span className="preview-domain">{previewData.domain}</span>
              </div>
            </div>
            
            {showIframe && (
              <div className="iframe-container">
                <iframe 
                  src={url} 
                  title={previewData.title}
                  sandbox="allow-scripts allow-same-origin"
                  className="w-full rounded-lg border border-gray-200"
                />
                <button 
                  className="close-iframe"
                  onClick={() => setShowIframe(false)}
                >
                  Close Preview
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };