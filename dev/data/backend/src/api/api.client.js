// backend/api/api.client.js
const axios      = require('axios'); // or import axios from 'axios'
const dotenv     = require('dotenv');
const path       = require('path');
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

class ApiClient {
  constructor( token=null ) {
    const path = process.env.VITE_DOMAIN_URL || "http://localhost";
    const port = process.env.BACKEND_PORT || 3000;
    const httpPath = path.replace('https://', 'http://');
    
    this.tokenProvider = token;
    this.client = axios.create({
      baseURL: `${httpPath}:${port}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request Interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.tokenProvider) {
            config.headers.Authorization = `Bearer ${this.tokenProvider}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // In backend, we just throw the error
          // The calling service should handle it
          throw new Error('SESSION_EXPIRED');
        }
        const errorData = error.response?.data;
        const message = errorData?.error || errorData?.message || error.message;
        return Promise.reject(new Error(message));
      }
    );
  }

  // Set token (for backend-to-backend calls)
  setTokenProvider(token) {
    this.tokenProvider = token;
    return this;
  }

  // Public API methods
  get(endpoint, config = {}) {
    return this.client.get(endpoint, config);
  }

  post(endpoint, data = null, config = {}) {
    return this.client.post(endpoint, data, config);
  }

  put(endpoint, data = null, config = {}) {
    return this.client.put(endpoint, data, config);
  }

  patch(endpoint, data = null, config = {}) {
    return this.client.patch(endpoint, data, config);
  }

  delete(endpoint, config = {}) {
    return this.client.delete(endpoint, config);
  }

  // File uploads (if needed in backend)
  upload(endpoint, formData, onProgress = null) {
    return this.client.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress ? (progressEvent) => {
        if (progressEvent.total) {
          const percent = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(percent);
        }
      } : undefined,
    });
  }
}

// singleton instance
const apiClient = new ApiClient();

module.exports = { apiClient };