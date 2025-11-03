import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const uploadFile = async (file, clientName) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientName', clientName || '');

    const response = await axios.post(
      `${API_URL}/jobs/upload`,
      formData,
      {
        'Content-Type': 'multipart/form-data',
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'File upload failed');
  }
};

export const getJobs = async () => {
  try {
    const response = await axios.get(`${API_URL}/jobs/status`);
    return response.data.jobs;
  } catch (error) {
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

