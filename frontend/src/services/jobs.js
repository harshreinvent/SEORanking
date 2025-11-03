import axios from 'axios';

// Get API URL from environment variable or use defaults
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // Explicitly check if environment variable exists and is not empty
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim();
  }
  
  // In development mode, use localhost
  if (import.meta.env.MODE === 'development' || import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }
  
  // Production: if no env var set, use relative path
  // This will fail, but at least we won't use localhost
  console.warn('⚠️ VITE_API_URL not set! API calls will fail. Set VITE_API_URL in Vercel environment variables.');
  return '/api';
};

const API_URL = getApiUrl();

// Always log API URL for debugging (helps diagnose issues in production)
console.log('🔗 API URL configured:', API_URL);
console.log('🔍 Environment check:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
});

export const uploadFile = async (file, clientName) => {
  try {
    console.log('📤 Uploading file to:', `${API_URL}/jobs/upload`);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientName', clientName || '');

    const response = await axios.post(
      `${API_URL}/jobs/upload`,
      formData,
      {
        'Content-Type': 'multipart/form-data',
        timeout: 300000, // 5 minutes timeout for large files
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      }
    );
    console.log('✅ Upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Upload error:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timeout - please check your connection and try again');
    }
    if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error(`Cannot connect to backend at ${API_URL}. Please check if the backend is running.`);
    }
    throw new Error(error.response?.data?.error || error.message || 'File upload failed');
  }
};

export const getJobs = async () => {
  try {
    const response = await axios.get(`${API_URL}/jobs/status`, {
      timeout: 10000, // 10 second timeout
    });
    return response.data.jobs;
  } catch (error) {
    console.error('❌ Get jobs error:', error);
    if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error(`Cannot connect to backend at ${API_URL}. Please check if the backend is running.`);
    }
    throw new Error(error.response?.data?.error || 'Failed to fetch jobs');
  }
};

export const downloadFile = async (jobId, fileName) => {
  try {
    const response = await axios.get(
      `${API_URL}/jobs/download/${jobId}`,
      {
        responseType: 'blob',
      }
    );

    // Get the filename from Content-Disposition header or use provided fileName
    let downloadFileName = fileName;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
      if (fileNameMatch && fileNameMatch[1]) {
        downloadFileName = fileNameMatch[1];
      }
    }

    // Create blob with correct MIME type from response
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', downloadFileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(error.response?.data?.error || 'File download failed');
  }
};

