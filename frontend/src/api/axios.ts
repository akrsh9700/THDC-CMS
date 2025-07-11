import axios from 'axios';

// Extract the base URL from environment variables or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:6050';

// Add /api/v1 to the base URL since all our endpoints are under this path
const API_URL_WITH_PREFIX = `${API_BASE_URL}/api/v1`;

// Log the API URL being used (for debugging)
console.log(`API configured with base URL: ${API_URL_WITH_PREFIX}`);

// Create an axios instance with default config
const api = axios.create({
  // Use the configured base URL with the API prefix
  baseURL: API_URL_WITH_PREFIX,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/authentication
  timeout: 60000, // Increase timeout to 60 seconds to account for cold starts on Render's free tier
});

// Track retry attempts for each request
const retryMap = new Map();

// Function to handle retries
const retryRequest = async (error: any, maxRetries = 2) => {
  const config = error.config;
  
  // Create a unique key for this request
  const requestKey = `${config.method}-${config.url}`;
  
  // Get current retry count or initialize to 0
  const retryCount = retryMap.get(requestKey) || 0;
  
  // Check if we should retry
  if (retryCount < maxRetries && (!error.response || error.response.status >= 500 || error.code === 'ECONNABORTED')) {
    retryMap.set(requestKey, retryCount + 1);
    
    // Exponential backoff delay: 1s, 2s, 4s, etc.
    const delay = Math.pow(2, retryCount) * 1000;
    console.log(`[API] Retrying request (${retryCount + 1}/${maxRetries}) after ${delay}ms delay...`);
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry the request
    return api(config);
  }
  
  // Clear retry count
  retryMap.delete(requestKey);
  
  // If we've exhausted retries or shouldn't retry, reject with the original error
  return Promise.reject(error);
};

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    // If token exists, add it to headers
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Simplify request logging
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    
    // Check for duplicate api/v1 in URL and fix it
    if (config.url) {
      // This regex will match any duplicate instances of /api/v1 in the URL
      const duplicatePathRegex = /\/api\/v1(\/api\/v1)+/g;
      if (duplicatePathRegex.test(config.url)) {
        console.warn('[API Warning] Detected duplicate /api/v1/ in URL path. Fixing URL.');
        // Replace all duplicate occurrences with a single /api/v1
        config.url = config.url.replace(duplicatePathRegex, '/api/v1');
      }
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // Clear retry count on success
    const requestKey = `${response.config.method}-${response.config.url}`;
    retryMap.delete(requestKey);
    
    // Only log success for non-GET requests to reduce noise
    if (response.config.method !== 'get') {
      console.log(`[API Success] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error: any) => {
    // First try to retry the request if applicable
    try {
      return await retryRequest(error);
    } catch (retryErr) {
      // If retry fails, continue with normal error handling
      const retryError: any = retryErr;
      
      // Check for network errors which could indicate cold starts
      if (!retryError.response) {
        console.error(`[API Network Error] ${retryError.config?.url || 'unknown URL'}: ${retryError.message}`);
        
        // Check if this might be a cold start issue
        if (retryError.message.includes('timeout') || retryError.message.includes('Network Error')) {
          console.log('[API] Possible cold start detected. The backend might be starting up.');
          
          // Show a user-friendly message for timeouts
          if (retryError.message.includes('timeout') && typeof window !== 'undefined') {
            const notificationId = 'cold-start-notification';
            if (!document.getElementById(notificationId)) {
              const notification = document.createElement('div');
              notification.id = notificationId;
              notification.style.position = 'fixed';
              notification.style.top = '20px';
              notification.style.left = '50%';
              notification.style.transform = 'translateX(-50%)';
              notification.style.backgroundColor = '#3182CE'; // blue color
              notification.style.color = 'white';
              notification.style.padding = '10px 20px';
              notification.style.borderRadius = '4px';
              notification.style.zIndex = '9999';
              notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
              notification.innerText = 'Server is starting up. This may take up to 60 seconds...';
              
              document.body.appendChild(notification);
              
              // Remove after 10 seconds
              setTimeout(() => {
                if (document.getElementById(notificationId)) {
                  document.body.removeChild(notification);
                }
              }, 10000);
            }
          }
        }
        
        return Promise.reject(retryError);
      }
      
      // Error response - simplify error logging
      const status = retryError.response.status;
      console.error(`[API Error] ${status} ${retryError.config?.url || 'unknown URL'}: ${retryError.message}`);
      
      // Handle 401 Unauthorized errors
      if (status === 401) {
        // Don't clear token or redirect if we're already on the login page
        if (window.location.pathname !== '/') {
          console.log('[API] Authentication failed - redirecting to login');
          
          // Clear all auth-related storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('rememberedUser');
          
          // Add a small notification to the user
          if (document.getElementById('auth-redirect-notification') === null) {
            const notification = document.createElement('div');
            notification.id = 'auth-redirect-notification';
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.backgroundColor = '#285E61'; // teal color
            notification.style.color = 'white';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '4px';
            notification.style.zIndex = '9999';
            notification.innerText = 'Authentication error. Redirecting to login...';
            
            document.body.appendChild(notification);
            
            // Set a failsafe redirect flag in sessionStorage
            sessionStorage.setItem('auth_redirect_timestamp', Date.now().toString());
            
            setTimeout(() => {
              // Manual redirect to avoid loops - with a small delay to show notification
              window.location.href = '/';
            }, 2000);
          } else {
            // If notification exists, just redirect
            window.location.href = '/';
          }
        }
      } else if (status === 404 && retryError.config?.url?.includes('/login')) {
        // Special handling for login 404 errors which might indicate wrong API URL
        console.error('[API URL Error] Login endpoint not found. Check if API_BASE_URL is correct:', API_URL_WITH_PREFIX);
        console.log('Attempting direct request to:', `${API_BASE_URL}/api/v1/login`);
      }
      
      return Promise.reject(retryError);
    }
  }
);

// Add a failsafe check for auth redirects on app init
const checkAuthRedirect = () => {
  const authRedirectTimestamp = sessionStorage.getItem('auth_redirect_timestamp');
  
  if (authRedirectTimestamp) {
    const now = Date.now();
    const redirectTime = parseInt(authRedirectTimestamp, 10);
    
    // If the redirect happened in the last 5 seconds, we're probably in a redirect loop
    // Clear it and show a message
    if (now - redirectTime < 5000) {
      console.log('[AUTH FAILSAFE] Detected possible auth redirect loop');
      
      // Clear auth data completely
      localStorage.clear();
      sessionStorage.clear();
      
      // If we're not on the login page, force redirect
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    } else {
      // Just clear the timestamp if it's old
      sessionStorage.removeItem('auth_redirect_timestamp');
    }
  }
};

// Run the check
checkAuthRedirect();

export default api; 