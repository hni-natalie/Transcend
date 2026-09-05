import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@api/api.config';

class ApiClient {
  private client: AxiosInstance;
  private onSessionExpiredHandler: (() => void) | null = null;
  
  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request Interceptor; adds token to every request
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

	// Response Interceptor; handles errors globally
	this.client.interceptors.response.use(
	  (response) => response.data,
	  (error: AxiosError) => {
		if (error.response?.status === 401) {
		  const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
								error.config?.url?.includes('/auth/google') ||
								error.config?.url?.includes('/auth/me');
		
		  if (!isAuthEndpoint) {
			if (this.onSessionExpiredHandler) {
				this.onSessionExpiredHandler();
			}
			throw new Error('SESSION_EXPIRED');
		  }
		}

		const errorData = error.response?.data as any;
		const message = errorData?.error || errorData?.message || error.message;
		
		return Promise.reject(new Error(message));
	}
	);
  }

  // Public API methods
  get<T>(endpoint: string, config?: any): Promise<T> {
    return this.client.get(endpoint, config);
  }

  post<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    return this.client.post(endpoint, data, config);
  }

  put<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    return this.client.put(endpoint, data, config);
  }

  patch<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    return this.client.patch(endpoint, data, config);
  }

  delete<T>(endpoint: string, config?: any): Promise<T> {
    return this.client.delete(endpoint, config);
  }

  // File uploads
  upload<T>(endpoint: string, formData: FormData, onProgress?: (percent: number) => void): Promise<T> {
    return this.client.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(percent);
        }
      },
    });
  }

// Register callback for when session expires (401 on non-auth endpoint)
  registerSessionExpiredHandler(handler: () => void) {
    this.onSessionExpiredHandler = handler;
  }
}

export const apiClient = new ApiClient();