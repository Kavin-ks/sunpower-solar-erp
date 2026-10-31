import axios, { AxiosError } from 'axios';

export interface ApiStructuredError {
  statusCode: number;
  endpoint: string;
  userMessage: string;
  safeNextStep: string;
  correlationId?: string;
  details?: any;
}

export const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30-second client-side timeout to prevent indefinite hangs
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sunpower_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.url && config.url.startsWith('/api/')) {
    config.url = config.url.substring(4);
  }
  // Attach correlation ID for end-to-end audit tracing
  if (!config.headers['X-Request-ID']) {
    config.headers['X-Request-ID'] = 'REQ-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response ? error.response.status : (error.code === 'ECONNABORTED' ? 504 : 0);
    const endpoint = error.config ? `${error.config.method?.toUpperCase()} ${error.config.url}` : 'Unknown';
    const correlationId = (error.config?.headers?.['X-Request-ID'] as string) || 'N/A';
    const serverMessage = (error.response?.data as any)?.message || error.message;

    let userMessage = serverMessage;
    let safeNextStep = 'Please retry the action or contact system support.';

    switch (status) {
      case 400:
        userMessage = serverMessage || 'Invalid request parameters or payload format.';
        safeNextStep = 'Review submitted form fields and verify required parameters.';
        break;
      case 401:
        userMessage = 'Authentication session expired or required.';
        safeNextStep = 'Please log in again with authorized credentials.';
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('sunpower_token');
          localStorage.removeItem('sunpower_user');
          window.location.href = '/login';
        }
        break;
      case 403:
        userMessage = 'Permission denied. Your current role does not have authorization for this department operation.';
        safeNextStep = 'Switch to an authorized role or contact system administrator.';
        break;
      case 404:
        userMessage = serverMessage || 'Requested record or endpoint was not found.';
        safeNextStep = 'Verify the reference number (order, serial or ticket ID) and refresh.';
        break;
      case 409:
        userMessage = serverMessage || 'Duplicate or conflicting record operation detected.';
        safeNextStep = 'Do not resubmit duplicate entries. Check if already processed.';
        break;
      case 422:
        userMessage = serverMessage || 'Business rule validation failure.';
        safeNextStep = 'Verify warranty terms, product serial ownership, and order status prerequisites.';
        break;
      case 500:
        userMessage = serverMessage || 'Internal server error occurred while processing transaction.';
        safeNextStep = 'Check backend server logs. Historical audit records have been preserved.';
        break;
      case 502:
        userMessage = 'Bad Gateway: Upstream application server unreachable.';
        safeNextStep = 'Verify that the Spring Boot backend on port 8080 is running.';
        break;
      case 503:
        userMessage = 'Service temporarily unavailable.';
        safeNextStep = 'Database or server is busy; wait a few moments before retrying.';
        break;
      case 504:
        userMessage = 'Gateway Timeout: The requested backend operation exceeded the 30-second timeout threshold.';
        safeNextStep = 'The request may still be processing in the background. Refresh your view before retrying to avoid duplicate submissions.';
        break;
    }

    const structuredError: ApiStructuredError = {
      statusCode: status,
      endpoint,
      userMessage,
      safeNextStep,
      correlationId,
      details: error.response?.data,
    };

    (error as any).structured = structuredError;
    console.error(`[API Error ${status}] ${endpoint} (Trace ID: ${correlationId}) - ${userMessage}`);
    return Promise.reject(error);
  }
);

export default api;
