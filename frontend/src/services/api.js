import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const queryData = (query) => {
  return api.post('/query', { query });
};

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const downloadData = (area = '', format = 'csv') => {
  const params = new URLSearchParams();
  if (area) params.append('area', area);
  params.append('format', format);
  
  return api.get(`/download?${params.toString()}`, {
    responseType: 'blob',
  });
};

export const downloadSampleDataset = () => {
  // Download the sample dataset from the backend
  return api.get('/download-sample', {
    responseType: 'blob',
  });
};

export const getAreas = () => {
  return api.get('/areas');
};

export const checkHealth = () => {
  return api.get('/health');
};

export default api;