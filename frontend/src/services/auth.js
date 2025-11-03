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
  console.warn('⚠️ VITE_API_URL not set! API calls will fail. Set VITE_API_URL in Vercel environment variables.');
  return '/api';
};

const API_URL = getApiUrl();

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Login failed');
  }
};

export const register = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Registration failed');
  }
};

