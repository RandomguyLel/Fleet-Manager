import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../AuthContext';
import DocumentPreviewModal from './DocumentPreviewModal';

const VehicleDocuments = ({ vehicleId, onClose }) => {
  const { t } = useTranslation();
  const { getAuthHeader } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  // Allowed file types and max size
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  // Fetch documents for the vehicle
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/vehicles/${vehicleId}/documents`, {
          headers: getAuthHeader()
        });

        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }

        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Fetch document categories
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/document-categories`, {
          headers: getAuthHeader()
        });

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchDocuments();
    fetchCategories();
  }, [vehicleId, apiUrl, getAuthHeader]);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!allowedTypes.includes(file.type)) {
        setError(t('documents.invalidFileType'));
        setSelectedFile(null);
        return;
      }
      if (file.size > maxFileSize) {
        setError(t('documents.fileTooLarge'));
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setDocumentName(file.name);
      setError(null);
    }
  };

  // Handle document upload
  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile) return;
    // Prevent upload if error
    if (error) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', documentName);
    formData.append('description', documentDescription);
    formData.append('category', selectedCategory);
    if (expiryDate) {
      formData.append('expiryDate', expiryDate);
    }

    try {
      const response = await fetch(`${apiUrl}/api/vehicles/${vehicleId}/documents`, {
        method: 'POST',
        headers: {
          ...getAuthHeader()
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      const newDocument = await response.json();
      setDocuments([...documents, newDocument]);
      setShowUploadForm(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle document deletion
  const handleDelete = async (documentId) => {
    if (!window.confirm(t('documents.confirmDelete'))) return;

    try {
      const response = await fetch(`${apiUrl}/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle document download
  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await fetch(`${apiUrl}/api/documents/${documentId}/download`, {
        headers: getAuthHeader()
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch file as blob for preview/download
  const fetchFile = async (documentId) => {
    const response = await fetch(`${apiUrl}/api/documents/${documentId}/download`, {
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch file');
    return await response.blob();
  };

  // Reset form
  const resetForm = () => {
    setSelectedFile(null);
    setDocumentName('');
    setDocumentDescription('');
    setSelectedCategory('');
    setExpiryDate('');
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('documents.title')}</h2>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          {showUploadForm ? t('common.cancel') : t('documents.upload')}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {showUploadForm && (
        <form onSubmit={handleUpload} className="mb-6 p-4 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('documents.file')}  {('(< 10 Mb PDF, DOC, DOCX, XLS, XLSX, PNG, JPG)')}
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          dark:file:bg-blue-900/20 dark:file:text-blue-400
                          hover:file:bg-blue-100 dark:hover:file:bg-blue-900/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('documents.name')}
              </label>
              <input
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('documents.description')}
              </label>
              <textarea
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('documents.category')}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">{t('documents.selectCategory')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {t(`documents.categories.${category.name}`) || category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('documents.expiryDate')}
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {uploading ? t('common.uploading') : t('common.upload')}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('documents.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('documents.category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('documents.uploaded')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('documents.expiryDate')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</div>
                      {doc.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{doc.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {t(`documents.categories.${doc.category}`) || doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setPreviewDoc(doc);
                          setPreviewOpen(true);
                        }}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-2"
                      >
                        {t('common.preview')}
                      </button>
                      <button
                        onClick={() => handleDownload(doc.id, doc.name)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        {t('common.download')}
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {t('documents.noDocuments')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <DocumentPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        document={previewDoc}
        fetchFile={fetchFile}
      />
    </div>
  );
};

export default VehicleDocuments; 