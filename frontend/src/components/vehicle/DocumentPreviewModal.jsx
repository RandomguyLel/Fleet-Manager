import React, { useEffect, useState } from 'react';

const DocumentPreviewModal = ({ isOpen, onClose, document, fetchFile }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && document) {
      setLoading(true);
      setError(null);
      fetchFile(document.id)
        .then(blob => {
          setFileUrl(URL.createObjectURL(blob));
        })
        .catch(err => {
          setError('Failed to load document');
        })
        .finally(() => setLoading(false));
    } else {
      setFileUrl(null);
      setError(null);
    }
    // Cleanup URL on close
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
    // eslint-disable-next-line
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  const isPDF = document.file_type === 'application/pdf';
  const isImage = document.file_type.startsWith('image/');

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-2xl h-[80vh] flex flex-col dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-white truncate">{document.name}</h2>
          <button 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={onClose}
          >
            <span className="text-xl">✖️</span>
          </button>
        </div>
        <div className="flex-1 p-4 overflow-auto flex items-center justify-center">
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {!loading && !error && fileUrl && (
            isPDF ? (
              <iframe
                src={fileUrl}
                title="PDF Preview"
                className="w-full h-full border-0 rounded"
              />
            ) : isImage ? (
              <img
                src={fileUrl}
                alt={document.name}
                className="max-h-full max-w-full rounded shadow"
              />
            ) : (
              <div className="text-center w-full">
                <p className="mb-4">Preview not available for this file type.</p>
                <a
                  href={fileUrl}
                  download={document.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Download
                </a>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal; 